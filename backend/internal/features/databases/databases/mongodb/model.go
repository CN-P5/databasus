package mongodb

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/url"
	"regexp"
	"strings"
	"time"

	"databasus-backend/internal/util/encryption"
	"databasus-backend/internal/util/ssh"
	"databasus-backend/internal/util/tools"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongodbDatabase struct {
	ID         uuid.UUID  `json:"id"         gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	DatabaseID *uuid.UUID `json:"databaseId" gorm:"type:uuid;column:database_id"`

	Version tools.MongodbVersion `json:"version" gorm:"type:text;not null"`

	Host         string `json:"host"         gorm:"type:text;not null"`
	Port         int    `json:"port"         gorm:"type:int;not null"`
	Username     string `json:"username"     gorm:"type:text;not null"`
	Password     string `json:"password"     gorm:"type:text;not null"`
	Database     string `json:"database"     gorm:"type:text;not null"`
	AuthDatabase string `json:"authDatabase" gorm:"type:text;not null;default:'admin'"`
	IsHttps      bool   `json:"isHttps"      gorm:"type:boolean;default:false"`
	CpuCount     int    `json:"cpuCount"     gorm:"column:cpu_count;type:int;not null;default:1"`
}

func (m *MongodbDatabase) TableName() string {
	return "mongodb_databases"
}

func (m *MongodbDatabase) Validate() error {
	if m.Host == "" {
		return errors.New("host is required")
	}
	if m.Port == 0 {
		return errors.New("port is required")
	}
	if m.Username == "" {
		return errors.New("username is required")
	}
	if m.Password == "" {
		return errors.New("password is required")
	}
	if m.Database == "" {
		return errors.New("database is required")
	}
	if m.CpuCount <= 0 {
		return errors.New("cpu count must be greater than 0")
	}
	return nil
}

func (m *MongodbDatabase) TestConnection(
	logger *slog.Logger,
	encryptor encryption.FieldEncryptor,
	databaseID uuid.UUID,
	sshTunnel *ssh.Config,
) error {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	password, err := decryptPasswordIfNeeded(m.Password, encryptor, databaseID)
	if err != nil {
		return fmt.Errorf("failed to decrypt password: %w", err)
	}

	client, cleanup, err := connectWithSSHTunnelMongoDB(
		ctx,
		m,
		password,
		sshTunnel,
		encryptor,
		databaseID,
	)
	if err != nil {
		return fmt.Errorf("failed to connect to MongoDB: %w", err)
	}
	defer cleanup()

	if err := client.Ping(ctx, nil); err != nil {
		return fmt.Errorf("failed to ping MongoDB database '%s': %w", m.Database, err)
	}

	detectedVersion, err := detectMongodbVersion(ctx, client)
	if err != nil {
		return err
	}
	m.Version = detectedVersion

	if err := checkBackupPermissions(
		ctx,
		client,
		m.Username,
		m.Database,
		m.AuthDatabase,
	); err != nil {
		return err
	}

	return nil
}

func (m *MongodbDatabase) HideSensitiveData() {
	if m == nil {
		return
	}
	m.Password = ""
}

func (m *MongodbDatabase) Update(incoming *MongodbDatabase) {
	m.Version = incoming.Version
	m.Host = incoming.Host
	m.Port = incoming.Port
	m.Username = incoming.Username
	m.Database = incoming.Database
	m.AuthDatabase = incoming.AuthDatabase
	m.IsHttps = incoming.IsHttps
	m.CpuCount = incoming.CpuCount

	if incoming.Password != "" {
		m.Password = incoming.Password
	}
}

func (m *MongodbDatabase) EncryptSensitiveFields(
	databaseID uuid.UUID,
	encryptor encryption.FieldEncryptor,
) error {
	if m.Password != "" {
		encrypted, err := encryptor.Encrypt(databaseID, m.Password)
		if err != nil {
			return err
		}
		m.Password = encrypted
	}
	return nil
}

func (m *MongodbDatabase) PopulateDbData(
	logger *slog.Logger,
	encryptor encryption.FieldEncryptor,
	databaseID uuid.UUID,
	sshTunnel *ssh.Config,
) error {
	return m.PopulateVersion(logger, encryptor, databaseID, sshTunnel)
}

func (m *MongodbDatabase) PopulateVersion(
	logger *slog.Logger,
	encryptor encryption.FieldEncryptor,
	databaseID uuid.UUID,
	sshTunnel *ssh.Config,
) error {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	password, err := decryptPasswordIfNeeded(m.Password, encryptor, databaseID)
	if err != nil {
		return fmt.Errorf("failed to decrypt password: %w", err)
	}

	client, cleanup, err := connectWithSSHTunnelMongoDB(
		ctx,
		m,
		password,
		sshTunnel,
		encryptor,
		databaseID,
	)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	defer cleanup()

	detectedVersion, err := detectMongodbVersion(ctx, client)
	if err != nil {
		return err
	}

	m.Version = detectedVersion
	return nil
}

func (m *MongodbDatabase) IsUserReadOnly(
	ctx context.Context,
	logger *slog.Logger,
	encryptor encryption.FieldEncryptor,
	databaseID uuid.UUID,
	sshTunnel *ssh.Config,
) (bool, []string, error) {
	password, err := decryptPasswordIfNeeded(m.Password, encryptor, databaseID)
	if err != nil {
		return false, nil, fmt.Errorf("failed to decrypt password: %w", err)
	}

	client, cleanup, err := connectWithSSHTunnelMongoDB(
		ctx,
		m,
		password,
		sshTunnel,
		encryptor,
		databaseID,
	)
	if err != nil {
		return false, nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	defer cleanup()

	authDB := m.AuthDatabase
	if authDB == "" {
		authDB = "admin"
	}

	adminDB := client.Database(authDB)
	var result bson.M
	err = adminDB.RunCommand(ctx, bson.D{
		{Key: "usersInfo", Value: bson.D{
			{Key: "user", Value: m.Username},
			{Key: "db", Value: authDB},
		}},
	}).Decode(&result)
	if err != nil {
		return false, nil, fmt.Errorf("failed to get user info: %w", err)
	}

	writeRoles := map[string]bool{
		"readWrite":            true,
		"readWriteAnyDatabase": true,
		"dbAdmin":              true,
		"dbAdminAnyDatabase":   true,
		"userAdmin":            true,
		"userAdminAnyDatabase": true,
		"clusterAdmin":         true,
		"clusterManager":       true,
		"hostManager":          true,
		"root":                 true,
		"dbOwner":              true,
		"restore":              true,
		"__system":             true,
	}

	readOnlyRoles := map[string]bool{
		"read":   true,
		"backup": true,
	}

	writeActions := map[string]bool{
		"insert":             true,
		"update":             true,
		"remove":             true,
		"createCollection":   true,
		"dropCollection":     true,
		"createIndex":        true,
		"dropIndex":          true,
		"convertToCapped":    true,
		"dropDatabase":       true,
		"renameCollection":   true,
		"createUser":         true,
		"dropUser":           true,
		"updateUser":         true,
		"grantRole":          true,
		"revokeRole":         true,
		"dropRole":           true,
		"createRole":         true,
		"updateRole":         true,
		"enableSharding":     true,
		"shardCollection":    true,
		"addShard":           true,
		"removeShard":        true,
		"shutdown":           true,
		"replSetReconfig":    true,
		"replSetStateChange": true,
	}

	var detectedRoles []string

	users, ok := result["users"].(bson.A)
	if !ok || len(users) == 0 {
		return true, detectedRoles, nil
	}

	user, ok := users[0].(bson.M)
	if !ok {
		return true, detectedRoles, nil
	}

	roles, ok := user["roles"].(bson.A)
	if !ok {
		return true, detectedRoles, nil
	}

	for _, roleDoc := range roles {
		role, ok := roleDoc.(bson.M)
		if !ok {
			continue
		}
		roleName, _ := role["role"].(string)
		if roleName != "" {
			detectedRoles = append(detectedRoles, roleName)
		}
	}

	for _, roleName := range detectedRoles {
		if writeRoles[roleName] {
			return false, detectedRoles, nil
		}
	}

	allRolesReadOnly := true
	for _, roleName := range detectedRoles {
		if !readOnlyRoles[roleName] {
			allRolesReadOnly = false
			break
		}
	}
	if allRolesReadOnly && len(detectedRoles) > 0 {
		return true, detectedRoles, nil
	}

	var privResult bson.M
	err = adminDB.RunCommand(ctx, bson.D{
		{Key: "usersInfo", Value: bson.D{
			{Key: "user", Value: m.Username},
			{Key: "db", Value: authDB},
		}},
		{Key: "showPrivileges", Value: true},
	}).Decode(&privResult)
	if err != nil {
		return false, nil, fmt.Errorf("failed to get user privileges: %w", err)
	}

	privUsers, ok := privResult["users"].(bson.A)
	if !ok || len(privUsers) == 0 {
		return true, detectedRoles, nil
	}

	privUser, ok := privUsers[0].(bson.M)
	if !ok {
		return true, detectedRoles, nil
	}

	inheritedPrivileges, ok := privUser["inheritedPrivileges"].(bson.A)
	if ok {
		for _, privDoc := range inheritedPrivileges {
			priv, ok := privDoc.(bson.M)
			if !ok {
				continue
			}
			actions, ok := priv["actions"].(bson.A)
			if !ok {
				continue
			}
			for _, action := range actions {
				actionStr, ok := action.(string)
				if ok && writeActions[actionStr] {
					return false, detectedRoles, nil
				}
			}
		}
	}

	return true, detectedRoles, nil
}

func (m *MongodbDatabase) CreateReadOnlyUser(
	ctx context.Context,
	logger *slog.Logger,
	encryptor encryption.FieldEncryptor,
	databaseID uuid.UUID,
	sshTunnel *ssh.Config,
) (string, string, error) {
	password, err := decryptPasswordIfNeeded(m.Password, encryptor, databaseID)
	if err != nil {
		return "", "", fmt.Errorf("failed to decrypt password: %w", err)
	}

	client, cleanup, err := connectWithSSHTunnelMongoDB(
		ctx,
		m,
		password,
		sshTunnel,
		encryptor,
		databaseID,
	)
	if err != nil {
		return "", "", fmt.Errorf("failed to connect to database: %w", err)
	}
	defer cleanup()

	authDB := m.AuthDatabase
	if authDB == "" {
		authDB = "admin"
	}

	maxRetries := 3
	for attempt := range maxRetries {
		newUsername := fmt.Sprintf("databasus-%s", uuid.New().String()[:8])
		newPassword := encryption.GenerateComplexPassword()

		adminDB := client.Database(authDB)
		err = adminDB.RunCommand(ctx, bson.D{
			{Key: "createUser", Value: newUsername},
			{Key: "pwd", Value: newPassword},
			{Key: "roles", Value: bson.A{
				bson.D{
					{Key: "role", Value: "backup"},
					{Key: "db", Value: "admin"},
				},
				bson.D{
					{Key: "role", Value: "read"},
					{Key: "db", Value: m.Database},
				},
			}},
		}).Err()

		if err != nil {
			if attempt < maxRetries-1 {
				continue
			}
			return "", "", fmt.Errorf("failed to create user: %w", err)
		}

		logger.Info(
			"Read-only MongoDB user created successfully",
			"username", newUsername,
		)
		return newUsername, newPassword, nil
	}

	return "", "", errors.New("failed to generate unique username after 3 attempts")
}

// BuildMongodumpURI builds a URI suitable for mongodump (without database in path)
func (m *MongodbDatabase) BuildMongodumpURI(password string) string {
	authDB := m.AuthDatabase
	if authDB == "" {
		authDB = "admin"
	}

	tlsParams := ""
	if m.IsHttps {
		tlsParams = "&tls=true&tlsInsecure=true"
	}

	return fmt.Sprintf(
		"mongodb://%s:%s@%s:%d/?authSource=%s&connectTimeoutMS=15000%s",
		url.QueryEscape(m.Username),
		url.QueryEscape(password),
		m.Host,
		m.Port,
		authDB,
		tlsParams,
	)
}

func (m *MongodbDatabase) BuildMongodumpURIWithHostPort(
	password string,
	host string,
	port int,
) string {
	authDB := m.AuthDatabase
	if authDB == "" {
		authDB = "admin"
	}

	tlsParams := ""
	if m.IsHttps {
		tlsParams = "&tls=true&tlsInsecure=true"
	}

	return fmt.Sprintf(
		"mongodb://%s:%s@%s:%d/?authSource=%s&connectTimeoutMS=15000%s",
		url.QueryEscape(m.Username),
		url.QueryEscape(password),
		host,
		port,
		authDB,
		tlsParams,
	)
}

// detectMongodbVersion gets MongoDB server version from buildInfo command
func detectMongodbVersion(ctx context.Context, client *mongo.Client) (tools.MongodbVersion, error) {
	adminDB := client.Database("admin")
	var result bson.M
	err := adminDB.RunCommand(ctx, bson.D{{Key: "buildInfo", Value: 1}}).Decode(&result)
	if err != nil {
		return "", fmt.Errorf("failed to get MongoDB version: %w", err)
	}

	versionStr, ok := result["version"].(string)
	if !ok {
		return "", errors.New("could not parse MongoDB version from buildInfo")
	}

	re := regexp.MustCompile(`^(\d+)\.`)
	matches := re.FindStringSubmatch(versionStr)
	if len(matches) < 2 {
		return "", fmt.Errorf("could not parse MongoDB version: %s", versionStr)
	}

	major := matches[1]

	switch major {
	case "4":
		return tools.MongodbVersion4, nil
	case "5":
		return tools.MongodbVersion5, nil
	case "6":
		return tools.MongodbVersion6, nil
	case "7":
		return tools.MongodbVersion7, nil
	case "8":
		return tools.MongodbVersion8, nil
	default:
		return "", fmt.Errorf(
			"unsupported MongoDB major version: %s (supported: 4.x, 5.x, 6.x, 7.x, 8.x)",
			major,
		)
	}
}

// checkBackupPermissions verifies the user has sufficient privileges for mongodump backup.
// Required: 'read' role on target database OR 'backup' role on admin OR 'readAnyDatabase' role.
func checkBackupPermissions(
	ctx context.Context,
	client *mongo.Client,
	username, database, authDatabase string,
) error {
	authDB := authDatabase
	if authDB == "" {
		authDB = "admin"
	}

	adminDB := client.Database(authDB)
	var result bson.M
	err := adminDB.RunCommand(ctx, bson.D{
		{Key: "usersInfo", Value: bson.D{
			{Key: "user", Value: username},
			{Key: "db", Value: authDB},
		}},
		{Key: "showPrivileges", Value: true},
	}).Decode(&result)
	if err != nil {
		return fmt.Errorf("failed to get user info: %w", err)
	}

	users, ok := result["users"].(bson.A)
	if !ok || len(users) == 0 {
		return errors.New("insufficient permissions for backup. User not found")
	}

	user, ok := users[0].(bson.M)
	if !ok {
		return errors.New("insufficient permissions for backup. Could not parse user info")
	}

	// Check roles for backup permissions
	roles, ok := user["roles"].(bson.A)
	if !ok {
		return errors.New("insufficient permissions for backup. No roles assigned")
	}

	backupRoles := map[string]bool{
		"backup":               true,
		"root":                 true,
		"readAnyDatabase":      true,
		"dbOwner":              true,
		"__system":             true,
		"clusterAdmin":         true,
		"readWriteAnyDatabase": true,
	}

	var userRoles []string
	hasBackupRole := false
	hasReadOnTargetDB := false

	for _, roleDoc := range roles {
		role, ok := roleDoc.(bson.M)
		if !ok {
			continue
		}
		roleName, _ := role["role"].(string)
		roleDB, _ := role["db"].(string)

		if roleName != "" {
			userRoles = append(userRoles, roleName)
		}

		if backupRoles[roleName] {
			hasBackupRole = true
		}

		if roleName == "read" && (roleDB == database || roleDB == "") {
			hasReadOnTargetDB = true
		}
		if roleName == "readWrite" && (roleDB == database || roleDB == "") {
			hasReadOnTargetDB = true
		}
	}

	if hasBackupRole || hasReadOnTargetDB {
		return nil
	}

	// Check inherited privileges for 'find' action on target database
	inheritedPrivileges, ok := user["inheritedPrivileges"].(bson.A)
	if ok {
		for _, privDoc := range inheritedPrivileges {
			priv, ok := privDoc.(bson.M)
			if !ok {
				continue
			}
			resource, ok := priv["resource"].(bson.M)
			if !ok {
				continue
			}

			resourceDB, _ := resource["db"].(string)
			resourceCluster, _ := resource["cluster"].(bool)

			isTargetDB := resourceDB == database || resourceDB == "" || resourceCluster

			actions, ok := priv["actions"].(bson.A)
			if !ok {
				continue
			}

			for _, action := range actions {
				actionStr, ok := action.(string)
				if ok && actionStr == "find" && isTargetDB {
					return nil
				}
			}
		}
	}

	return fmt.Errorf(
		"insufficient permissions for backup. Current roles: %s. Required: 'read' role on database '%s' OR 'backup' role on admin OR 'readAnyDatabase' role",
		strings.Join(userRoles, ", "),
		database,
	)
}

func decryptPasswordIfNeeded(
	password string,
	encryptor encryption.FieldEncryptor,
	databaseID uuid.UUID,
) (string, error) {
	if encryptor == nil {
		return password, nil
	}
	return encryptor.Decrypt(databaseID, password)
}

func decryptSSHTunnelCredentials(
	sshConfig *ssh.Config,
	encryptor encryption.FieldEncryptor,
	databaseID uuid.UUID,
) error {
	if sshConfig == nil || encryptor == nil {
		return nil
	}

	if sshConfig.Password != "" {
		decrypted, err := encryptor.Decrypt(databaseID, sshConfig.Password)
		if err != nil {
			return fmt.Errorf("failed to decrypt SSH password: %w", err)
		}
		sshConfig.Password = decrypted
	}

	if sshConfig.PrivateKey != "" {
		decrypted, err := encryptor.Decrypt(databaseID, sshConfig.PrivateKey)
		if err != nil {
			return fmt.Errorf("failed to decrypt SSH private key: %w", err)
		}
		sshConfig.PrivateKey = decrypted
	}

	if sshConfig.Passphrase != "" {
		decrypted, err := encryptor.Decrypt(databaseID, sshConfig.Passphrase)
		if err != nil {
			return fmt.Errorf("failed to decrypt SSH passphrase: %w", err)
		}
		sshConfig.Passphrase = decrypted
	}

	return nil
}

func connectWithSSHTunnelMongoDB(
	ctx context.Context,
	m *MongodbDatabase,
	password string,
	sshConfig *ssh.Config,
	encryptor encryption.FieldEncryptor,
	databaseID uuid.UUID,
) (*mongo.Client, func(), error) {
	host := m.Host
	port := m.Port

	var tunnel *ssh.Tunnel
	cleanup := func() {}

	if sshConfig != nil && sshConfig.HasAuth() {
		if err := decryptSSHTunnelCredentials(sshConfig, encryptor, databaseID); err != nil {
			return nil, cleanup, err
		}

		tunnel = ssh.NewTunnel(sshConfig)

		if err := tunnel.Start(ctx, m.Host, m.Port); err != nil {
			return nil, cleanup, fmt.Errorf("failed to start SSH tunnel: %w", err)
		}

		host = "127.0.0.1"
		port = tunnel.GetLocalPort()

		cleanup = func() {
			_ = tunnel.Stop()
		}
	}

	uri := m.buildConnectionURIWithHostPort(password, host, port)

	clientOptions := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		if tunnel != nil {
			_ = tunnel.Stop()
		}
		return nil, func() {}, err
	}

	originalCleanup := cleanup
	cleanup = func() {
		_ = client.Disconnect(ctx)
		originalCleanup()
	}

	return client, cleanup, nil
}

func (m *MongodbDatabase) buildConnectionURIWithHostPort(
	password string,
	host string,
	port int,
) string {
	authDB := m.AuthDatabase
	if authDB == "" {
		authDB = "admin"
	}

	tlsParams := ""
	if m.IsHttps {
		tlsParams = "&tls=true&tlsInsecure=true"
	}

	return fmt.Sprintf(
		"mongodb://%s:%s@%s:%d/%s?authSource=%s&connectTimeoutMS=15000%s",
		url.QueryEscape(m.Username),
		url.QueryEscape(password),
		host,
		port,
		m.Database,
		authDB,
		tlsParams,
	)
}

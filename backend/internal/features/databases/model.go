package databases

import (
	"context"
	"databasus-backend/internal/features/databases/databases/mariadb"
	"databasus-backend/internal/features/databases/databases/mongodb"
	"databasus-backend/internal/features/databases/databases/mysql"
	"databasus-backend/internal/features/databases/databases/postgresql"
	"databasus-backend/internal/features/notifiers"
	"databasus-backend/internal/util/encryption"
	"databasus-backend/internal/util/ssh"
	"errors"
	"log/slog"
	"time"

	"github.com/google/uuid"
)

type Database struct {
	ID uuid.UUID `json:"id" gorm:"column:id;primaryKey;type:uuid;default:gen_random_uuid()"`

	// WorkspaceID can be null when a database is created via restore operation
	// outside the context of any workspace
	WorkspaceID *uuid.UUID   `json:"workspaceId" gorm:"column:workspace_id;type:uuid"`
	Name        string       `json:"name"        gorm:"column:name;type:text;not null"`
	Type        DatabaseType `json:"type"        gorm:"column:type;type:text;not null"`

	Postgresql *postgresql.PostgresqlDatabase `json:"postgresql,omitempty" gorm:"foreignKey:DatabaseID"`
	Mysql      *mysql.MysqlDatabase           `json:"mysql,omitempty"      gorm:"foreignKey:DatabaseID"`
	Mariadb    *mariadb.MariadbDatabase       `json:"mariadb,omitempty"    gorm:"foreignKey:DatabaseID"`
	Mongodb    *mongodb.MongodbDatabase       `json:"mongodb,omitempty"    gorm:"foreignKey:DatabaseID"`

	SSHTunnel *SSHTunnelConfig `json:"sshTunnel,omitempty" gorm:"foreignKey:DatabaseID"`

	Notifiers []notifiers.Notifier `json:"notifiers" gorm:"many2many:database_notifiers;"`

	// these fields are not reliable, but
	// they are used for pretty UI
	LastBackupTime         *time.Time `json:"lastBackupTime,omitempty"         gorm:"column:last_backup_time;type:timestamp with time zone"`
	LastBackupErrorMessage *string    `json:"lastBackupErrorMessage,omitempty" gorm:"column:last_backup_error_message;type:text"`

	HealthStatus *HealthStatus `json:"healthStatus" gorm:"column:health_status;type:text;not null"`
}

func (d *Database) Validate() error {
	if d.Name == "" {
		return errors.New("name is required")
	}

	if d.SSHTunnel != nil {
		if err := d.SSHTunnel.Validate(); err != nil {
			return err
		}
	}

	switch d.Type {
	case DatabaseTypePostgres:
		if d.Postgresql == nil {
			return errors.New("postgresql database is required")
		}
		return d.Postgresql.Validate()
	case DatabaseTypeMysql:
		if d.Mysql == nil {
			return errors.New("mysql database is required")
		}
		return d.Mysql.Validate()
	case DatabaseTypeMariadb:
		if d.Mariadb == nil {
			return errors.New("mariadb database is required")
		}
		return d.Mariadb.Validate()
	case DatabaseTypeMongodb:
		if d.Mongodb == nil {
			return errors.New("mongodb database is required")
		}
		return d.Mongodb.Validate()
	default:
		return errors.New("invalid database type: " + string(d.Type))
	}
}

func (d *Database) ValidateUpdate(old, new Database) error {
	if old.Type != new.Type {
		return errors.New("database type is not allowed to change")
	}

	return nil
}

func (d *Database) TestConnection(
	logger *slog.Logger,
	encryptor encryption.FieldEncryptor,
) error {
	var sshConfig *ssh.Config
	if d.SSHTunnel != nil && d.SSHTunnel.Enabled {
		sshConfig = d.SSHTunnel.ToSSHConfig()
	}
	return d.getSpecificDatabase().TestConnection(logger, encryptor, d.ID, sshConfig)
}

func (d *Database) IsUserReadOnly(
	ctx context.Context,
	logger *slog.Logger,
	encryptor encryption.FieldEncryptor,
) (bool, []string, error) {
	switch d.Type {
	case DatabaseTypePostgres:
		return d.Postgresql.IsUserReadOnly(ctx, logger, encryptor, d.ID)
	case DatabaseTypeMysql:
		return d.Mysql.IsUserReadOnly(ctx, logger, encryptor, d.ID)
	case DatabaseTypeMariadb:
		return d.Mariadb.IsUserReadOnly(ctx, logger, encryptor, d.ID)
	case DatabaseTypeMongodb:
		return d.Mongodb.IsUserReadOnly(ctx, logger, encryptor, d.ID)
	default:
		return false, nil, errors.New("read-only check not supported for this database type")
	}
}

func (d *Database) HideSensitiveData() {
	d.getSpecificDatabase().HideSensitiveData()
	if d.SSHTunnel != nil {
		d.SSHTunnel.HideSensitiveData()
	}
}

func (d *Database) EncryptSensitiveFields(encryptor encryption.FieldEncryptor) error {
	if d.Postgresql != nil {
		if err := d.Postgresql.EncryptSensitiveFields(d.ID, encryptor); err != nil {
			return err
		}
	}
	if d.Mysql != nil {
		if err := d.Mysql.EncryptSensitiveFields(d.ID, encryptor); err != nil {
			return err
		}
	}
	if d.Mariadb != nil {
		if err := d.Mariadb.EncryptSensitiveFields(d.ID, encryptor); err != nil {
			return err
		}
	}
	if d.Mongodb != nil {
		if err := d.Mongodb.EncryptSensitiveFields(d.ID, encryptor); err != nil {
			return err
		}
	}
	if d.SSHTunnel != nil {
		if err := d.SSHTunnel.EncryptSensitiveFields(d.ID, encryptor); err != nil {
			return err
		}
	}
	return nil
}

func (d *Database) PopulateDbData(
	logger *slog.Logger,
	encryptor encryption.FieldEncryptor,
) error {
	var sshConfig *ssh.Config
	if d.SSHTunnel != nil && d.SSHTunnel.Enabled {
		sshConfig = d.SSHTunnel.ToSSHConfig()
	}

	if d.Postgresql != nil {
		return d.Postgresql.PopulateDbData(logger, encryptor, d.ID, sshConfig)
	}
	if d.Mysql != nil {
		return d.Mysql.PopulateDbData(logger, encryptor, d.ID, sshConfig)
	}
	if d.Mariadb != nil {
		return d.Mariadb.PopulateDbData(logger, encryptor, d.ID, sshConfig)
	}
	if d.Mongodb != nil {
		return d.Mongodb.PopulateDbData(logger, encryptor, d.ID, sshConfig)
	}
	return nil
}

func (d *Database) Update(incoming *Database) {
	d.Name = incoming.Name
	d.Type = incoming.Type
	d.Notifiers = incoming.Notifiers
	d.SSHTunnel = incoming.SSHTunnel

	switch d.Type {
	case DatabaseTypePostgres:
		if d.Postgresql != nil && incoming.Postgresql != nil {
			d.Postgresql.Update(incoming.Postgresql)
		}
	case DatabaseTypeMysql:
		if d.Mysql != nil && incoming.Mysql != nil {
			d.Mysql.Update(incoming.Mysql)
		}
	case DatabaseTypeMariadb:
		if d.Mariadb != nil && incoming.Mariadb != nil {
			d.Mariadb.Update(incoming.Mariadb)
		}
	case DatabaseTypeMongodb:
		if d.Mongodb != nil && incoming.Mongodb != nil {
			d.Mongodb.Update(incoming.Mongodb)
		}
	}
}

func (d *Database) getSpecificDatabase() DatabaseConnector {
	switch d.Type {
	case DatabaseTypePostgres:
		return d.Postgresql
	case DatabaseTypeMysql:
		return d.Mysql
	case DatabaseTypeMariadb:
		return d.Mariadb
	case DatabaseTypeMongodb:
		return d.Mongodb
	}

	panic("invalid database type: " + string(d.Type))
}

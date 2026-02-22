package databases

import (
	"databasus-backend/internal/util/encryption"
	"databasus-backend/internal/util/ssh"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SSHTunnelConfig struct {
	ID         uuid.UUID `json:"id"         gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	DatabaseID uuid.UUID `json:"databaseId" gorm:"type:uuid;column:database_id;not null;uniqueIndex"`

	Enabled           bool   `json:"enabled"              gorm:"default:false"`
	Host              string `json:"host"                 gorm:"type:text"`
	Port              int    `json:"port"                 gorm:"default:22"`
	Username          string `json:"username"             gorm:"type:text"`
	AuthType          string `json:"authType"             gorm:"type:text;default:'password'"`
	Password          string `json:"password,omitempty"   gorm:"type:text"`
	PrivateKey        string `json:"privateKey,omitempty" gorm:"type:text"`
	Passphrase        string `json:"passphrase,omitempty" gorm:"type:text"`
	SkipHostKeyVerify bool   `json:"skipHostKeyVerify"    gorm:"default:false"`
}

func (s *SSHTunnelConfig) TableName() string {
	return "ssh_tunnel_configs"
}

func (s *SSHTunnelConfig) Validate() error {
	if !s.Enabled {
		return nil
	}

	if s.Host == "" {
		return errors.New("SSH host is required")
	}

	if s.Port <= 0 || s.Port > 65535 {
		return errors.New("SSH port must be between 1 and 65535")
	}

	if s.Username == "" {
		return errors.New("SSH username is required")
	}

	if s.AuthType == "password" && s.Password == "" {
		return errors.New("SSH password is required when using password authentication")
	}

	if s.AuthType == "privateKey" && s.PrivateKey == "" {
		return errors.New("SSH private key is required when using private key authentication")
	}

	return nil
}

func (s *SSHTunnelConfig) ToSSHConfig() *ssh.Config {
	return &ssh.Config{
		Host:              s.Host,
		Port:              s.Port,
		Username:          s.Username,
		AuthType:          ssh.AuthType(s.AuthType),
		Password:          s.Password,
		PrivateKey:        s.PrivateKey,
		Passphrase:        s.Passphrase,
		SkipHostKeyVerify: s.SkipHostKeyVerify,
	}
}

func (s *SSHTunnelConfig) ToSSHConfigWithDecrypt(
	encryptor encryption.FieldEncryptor,
	databaseID uuid.UUID,
) (*ssh.Config, error) {
	if err := s.DecryptSensitiveFields(databaseID, encryptor); err != nil {
		return nil, err
	}
	return s.ToSSHConfig(), nil
}

func (s *SSHTunnelConfig) HideSensitiveData() {
	s.Password = ""
	s.PrivateKey = ""
	s.Passphrase = ""
}

func (s *SSHTunnelConfig) EncryptSensitiveFields(
	databaseID uuid.UUID,
	encryptor encryption.FieldEncryptor,
) error {
	if s.Password != "" {
		encrypted, err := encryptor.Encrypt(databaseID, s.Password)
		if err != nil {
			return fmt.Errorf("failed to encrypt SSH password: %w", err)
		}
		s.Password = encrypted
	}

	if s.PrivateKey != "" {
		encrypted, err := encryptor.Encrypt(databaseID, s.PrivateKey)
		if err != nil {
			return fmt.Errorf("failed to encrypt SSH private key: %w", err)
		}
		s.PrivateKey = encrypted
	}

	if s.Passphrase != "" {
		encrypted, err := encryptor.Encrypt(databaseID, s.Passphrase)
		if err != nil {
			return fmt.Errorf("failed to encrypt SSH passphrase: %w", err)
		}
		s.Passphrase = encrypted
	}

	return nil
}

func (s *SSHTunnelConfig) DecryptSensitiveFields(
	databaseID uuid.UUID,
	encryptor encryption.FieldEncryptor,
) error {
	if s.Password != "" {
		decrypted, err := encryptor.Decrypt(databaseID, s.Password)
		if err != nil {
			return fmt.Errorf("failed to decrypt SSH password: %w", err)
		}
		s.Password = decrypted
	}

	if s.PrivateKey != "" {
		decrypted, err := encryptor.Decrypt(databaseID, s.PrivateKey)
		if err != nil {
			return fmt.Errorf("failed to decrypt SSH private key: %w", err)
		}
		s.PrivateKey = decrypted
	}

	if s.Passphrase != "" {
		decrypted, err := encryptor.Decrypt(databaseID, s.Passphrase)
		if err != nil {
			return fmt.Errorf("failed to decrypt SSH passphrase: %w", err)
		}
		s.Passphrase = decrypted
	}

	return nil
}

func (s *SSHTunnelConfig) BeforeSave(_ *gorm.DB) error {
	return s.Validate()
}

func (s *SSHTunnelConfig) Update(incoming *SSHTunnelConfig) {
	s.Enabled = incoming.Enabled
	s.Host = incoming.Host
	s.Port = incoming.Port
	s.Username = incoming.Username
	s.AuthType = incoming.AuthType
	s.SkipHostKeyVerify = incoming.SkipHostKeyVerify

	if incoming.Password != "" {
		s.Password = incoming.Password
	}

	if incoming.PrivateKey != "" {
		s.PrivateKey = incoming.PrivateKey
	}

	if incoming.Passphrase != "" {
		s.Passphrase = incoming.Passphrase
	}
}

package ssh

import (
	"errors"
)

type AuthType string

const (
	AuthTypePassword   AuthType = "password"
	AuthTypePrivateKey AuthType = "privateKey"
)

type Config struct {
	Host              string   `json:"host"`
	Port              int      `json:"port"`
	Username          string   `json:"username"`
	AuthType          AuthType `json:"authType"`
	Password          string   `json:"password,omitempty"`
	PrivateKey        string   `json:"privateKey,omitempty"`
	Passphrase        string   `json:"passphrase,omitempty"`
	SkipHostKeyVerify bool     `json:"skipHostKeyVerify"`
}

func (c *Config) Validate() error {
	if c.Host == "" {
		return errors.New("SSH host is required")
	}

	if c.Port <= 0 || c.Port > 65535 {
		return errors.New("SSH port must be between 1 and 65535")
	}

	if c.Username == "" {
		return errors.New("SSH username is required")
	}

	if c.AuthType == AuthTypePassword && c.Password == "" {
		return errors.New("SSH password is required when using password authentication")
	}

	if c.AuthType == AuthTypePrivateKey && c.PrivateKey == "" {
		return errors.New("SSH private key is required when using private key authentication")
	}

	return nil
}

func (c *Config) HasAuth() bool {
	return c.Password != "" || c.PrivateKey != ""
}

func (c *Config) HideSensitiveData() {
	c.Password = ""
	c.PrivateKey = ""
	c.Passphrase = ""
}

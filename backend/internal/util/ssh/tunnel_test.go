package ssh

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConfig_Validate(t *testing.T) {
	tests := []struct {
		name    string
		config  *Config
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid password config",
			config: &Config{
				Host:     "example.com",
				Port:     22,
				Username: "user",
				AuthType: AuthTypePassword,
				Password: "password",
			},
			wantErr: false,
		},
		{
			name: "valid private key config",
			config: &Config{
				Host:       "example.com",
				Port:       22,
				Username:   "user",
				AuthType:   AuthTypePrivateKey,
				PrivateKey: "-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----",
			},
			wantErr: false,
		},
		{
			name: "missing host",
			config: &Config{
				Port:     22,
				Username: "user",
				AuthType: AuthTypePassword,
				Password: "password",
			},
			wantErr: true,
			errMsg:  "SSH host is required",
		},
		{
			name: "invalid port - zero",
			config: &Config{
				Host:     "example.com",
				Port:     0,
				Username: "user",
				AuthType: AuthTypePassword,
				Password: "password",
			},
			wantErr: true,
			errMsg:  "SSH port must be between 1 and 65535",
		},
		{
			name: "invalid port - too high",
			config: &Config{
				Host:     "example.com",
				Port:     70000,
				Username: "user",
				AuthType: AuthTypePassword,
				Password: "password",
			},
			wantErr: true,
			errMsg:  "SSH port must be between 1 and 65535",
		},
		{
			name: "missing username",
			config: &Config{
				Host:     "example.com",
				Port:     22,
				AuthType: AuthTypePassword,
				Password: "password",
			},
			wantErr: true,
			errMsg:  "SSH username is required",
		},
		{
			name: "missing password for password auth",
			config: &Config{
				Host:     "example.com",
				Port:     22,
				Username: "user",
				AuthType: AuthTypePassword,
			},
			wantErr: true,
			errMsg:  "SSH password is required when using password authentication",
		},
		{
			name: "missing private key for private key auth",
			config: &Config{
				Host:     "example.com",
				Port:     22,
				Username: "user",
				AuthType: AuthTypePrivateKey,
			},
			wantErr: true,
			errMsg:  "SSH private key is required when using private key authentication",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.config.Validate()
			if tt.wantErr {
				assert.Error(t, err)
				assert.Equal(t, tt.errMsg, err.Error())
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestConfig_HasAuth(t *testing.T) {
	tests := []struct {
		name   string
		config *Config
		want   bool
	}{
		{
			name: "has password",
			config: &Config{
				Password: "password",
			},
			want: true,
		},
		{
			name: "has private key",
			config: &Config{
				PrivateKey: "key",
			},
			want: true,
		},
		{
			name: "has both",
			config: &Config{
				Password:   "password",
				PrivateKey: "key",
			},
			want: true,
		},
		{
			name:   "has neither",
			config: &Config{},
			want:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, tt.config.HasAuth())
		})
	}
}

func TestConfig_HideSensitiveData(t *testing.T) {
	config := &Config{
		Host:       "example.com",
		Port:       22,
		Username:   "user",
		Password:   "secret-password",
		PrivateKey: "secret-key",
		Passphrase: "secret-passphrase",
	}

	config.HideSensitiveData()

	assert.Equal(t, "example.com", config.Host)
	assert.Equal(t, 22, config.Port)
	assert.Equal(t, "user", config.Username)
	assert.Empty(t, config.Password)
	assert.Empty(t, config.PrivateKey)
	assert.Empty(t, config.Passphrase)
}

func TestNewTunnel(t *testing.T) {
	config := &Config{
		Host:     "example.com",
		Port:     22,
		Username: "user",
		AuthType: AuthTypePassword,
		Password: "password",
	}

	tunnel := NewTunnel(config)

	assert.NotNil(t, tunnel)
	assert.Equal(t, config, tunnel.config)
}

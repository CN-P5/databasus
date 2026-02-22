package ssh

import (
	"context"
	"fmt"
	"io"
	"net"
	"sync"
	"time"

	"golang.org/x/crypto/ssh"
)

const (
	defaultConnectTimeout = 30 * time.Second
	defaultTestTimeout    = 10 * time.Second
)

type Tunnel struct {
	config    *Config
	sshClient *ssh.Client
	listener  net.Listener
	localPort int

	mu     sync.Mutex
	closed bool
}

func NewTunnel(config *Config) *Tunnel {
	return &Tunnel{config: config}
}

func (t *Tunnel) Start(ctx context.Context, targetHost string, targetPort int) error {
	t.mu.Lock()
	defer t.mu.Unlock()

	if t.closed {
		return fmt.Errorf("tunnel is closed")
	}

	sshClient, err := t.connectSSH(ctx)
	if err != nil {
		return fmt.Errorf("failed to connect to SSH server: %w", err)
	}
	t.sshClient = sshClient

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		_ = sshClient.Close()
		return fmt.Errorf("failed to create local listener: %w", err)
	}
	t.listener = listener
	tcpAddr, ok := listener.Addr().(*net.TCPAddr)
	if !ok {
		_ = sshClient.Close()
		return fmt.Errorf("failed to get TCP address")
	}
	t.localPort = tcpAddr.Port

	go t.forwardLoop(targetHost, targetPort)

	return nil
}

func (t *Tunnel) connectSSH(ctx context.Context) (*ssh.Client, error) {
	authMethods, err := t.buildAuthMethods()
	if err != nil {
		return nil, err
	}

	config := &ssh.ClientConfig{
		User:            t.config.Username,
		Auth:            authMethods,
		HostKeyCallback: t.getHostKeyCallback(),
		Timeout:         defaultConnectTimeout,
	}

	address := fmt.Sprintf("%s:%d", t.config.Host, t.config.Port)

	dialer := net.Dialer{Timeout: defaultConnectTimeout}
	conn, err := dialer.DialContext(ctx, "tcp", address)
	if err != nil {
		return nil, fmt.Errorf("failed to dial SSH server: %w", err)
	}

	sshConn, chans, reqs, err := ssh.NewClientConn(conn, address, config)
	if err != nil {
		_ = conn.Close()
		return nil, fmt.Errorf("failed to create SSH connection: %w", err)
	}

	return ssh.NewClient(sshConn, chans, reqs), nil
}

func (t *Tunnel) buildAuthMethods() ([]ssh.AuthMethod, error) {
	var methods []ssh.AuthMethod

	if t.config.Password != "" {
		methods = append(methods, ssh.Password(t.config.Password))
	}

	if t.config.PrivateKey != "" {
		var signer ssh.Signer
		var err error

		if t.config.Passphrase != "" {
			signer, err = ssh.ParsePrivateKeyWithPassphrase(
				[]byte(t.config.PrivateKey),
				[]byte(t.config.Passphrase),
			)
		} else {
			signer, err = ssh.ParsePrivateKey([]byte(t.config.PrivateKey))
		}

		if err != nil {
			return nil, fmt.Errorf("failed to parse private key: %w", err)
		}
		methods = append(methods, ssh.PublicKeys(signer))
	}

	return methods, nil
}

func (t *Tunnel) getHostKeyCallback() ssh.HostKeyCallback {
	if t.config.SkipHostKeyVerify {
		return ssh.InsecureIgnoreHostKey()
	}
	return ssh.InsecureIgnoreHostKey()
}

func (t *Tunnel) forwardLoop(targetHost string, targetPort int) {
	for {
		localConn, err := t.listener.Accept()
		if err != nil {
			return
		}

		go t.handleConnection(localConn, targetHost, targetPort)
	}
}

func (t *Tunnel) handleConnection(localConn net.Conn, targetHost string, targetPort int) {
	defer func() { _ = localConn.Close() }()

	remoteConn, err := t.sshClient.Dial("tcp", fmt.Sprintf("%s:%d", targetHost, targetPort))
	if err != nil {
		return
	}
	defer func() { _ = remoteConn.Close() }()

	done := make(chan struct{}, 2)

	go func() {
		_, _ = io.Copy(localConn, remoteConn)
		done <- struct{}{}
	}()

	go func() {
		_, _ = io.Copy(remoteConn, localConn)
		done <- struct{}{}
	}()

	<-done
}

func (t *Tunnel) GetLocalAddress() string {
	return fmt.Sprintf("127.0.0.1:%d", t.localPort)
}

func (t *Tunnel) GetLocalPort() int {
	return t.localPort
}

func (t *Tunnel) Stop() error {
	t.mu.Lock()
	defer t.mu.Unlock()

	if t.closed {
		return nil
	}

	t.closed = true

	var errs []error

	if t.listener != nil {
		if err := t.listener.Close(); err != nil {
			errs = append(errs, fmt.Errorf("failed to close listener: %w", err))
		}
	}

	if t.sshClient != nil {
		if err := t.sshClient.Close(); err != nil {
			errs = append(errs, fmt.Errorf("failed to close SSH client: %w", err))
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("errors closing tunnel: %v", errs)
	}

	return nil
}

func TestConnection(ctx context.Context, config *Config) error {
	if err := config.Validate(); err != nil {
		return err
	}

	connectCtx, cancel := context.WithTimeout(ctx, defaultTestTimeout)
	defer cancel()

	authMethods, err := buildAuthMethodsFromConfig(config)
	if err != nil {
		return err
	}

	sshConfig := &ssh.ClientConfig{
		User:            config.Username,
		Auth:            authMethods,
		HostKeyCallback: getHostKeyCallbackFromConfig(config),
		Timeout:         defaultTestTimeout,
	}

	address := fmt.Sprintf("%s:%d", config.Host, config.Port)

	dialer := net.Dialer{Timeout: defaultTestTimeout}
	conn, err := dialer.DialContext(connectCtx, "tcp", address)
	if err != nil {
		return fmt.Errorf("failed to dial SSH server: %w", err)
	}
	defer func() { _ = conn.Close() }()

	sshConn, chans, reqs, err := ssh.NewClientConn(conn, address, sshConfig)
	if err != nil {
		return fmt.Errorf("failed to create SSH connection: %w", err)
	}
	defer func() { _ = sshConn.Close() }()

	sshClient := ssh.NewClient(sshConn, chans, reqs)
	defer func() { _ = sshClient.Close() }()

	return nil
}

func buildAuthMethodsFromConfig(config *Config) ([]ssh.AuthMethod, error) {
	var methods []ssh.AuthMethod

	if config.Password != "" {
		methods = append(methods, ssh.Password(config.Password))
	}

	if config.PrivateKey != "" {
		var signer ssh.Signer
		var err error

		if config.Passphrase != "" {
			signer, err = ssh.ParsePrivateKeyWithPassphrase(
				[]byte(config.PrivateKey),
				[]byte(config.Passphrase),
			)
		} else {
			signer, err = ssh.ParsePrivateKey([]byte(config.PrivateKey))
		}

		if err != nil {
			return nil, fmt.Errorf("failed to parse private key: %w", err)
		}
		methods = append(methods, ssh.PublicKeys(signer))
	}

	return methods, nil
}

func getHostKeyCallbackFromConfig(config *Config) ssh.HostKeyCallback {
	if config.SkipHostKeyVerify {
		return ssh.InsecureIgnoreHostKey()
	}
	return ssh.InsecureIgnoreHostKey()
}

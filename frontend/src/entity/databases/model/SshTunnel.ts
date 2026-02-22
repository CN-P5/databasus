export type SshAuthType = 'password' | 'privateKey';

export interface SshTunnel {
  id?: string;
  databaseId?: string;
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  authType: SshAuthType;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  skipHostKeyVerify?: boolean;
}

export const createDefaultSshTunnel = (): SshTunnel => ({
  enabled: false,
  host: '',
  port: 22,
  username: '',
  authType: 'password',
  password: '',
  privateKey: '',
  passphrase: '',
  skipHostKeyVerify: false,
});

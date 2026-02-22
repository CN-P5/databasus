import { Checkbox, Input, InputNumber, Select, Switch } from 'antd';
import { useTranslation } from 'react-i18next';

import type { SshTunnel } from '../../../../entity/databases/model/SshTunnel';
import { createDefaultSshTunnel } from '../../../../entity/databases/model/SshTunnel';

interface Props {
  sshTunnel?: SshTunnel;
  onChange: (sshTunnel: SshTunnel) => void;
}

export const SshTunnelConfigComponent = ({ sshTunnel, onChange }: Props) => {
  const { t } = useTranslation(['common', 'databases']);

  const handleToggle = (enabled: boolean) => {
    if (enabled && !sshTunnel) {
      onChange({ ...createDefaultSshTunnel(), enabled: true });
    } else {
      onChange({ ...(sshTunnel || createDefaultSshTunnel()), enabled });
    }
  };

  const handleChange = (field: keyof SshTunnel, value: string | number | boolean) => {
    const currentTunnel = sshTunnel || createDefaultSshTunnel();
    onChange({ ...currentTunnel, [field]: value });
  };

  const handleAuthTypeChange = (authType: 'password' | 'privateKey') => {
    const currentTunnel = sshTunnel || createDefaultSshTunnel();
    onChange({
      ...currentTunnel,
      authType,
      password: authType === 'password' ? currentTunnel.password || '' : undefined,
      privateKey: authType === 'privateKey' ? currentTunnel.privateKey || '' : undefined,
      passphrase: authType === 'privateKey' ? currentTunnel.passphrase || '' : undefined,
    });
  };

  const currentTunnel = sshTunnel || createDefaultSshTunnel();

  return (
    <div className="mt-4">
      <div className="mb-1 flex items-center">
        <div className="min-w-[150px]">{t('databases:sshTunnel')}</div>
        <Switch checked={currentTunnel.enabled} onChange={handleToggle} size="small" />
      </div>

      {currentTunnel.enabled && (
        <div className="space-y-2">
          <div className="flex w-full items-center">
            <div className="min-w-[120px] text-sm">{t('databases:sshHost')}</div>
            <Input
              value={currentTunnel.host}
              onChange={(e) => handleChange('host', e.target.value)}
              size="small"
              className="max-w-[200px] grow"
              placeholder={t('databases:sshHostPlaceholder')}
            />
          </div>

          <div className="flex w-full items-center">
            <div className="min-w-[120px] text-sm">{t('databases:sshPort')}</div>
            <InputNumber
              value={currentTunnel.port}
              onChange={(e) => handleChange('port', e ?? 22)}
              size="small"
              className="max-w-[200px] grow"
              min={1}
              max={65535}
              placeholder={t('databases:sshPortPlaceholder')}
            />
          </div>

          <div className="flex w-full items-center">
            <div className="min-w-[120px] text-sm">{t('databases:sshUsername')}</div>
            <Input
              value={currentTunnel.username}
              onChange={(e) => handleChange('username', e.target.value)}
              size="small"
              className="max-w-[200px] grow"
              placeholder={t('databases:sshUsernamePlaceholder')}
            />
          </div>

          <div className="flex w-full items-center">
            <div className="min-w-[120px] text-sm">{t('databases:sshAuthType')}</div>
            <Select
              value={currentTunnel.authType}
              onChange={handleAuthTypeChange}
              size="small"
              className="max-w-[200px] grow"
              options={[
                { value: 'password', label: t('databases:sshPasswordAuth') },
                { value: 'privateKey', label: t('databases:sshPrivateKeyAuth') },
              ]}
            />
          </div>

          {currentTunnel.authType === 'password' && (
            <div className="flex w-full items-center">
              <div className="min-w-[120px] text-sm">{t('databases:sshPassword')}</div>
              <Input.Password
                value={currentTunnel.password}
                onChange={(e) => handleChange('password', e.target.value)}
                size="small"
                className="max-w-[200px] grow"
                placeholder={t('databases:sshPasswordPlaceholder')}
              />
            </div>
          )}

          {currentTunnel.authType === 'privateKey' && (
            <>
              <div className="flex w-full items-start">
                <div className="min-w-[120px] pt-1 text-sm">{t('databases:sshPrivateKey')}</div>
                <Input.TextArea
                  value={currentTunnel.privateKey}
                  onChange={(e) => handleChange('privateKey', e.target.value)}
                  size="small"
                  className="max-w-[200px] grow"
                  rows={4}
                  placeholder={t('databases:sshPrivateKeyPlaceholder')}
                />
              </div>

              <div className="flex w-full items-center">
                <div className="min-w-[120px] text-sm">{t('databases:sshPassphrase')}</div>
                <Input.Password
                  value={currentTunnel.passphrase}
                  onChange={(e) => handleChange('passphrase', e.target.value)}
                  size="small"
                  className="max-w-[200px] grow"
                  placeholder={t('databases:sshPassphrasePlaceholder')}
                />
              </div>
            </>
          )}

          <div className="flex w-full items-center">
            <div className="min-w-[120px]" />
            <Checkbox
              checked={currentTunnel.skipHostKeyVerify}
              onChange={(e) => handleChange('skipHostKeyVerify', e.target.checked)}
            >
              {t('databases:sshSkipHostKeyVerify')}
            </Checkbox>
          </div>

          <div className="flex w-full items-center">
            <div className="min-w-[120px]" />
            <div className="max-w-[300px] text-xs text-gray-500 dark:text-gray-400">
              {t('databases:sshSkipHostKeyVerifyDescription')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

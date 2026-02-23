import { useTranslation } from 'react-i18next';

import { type Database, MariadbVersion } from '../../../../entity/databases';

interface Props {
  database: Database;
}

const mariadbVersionLabels: Record<MariadbVersion, string> = {
  [MariadbVersion.MariadbVersion55]: '5.5',
  [MariadbVersion.MariadbVersion101]: '10.1',
  [MariadbVersion.MariadbVersion102]: '10.2',
  [MariadbVersion.MariadbVersion103]: '10.3',
  [MariadbVersion.MariadbVersion104]: '10.4',
  [MariadbVersion.MariadbVersion105]: '10.5',
  [MariadbVersion.MariadbVersion106]: '10.6',
  [MariadbVersion.MariadbVersion1011]: '10.11',
  [MariadbVersion.MariadbVersion114]: '11.4',
  [MariadbVersion.MariadbVersion118]: '11.8',
  [MariadbVersion.MariadbVersion120]: '12.0',
};

export const ShowMariaDbSpecificDataComponent = ({ database }: Props) => {
  const { t } = useTranslation('databases');

  return (
    <div>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('mariadbVersion')}</div>
        <div>{database.mariadb?.version ? mariadbVersionLabels[database.mariadb.version] : ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px] break-all">{t('host')}</div>
        <div>{database.mariadb?.host || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('port')}</div>
        <div>{database.mariadb?.port || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('username')}</div>
        <div>{database.mariadb?.username || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('password')}</div>
        <div>{'*************'}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('dbName')}</div>
        <div>{database.mariadb?.database || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('useHttps')}</div>
        <div>{database.mariadb?.isHttps ? t('yes') : t('no')}</div>
      </div>

      {database.mariadb?.isExcludeEvents && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">{t('excludeEvents')}</div>
          <div>{t('yes')}</div>
        </div>
      )}

      {database.sshTunnel?.enabled && (
        <>
          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('sshTunnel')}</div>
            <div>{t('enabled')}</div>
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px] break-all">{t('sshHost')}</div>
            <div>{database.sshTunnel.host}</div>
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('sshPort')}</div>
            <div>{database.sshTunnel.port}</div>
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('sshUsername')}</div>
            <div>{database.sshTunnel.username}</div>
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('sshAuthType')}</div>
            <div>
              {database.sshTunnel.authType === 'password'
                ? t('sshPasswordAuth')
                : t('sshPrivateKeyAuth')}
            </div>
          </div>

          {database.sshTunnel.skipHostKeyVerify && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[150px]">{t('sshSkipHostKeyVerify')}</div>
              <div>{t('yes')}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

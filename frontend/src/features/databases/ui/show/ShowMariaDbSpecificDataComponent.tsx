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
  const { t } = useTranslation(['common', 'databases']);

  return (
    <div>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases:mariadbVersion')}</div>
        <div>{database.mariadb?.version ? mariadbVersionLabels[database.mariadb.version] : ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px] break-all">{t('databases:host')}</div>
        <div>{database.mariadb?.host || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases:port')}</div>
        <div>{database.mariadb?.port || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases:username')}</div>
        <div>{database.mariadb?.username || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases:databasePassword')}</div>
        <div>{'*************'}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases:databaseName')}</div>
        <div>{database.mariadb?.database || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases:useHttps')}</div>
        <div>{database.mariadb?.isHttps ? t('databases:yes') : t('databases:no')}</div>
      </div>

      {database.mariadb?.isExcludeEvents && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">{t('databases:excludeEvents')}</div>
          <div>{t('databases:yes')}</div>
        </div>
      )}

      {database.sshTunnel?.enabled && (
        <>
          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('databases:sshTunnel')}</div>
            <div>{t('databases:enabled')}</div>
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px] break-all">{t('databases:sshHost')}</div>
            <div>{database.sshTunnel.host}</div>
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('databases:sshPort')}</div>
            <div>{database.sshTunnel.port}</div>
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('databases:sshUsername')}</div>
            <div>{database.sshTunnel.username}</div>
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('databases:sshAuthType')}</div>
            <div>
              {database.sshTunnel.authType === 'password'
                ? t('databases:sshPasswordAuth')
                : t('databases:sshPrivateKeyAuth')}
            </div>
          </div>

          {database.sshTunnel.skipHostKeyVerify && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[150px]">{t('databases:sshSkipHostKeyVerify')}</div>
              <div>{t('databases:yes')}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

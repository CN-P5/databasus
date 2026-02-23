import { useTranslation } from 'react-i18next';

import { type Database } from '../../../../entity/databases';

interface Props {
  database: Database;
}

export const ShowMongoDbSpecificDataComponent = ({ database }: Props) => {
  const { t } = useTranslation('databases');

  return (
    <div>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px] break-all">{t('host')}</div>
        <div>{database.mongodb?.host || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('port')}</div>
        <div>{database.mongodb?.port || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('username')}</div>
        <div>{database.mongodb?.username || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('password')}</div>
        <div>{'*************'}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('dbName')}</div>
        <div>{database.mongodb?.database || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('useHttps')}</div>
        <div>{database.mongodb?.isHttps ? t('yes') : t('no')}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('cpuCount')}</div>
        <div>{database.mongodb?.cpuCount}</div>
      </div>

      {database.mongodb?.isDirectConnection && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">{t('directConnection')}</div>
          <div>{t('yes')}</div>
        </div>
      )}

      {database.mongodb?.authDatabase && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">{t('authDatabase')}</div>
          <div>{database.mongodb.authDatabase}</div>
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

import { useTranslation } from 'react-i18next';

import { type Database, PostgresqlVersion } from '../../../../entity/databases';

interface Props {
  database: Database;
}

const postgresqlVersionLabels = {
  [PostgresqlVersion.PostgresqlVersion12]: '12',
  [PostgresqlVersion.PostgresqlVersion13]: '13',
  [PostgresqlVersion.PostgresqlVersion14]: '14',
  [PostgresqlVersion.PostgresqlVersion15]: '15',
  [PostgresqlVersion.PostgresqlVersion16]: '16',
  [PostgresqlVersion.PostgresqlVersion17]: '17',
  [PostgresqlVersion.PostgresqlVersion18]: '18',
};

export const ShowPostgreSqlSpecificDataComponent = ({ database }: Props) => {
  const { t } = useTranslation('databases');

  return (
    <div>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('pgVersion')}</div>
        <div>
          {database.postgresql?.version ? postgresqlVersionLabels[database.postgresql.version] : ''}
        </div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px] break-all">{t('host')}</div>
        <div>{database.postgresql?.host || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('port')}</div>
        <div>{database.postgresql?.port || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('username')}</div>
        <div>{database.postgresql?.username || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('password')}</div>
        <div>{'*************'}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('dbName')}</div>
        <div>{database.postgresql?.database || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('useHttps')}</div>
        <div>{database.postgresql?.isHttps ? t('yes') : t('no')}</div>
      </div>

      {!!database.postgresql?.includeSchemas?.length && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">{t('includeSchemas')}</div>
          <div>{database.postgresql.includeSchemas.join(', ')}</div>
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

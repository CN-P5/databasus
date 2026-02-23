import { useTranslation } from 'react-i18next';

import { type Database, MysqlVersion } from '../../../../entity/databases';

interface Props {
  database: Database;
}

const mysqlVersionLabels = {
  [MysqlVersion.MysqlVersion57]: '5.7',
  [MysqlVersion.MysqlVersion80]: '8.0',
  [MysqlVersion.MysqlVersion84]: '8.4',
};

export const ShowMySqlSpecificDataComponent = ({ database }: Props) => {
  const { t } = useTranslation('databases');

  return (
    <div>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('mysqlVersion')}</div>
        <div>{database.mysql?.version ? mysqlVersionLabels[database.mysql.version] : ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px] break-all">{t('host')}</div>
        <div>{database.mysql?.host || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('port')}</div>
        <div>{database.mysql?.port || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('username')}</div>
        <div>{database.mysql?.username || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('password')}</div>
        <div>{'*************'}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('dbName')}</div>
        <div>{database.mysql?.database || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('useHttps')}</div>
        <div>{database.mysql?.isHttps ? t('yes') : t('no')}</div>
      </div>

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

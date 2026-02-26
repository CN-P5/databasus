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
  const { t } = useTranslation(['common', 'databases']);

  return (
    <div>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases:mysqlVersion')}</div>
        <div>{database.mysql?.version ? mysqlVersionLabels[database.mysql.version] : ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px] break-all">{t('databases:host')}</div>
        <div>{database.mysql?.host || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases:port')}</div>
        <div>{database.mysql?.port || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases:username')}</div>
        <div>{database.mysql?.username || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases:databasePassword')}</div>
        <div>{'*************'}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases:databaseName')}</div>
        <div>{database.mysql?.database || ''}</div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases:useHttps')}</div>
        <div>{database.mysql?.isHttps ? t('databases:yes') : t('databases:no')}</div>
      </div>

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

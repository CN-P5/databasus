import { useTranslation } from 'react-i18next';

import type { Storage } from '../../../../../entity/storages';

interface Props {
  storage: Storage;
}

export function ShowSFTPStorageComponent({ storage }: Props) {
  const { t } = useTranslation('storages');
  const authMethod = storage?.sftpStorage?.privateKey ? t('privateKey') : t('password');

  return (
    <>
      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('host')}</div>
        {storage?.sftpStorage?.host || '-'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('port')}</div>
        {storage?.sftpStorage?.port || '-'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('username')}</div>
        {storage?.sftpStorage?.username || '-'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('authMethod')}</div>
        {authMethod}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('credentials')}</div>
        {'*************'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('path')}</div>
        {storage?.sftpStorage?.path || '-'}
      </div>

      {storage?.sftpStorage?.skipHostKeyVerify && (
        <div className="mb-1 flex items-center">
          <div className="min-w-[110px]">{t('skipHostKey')}</div>
          {t('enabled')}
        </div>
      )}
    </>
  );
}

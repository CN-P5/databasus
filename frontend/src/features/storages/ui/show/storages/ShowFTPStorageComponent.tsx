import { useTranslation } from 'react-i18next';

import type { Storage } from '../../../../../entity/storages';

interface Props {
  storage: Storage;
}

export function ShowFTPStorageComponent({ storage }: Props) {
  const { t } = useTranslation('storages');

  return (
    <>
      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('host')}</div>
        {storage?.ftpStorage?.host || '-'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('port')}</div>
        {storage?.ftpStorage?.port || '-'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('username')}</div>
        {storage?.ftpStorage?.username || '-'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('password')}</div>
        {'*************'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('path')}</div>
        {storage?.ftpStorage?.path || '-'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('useSslTls')}</div>
        {storage?.ftpStorage?.useSsl ? t('yes') : t('no')}
      </div>

      {storage?.ftpStorage?.useSsl && storage?.ftpStorage?.skipTlsVerify && (
        <div className="mb-1 flex items-center">
          <div className="min-w-[110px]">{t('skipTLS')}</div>
          {t('enabled')}
        </div>
      )}
    </>
  );
}

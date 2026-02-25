import type { Storage } from '../../../../../entity/storages';
import { useTranslation } from 'react-i18next';

interface Props {
  storage: Storage;
}

export function ShowS3StorageComponent({ storage }: Props) {
  const { t } = useTranslation('storages');
  return (
    <>
      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('s3BucketLabel')}</div>
        {storage?.s3Storage?.s3Bucket}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('region')}</div>
        {storage?.s3Storage?.s3Region || '-'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('accessKey')}</div>
        {'*************'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('secretKey')}</div>
        {'*************'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('endpoint')}</div>
        {storage?.s3Storage?.s3Endpoint || '-'}
      </div>

      {storage?.s3Storage?.s3Prefix && (
        <div className="mb-1 flex items-center">
          <div className="min-w-[110px]">{t('folderPrefix')}</div>
          {storage.s3Storage.s3Prefix}
        </div>
      )}

      {storage?.s3Storage?.s3UseVirtualHostedStyle && (
        <div className="mb-1 flex items-center">
          <div className="min-w-[110px]">{t('virtualHost')}</div>
          {t('enabled')}
        </div>
      )}

      {storage?.s3Storage?.skipTLSVerify && (
        <div className="mb-1 flex items-center">
          <div className="min-w-[110px]">{t('skipTLS')}</div>
          {t('enabled')}
        </div>
      )}
    </>
  );
}

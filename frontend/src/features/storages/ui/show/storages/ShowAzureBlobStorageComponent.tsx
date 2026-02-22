import { useTranslation } from 'react-i18next';

import type { Storage } from '../../../../../entity/storages';

interface Props {
  storage: Storage;
}

export function ShowAzureBlobStorageComponent({ storage }: Props) {
  const { t } = useTranslation('storages');

  return (
    <>
      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('authMethod')}</div>
        {storage?.azureBlobStorage?.authMethod === 'CONNECTION_STRING'
          ? t('connectionString')
          : t('accountKey')}
      </div>

      {storage?.azureBlobStorage?.authMethod === 'CONNECTION_STRING' && (
        <div className="mb-1 flex items-center">
          <div className="min-w-[110px]">{t('connectionString')}</div>
          {'*************'}
        </div>
      )}

      {storage?.azureBlobStorage?.authMethod === 'ACCOUNT_KEY' && (
        <>
          <div className="mb-1 flex items-center">
            <div className="min-w-[110px]">{t('accountName')}</div>
            {storage?.azureBlobStorage?.accountName || '-'}
          </div>

          <div className="mb-1 flex items-center">
            <div className="min-w-[110px]">{t('accountKey')}</div>
            {'*************'}
          </div>

          <div className="mb-1 flex items-center">
            <div className="min-w-[110px]">{t('endpoint')}</div>
            {storage?.azureBlobStorage?.endpoint || '-'}
          </div>
        </>
      )}

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('containerName')}</div>
        {storage?.azureBlobStorage?.containerName || '-'}
      </div>

      {storage?.azureBlobStorage?.prefix && (
        <div className="mb-1 flex items-center">
          <div className="min-w-[110px]">{t('blobPrefix')}</div>
          {storage.azureBlobStorage.prefix}
        </div>
      )}
    </>
  );
}

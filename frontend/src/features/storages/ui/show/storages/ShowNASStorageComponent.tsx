import type { Storage } from '../../../../../entity/storages';
import { useTranslation } from 'react-i18next';

interface Props {
  storage: Storage;
}

export function ShowNASStorageComponent({ storage }: Props) {
  const { t } = useTranslation('storages');
  return (
    <>
      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('host')}</div>
        {storage?.nasStorage?.host || '-'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('port')}</div>
        {storage?.nasStorage?.port || '-'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('share')}</div>
        {storage?.nasStorage?.share || '-'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('username')}</div>
        {storage?.nasStorage?.username || '-'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('password')}</div>
        {'*************'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('useSsl')}</div>
        {storage?.nasStorage?.useSsl ? t('yes') : t('no')}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('domain')}</div>
        {storage?.nasStorage?.domain || '-'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('path')}</div>
        {storage?.nasStorage?.path || '-'}
      </div>
    </>
  );
}

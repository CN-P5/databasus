import type { Storage } from '../../../../../entity/storages';
import { useTranslation } from 'react-i18next';

interface Props {
  storage: Storage;
}

export function ShowGoogleDriveStorageComponent({ storage }: Props) {
  const { t } = useTranslation('storages');
  return (
    <>
      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('clientId')}</div>
        {storage?.googleDriveStorage?.clientId
          ? `${storage?.googleDriveStorage?.clientId.slice(0, 10)}***`
          : '-'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('clientSecret')}</div>
        {`*************`}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('userToken')}</div>
        {`*************`}
      </div>
    </>
  );
}

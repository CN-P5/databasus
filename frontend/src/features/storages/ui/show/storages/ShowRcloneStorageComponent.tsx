import type { Storage } from '../../../../../entity/storages';
import { useTranslation } from 'react-i18next';

interface Props {
  storage: Storage;
}

export function ShowRcloneStorageComponent({ storage }: Props) {
  const { t } = useTranslation('storages');

  return (
    <>
      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('remotePath')}</div>
        {storage?.rcloneStorage?.remotePath || '-'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('config')}</div>
        {'*************'}
      </div>
    </>
  );
}

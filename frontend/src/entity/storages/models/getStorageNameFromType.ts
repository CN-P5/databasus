import i18n from '../../../shared/i18n/config';
import { StorageType } from './StorageType';

export const getStorageNameFromType = (type: StorageType) => {
  switch (type) {
    case StorageType.LOCAL:
      return i18n.t('storages:local');
    case StorageType.S3:
      return i18n.t('storages:s3');
    case StorageType.GOOGLE_DRIVE:
      return i18n.t('storages:googleDrive');
    case StorageType.NAS:
      return i18n.t('storages:nas');
    case StorageType.AZURE_BLOB:
      return i18n.t('storages:azureBlob');
    case StorageType.FTP:
      return i18n.t('storages:ftp');
    case StorageType.SFTP:
      return i18n.t('storages:sftp');
    case StorageType.RCLONE:
      return i18n.t('storages:rclone');
    default:
      return '';
  }
};

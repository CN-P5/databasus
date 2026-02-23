import { useTranslation } from 'react-i18next';

import { type Database, getDatabaseLogoFromType } from '../../../../entity/databases';

interface Props {
  database: Database;
  isShowName?: boolean;
  isShowType?: boolean;
}

export const ShowDatabaseBaseInfoComponent = ({ database, isShowName, isShowType }: Props) => {
  const { t } = useTranslation('databases');

  const getDatabaseTypeName = () => {
    switch (database.type) {
      case 'POSTGRES':
        return 'PostgreSQL';
      case 'MYSQL':
        return 'MySQL';
      case 'MARIADB':
        return 'MariaDB';
      case 'MONGODB':
        return 'MongoDB';
      default:
        return t('database');
    }
  };

  return (
    <div>
      {isShowName && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">{t('databaseName')}</div>
          <div>{database.name || ''}</div>
        </div>
      )}

      {isShowType && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">{t('databaseType')}</div>
          <div className="flex items-center">
            <span>{getDatabaseTypeName()}</span>
            <img
              src={getDatabaseLogoFromType(database.type)}
              alt="databaseIcon"
              className="ml-2 h-4 w-4"
            />
          </div>
        </div>
      )}
    </div>
  );
};

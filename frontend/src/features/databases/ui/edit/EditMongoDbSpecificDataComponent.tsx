import { CopyOutlined, DownOutlined, InfoCircleOutlined, UpOutlined } from '@ant-design/icons';
import { App, Button, Input, InputNumber, Switch, Tooltip } from 'antd';
import { useEffect, useState } from 'react';

import { IS_CLOUD } from '../../../../constants';
import { type Database, databaseApi } from '../../../../entity/databases';
import { MongodbConnectionStringParser } from '../../../../entity/databases/model/mongodb/MongodbConnectionStringParser';
import { ToastHelper } from '../../../../shared/toast';
import { useTranslation } from 'react-i18next';
import { SshTunnelConfigComponent } from '../components/SshTunnelConfigComponent';

interface Props {
  database: Database;

  isShowCancelButton?: boolean;
  onCancel: () => void;

  isShowBackButton: boolean;
  onBack: () => void;

  saveButtonText?: string;
  isSaveToApi: boolean;
  onSaved: (database: Database) => void;

  isShowDbName?: boolean;
}

export const EditMongoDbSpecificDataComponent = ({
  database,

  isShowCancelButton,
  onCancel,

  isShowBackButton,
  onBack,

  saveButtonText,
  isSaveToApi,
  onSaved,
  isShowDbName = true,
}: Props) => {
  const { t } = useTranslation(['common', 'databases']);
  const { message } = App.useApp();

  const [editingDatabase, setEditingDatabase] = useState<Database>();
  const [isSaving, setIsSaving] = useState(false);

  const [isConnectionTested, setIsConnectionTested] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isConnectionFailed, setIsConnectionFailed] = useState(false);

  const hasAdvancedValues = !!database.mongodb?.authDatabase;
  const [isShowAdvanced, setShowAdvanced] = useState(hasAdvancedValues);

  const parseFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmedText = text.trim();

      if (!trimmedText) {
        message.error(t('databases:clipboardIsEmpty'));
        return;
      }

      const result = MongodbConnectionStringParser.parse(trimmedText);

      if ('error' in result) {
        message.error(result.error);
        return;
      }

      if (!editingDatabase?.mongodb) return;

      const updatedDatabase: Database = {
        ...editingDatabase,
        mongodb: {
          ...editingDatabase.mongodb,
          host: result.host,
          port: result.port,
          username: result.username,
          password: result.password,
          database: result.database,
          authDatabase: result.authDatabase,
          isHttps: result.useTls,
          cpuCount: 1,
        },
      };

      setEditingDatabase(updatedDatabase);
      setIsConnectionTested(false);
      message.success(t('databases:connectionStringParsedSuccessfully'));
    } catch {
      message.error(t('databases:failedToReadClipboard'));
    }
  };

  const testConnection = async () => {
    if (!editingDatabase?.mongodb) return;
    setIsTestingConnection(true);
    setIsConnectionFailed(false);

    const trimmedDatabase = {
      ...editingDatabase,
      mongodb: {
        ...editingDatabase.mongodb,
        password: editingDatabase.mongodb.password?.trim(),
      },
    };

    try {
      await databaseApi.testDatabaseConnectionDirect(trimmedDatabase);
      setIsConnectionTested(true);
      ToastHelper.showToast({
        title: t('databases:connectionTestPassed'),
        description: t('databases:youCanContinueWithNextStep'),
      });
    } catch (e) {
      setIsConnectionFailed(true);
      alert((e as Error).message);
    }

    setIsTestingConnection(false);
  };

  const saveDatabase = async () => {
    if (!editingDatabase?.mongodb) return;

    const trimmedDatabase = {
      ...editingDatabase,
      mongodb: {
        ...editingDatabase.mongodb,
        password: editingDatabase.mongodb.password?.trim(),
      },
    };

    if (isSaveToApi) {
      setIsSaving(true);

      try {
        await databaseApi.updateDatabase(trimmedDatabase);
      } catch (e) {
        alert((e as Error).message);
      }

      setIsSaving(false);
    }

    onSaved(trimmedDatabase);
  };

  useEffect(() => {
    setIsSaving(false);
    setIsConnectionTested(false);
    setIsTestingConnection(false);
    setIsConnectionFailed(false);

    setEditingDatabase({ ...database });
  }, [database]);

  if (!editingDatabase) return null;

  let isAllFieldsFilled = true;
  if (!editingDatabase.mongodb?.host) isAllFieldsFilled = false;
  if (!editingDatabase.mongodb?.port) isAllFieldsFilled = false;
  if (!editingDatabase.mongodb?.username) isAllFieldsFilled = false;
  if (!editingDatabase.id && !editingDatabase.mongodb?.password) isAllFieldsFilled = false;
  if (!editingDatabase.mongodb?.database) isAllFieldsFilled = false;

  const isLocalhostDb =
    editingDatabase.mongodb?.host?.includes('localhost') ||
    editingDatabase.mongodb?.host?.includes('127.0.0.1');

  return (
    <div>
      <div className="mb-3 flex">
        <div className="min-w-[150px]" />
        <div
          className="cursor-pointer text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={parseFromClipboard}
        >
          <CopyOutlined className="mr-1" />
          {t('databases:parseFromClipboard')}
        </div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases:host')}</div>
        <Input
          value={editingDatabase.mongodb?.host}
          onChange={(e) => {
            if (!editingDatabase.mongodb) return;

            setEditingDatabase({
              ...editingDatabase,
              mongodb: {
                ...editingDatabase.mongodb,
                host: e.target.value.trim().replace('https://', '').replace('http://', ''),
              },
            });
            setIsConnectionTested(false);
          }}
          size="small"
          className="max-w-[200px] grow"
          placeholder={t('databases:hostPlaceholder')}
        />
      </div>

      {isLocalhostDb && !IS_CLOUD && (
        <div className="mb-1 flex">
          <div className="min-w-[150px]" />
          <div className="max-w-[200px] text-xs text-gray-500 dark:text-gray-400">
            {t('databases:please')}{' '}
            <a
              href="https://databasus.com/faq/localhost"
              target="_blank"
              rel="noreferrer"
              className="!text-blue-600 dark:!text-blue-400"
            >
              {t('databases:readThisDocument')}
            </a>{' '}
            {t('databases:toStudyHowToBackupLocalDatabase')}
          </div>
        </div>
      )}

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases:port')}</div>
        <InputNumber
          type="number"
          value={editingDatabase.mongodb?.port}
          onChange={(e) => {
            if (!editingDatabase.mongodb || e === null) return;

            setEditingDatabase({
              ...editingDatabase,
              mongodb: { ...editingDatabase.mongodb, port: e },
            });
            setIsConnectionTested(false);
          }}
          size="small"
          className="max-w-[200px] grow"
          placeholder="27017"
        />
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases:username')}</div>
        <Input
          value={editingDatabase.mongodb?.username}
          onChange={(e) => {
            if (!editingDatabase.mongodb) return;

            setEditingDatabase({
              ...editingDatabase,
              mongodb: { ...editingDatabase.mongodb, username: e.target.value.trim() },
            });
            setIsConnectionTested(false);
          }}
          size="small"
          className="max-w-[200px] grow"
          placeholder={t('databases:usernamePlaceholder')}
        />
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases:databasePassword')}</div>
        <Input.Password
          value={editingDatabase.mongodb?.password}
          onChange={(e) => {
            if (!editingDatabase.mongodb) return;

            setEditingDatabase({
              ...editingDatabase,
              mongodb: { ...editingDatabase.mongodb, password: e.target.value },
            });
            setIsConnectionTested(false);
          }}
          size="small"
          className="max-w-[200px] grow"
          placeholder={t('databases:databasePasswordPlaceholder')}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
        />
      </div>

      {isShowDbName && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">{t('databases:databaseName')}</div>
          <Input
            value={editingDatabase.mongodb?.database}
            onChange={(e) => {
              if (!editingDatabase.mongodb) return;

              setEditingDatabase({
                ...editingDatabase,
                mongodb: { ...editingDatabase.mongodb, database: e.target.value.trim() },
              });
              setIsConnectionTested(false);
            }}
            size="small"
            className="max-w-[200px] grow"
            placeholder={t('databases:databaseNamePlaceholder')}
          />
        </div>
      )}

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases:useHttps')}</div>
        <Switch
          checked={editingDatabase.mongodb?.isHttps}
          onChange={(checked) => {
            if (!editingDatabase.mongodb) return;

            setEditingDatabase({
              ...editingDatabase,
              mongodb: { ...editingDatabase.mongodb, isHttps: checked },
            });
            setIsConnectionTested(false);
          }}
          size="small"
        />
      </div>

      <div className="mb-5 flex w-full items-center">
        <div className="min-w-[150px]">{t('databases:cpuCount')}</div>
        <div className="flex items-center">
          <InputNumber
            min={1}
            max={16}
            value={editingDatabase.mongodb?.cpuCount}
            onChange={(value) => {
              if (!editingDatabase.mongodb) return;

              setEditingDatabase({
                ...editingDatabase,
                mongodb: { ...editingDatabase.mongodb, cpuCount: value || 1 },
              });
              setIsConnectionTested(false);
            }}
            size="small"
            className="max-w-[200px] grow"
          />

          <Tooltip
            className="cursor-pointer"
            title={t('databases:cpuCountDescription')}
          >
            <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
          </Tooltip>
        </div>
      </div>

      <div className="mt-4 mb-1 flex items-center">
        <div
          className="flex cursor-pointer items-center text-sm text-blue-600 hover:text-blue-800"
          onClick={() => setShowAdvanced(!isShowAdvanced)}
        >
          <span className="mr-2">{t('databases:advancedSettings')}</span>

          {isShowAdvanced ? (
            <UpOutlined style={{ fontSize: '12px' }} />
          ) : (
            <DownOutlined style={{ fontSize: '12px' }} />
          )}
        </div>
      </div>

      {isShowAdvanced && (
        <>
          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('databases:authDatabase')}</div>
            <Input
              value={editingDatabase.mongodb?.authDatabase}
              onChange={(e) => {
                if (!editingDatabase.mongodb) return;

                setEditingDatabase({
                  ...editingDatabase,
                  mongodb: { ...editingDatabase.mongodb, authDatabase: e.target.value.trim() },
                });
                setIsConnectionTested(false);
              }}
              size="small"
              className="max-w-[200px] grow"
              placeholder="admin"
            />
          </div>
        </>
      )}

      <SshTunnelConfigComponent
        sshTunnel={editingDatabase.sshTunnel}
        onChange={(sshTunnel) => {
          setEditingDatabase({
            ...editingDatabase,
            sshTunnel,
          });
          setIsConnectionTested(false);
        }}
      />

      <div className="mt-5 flex">
        {isShowCancelButton && (
          <Button className="mr-1" danger ghost onClick={() => onCancel()}>
            {t('common:cancel')}
          </Button>
        )}

        {isShowBackButton && (
          <Button className="mr-auto" type="primary" ghost onClick={() => onBack()}>
            {t('common:back')}
          </Button>
        )}

        {!isConnectionTested && (
          <Button
            type="primary"
            onClick={() => testConnection()}
            loading={isTestingConnection}
            disabled={!isAllFieldsFilled}
            className="mr-5"
          >
            {t('databases:testConnection')}
          </Button>
        )}

        {isConnectionTested && (
          <Button
            type="primary"
            onClick={() => saveDatabase()}
            loading={isSaving}
            disabled={!isAllFieldsFilled}
            className="mr-5"
          >
            {saveButtonText || t('common:save')}
          </Button>
        )}
      </div>

      {isConnectionFailed && !IS_CLOUD && (
        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {t('databases:ifYourDatabaseUsesIpWhitelist')}
        </div>
      )}
    </div>
  );
};

import { CopyOutlined, DownOutlined, InfoCircleOutlined, UpOutlined } from '@ant-design/icons';
import { App, Button, Checkbox, Input, InputNumber, Select, Switch, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SshTunnelConfigComponent } from '../components/SshTunnelConfigComponent';

import { IS_CLOUD } from '../../../../constants';
import { type Database, databaseApi } from '../../../../entity/databases';
import { ConnectionStringParser } from '../../../../entity/databases/model/postgresql/ConnectionStringParser';
import { ToastHelper } from '../../../../shared/toast';

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
  isRestoreMode?: boolean;
}

export const EditPostgreSqlSpecificDataComponent = ({
  database,

  isShowCancelButton,
  onCancel,

  isShowBackButton,
  onBack,

  saveButtonText,
  isSaveToApi,
  onSaved,
  isShowDbName = true,
  isRestoreMode = false,
}: Props) => {
  const { t } = useTranslation('databases');
  const { message } = App.useApp();

  const [editingDatabase, setEditingDatabase] = useState<Database>();
  const [isSaving, setIsSaving] = useState(false);

  const [isConnectionTested, setIsConnectionTested] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isConnectionFailed, setIsConnectionFailed] = useState(false);

  const hasAdvancedValues =
    !!database.postgresql?.includeSchemas?.length || !!database.postgresql?.isExcludeExtensions;
  const [isShowAdvanced, setShowAdvanced] = useState(hasAdvancedValues);

  const [hasAutoAddedPublicSchema, setHasAutoAddedPublicSchema] = useState(false);

  const parseFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmedText = text.trim();

      if (!trimmedText) {
        message.error(t('clipboardIsEmpty'));
        return;
      }

      const result = ConnectionStringParser.parse(trimmedText);

      if ('error' in result) {
        message.error(result.error);
        return;
      }

      if (!editingDatabase?.postgresql) return;

      const updatedDatabase: Database = {
        ...editingDatabase,
        postgresql: {
          ...editingDatabase.postgresql,
          host: result.host,
          port: result.port,
          username: result.username,
          password: result.password,
          database: result.database,
          isHttps: result.isHttps,
          cpuCount: 1,
        },
      };

      setEditingDatabase(autoAddPublicSchemaForSupabase(updatedDatabase));
      setIsConnectionTested(false);
      message.success(t('connectionStringParsedSuccessfully'));
    } catch {
      message.error(t('failedToReadClipboard'));
    }
  };

  const autoAddPublicSchemaForSupabase = (updatedDatabase: Database): Database => {
    if (hasAutoAddedPublicSchema) return updatedDatabase;

    const host = updatedDatabase.postgresql?.host || '';
    const username = updatedDatabase.postgresql?.username || '';
    const isSupabase = host.includes('supabase') || username.includes('supabase');

    if (isSupabase && updatedDatabase.postgresql) {
      setHasAutoAddedPublicSchema(true);

      const currentSchemas = updatedDatabase.postgresql.includeSchemas || [];
      if (!currentSchemas.includes('public')) {
        return {
          ...updatedDatabase,
          postgresql: {
            ...updatedDatabase.postgresql,
            includeSchemas: ['public', ...currentSchemas],
          },
        };
      }
    }

    return updatedDatabase;
  };

  const testConnection = async () => {
    if (!editingDatabase?.postgresql) return;
    setIsTestingConnection(true);
    setIsConnectionFailed(false);

    const trimmedDatabase = {
      ...editingDatabase,
      postgresql: {
        ...editingDatabase.postgresql,
        password: editingDatabase.postgresql.password?.trim(),
      },
    };

    try {
      await databaseApi.testDatabaseConnectionDirect(trimmedDatabase);
      setIsConnectionTested(true);
      ToastHelper.showToast({
        title: t('connectionTestPassed'),
        description: t('youCanContinueWithNextStep'),
      });
    } catch (e) {
      setIsConnectionFailed(true);
      alert((e as Error).message);
    }

    setIsTestingConnection(false);
  };

  const saveDatabase = async () => {
    if (!editingDatabase?.postgresql) return;

    const trimmedDatabase = {
      ...editingDatabase,
      postgresql: {
        ...editingDatabase.postgresql,
        password: editingDatabase.postgresql.password?.trim(),
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
  if (!editingDatabase.postgresql?.host) isAllFieldsFilled = false;
  if (!editingDatabase.postgresql?.port) isAllFieldsFilled = false;
  if (!editingDatabase.postgresql?.username) isAllFieldsFilled = false;
  if (!editingDatabase.id && !editingDatabase.postgresql?.password) isAllFieldsFilled = false;
  if (!editingDatabase.postgresql?.database) isAllFieldsFilled = false;

  const isLocalhostDb =
    editingDatabase.postgresql?.host?.includes('localhost') ||
    editingDatabase.postgresql?.host?.includes('127.0.0.1');

  const isSupabaseDb =
    editingDatabase.postgresql?.host?.includes('supabase') ||
    editingDatabase.postgresql?.username?.includes('supabase');

  return (
    <div>
      <div className="mb-3 flex">
        <div className="min-w-[150px]" />
        <div
          className="cursor-pointer text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={parseFromClipboard}
        >
          <CopyOutlined className="mr-1" />
          {t('parseFromClipboard')}
        </div>
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('host')}</div>
        <Input
          value={editingDatabase.postgresql?.host}
          onChange={(e) => {
            if (!editingDatabase.postgresql) return;

            const updatedDatabase = {
              ...editingDatabase,
              postgresql: {
                ...editingDatabase.postgresql,
                host: e.target.value.trim().replace('https://', '').replace('http://', ''),
              },
            };
            setEditingDatabase(autoAddPublicSchemaForSupabase(updatedDatabase));
            setIsConnectionTested(false);
          }}
          size="small"
          className="max-w-[200px] grow"
          placeholder={t('enterPgHost')}
        />
      </div>

      {isLocalhostDb && !IS_CLOUD && (
        <div className="mb-1 flex">
          <div className="min-w-[150px]" />
          <div className="max-w-[200px] text-xs text-gray-500 dark:text-gray-400">
            {t('please')}{' '}
            <a
              href="https://databasus.com/faq/localhost"
              target="_blank"
              rel="noreferrer"
              className="!text-blue-600 dark:!text-blue-400"
            >
              {t('readThisDocument')}
            </a>{' '}
            {t('toStudyHowToBackupLocalDatabase')}
          </div>
        </div>
      )}

      {isSupabaseDb && (
        <div className="mb-1 flex">
          <div className="min-w-[150px]" />
          <div className="max-w-[200px] text-xs text-gray-500 dark:text-gray-400">
            {t('please')}{' '}
            <a
              href="https://databasus.com/faq/supabase"
              target="_blank"
              rel="noreferrer"
              className="!text-blue-600 dark:!text-blue-400"
            >
              {t('readThisDocument')}
            </a>{' '}
            {t('toStudyHowToBackupSupabaseDatabase')}
          </div>
        </div>
      )}

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('port')}</div>
        <InputNumber
          type="number"
          value={editingDatabase.postgresql?.port}
          onChange={(e) => {
            if (!editingDatabase.postgresql || e === null) return;

            setEditingDatabase({
              ...editingDatabase,
              postgresql: { ...editingDatabase.postgresql, port: e },
            });
            setIsConnectionTested(false);
          }}
          size="small"
          className="max-w-[200px] grow"
          placeholder={t('enterPgPort')}
        />
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('username')}</div>
        <Input
          value={editingDatabase.postgresql?.username}
          onChange={(e) => {
            if (!editingDatabase.postgresql) return;

            const updatedDatabase = {
              ...editingDatabase,
              postgresql: { ...editingDatabase.postgresql, username: e.target.value.trim() },
            };
            setEditingDatabase(autoAddPublicSchemaForSupabase(updatedDatabase));
            setIsConnectionTested(false);
          }}
          size="small"
          className="max-w-[200px] grow"
          placeholder={t('enterPgUsername')}
        />
      </div>

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('password')}</div>
        <Input.Password
          value={editingDatabase.postgresql?.password}
          onChange={(e) => {
            if (!editingDatabase.postgresql) return;

            setEditingDatabase({
              ...editingDatabase,
              postgresql: { ...editingDatabase.postgresql, password: e.target.value },
            });
            setIsConnectionTested(false);
          }}
          size="small"
          className="max-w-[200px] grow"
          placeholder={t('enterPgPassword')}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
        />
      </div>

      {isShowDbName && (
        <div className="mb-1 flex w-full items-center">
          <div className="min-w-[150px]">{t('dbName')}</div>
          <Input
            value={editingDatabase.postgresql?.database}
            onChange={(e) => {
              if (!editingDatabase.postgresql) return;

              setEditingDatabase({
                ...editingDatabase,
                postgresql: { ...editingDatabase.postgresql, database: e.target.value.trim() },
              });
              setIsConnectionTested(false);
            }}
            size="small"
            className="max-w-[200px] grow"
            placeholder={t('enterPgDatabaseName')}
          />
        </div>
      )}

      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('useHttps')}</div>
        <Switch
          checked={editingDatabase.postgresql?.isHttps}
          onChange={(checked) => {
            if (!editingDatabase.postgresql) return;

            setEditingDatabase({
              ...editingDatabase,
              postgresql: { ...editingDatabase.postgresql, isHttps: checked },
            });
            setIsConnectionTested(false);
          }}
          size="small"
        />
      </div>

      {isRestoreMode && !IS_CLOUD && (
        <div className="mb-5 flex w-full items-center">
          <div className="min-w-[150px]">{t('cpuCount')}</div>
          <div className="flex items-center">
            <InputNumber
              min={1}
              max={128}
              value={editingDatabase.postgresql?.cpuCount}
              onChange={(value) => {
                if (!editingDatabase.postgresql) return;

                setEditingDatabase({
                  ...editingDatabase,
                  postgresql: { ...editingDatabase.postgresql, cpuCount: value || 1 },
                });
                setIsConnectionTested(false);
              }}
              size="small"
              className="max-w-[75px] grow"
            />

            <Tooltip className="cursor-pointer" title={t('cpuCountDescription')}>
              <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
            </Tooltip>
          </div>
        </div>
      )}

      <div className="mt-4 mb-1 flex items-center">
        <div
          className="flex cursor-pointer items-center text-sm text-blue-600 hover:text-blue-800"
          onClick={() => setShowAdvanced(!isShowAdvanced)}
        >
          <span className="mr-2">{t('advancedSettings')}</span>

          {isShowAdvanced ? (
            <UpOutlined style={{ fontSize: '12px' }} />
          ) : (
            <DownOutlined style={{ fontSize: '12px' }} />
          )}
        </div>
      </div>

      {isShowAdvanced && (
        <>
          {!isRestoreMode && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[150px]">{t('includeSchemas')}</div>
              <Select
                mode="tags"
                value={editingDatabase.postgresql?.includeSchemas || []}
                onChange={(values) => {
                  if (!editingDatabase.postgresql) return;

                  setEditingDatabase({
                    ...editingDatabase,
                    postgresql: { ...editingDatabase.postgresql, includeSchemas: values },
                  });
                }}
                size="small"
                className="max-w-[200px] grow"
                placeholder={t('allSchemasDefault')}
                tokenSeparators={[',']}
              />
            </div>
          )}

          {isRestoreMode && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[150px]">{t('excludeExtensions')}</div>
              <div className="flex items-center">
                <Checkbox
                  checked={editingDatabase.postgresql?.isExcludeExtensions || false}
                  onChange={(e) => {
                    if (!editingDatabase.postgresql) return;

                    setEditingDatabase({
                      ...editingDatabase,
                      postgresql: {
                        ...editingDatabase.postgresql,
                        isExcludeExtensions: e.target.checked,
                      },
                    });
                  }}
                >
                  {t('skipExtensions')}
                </Checkbox>

                <Tooltip className="cursor-pointer" title={t('skipExtensionsTooltip')}>
                  <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
                </Tooltip>
              </div>
            </div>
          )}
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
            {t('testConnection')}
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
          {t('ifYourDatabaseUsesIpWhitelist')}
        </div>
      )}
    </div>
  );
};

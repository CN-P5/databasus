import { DownOutlined, InfoCircleOutlined, UpOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Input,
  InputNumber,
  Modal,
  Select,
  Spin,
  Switch,
  TimePicker,
  Tooltip,
} from 'antd';
import { CronExpressionParser } from 'cron-parser';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { IS_CLOUD } from '../../../constants';
import {
  type BackupConfig,
  BackupEncryption,
  type DatabasePlan,
  backupConfigApi,
} from '../../../entity/backups';
import { BackupNotificationType } from '../../../entity/backups/model/BackupNotificationType';
import type { Database } from '../../../entity/databases';
import { Period } from '../../../entity/databases/model/Period';
import { type Interval, IntervalType } from '../../../entity/intervals';
import { type Storage, getStorageLogoFromType, storageApi } from '../../../entity/storages';
import type { UserProfile } from '../../../entity/users';
import { getUserTimeFormat } from '../../../shared/time';
import {
  getUserTimeFormat as getIs12Hour,
  getLocalDayOfMonth,
  getLocalWeekday,
  getUtcDayOfMonth,
  getUtcWeekday,
} from '../../../shared/time/utils';
import { ConfirmationComponent } from '../../../shared/ui';
import { EditStorageComponent } from '../../storages/ui/edit/EditStorageComponent';

interface Props {
  user: UserProfile;
  database: Database;

  isShowBackButton: boolean;
  onBack: () => void;

  isShowCancelButton?: boolean;
  onCancel: () => void;

  saveButtonText?: string;
  isSaveToApi: boolean;
  onSaved: (backupConfig: BackupConfig) => void;
}

export const EditBackupConfigComponent = ({
  user,
  database,

  isShowBackButton,
  onBack,

  isShowCancelButton,
  onCancel,
  saveButtonText,
  isSaveToApi,
  onSaved,
}: Props) => {
  const { t } = useTranslation('backups');

  const weekdayOptions = useMemo(
    () => [
      { value: 1, label: t('mon') },
      { value: 2, label: t('tue') },
      { value: 3, label: t('wed') },
      { value: 4, label: t('thu') },
      { value: 5, label: t('fri') },
      { value: 6, label: t('sat') },
      { value: 7, label: t('sun') },
    ],
    [t],
  );

  const [backupConfig, setBackupConfig] = useState<BackupConfig>();
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [storages, setStorages] = useState<Storage[]>([]);
  const [isShowCreateStorage, setShowCreateStorage] = useState(false);
  const [storageSelectKey, setStorageSelectKey] = useState(0);

  const [isShowWarn, setIsShowWarn] = useState(false);

  const [databasePlan, setDatabasePlan] = useState<DatabasePlan>();
  const [isLoading, setIsLoading] = useState(true);

  const hasAdvancedValues =
    !!backupConfig?.isRetryIfFailed ||
    (backupConfig?.maxBackupSizeMb ?? 0) > 0 ||
    (backupConfig?.maxBackupsTotalSizeMb ?? 0) > 0;
  const [isShowAdvanced, setShowAdvanced] = useState(hasAdvancedValues);

  const timeFormat = useMemo(() => {
    const is12 = getIs12Hour();
    return { use12Hours: is12, format: is12 ? 'h:mm A' : 'HH:mm' };
  }, []);

  const dateTimeFormat = useMemo(() => getUserTimeFormat(), []);

  const createDefaultPlan = (databaseId: string, isCloud: boolean): DatabasePlan => {
    if (isCloud) {
      return {
        databaseId,
        maxBackupSizeMb: 100,
        maxBackupsTotalSizeMb: 4000,
        maxStoragePeriod: Period.WEEK,
      };
    } else {
      return {
        databaseId,
        maxBackupSizeMb: 0,
        maxBackupsTotalSizeMb: 0,
        maxStoragePeriod: Period.FOREVER,
      };
    }
  };

  const isPeriodAllowed = (period: Period, maxPeriod: Period): boolean => {
    const periodOrder = [
      Period.DAY,
      Period.WEEK,
      Period.MONTH,
      Period.THREE_MONTH,
      Period.SIX_MONTH,
      Period.YEAR,
      Period.TWO_YEARS,
      Period.THREE_YEARS,
      Period.FOUR_YEARS,
      Period.FIVE_YEARS,
      Period.FOREVER,
    ];
    const periodIndex = periodOrder.indexOf(period);
    const maxIndex = periodOrder.indexOf(maxPeriod);
    return periodIndex <= maxIndex;
  };

  const availablePeriods = useMemo(() => {
    const allPeriods = [
      { label: t('1day'), value: Period.DAY },
      { label: t('1week'), value: Period.WEEK },
      { label: t('1month'), value: Period.MONTH },
      { label: t('3months'), value: Period.THREE_MONTH },
      { label: t('6months'), value: Period.SIX_MONTH },
      { label: t('1year'), value: Period.YEAR },
      { label: t('2years'), value: Period.TWO_YEARS },
      { label: t('3years'), value: Period.THREE_YEARS },
      { label: t('4years'), value: Period.FOUR_YEARS },
      { label: t('5years'), value: Period.FIVE_YEARS },
      { label: t('forever'), value: Period.FOREVER },
    ];

    if (!databasePlan) {
      return allPeriods;
    }

    return allPeriods.filter((p) => isPeriodAllowed(p.value, databasePlan.maxStoragePeriod));
  }, [databasePlan]);

  const updateBackupConfig = (patch: Partial<BackupConfig>) => {
    setBackupConfig((prev) => (prev ? { ...prev, ...patch } : prev));
    setIsUnsaved(true);
  };

  const saveInterval = (patch: Partial<Interval>) => {
    setBackupConfig((prev) => {
      if (!prev) return prev;

      const updatedBackupInterval = { ...(prev.backupInterval ?? {}), ...patch };

      if (!updatedBackupInterval.id && prev.backupInterval?.id) {
        updatedBackupInterval.id = prev.backupInterval.id;
      }

      return { ...prev, backupInterval: updatedBackupInterval as Interval };
    });

    setIsUnsaved(true);
  };

  const saveBackupConfig = async () => {
    if (!backupConfig) return;

    if (isSaveToApi) {
      setIsSaving(true);
      try {
        await backupConfigApi.saveBackupConfig(backupConfig);
        setIsUnsaved(false);
      } catch (e) {
        alert((e as Error).message);
      }
      setIsSaving(false);
    }

    onSaved(backupConfig);
  };

  const loadStorages = async () => {
    try {
      const storages = await storageApi.getStorages(database.workspaceId);
      setStorages(storages);

      if (IS_CLOUD) {
        const systemStorages = storages.filter((s) => s.isSystem);
        if (systemStorages.length > 0) {
          updateBackupConfig({ storage: systemStorages[0] });
        }
      }
    } catch (e) {
      alert((e as Error).message);
    }
  };

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);

      try {
        if (database.id) {
          const config = await backupConfigApi.getBackupConfigByDbID(database.id);
          setBackupConfig(config);
          setIsUnsaved(false);
          setIsSaving(false);

          const plan = await backupConfigApi.getDatabasePlan(database.id);
          setDatabasePlan(plan);
        } else {
          const plan = createDefaultPlan('', IS_CLOUD);
          setDatabasePlan(plan);

          setBackupConfig({
            databaseId: database.id,
            isBackupsEnabled: true,
            backupInterval: {
              id: undefined as unknown as string,
              interval: IntervalType.DAILY,
              timeOfDay: '00:00',
            },
            storage: undefined,
            storePeriod:
              plan.maxStoragePeriod === Period.FOREVER ? Period.THREE_MONTH : plan.maxStoragePeriod,
            sendNotificationsOn: [BackupNotificationType.BackupFailed],
            isRetryIfFailed: true,
            maxFailedTriesCount: 3,
            encryption: BackupEncryption.ENCRYPTED,
            maxBackupSizeMb: plan.maxBackupSizeMb,
            maxBackupsTotalSizeMb: plan.maxBackupsTotalSizeMb,
          });
        }

        await loadStorages();
      } catch (e) {
        alert((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [database]);

  if (isLoading) {
    return (
      <div className="mb-5 flex items-center">
        <Spin />
      </div>
    );
  }

  if (!backupConfig) return <div />;

  const { backupInterval } = backupConfig;

  // UTC → local conversions for display
  const localTime: Dayjs | undefined = backupInterval?.timeOfDay
    ? dayjs.utc(backupInterval.timeOfDay, 'HH:mm').local()
    : undefined;

  const displayedWeekday: number | undefined =
    backupInterval?.interval === IntervalType.WEEKLY &&
    backupInterval.weekday &&
    backupInterval.timeOfDay
      ? getLocalWeekday(backupInterval.weekday, backupInterval.timeOfDay)
      : backupInterval?.weekday;

  const displayedDayOfMonth: number | undefined =
    backupInterval?.interval === IntervalType.MONTHLY &&
    backupInterval.dayOfMonth &&
    backupInterval.timeOfDay
      ? getLocalDayOfMonth(backupInterval.dayOfMonth, backupInterval.timeOfDay)
      : backupInterval?.dayOfMonth;

  // mandatory-field check
  const isAllFieldsFilled =
    !backupConfig.isBackupsEnabled ||
    (Boolean(backupConfig.storePeriod) &&
      Boolean(backupConfig.storage?.id) &&
      Boolean(backupConfig.encryption) &&
      Boolean(backupInterval?.interval) &&
      (!backupInterval ||
        ((backupInterval.interval !== IntervalType.WEEKLY || displayedWeekday) &&
          (backupInterval.interval !== IntervalType.MONTHLY || displayedDayOfMonth) &&
          (backupInterval.interval !== IntervalType.CRON || backupInterval.cronExpression))));

  return (
    <div>
      {database.id && (
        <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
          <div className="mb-1 min-w-[150px] sm:mb-0">{t('backupsEnabled')}</div>
          <Switch
            checked={backupConfig.isBackupsEnabled}
            onChange={(checked) => {
              updateBackupConfig({ isBackupsEnabled: checked });
            }}
            size="small"
          />
        </div>
      )}

      {backupConfig.isBackupsEnabled && (
        <>
          <div className="mt-4 mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[150px] sm:mb-0">{t('backupInterval')}</div>
            <Select
              value={backupInterval?.interval}
              onChange={(v) => saveInterval({ interval: v })}
              size="small"
              className="w-full max-w-[200px] grow"
              options={[
                { label: t('hourly'), value: IntervalType.HOURLY },
                { label: t('daily'), value: IntervalType.DAILY },
                { label: t('weekly'), value: IntervalType.WEEKLY },
                { label: t('monthly'), value: IntervalType.MONTHLY },
                { label: t('cron'), value: IntervalType.CRON },
              ]}
            />
          </div>

          {backupInterval?.interval === IntervalType.WEEKLY && (
            <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
              <div className="mb-1 min-w-[150px] sm:mb-0">{t('backupWeekday')}</div>
              <Select
                value={displayedWeekday}
                onChange={(localWeekday) => {
                  if (!localWeekday) return;
                  const ref = localTime ?? dayjs();
                  saveInterval({ weekday: getUtcWeekday(localWeekday, ref) });
                }}
                size="small"
                className="w-full max-w-[200px] grow"
                options={weekdayOptions}
              />
            </div>
          )}

          {backupInterval?.interval === IntervalType.MONTHLY && (
            <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
              <div className="mb-1 min-w-[150px] sm:mb-0">{t('backupDayOfMonth')}</div>
              <InputNumber
                min={1}
                max={31}
                value={displayedDayOfMonth}
                onChange={(localDom) => {
                  if (!localDom) return;
                  const ref = localTime ?? dayjs();
                  saveInterval({ dayOfMonth: getUtcDayOfMonth(localDom, ref) });
                }}
                size="small"
                className="w-full max-w-[200px] grow"
              />
            </div>
          )}

          {backupInterval?.interval === IntervalType.CRON && (
            <>
              <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
                <div className="mb-1 min-w-[150px] sm:mb-0">{t('cronExpressionUtc')}</div>
                <div className="flex items-center">
                  <Input
                    value={backupInterval?.cronExpression || ''}
                    onChange={(e) => saveInterval({ cronExpression: e.target.value })}
                    placeholder="0 2 * * *"
                    size="small"
                    className="w-full max-w-[200px] grow"
                  />
                  <Tooltip
                    className="cursor-pointer"
                    title={
                      <div>
                        <div className="font-bold">{t('cronFormat')}</div>
                        <div className="mt-1">{t('examples')}</div>
                        <div>• {t('dailyAt2AmUtc')}</div>
                        <div>• {t('every6Hours')}</div>
                        <div>• {t('everyMondayAt3AmUtc')}</div>
                        <div>• {t('firstAndFifteenthAt430AmUtc')}</div>
                      </div>
                    }
                  >
                    <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
                  </Tooltip>
                </div>
              </div>
              {backupInterval?.cronExpression &&
                (() => {
                  try {
                    const interval = CronExpressionParser.parse(backupInterval.cronExpression, {
                      tz: 'UTC',
                    });
                    const nextRun = interval.next().toDate();
                    return (
                      <div className="mb-1 flex w-full flex-col items-start text-xs text-gray-600 sm:flex-row sm:items-center dark:text-gray-400">
                        <div className="mb-1 min-w-[150px] sm:mb-0" />
                        <div className="text-gray-600 dark:text-gray-400">
                          {t('nextRun')} {dayjs(nextRun).local().format(dateTimeFormat.format)}
                          <br />({dayjs(nextRun).fromNow()})
                        </div>
                      </div>
                    );
                  } catch {
                    return (
                      <div className="mb-1 flex w-full flex-col items-start text-red-500 sm:flex-row sm:items-center">
                        <div className="mb-1 min-w-[150px] sm:mb-0" />
                        <div className="text-red-500">{t('invalidCronExpression')}</div>
                      </div>
                    );
                  }
                })()}
            </>
          )}

          {backupInterval?.interval !== IntervalType.HOURLY &&
            backupInterval?.interval !== IntervalType.CRON && (
              <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
                <div className="mb-1 min-w-[150px] sm:mb-0">{t('backupTimeOfDay')}</div>
                <TimePicker
                  value={localTime}
                  format={timeFormat.format}
                  use12Hours={timeFormat.use12Hours}
                  allowClear={false}
                  size="small"
                  className="w-full max-w-[200px] grow"
                  onChange={(t) => {
                    if (!t) return;
                    const patch: Partial<Interval> = { timeOfDay: t.utc().format('HH:mm') };

                    if (backupInterval?.interval === IntervalType.WEEKLY && displayedWeekday) {
                      patch.weekday = getUtcWeekday(displayedWeekday, t);
                    }
                    if (backupInterval?.interval === IntervalType.MONTHLY && displayedDayOfMonth) {
                      patch.dayOfMonth = getUtcDayOfMonth(displayedDayOfMonth, t);
                    }

                    saveInterval(patch);
                  }}
                />
              </div>
            )}

          <div className="mb-3" />
        </>
      )}

      <div className="mt-2 mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('storage')}</div>
        <div className="flex w-full items-center">
          <Select
            key={storageSelectKey}
            value={backupConfig.storage?.id}
            onChange={(storageId) => {
              if (storageId.includes('create-new-storage')) {
                setShowCreateStorage(true);
                return;
              }

              const selectedStorage = storages.find((s) => s.id === storageId);
              updateBackupConfig({ storage: selectedStorage });

              if (backupConfig.storage?.id) {
                setIsShowWarn(true);
              }
            }}
            size="small"
            className="mr-2 max-w-[200px] grow"
            options={[
              ...storages.map((s) => ({ label: s.name, value: s.id })),
              { label: t('createNewStorage'), value: 'create-new-storage' },
            ]}
            placeholder={t('selectStorage')}
          />

          {backupConfig.storage?.type && (
            <img
              src={getStorageLogoFromType(backupConfig.storage.type)}
              alt="storageIcon"
              className="ml-1 h-4 w-4"
            />
          )}
        </div>
      </div>

      {!IS_CLOUD && (
        <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
          <div className="mb-1 min-w-[150px] sm:mb-0">{t('encryption')}</div>
          <div className="flex items-center">
            <Select
              value={backupConfig.encryption}
              onChange={(v) => updateBackupConfig({ encryption: v })}
              size="small"
              className="w-[200px]"
              options={[
                { label: t('none'), value: BackupEncryption.NONE },
                { label: t('encryptBackupFiles'), value: BackupEncryption.ENCRYPTED },
              ]}
            />

            <Tooltip className="cursor-pointer" title={t('encryptionTooltip')}>
              <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
            </Tooltip>
          </div>
        </div>
      )}

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('storePeriod')}</div>
        <div className="flex items-center">
          <Select
            value={backupConfig.storePeriod}
            onChange={(v) => updateBackupConfig({ storePeriod: v })}
            size="small"
            className="w-[200px]"
            options={availablePeriods}
          />

          <Tooltip className="cursor-pointer" title={t('storePeriodTooltip')}>
            <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
          </Tooltip>
        </div>
      </div>

      {backupConfig.isBackupsEnabled && (
        <>
          <div className="mt-4 mb-1 flex w-full flex-col items-start sm:flex-row sm:items-start">
            <div className="mt-0 mb-1 min-w-[150px] sm:mt-1 sm:mb-0">{t('notifications')}</div>
            <div className="flex flex-col space-y-2">
              <Checkbox
                checked={backupConfig.sendNotificationsOn.includes(
                  BackupNotificationType.BackupSuccess,
                )}
                onChange={(e) => {
                  const notifications = [...backupConfig.sendNotificationsOn];
                  const index = notifications.indexOf(BackupNotificationType.BackupSuccess);
                  if (e.target.checked && index === -1) {
                    notifications.push(BackupNotificationType.BackupSuccess);
                  } else if (!e.target.checked && index > -1) {
                    notifications.splice(index, 1);
                  }
                  updateBackupConfig({ sendNotificationsOn: notifications });
                }}
              >
                {t('backupSuccess')}
              </Checkbox>

              <Checkbox
                checked={backupConfig.sendNotificationsOn.includes(
                  BackupNotificationType.BackupFailed,
                )}
                onChange={(e) => {
                  const notifications = [...backupConfig.sendNotificationsOn];
                  const index = notifications.indexOf(BackupNotificationType.BackupFailed);
                  if (e.target.checked && index === -1) {
                    notifications.push(BackupNotificationType.BackupFailed);
                  } else if (!e.target.checked && index > -1) {
                    notifications.splice(index, 1);
                  }
                  updateBackupConfig({ sendNotificationsOn: notifications });
                }}
              >
                {t('backupFailed')}
              </Checkbox>
            </div>
          </div>
        </>
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

      {isShowAdvanced && backupConfig.isBackupsEnabled && (
        <>
          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[150px] sm:mb-0">{t('retryBackupIfFailed')}</div>
            <div className="flex items-center">
              <Switch
                size="small"
                checked={backupConfig.isRetryIfFailed}
                onChange={(checked) => updateBackupConfig({ isRetryIfFailed: checked })}
              />

              <Tooltip className="cursor-pointer" title={t('retryBackupIfFailedTooltip')}>
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>

          {backupConfig.isRetryIfFailed && (
            <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
              <div className="mb-1 min-w-[150px] sm:mb-0">{t('maxFailedTriesCount')}</div>
              <div className="flex items-center">
                <InputNumber
                  min={1}
                  max={10}
                  value={backupConfig.maxFailedTriesCount}
                  onChange={(value) => updateBackupConfig({ maxFailedTriesCount: value || 1 })}
                  size="small"
                  className="w-full max-w-[75px] grow"
                />

                <Tooltip className="cursor-pointer" title={t('maxFailedTriesCountTooltip')}>
                  <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
                </Tooltip>
              </div>
            </div>
          )}

          <div className="mt-5 mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[150px] sm:mb-0">{t('maxBackupSizeLimit')}</div>
            <div className="flex items-center">
              <Switch
                size="small"
                checked={backupConfig.maxBackupSizeMb > 0}
                disabled={IS_CLOUD}
                onChange={(checked) => {
                  updateBackupConfig({
                    maxBackupSizeMb: checked ? backupConfig.maxBackupSizeMb || 1000 : 0,
                  });
                }}
              />

              <Tooltip className="cursor-pointer" title={t('maxBackupSizeLimitTooltip')}>
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>

          {backupConfig.maxBackupSizeMb > 0 && (
            <div className="mb-5 flex w-full flex-col items-start sm:flex-row sm:items-center">
              <div className="mb-1 min-w-[150px] sm:mb-0">{t('maxFileSizeMb')}</div>

              <InputNumber
                min={1}
                max={
                  databasePlan?.maxBackupSizeMb && databasePlan.maxBackupSizeMb > 0
                    ? databasePlan.maxBackupSizeMb
                    : undefined
                }
                value={backupConfig.maxBackupSizeMb}
                onChange={(value) => {
                  const newValue = value || 1;
                  if (databasePlan?.maxBackupSizeMb && databasePlan.maxBackupSizeMb > 0) {
                    updateBackupConfig({
                      maxBackupSizeMb: Math.min(newValue, databasePlan.maxBackupSizeMb),
                    });
                  } else {
                    updateBackupConfig({ maxBackupSizeMb: newValue });
                  }
                }}
                size="small"
                className="w-full max-w-[75px] grow"
              />

              <div className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                ~{((backupConfig.maxBackupSizeMb / 1024) * 15).toFixed(2)} GB {t('dbSize')}
              </div>
            </div>
          )}

          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[150px] sm:mb-0">{t('limitTotalBackupsSize')}</div>
            <div className="flex items-center">
              <Switch
                size="small"
                checked={backupConfig.maxBackupsTotalSizeMb > 0}
                disabled={IS_CLOUD}
                onChange={(checked) => {
                  updateBackupConfig({
                    maxBackupsTotalSizeMb: checked
                      ? backupConfig.maxBackupsTotalSizeMb || 1_000_000
                      : 0,
                  });
                }}
              />

              <Tooltip className="cursor-pointer" title={t('limitTotalBackupsSizeTooltip')}>
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>

          {backupConfig.maxBackupsTotalSizeMb > 0 && (
            <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
              <div className="mb-1 min-w-[150px] sm:mb-0">{t('backupsFilesSizeMb')}</div>
              <InputNumber
                min={1}
                max={
                  databasePlan?.maxBackupsTotalSizeMb && databasePlan.maxBackupsTotalSizeMb > 0
                    ? databasePlan.maxBackupsTotalSizeMb
                    : undefined
                }
                value={backupConfig.maxBackupsTotalSizeMb}
                onChange={(value) => {
                  const newValue = value || 1;
                  if (
                    databasePlan?.maxBackupsTotalSizeMb &&
                    databasePlan.maxBackupsTotalSizeMb > 0
                  ) {
                    updateBackupConfig({
                      maxBackupsTotalSizeMb: Math.min(newValue, databasePlan.maxBackupsTotalSizeMb),
                    });
                  } else {
                    updateBackupConfig({ maxBackupsTotalSizeMb: newValue });
                  }
                }}
                size="small"
                className="w-full max-w-[75px] grow"
              />

              <div className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                {(backupConfig.maxBackupsTotalSizeMb / 1024).toFixed(2)} GB (~
                {backupConfig.maxBackupsTotalSizeMb / backupConfig.maxBackupSizeMb} {t('backups')})
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-5 flex">
        {isShowBackButton && (
          <Button className="mr-1" type="primary" ghost onClick={onBack}>
            {t('back')}
          </Button>
        )}

        {isShowCancelButton && (
          <Button danger ghost className="mr-1" onClick={onCancel}>
            {t('cancel')}
          </Button>
        )}

        <Button
          type="primary"
          className={`${isShowCancelButton ? 'ml-1' : 'ml-auto'} mr-5`}
          onClick={saveBackupConfig}
          loading={isSaving}
          disabled={!isUnsaved || !isAllFieldsFilled}
        >
          {saveButtonText || t('save')}
        </Button>
      </div>

      {isShowCreateStorage && (
        <Modal
          title={t('addStorage')}
          footer={<div />}
          open={isShowCreateStorage}
          onCancel={() => {
            setShowCreateStorage(false);
            setStorageSelectKey((prev) => prev + 1);
          }}
          maskClosable={false}
        >
          <div className="my-3 max-w-[275px] text-gray-500 dark:text-gray-400">
            {t('storageDescription')}
          </div>

          <EditStorageComponent
            user={user}
            workspaceId={database.workspaceId}
            isShowName
            isShowClose={false}
            onClose={() => setShowCreateStorage(false)}
            onChanged={() => {
              loadStorages();
              setShowCreateStorage(false);
            }}
          />
        </Modal>
      )}

      {isShowWarn && (
        <ConfirmationComponent
          onConfirm={() => {
            setIsShowWarn(false);
          }}
          onDecline={() => {
            setIsShowWarn(false);
          }}
          description={t('changeStorageWarning')}
          actionButtonColor="red"
          actionText={t('iUnderstand')}
          cancelText={t('cancel')}
          hideCancelButton
        />
      )}
    </div>
  );
};

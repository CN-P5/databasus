import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { CronExpressionParser } from 'cron-parser';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { IS_CLOUD } from '../../../constants';
import {
  type BackupConfig,
  BackupEncryption,
  RetentionPolicyType,
  backupConfigApi,
} from '../../../entity/backups';
import { BackupNotificationType } from '../../../entity/backups/model/BackupNotificationType';
import type { Database } from '../../../entity/databases';
import { Period } from '../../../entity/databases/model/Period';
import { IntervalType } from '../../../entity/intervals';
import { getStorageLogoFromType } from '../../../entity/storages/models/getStorageLogoFromType';
import { getUserTimeFormat } from '../../../shared/time';
import {
  getUserTimeFormat as getIs12Hour,
  getLocalDayOfMonth,
  getLocalWeekday,
} from '../../../shared/time/utils';

interface Props {
  database: Database;
}

const getWeekdayLabels = (t: (key: string) => string) => ({
  1: t('backups:mon'),
  2: t('backups:tue'),
  3: t('backups:wed'),
  4: t('backups:thu'),
  5: t('backups:fri'),
  6: t('backups:sat'),
  7: t('backups:sun'),
});

const getIntervalLabels = (t: (key: string) => string) => ({
  [IntervalType.HOURLY]: t('backups:hourly'),
  [IntervalType.DAILY]: t('backups:daily'),
  [IntervalType.WEEKLY]: t('backups:weekly'),
  [IntervalType.MONTHLY]: t('backups:monthly'),
  [IntervalType.CRON]: t('backups:cron'),
});

const getPeriodLabels = (t: (key: string) => string) => ({
  [Period.DAY]: t('backups:1day'),
  [Period.WEEK]: t('backups:1week'),
  [Period.MONTH]: t('backups:1month'),
  [Period.THREE_MONTH]: t('backups:3months'),
  [Period.SIX_MONTH]: t('backups:6months'),
  [Period.YEAR]: t('backups:1year'),
  [Period.TWO_YEARS]: t('backups:2years'),
  [Period.THREE_YEARS]: t('backups:3years'),
  [Period.FOUR_YEARS]: t('backups:4years'),
  [Period.FIVE_YEARS]: t('backups:5years'),
  [Period.FOREVER]: t('backups:forever'),
});

const getNotificationLabels = (t: (key: string) => string) => ({
  [BackupNotificationType.BackupFailed]: t('backups:backupFailed'),
  [BackupNotificationType.BackupSuccess]: t('backups:backupSuccess'),
});

const formatGfsRetention = (config: BackupConfig, t: (key: string) => string): string => {
  const parts: string[] = [];

  if (config.retentionGfsHours > 0)
    parts.push(`${config.retentionGfsHours} ${t('backups:hourly')}`);
  if (config.retentionGfsDays > 0) parts.push(`${config.retentionGfsDays} ${t('backups:daily')}`);
  if (config.retentionGfsWeeks > 0)
    parts.push(`${config.retentionGfsWeeks} ${t('backups:weekly')}`);
  if (config.retentionGfsMonths > 0)
    parts.push(`${config.retentionGfsMonths} ${t('backups:monthly')}`);
  if (config.retentionGfsYears > 0)
    parts.push(`${config.retentionGfsYears} ${t('backups:yearly')}`);

  return parts.length > 0 ? parts.join(', ') : t('common:notConfigured');
};

export const ShowBackupConfigComponent = ({ database }: Props) => {
  const { t } = useTranslation(['backups', 'common']);
  const [backupConfig, setBackupConfig] = useState<BackupConfig>();

  const timeFormat = useMemo(() => {
    const is12Hour = getIs12Hour();
    return {
      use12Hours: is12Hour,
      format: is12Hour ? 'h:mm A' : 'HH:mm',
    };
  }, []);

  const dateTimeFormat = useMemo(() => getUserTimeFormat(), []);

  const weekdayLabels = getWeekdayLabels(t);
  const intervalLabels = getIntervalLabels(t);
  const periodLabels = getPeriodLabels(t);
  const notificationLabels = getNotificationLabels(t);

  useEffect(() => {
    if (database.id) {
      backupConfigApi.getBackupConfigByDbID(database.id).then((res) => {
        setBackupConfig(res);
      });
    }
  }, [database]);

  if (!backupConfig) return <div />;

  const { backupInterval } = backupConfig;

  const localTime = backupInterval?.timeOfDay
    ? dayjs.utc(backupInterval.timeOfDay, 'HH:mm').local()
    : undefined;

  const formattedTime = localTime ? localTime.format(timeFormat.format) : '';

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

  const retentionPolicyType = backupConfig.retentionPolicyType ?? RetentionPolicyType.TimePeriod;

  return (
    <div>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('backups:backupsEnabled')}</div>
        <div className={backupConfig.isBackupsEnabled ? '' : 'font-bold text-red-600'}>
          {backupConfig.isBackupsEnabled ? t('common:yes') : t('common:no')}
        </div>
      </div>

      {backupConfig.isBackupsEnabled ? (
        <>
          <div className="mt-4 mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('backups:backupInterval')}</div>
            <div>{backupInterval?.interval ? intervalLabels[backupInterval.interval] : ''}</div>
          </div>

          {backupInterval?.interval === IntervalType.WEEKLY && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[150px]">{t('backups:backupWeekday')}</div>
              <div>
                {displayedWeekday
                  ? weekdayLabels[displayedWeekday as keyof typeof weekdayLabels]
                  : ''}
              </div>
            </div>
          )}

          {backupInterval?.interval === IntervalType.MONTHLY && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[150px]">{t('backups:backupDayOfMonth')}</div>
              <div>{displayedDayOfMonth || ''}</div>
            </div>
          )}

          {backupInterval?.interval === IntervalType.CRON && (
            <>
              <div className="mb-1 flex w-full items-center">
                <div className="min-w-[150px]">{t('backups:cronExpressionUtc')}</div>
                <code className="rounded bg-gray-100 px-2 py-0.5 text-sm dark:bg-gray-700">
                  {backupInterval?.cronExpression || ''}
                </code>
              </div>
              {backupInterval?.cronExpression &&
                (() => {
                  try {
                    const interval = CronExpressionParser.parse(backupInterval.cronExpression, {
                      tz: 'UTC',
                    });
                    const nextRun = interval.next().toDate();
                    return (
                      <div className="mb-1 flex w-full items-center text-xs text-gray-600 dark:text-gray-400">
                        <div className="min-w-[150px]" />
                        <div>
                          {t('backups:nextRun')}{' '}
                          {dayjs(nextRun).local().format(dateTimeFormat.format)}
                          <br />({dayjs(nextRun).fromNow()})
                        </div>
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })()}
            </>
          )}

          {backupInterval?.interval !== IntervalType.HOURLY &&
            backupInterval?.interval !== IntervalType.CRON && (
              <div className="mb-1 flex w-full items-center">
                <div className="min-w-[150px]">{t('backups:backupTimeOfDay')}</div>
                <div>{formattedTime}</div>
              </div>
            )}

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('backups:retryIfFailed')}</div>
            <div>{backupConfig.isRetryIfFailed ? t('common:yes') : t('common:no')}</div>
          </div>

          {backupConfig.isRetryIfFailed && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[150px]">{t('backups:maxFailedTriesCount')}</div>
              <div>{backupConfig.maxFailedTriesCount}</div>
            </div>
          )}

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('backups:retentionPolicy')}</div>
            <div className="flex items-center gap-1">
              {retentionPolicyType === RetentionPolicyType.TimePeriod && (
                <span>
                  {backupConfig.retentionTimePeriod
                    ? periodLabels[backupConfig.retentionTimePeriod]
                    : ''}
                </span>
              )}
              {retentionPolicyType === RetentionPolicyType.Count && (
                <span>{t('backups:keepLastNBackups', { count: backupConfig.retentionCount })}</span>
              )}
              {retentionPolicyType === RetentionPolicyType.GFS && (
                <span className="flex items-center gap-1">
                  {formatGfsRetention(backupConfig, t)}
                  <Tooltip title={t('backups:gfsRotationTooltip')}>
                    <InfoCircleOutlined style={{ color: 'gray' }} />
                  </Tooltip>
                </span>
              )}
            </div>
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('backups:storage')}</div>
            <div className="flex items-center">
              <div>{backupConfig.storage?.name || ''}</div>
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
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[150px]">{t('backups:encryption')}</div>
              <div>
                {backupConfig.encryption === BackupEncryption.ENCRYPTED
                  ? t('backups:enabled')
                  : t('backups:none')}
              </div>

              <Tooltip className="cursor-pointer" title={t('backups:encryptionTooltip')}>
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          )}

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('backups:notifications')}</div>
            <div>
              {backupConfig.sendNotificationsOn.length > 0
                ? backupConfig.sendNotificationsOn
                    .map((type) => notificationLabels[type])
                    .join(', ')
                : t('backups:none')}
            </div>
          </div>
        </>
      ) : (
        <div />
      )}
    </div>
  );
};

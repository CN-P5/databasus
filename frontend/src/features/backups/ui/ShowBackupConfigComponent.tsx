import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { CronExpressionParser } from 'cron-parser';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { IS_CLOUD } from '../../../constants';
import { type BackupConfig, BackupEncryption, backupConfigApi } from '../../../entity/backups';
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

export const ShowBackupConfigComponent = ({ database }: Props) => {
  const { t } = useTranslation('backups');
  const [backupConfig, setBackupConfig] = useState<BackupConfig>();

  const weekdayLabels = useMemo(() => ({
    1: t('mon'),
    2: t('tue'),
    3: t('wed'),
    4: t('thu'),
    5: t('fri'),
    6: t('sat'),
    7: t('sun'),
  }), [t]);

  const intervalLabels = useMemo(() => ({
    [IntervalType.HOURLY]: t('hourly'),
    [IntervalType.DAILY]: t('daily'),
    [IntervalType.WEEKLY]: t('weekly'),
    [IntervalType.MONTHLY]: t('monthly'),
    [IntervalType.CRON]: t('cron'),
  }), [t]);

  const periodLabels = useMemo(() => ({
    [Period.DAY]: t('1day'),
    [Period.WEEK]: t('1week'),
    [Period.MONTH]: t('1month'),
    [Period.THREE_MONTH]: t('3months'),
    [Period.SIX_MONTH]: t('6months'),
    [Period.YEAR]: t('1year'),
    [Period.TWO_YEARS]: t('2years'),
    [Period.THREE_YEARS]: t('3years'),
    [Period.FOUR_YEARS]: t('4years'),
    [Period.FIVE_YEARS]: t('5years'),
    [Period.FOREVER]: t('forever'),
  }), [t]);

  // Detect user's preferred time format (12-hour vs 24-hour)
  const timeFormat = useMemo(() => {
    const is12Hour = getIs12Hour();
    return {
      use12Hours: is12Hour,
      format: is12Hour ? 'h:mm A' : 'HH:mm',
    };
  }, []);

  const dateTimeFormat = useMemo(() => getUserTimeFormat(), []);

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

  // Convert UTC weekday/day-of-month to local equivalents for display
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

  return (
    <div>
      <div className="mb-1 flex w-full items-center">
        <div className="min-w-[150px]">{t('backupsEnabled')}</div>
        <div className={backupConfig.isBackupsEnabled ? '' : 'font-bold text-red-600'}>
          {backupConfig.isBackupsEnabled ? 'Yes' : 'No'}
        </div>
      </div>

      {backupConfig.isBackupsEnabled ? (
        <>
          <div className="mt-4 mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('backupInterval')}</div>
            <div>{backupInterval?.interval ? intervalLabels[backupInterval.interval] : ''}</div>
          </div>

          {backupInterval?.interval === IntervalType.WEEKLY && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[150px]">{t('backupWeekday')}</div>
              <div>
                {displayedWeekday
                  ? weekdayLabels[displayedWeekday as keyof typeof weekdayLabels]
                  : ''}
              </div>
            </div>
          )}

          {backupInterval?.interval === IntervalType.MONTHLY && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[150px]">{t('backupDayOfMonth')}</div>
              <div>{displayedDayOfMonth || ''}</div>
            </div>
          )}

          {backupInterval?.interval === IntervalType.CRON && (
            <>
              <div className="mb-1 flex w-full items-center">
                <div className="min-w-[150px]">{t('cronExpressionUtc')}</div>
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
                          {t('nextRun')} {dayjs(nextRun).local().format(dateTimeFormat.format)}
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
                <div className="min-w-[150px]">{t('backupTimeOfDay')}</div>
                <div>{formattedTime}</div>
              </div>
            )}

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('retryBackupIfFailed')}</div>
            <div>{backupConfig.isRetryIfFailed ? 'Yes' : 'No'}</div>
          </div>

          {backupConfig.isRetryIfFailed && (
            <div className="mb-1 flex w-full items-center">
              <div className="min-w-[150px]">{t('maxFailedTriesCount')}</div>
              <div>{backupConfig.maxFailedTriesCount}</div>
            </div>
          )}

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('storePeriod')}</div>
            <div>{backupConfig.storePeriod ? periodLabels[backupConfig.storePeriod] : ''}</div>
          </div>

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('storage')}</div>
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
              <div className="min-w-[150px]">{t('encryption')}</div>
              <div>
                {backupConfig.encryption === BackupEncryption.ENCRYPTED ? t('encrypted') : t('none')}
              </div>

              <Tooltip
                className="cursor-pointer"
                title={t('encryptionTooltip')}
              >
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          )}

          <div className="mb-1 flex w-full items-center">
            <div className="min-w-[150px]">{t('notifications')}</div>
            <div>
              {backupConfig.sendNotificationsOn.length > 0
                ? backupConfig.sendNotificationsOn
                    .map((type) => {
                      if (type === BackupNotificationType.BackupFailed) return t('backupFailed');
                      if (type === BackupNotificationType.BackupSuccess) return t('backupSuccess');
                      return '';
                    })
                    .join(', ')
                : t('none')}
            </div>
          </div>
        </>
      ) : (
        <div />
      )}
    </div>
  );
};

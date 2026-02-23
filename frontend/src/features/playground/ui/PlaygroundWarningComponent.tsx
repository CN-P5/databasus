import { Modal } from 'antd';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { IS_CLOUD } from '../../../constants';

const STORAGE_KEY = 'databasus_playground_info_dismissed';

const TIMEOUT_SECONDS = 30;

export const PlaygroundWarningComponent = (): JSX.Element => {
  const { t } = useTranslation('playground');
  const [isVisible, setIsVisible] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(TIMEOUT_SECONDS);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  const handleClose = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      console.warn('Failed to save playground modal state to localStorage:', e);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (!IS_CLOUD) {
      return;
    }

    try {
      const isDismissed = localStorage.getItem(STORAGE_KEY) === 'true';
      if (!isDismissed) {
        setIsVisible(true);
      }
    } catch (e) {
      console.warn('Failed to read playground modal state from localStorage:', e);
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsButtonEnabled(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <Modal
      title={t('welcomeToPlayground')}
      open={isVisible}
      onOk={handleClose}
      okText={
        <div className="min-w-[100px]">
          {isButtonEnabled ? t('understood') : `${remainingSeconds}`}
        </div>
      }
      okButtonProps={{ disabled: !isButtonEnabled }}
      closable={false}
      cancelButtonProps={{ style: { display: 'none' } }}
      width={500}
      centered
      maskClosable={false}
    >
      <div className="space-y-6 py-4">
        <div>
          <h3 className="mb-2 text-lg font-semibold">{t('whatIsPlayground')}</h3>
          <p className="text-gray-700 dark:text-gray-300">{t('playgroundDescription')}</p>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">{t('whatIsLimit')}</h3>
          <ul className="list-disc space-y-1 pl-5 text-gray-700 dark:text-gray-300">
            <li>{t('singleBackupSizeLimit')}</li>
            <li>{t('storePeriodLimit')}</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">{t('isItSecure')}</h3>
          <p className="text-gray-700 dark:text-gray-300">
            {t('securityDescription')}{' '}
            <a
              href="https://databasus.com/security"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              {t('youCanReadHere')}
            </a>
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">{t('canMyDataBeCorrupted')}</h3>
          <p className="text-gray-700 dark:text-gray-300">{t('dataCorruptionDescription')}</p>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">{t('whatIfISeeIssue')}</h3>
          <p className="text-gray-700 dark:text-gray-300">
            {t('create')}{' '}
            <a
              href="https://github.com/databasus/databasus/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              GitHub issue
            </a>{' '}
            {t('orWrite')}{' '}
            <a
              href="https://t.me/databasus_community"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              {t('toTheCommunity')}
            </a>
          </p>
        </div>
      </div>
    </Modal>
  );
};

import { InfoCircleOutlined } from '@ant-design/icons';
import { Input, Switch, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Notifier } from '../../../../../entity/notifiers';

interface Props {
  notifier: Notifier;
  setNotifier: (notifier: Notifier) => void;
  setUnsaved: () => void;
}

export function EditTelegramNotifierComponent({ notifier, setNotifier, setUnsaved }: Props) {
  const { t } = useTranslation('notifiers');
  const [isShowHowToGetChatId, setIsShowHowToGetChatId] = useState(false);

  useEffect(() => {
    if (notifier.telegramNotifier?.threadId && !notifier.telegramNotifier.isSendToThreadEnabled) {
      setNotifier({
        ...notifier,
        telegramNotifier: {
          ...notifier.telegramNotifier,
          isSendToThreadEnabled: true,
        },
      });
    }
  }, [notifier]);

  return (
    <>
      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('botToken')}</div>
        <Input
          value={notifier?.telegramNotifier?.botToken || ''}
          onChange={(e) => {
            if (!notifier?.telegramNotifier) return;
            setNotifier({
              ...notifier,
              telegramNotifier: {
                ...notifier.telegramNotifier,
                botToken: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          placeholder="1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        />
      </div>

      <div className="mb-1 sm:ml-[150px]">
        <a
          className="text-xs !text-blue-600"
          href="https://www.siteguarding.com/en/how-to-get-telegram-bot-api-token"
          target="_blank"
          rel="noreferrer"
        >
          {t('howToGetTelegramBotApiToken')}
        </a>
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('targetChatId')}</div>
        <div className="flex items-center">
          <Input
            value={notifier?.telegramNotifier?.targetChatId || ''}
            onChange={(e) => {
              if (!notifier?.telegramNotifier) return;

              setNotifier({
                ...notifier,
                telegramNotifier: {
                  ...notifier.telegramNotifier,
                  targetChatId: e.target.value.trim(),
                },
              });
              setUnsaved();
            }}
            size="small"
            className="w-full max-w-[250px]"
            placeholder="-1001234567890"
          />

          <Tooltip
            className="cursor-pointer"
            title={t('theChatWhereYouWantToReceiveMessage')}
          >
            <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
          </Tooltip>
        </div>
      </div>

      <div className="max-w-[250px] sm:ml-[150px]">
        {!isShowHowToGetChatId ? (
          <div
            className="mt-1 cursor-pointer text-xs text-blue-600"
            onClick={() => setIsShowHowToGetChatId(true)}
          >
            {t('howToGetTelegramChatId')}
          </div>
        ) : (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('toGetYourChatId')}{' '}
            <a href="https://t.me/getmyid_bot" target="_blank" rel="noreferrer">
              @getmyid_bot
            </a>{' '}
            {t('inTelegram')}. <u>{t('makeSureYouStartedChatWithBot')}</u>
            <br />
            <br />
            {t('ifYouWantToGetChatIdOfAGroup')}{' '}
            <a href="https://t.me/getmyid_bot" target="_blank" rel="noreferrer">
              @getmyid_bot
            </a>{' '}
            {t('toGroupAndWriteStart')}
          </div>
        )}
      </div>

      <div className="mt-4 mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('sendToGroupTopic')}</div>
        <div className="flex items-center">
          <Switch
            checked={notifier?.telegramNotifier?.isSendToThreadEnabled || false}
            onChange={(checked) => {
              if (!notifier?.telegramNotifier) return;

              setNotifier({
                ...notifier,
                telegramNotifier: {
                  ...notifier.telegramNotifier,
                  isSendToThreadEnabled: checked,
                  threadId: checked ? notifier.telegramNotifier.threadId : undefined,
                },
              });
              setUnsaved();
            }}
            size="small"
          />

          <Tooltip
            className="cursor-pointer"
            title={t('enableThisToSendMessagesToASpecificThreadInAGroupChat')}
          >
            <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
          </Tooltip>
        </div>
      </div>

      {notifier?.telegramNotifier?.isSendToThreadEnabled && (
        <>
          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[150px] sm:mb-0">{t('threadId')}</div>
            <div className="flex items-center">
              <Input
                value={notifier?.telegramNotifier?.threadId?.toString() || ''}
                onChange={(e) => {
                  if (!notifier?.telegramNotifier) return;

                  const value = e.target.value.trim();
                  const threadId = value ? parseInt(value, 10) : undefined;

                  setNotifier({
                    ...notifier,
                    telegramNotifier: {
                      ...notifier.telegramNotifier,
                      threadId: !isNaN(threadId!) ? threadId : undefined,
                    },
                  });
                  setUnsaved();
                }}
                size="small"
                className="w-full max-w-[250px]"
                placeholder="3"
                type="number"
                min="1"
              />

              <Tooltip
                className="cursor-pointer"
                title={t('theIdOfThreadWhereMessagesShouldBeSent')}
              >
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>

          <div className="max-w-[250px] sm:ml-[150px]">
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('toGetThreadId')}
              <br />
              <br />
              <strong>{t('example')}</strong> {t('ifThreadLinkIs')}{' '}
              <code className="rounded bg-gray-100 px-1">https://t.me/c/2831948048/3</code>, {t('threadIdIs')}{' '}
              <code className="rounded bg-gray-100 px-1">3</code>
              <br />
              <br />
              <strong>{t('note')}</strong> {t('threadFunctionalityOnlyWorksInGroupChatsNotInPrivateChats')}.
            </div>
          </div>
        </>
      )}
    </>
  );
}

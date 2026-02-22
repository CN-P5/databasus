import { useTranslation } from 'react-i18next';

import type { Notifier, WebhookHeader } from '../../../../../entity/notifiers';
import { WebhookMethod } from '../../../../../entity/notifiers';

interface Props {
  notifier: Notifier;
}

export function ShowWebhookNotifierComponent({ notifier }: Props) {
  const { t } = useTranslation('notifiers');
  const headers = notifier?.webhookNotifier?.headers || [];
  const hasHeaders = headers.filter((h: WebhookHeader) => h.key).length > 0;

  return (
    <>
      <div className="flex items-center">
        <div className="min-w-[110px]">{t('webhookUrl')}</div>
        <div className="max-w-[350px] truncate">{notifier?.webhookNotifier?.webhookUrl || '-'}</div>
      </div>

      <div className="mt-1 mb-1 flex items-center">
        <div className="min-w-[110px]">{t('method')}</div>
        <div>{notifier?.webhookNotifier?.webhookMethod || '-'}</div>
      </div>

      {hasHeaders && (
        <div className="mt-1 mb-1 flex items-start">
          <div className="min-w-[110px]">{t('customHeaders')}</div>
          <div className="flex flex-col text-sm">
            {headers
              .filter((h: WebhookHeader) => h.key)
              .map((h: WebhookHeader, i: number) => (
                <div key={i} className="text-gray-600">
                  <span className="font-medium">{h.key}:</span> {h.value || t('hidden')}
                </div>
              ))}
          </div>
        </div>
      )}

      {notifier?.webhookNotifier?.webhookMethod === WebhookMethod.POST &&
        notifier?.webhookNotifier?.bodyTemplate && (
          <div className="mt-1 mb-1 flex items-start">
            <div className="min-w-[110px]">{t('bodyTemplate')}</div>
            <div className="max-w-[350px] rounded bg-gray-50 p-2 font-mono text-xs whitespace-pre-wrap">
              {notifier.webhookNotifier.bodyTemplate}
            </div>
          </div>
        )}
    </>
  );
}

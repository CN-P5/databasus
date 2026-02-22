import { useTranslation } from 'react-i18next';

import type { Notifier } from '../../../../../entity/notifiers';

interface Props {
  notifier: Notifier;
}

export function ShowDiscordNotifierComponent({ notifier }: Props) {
  const { t } = useTranslation('notifiers');

  return (
    <>
      <div className="flex">
        <div className="max-w-[110px] min-w-[110px] pr-3">{t('channelWebhookUrl')}</div>

        <div>{notifier.webhookNotifier?.webhookUrl.slice(0, 10)}*******</div>
      </div>
    </>
  );
}

import type { Notifier } from '../../../../../entity/notifiers';
import { useTranslation } from 'react-i18next';

interface Props {
  notifier: Notifier;
}

export function ShowSlackNotifierComponent({ notifier }: Props) {
  const { t } = useTranslation('notifiers');

  return (
    <>
      <div className="flex items-center">
        <div className="min-w-[110px]">{t('botToken')}</div>

        <div>*********</div>
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('targetChatId')}</div>
        {notifier?.slackNotifier?.targetChatId}
      </div>
    </>
  );
}

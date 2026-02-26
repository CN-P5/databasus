import { useTranslation } from 'react-i18next';

import type { Notifier } from '../../../../../entity/notifiers';

interface Props {
  notifier: Notifier;
}

export function ShowEmailNotifierComponent({ notifier }: Props) {
  const { t } = useTranslation('notifiers');

  return (
    <>
      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('targetEmail')}</div>
        {notifier?.emailNotifier?.targetEmail}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('smtpHost')}</div>
        {notifier?.emailNotifier?.smtpHost}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('smtpPort')}</div>
        {notifier?.emailNotifier?.smtpPort}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('smtpUser')}</div>
        {notifier?.emailNotifier?.smtpUser}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('smtpPassword')}</div>
        {'*************'}
      </div>

      <div className="mb-1 flex items-center">
        <div className="min-w-[110px]">{t('from')}</div>
        {notifier?.emailNotifier?.from || '(auto)'}
      </div>
    </>
  );
}

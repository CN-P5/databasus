import { Input } from 'antd';
import { useTranslation } from 'react-i18next';

import type { Notifier } from '../../../../../entity/notifiers';

interface Props {
  notifier: Notifier;
  setNotifier: (notifier: Notifier) => void;
  setUnsaved: () => void;
}

export function EditDiscordNotifierComponent({ notifier, setNotifier, setUnsaved }: Props) {
  const { t } = useTranslation('notifiers');

  return (
    <>
      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[150px] sm:mb-0">{t('channelWebhookUrl')}</div>
        <Input
          value={notifier?.discordNotifier?.channelWebhookUrl || ''}
          onChange={(e) => {
            if (!notifier?.discordNotifier) return;
            setNotifier({
              ...notifier,
              discordNotifier: {
                ...notifier.discordNotifier,
                channelWebhookUrl: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          placeholder="1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        />
      </div>

      <div className="max-w-[250px] sm:ml-[150px]">
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          <strong>{t('howToGetDiscordWebhookUrl')}</strong>
          <br />
          <br />
          {t('createOrSelectADiscordChannel')}
          <br />
          {t('goToChannelSettingsGearIcon')}
          <br />
          {t('navigateToIntegrations')}
          <br />
          {t('createANewWebhook')}
          <br />
          {t('copyWebhookUrl')}
          <br />
          <br />
          <em>{t('noteMakeSureMakeChannelPrivateIfNeeded')}</em>
        </div>
      </div>
    </>
  );
}

import { GlobalOutlined } from '@ant-design/icons';
import { Select } from 'antd';

import { useTranslation } from 'react-i18next';

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: '中文', value: 'zh' },
];

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common');

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
  };

  return (
    <Select
      value={i18n.language}
      onChange={handleLanguageChange}
      options={LANGUAGE_OPTIONS}
      style={{ width: 80 }}
      suffixIcon={<GlobalOutlined />}
      placeholder={t('language')}
    />
  );
}

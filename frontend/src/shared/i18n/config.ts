import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDatabases from './locales/en/databases.json';
import enBackups from './locales/en/backups.json';
import enStorages from './locales/en/storages.json';
import enNotifiers from './locales/en/notifiers.json';
import enUsers from './locales/en/users.json';
import enWorkspaces from './locales/en/workspaces.json';
import enSettings from './locales/en/settings.json';
import enSidebar from './locales/en/sidebar.json';
import enRestores from './locales/en/restores.json';

import zhCommon from './locales/zh/common.json';
import zhAuth from './locales/zh/auth.json';
import zhDatabases from './locales/zh/databases.json';
import zhBackups from './locales/zh/backups.json';
import zhStorages from './locales/zh/storages.json';
import zhNotifiers from './locales/zh/notifiers.json';
import zhUsers from './locales/zh/users.json';
import zhWorkspaces from './locales/zh/workspaces.json';
import zhSettings from './locales/zh/settings.json';
import zhSidebar from './locales/zh/sidebar.json';
import zhRestores from './locales/zh/restores.json';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    databases: enDatabases,
    backups: enBackups,
    storages: enStorages,
    notifiers: enNotifiers,
    users: enUsers,
    workspaces: enWorkspaces,
    settings: enSettings,
    sidebar: enSidebar,
    restores: enRestores,
  },
  zh: {
    common: zhCommon,
    auth: zhAuth,
    databases: zhDatabases,
    backups: zhBackups,
    storages: zhStorages,
    notifiers: zhNotifiers,
    users: zhUsers,
    workspaces: zhWorkspaces,
    settings: zhSettings,
    sidebar: zhSidebar,
    restores: zhRestores,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'databases', 'backups', 'storages', 'notifiers', 'users', 'workspaces', 'settings', 'sidebar', 'restores'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

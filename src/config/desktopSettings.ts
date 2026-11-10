import {
  APP_SETTINGS_ACCOUNT_PATH,
  APP_SETTINGS_DISPLAY_PATH,
  APP_SETTINGS_NOTIFICATIONS_PATH,
  APP_SETTINGS_PATH,
  APP_SETTINGS_PRIVACY_PATH,
  APP_SETTINGS_SAFETY_PATH,
} from './surfacePaths';

/** Desktop settings: one route per section (mobile keeps drill-down). */
export const DESKTOP_SETTINGS_SECTIONS = [
  { id: 'display', label: 'Display', path: APP_SETTINGS_PATH },
  { id: 'account', label: 'Account', path: APP_SETTINGS_ACCOUNT_PATH },
  { id: 'privacy', label: 'Privacy', path: APP_SETTINGS_PRIVACY_PATH },
  { id: 'notifications', label: 'Notifications', path: APP_SETTINGS_NOTIFICATIONS_PATH },
  { id: 'safety', label: 'Safety & emergency', path: APP_SETTINGS_SAFETY_PATH },
] as const;

export type DesktopSettingsSectionId = (typeof DESKTOP_SETTINGS_SECTIONS)[number]['id'];

/** Mobile single-page anchors only — desktop uses {@link desktopSettingsSectionPath}. */
export const desktopSettingsSectionDomId = (id: DesktopSettingsSectionId): string => `settings-${id}`;

export const desktopSettingsSectionPath = (id: DesktopSettingsSectionId): string => {
  const match = DESKTOP_SETTINGS_SECTIONS.find((section) => section.id === id);
  return match?.path ?? APP_SETTINGS_PATH;
};

export const desktopSettingsActiveSectionFromPath = (pathname: string): DesktopSettingsSectionId => {
  if (pathname.startsWith(APP_SETTINGS_SAFETY_PATH)) return 'safety';
  if (pathname.startsWith(APP_SETTINGS_NOTIFICATIONS_PATH)) return 'notifications';
  if (pathname.startsWith(APP_SETTINGS_PRIVACY_PATH)) return 'privacy';
  if (pathname.startsWith(APP_SETTINGS_ACCOUNT_PATH)) return 'account';
  if (pathname.startsWith(APP_SETTINGS_DISPLAY_PATH)) return 'display';
  return 'display';
};

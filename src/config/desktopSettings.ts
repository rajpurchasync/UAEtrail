import { PROFILE_SETTINGS_PATH } from './surfacePaths';

/** Desktop settings render as one page; mobile keeps the drill-down sub-routes. */
export const DESKTOP_SETTINGS_SECTIONS = [
  { id: 'display', label: 'Display' },
  { id: 'account', label: 'Account' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'safety', label: 'Safety & emergency' },
] as const;

export type DesktopSettingsSectionId = (typeof DESKTOP_SETTINGS_SECTIONS)[number]['id'];

export const desktopSettingsSectionDomId = (id: DesktopSettingsSectionId): string => `settings-${id}`;

export const desktopSettingsSectionPath = (id: DesktopSettingsSectionId): string =>
  `${PROFILE_SETTINGS_PATH}#${desktopSettingsSectionDomId(id)}`;

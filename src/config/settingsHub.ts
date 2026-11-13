import {
  APP_SETTINGS_ACCOUNT_PATH,
  APP_SETTINGS_DISPLAY_PATH,
  APP_SETTINGS_NOTIFICATIONS_PATH,
  APP_SETTINGS_PRIVACY_PATH,
  APP_SETTINGS_SAFETY_PATH,
} from './surfacePaths';

/** User-facing title for `/settings` and settings back labels. */
export const SETTINGS_SURFACE_TITLE = 'Settings';

export type SettingsHubSectionId = 'display' | 'account' | 'privacy' | 'notifications' | 'safety';

export const MOBILE_SETTINGS_HUB_SECTIONS: Array<{
  id: SettingsHubSectionId;
  label: string;
  path: string;
  description: string;
  guestDescription?: string;
  requiresAuth?: boolean;
}> = [
  {
    id: 'display',
    label: 'Display',
    path: APP_SETTINGS_DISPLAY_PATH,
    description: 'Theme, text size, and map preferences',
  },
  {
    id: 'account',
    label: 'Account',
    path: APP_SETTINGS_ACCOUNT_PATH,
    description: 'Email, password, and sign out',
    guestDescription: 'Log in to change email, password, and sign-out options',
    requiresAuth: true,
  },
  {
    id: 'privacy',
    label: 'Privacy',
    path: APP_SETTINGS_PRIVACY_PATH,
    description: 'Profile visibility, field privacy, and map presence',
    guestDescription: 'Log in to control profile visibility and map presence',
    requiresAuth: true,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    path: APP_SETTINGS_NOTIFICATIONS_PATH,
    description: 'History, preferences, and saved map alerts',
    guestDescription: 'Log in for history, preferences, and saved map alerts',
    requiresAuth: true,
  },
  {
    id: 'safety',
    label: 'Safety & emergency',
    path: APP_SETTINGS_SAFETY_PATH,
    description: 'Blood group, ICE contact, verification',
    guestDescription: 'Log in to save medical notes',
    requiresAuth: true,
  },
];

import {
  APP_SETTINGS_NOTIFICATIONS_PATH,
  APP_SETTINGS_NOTIFICATIONS_PREFERENCES_PATH,
  APP_SETTINGS_NOTIFICATIONS_SAVED_PATH,
} from './surfacePaths';

export type NotificationHubPanel = 'history' | 'settings' | 'saved';

export const NOTIFICATION_HUB_PANELS: Array<{
  id: NotificationHubPanel;
  label: string;
  path: string;
  description: string;
}> = [
  {
    id: 'history',
    label: 'Notification history',
    path: APP_SETTINGS_NOTIFICATIONS_PATH,
    description: 'Inbox for outings, friends, and account updates',
  },
  {
    id: 'settings',
    label: 'Notification settings',
    path: APP_SETTINGS_NOTIFICATIONS_PREFERENCES_PATH,
    description: 'Email, push, in-app, and quiet hours',
  },
  {
    id: 'saved',
    label: 'Saved map & alerts',
    path: APP_SETTINGS_NOTIFICATIONS_SAVED_PATH,
    description: 'Places and plans you starred for match alerts',
  },
];

export const notificationHubPanelFromPath = (pathname: string): NotificationHubPanel => {
  if (pathname.startsWith(APP_SETTINGS_NOTIFICATIONS_PREFERENCES_PATH)) return 'settings';
  if (pathname.startsWith(APP_SETTINGS_NOTIFICATIONS_SAVED_PATH)) return 'saved';
  return 'history';
};

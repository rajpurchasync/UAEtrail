import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../lib/notifications-store.js';

export const markMyNotificationRead = (input: { id: string; userId: string }) =>
  markNotificationAsRead(input);

export const markAllMyNotificationsRead = (userId: string) => markAllNotificationsAsRead(userId);

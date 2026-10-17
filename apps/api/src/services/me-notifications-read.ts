import { listUserNotifications } from '../lib/notifications-store.js';

export const listMyNotifications = (input: {
  userId: string;
  skip: number;
  take: number;
}) => listUserNotifications(input);

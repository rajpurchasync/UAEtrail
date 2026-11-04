import type { NotificationDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export type MeNotificationsPage = {
  data: NotificationDTO[];
  total: number;
  unreadCount: number;
};

export const fetchMeNotificationsPage = async (page = 1, pageSize = 20): Promise<MeNotificationsPage> => {
  const res = await api.getMeNotifications(page, pageSize);
  return {
    data: res.data,
    total: res.meta?.total ?? res.total ?? res.data.length,
    unreadCount: res.unreadCount ?? res.data.filter((n) => !n.isRead).length,
  };
};

export const markNotificationReadById = async (id: string): Promise<void> => {
  await api.markNotificationRead(id);
};

export const markAllMeNotificationsRead = async (): Promise<void> => {
  await api.markAllNotificationsRead();
};

export const acceptMeGroupInviteByToken = async (token: string): Promise<void> => {
  await api.acceptMeGroupInvite(token);
};

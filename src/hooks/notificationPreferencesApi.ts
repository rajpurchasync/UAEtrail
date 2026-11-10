import type { NotificationPreferenceSettings } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const fetchNotificationPreferences = async (): Promise<NotificationPreferenceSettings> => {
  const res = await api.getMeNotificationPreferences();
  return res.data;
};

export const updateNotificationPreferences = async (
  patch: Partial<NotificationPreferenceSettings>
): Promise<NotificationPreferenceSettings> => {
  const res = await api.updateMeNotificationPreferences(patch);
  return res.data;
};

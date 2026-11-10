import type {
  NotificationChannelPrefs,
  NotificationPreferenceSettings,
  NotificationPreferenceTopic,
} from '@uaetrail/shared-types';
import { mergeNotificationPreferenceSettings } from '@uaetrail/shared-types';
import { updateAuthUserProfile } from '../lib/auth-users-store.js';
import { findAuthUserById } from './member-identity-read.js';

export const getMemberNotificationPreferences = async (
  userId: string
): Promise<NotificationPreferenceSettings> => {
  const user = await findAuthUserById(userId);
  return mergeNotificationPreferenceSettings(user?.profile?.notificationPreferences);
};

export type NotificationPreferencesPatch = {
  topics?: Partial<Record<NotificationPreferenceTopic, Partial<NotificationChannelPrefs>>>;
  dnd?: Partial<NotificationPreferenceSettings['dnd']>;
};

const mergeTopicPatch = (
  current: NotificationPreferenceSettings['topics'],
  patch: NotificationPreferencesPatch['topics']
): NotificationPreferenceSettings['topics'] => {
  if (!patch) return current;
  const next = { ...current };
  for (const key of Object.keys(patch) as NotificationPreferenceTopic[]) {
    const topicPatch = patch[key];
    if (!topicPatch) continue;
    next[key] = { ...current[key], ...topicPatch };
  }
  return next;
};

export const patchMemberNotificationPreferences = async (
  userId: string,
  patch: NotificationPreferencesPatch
): Promise<NotificationPreferenceSettings> => {
  const user = await findAuthUserById(userId);
  const current = mergeNotificationPreferenceSettings(user?.profile?.notificationPreferences);
  const next = mergeNotificationPreferenceSettings({
    topics: mergeTopicPatch(current.topics, patch.topics),
    dnd: { ...current.dnd, ...patch.dnd },
  });
  await updateAuthUserProfile(userId, { notificationPreferences: next });
  return next;
};

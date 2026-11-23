export const NOTIFICATION_PREFERENCE_TOPICS = ['plans', 'social', 'account', 'map_alerts'] as const;
export type NotificationPreferenceTopic = (typeof NOTIFICATION_PREFERENCE_TOPICS)[number];

export const NOTIFICATION_DND_MODES = ['off', 'always', 'schedule'] as const;
export type NotificationDndMode = (typeof NOTIFICATION_DND_MODES)[number];

export type NotificationChannelPrefs = {
  email: boolean;
  push: boolean;
  inApp: boolean;
};

export type NotificationDndSettings = {
  mode: NotificationDndMode;
  /** Inclusive calendar dates (`YYYY-MM-DD`) when `mode === 'schedule'`. */
  fromDate?: string | null;
  toDate?: string | null;
};

export type NotificationPreferenceSettings = {
  topics: Record<NotificationPreferenceTopic, NotificationChannelPrefs>;
  dnd: NotificationDndSettings;
};

const defaultTopicChannels = (): NotificationChannelPrefs => ({
  email: true,
  push: true,
  inApp: true,
});

export const DEFAULT_NOTIFICATION_PREFERENCE_SETTINGS: NotificationPreferenceSettings = {
  topics: {
    plans: defaultTopicChannels(),
    social: defaultTopicChannels(),
    account: defaultTopicChannels(),
    map_alerts: defaultTopicChannels(),
  },
  dnd: { mode: 'off', fromDate: null, toDate: null },
};

export const mergeNotificationPreferenceSettings = (
  stored: Partial<NotificationPreferenceSettings> | null | undefined
): NotificationPreferenceSettings => {
  if (!stored || typeof stored !== 'object') {
    return {
      topics: { ...DEFAULT_NOTIFICATION_PREFERENCE_SETTINGS.topics },
      dnd: { ...DEFAULT_NOTIFICATION_PREFERENCE_SETTINGS.dnd },
    };
  }
  const topics = { ...DEFAULT_NOTIFICATION_PREFERENCE_SETTINGS.topics };
  for (const key of NOTIFICATION_PREFERENCE_TOPICS) {
    const row = stored.topics?.[key];
    if (row && typeof row === 'object') {
      topics[key] = {
        email: row.email !== false,
        push: row.push !== false,
        inApp: row.inApp !== false,
      };
    }
  }
  const mode = stored.dnd?.mode;
  const dnd: NotificationDndSettings = {
    mode:
      mode === 'always' || mode === 'schedule' || mode === 'off'
        ? mode
        : DEFAULT_NOTIFICATION_PREFERENCE_SETTINGS.dnd.mode,
    fromDate: stored.dnd?.fromDate ?? null,
    toDate: stored.dnd?.toDate ?? null,
  };
  return { topics, dnd };
};

const isoDateOnly = (value: Date): string => value.toISOString().slice(0, 10);

export const isNotificationDndActive = (
  dnd: NotificationDndSettings,
  at: Date = new Date()
): boolean => {
  if (dnd.mode === 'off') return false;
  if (dnd.mode === 'always') return true;
  const today = isoDateOnly(at);
  const from = dnd.fromDate?.trim() || null;
  const to = dnd.toDate?.trim() || null;
  if (!from && !to) return false;
  if (from && today < from) return false;
  if (to && today > to) return false;
  return true;
};

export const resolveNotificationPreferenceTopic = (
  kind: string | null | undefined
): NotificationPreferenceTopic => {
  const k = (kind ?? '').toLowerCase();
  if (k === 'wishlist_match' || k.includes('map') || k.includes('wishlist')) return 'map_alerts';
  if (
    k === 'connection_friend_request' ||
    k === 'connection_friend_accepted' ||
    k === 'connection_member_followed' ||
    k === 'group_invite' ||
    k === 'group_invite_accepted' ||
    k === 'group_message' ||
    k === 'message' ||
    k.includes('friend') ||
    k.includes('comment_')
  ) {
    return 'social';
  }
  if (
    k === 'badge' ||
    k === 'reward' ||
    k === 'tier_upgrade' ||
    k.startsWith('host_application') ||
    k === 'user_registered' ||
    k === 'user_suspended' ||
    k === 'user_reactivated' ||
    k.startsWith('location_')
  ) {
    return 'account';
  }
  return 'plans';
};

export type NotificationDeliveryChannel = 'in_app' | 'push' | 'email';

export const shouldDeliverNotification = (input: {
  prefs: NotificationPreferenceSettings;
  topic: NotificationPreferenceTopic;
  channel: NotificationDeliveryChannel;
  at?: Date;
}): boolean => {
  if (isNotificationDndActive(input.prefs.dnd, input.at)) {
    return false;
  }
  const topicPrefs = input.prefs.topics[input.topic] ?? defaultTopicChannels();
  if (input.channel === 'email') return topicPrefs.email;
  if (input.channel === 'push') return topicPrefs.push;
  return topicPrefs.inApp;
};

import { useCallback, useEffect, useState } from 'react';
import type {
  NotificationDndMode,
  NotificationPreferenceSettings,
  NotificationPreferenceTopic,
} from '@uaetrail/shared-types';
import {
  DEFAULT_NOTIFICATION_PREFERENCE_SETTINGS,
  NOTIFICATION_PREFERENCE_TOPICS,
} from '@uaetrail/shared-types';
import { GlassCard } from '../mobile/GlassCard';
import { SettingsContentGroup } from '../settings/SettingsMenuRow';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '../../hooks/notificationPreferencesApi';

const TOPIC_COPY: Record<NotificationPreferenceTopic, { label: string; hint: string }> = {
  plans: { label: 'Outings & plans', hint: 'Join requests, schedule changes, and invites' },
  social: { label: 'Friends & chat', hint: 'Buddy requests, groups, and messages' },
  account: { label: 'Account', hint: 'Badges, host applications, and platform updates' },
  map_alerts: { label: 'Saved map matches', hint: 'When new outings match your saved places' },
};

const DND_OPTIONS: { value: NotificationDndMode; label: string; hint: string }[] = [
  { value: 'off', label: 'Off', hint: 'Deliver alerts using the channels below' },
  { value: 'always', label: 'Always on (quiet)', hint: 'Pause push, email, and new inbox items' },
  {
    value: 'schedule',
    label: 'Date range',
    hint: 'Pause between the from and to dates (inclusive)',
  },
];

type NotificationPreferencesSectionProps = {
  /** Mobile settings card chrome instead of GlassCard. */
  mobileSurface?: boolean;
};

export const NotificationPreferencesSection = ({
  mobileSurface = false,
}: NotificationPreferencesSectionProps) => {
  const [prefs, setPrefs] = useState<NotificationPreferenceSettings>(
    DEFAULT_NOTIFICATION_PREFERENCE_SETTINGS
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetchNotificationPreferences().then(setPrefs).catch(() => undefined);
  }, []);

  const persist = useCallback(async (next: NotificationPreferenceSettings) => {
    setSaving(true);
    setMessage(null);
    setPrefs(next);
    try {
      const saved = await updateNotificationPreferences(next);
      setPrefs(saved);
      setMessage('Saved.');
    } catch {
      setMessage('Could not save. Try again.');
      const restored = await fetchNotificationPreferences().catch(() => next);
      setPrefs(restored);
    } finally {
      setSaving(false);
    }
  }, []);

  const toggleChannel = (
    topic: NotificationPreferenceTopic,
    channel: 'email' | 'push' | 'inApp',
    value: boolean
  ) => {
    const next: NotificationPreferenceSettings = {
      ...prefs,
      topics: {
        ...prefs.topics,
        [topic]: { ...prefs.topics[topic], [channel]: value },
      },
    };
    void persist(next);
  };

  const setDndMode = (mode: NotificationDndMode) => {
    void persist({
      ...prefs,
      dnd: { ...prefs.dnd, mode },
    });
  };

  const setDndDate = (field: 'fromDate' | 'toDate', value: string) => {
    void persist({
      ...prefs,
      dnd: { ...prefs.dnd, [field]: value || null },
    });
  };

  const dndBody = (
    <>
      {mobileSurface ? null : <h2 className="text-sm font-semibold text-neutral-900">Do not disturb</h2>}
      <p className={`${mobileSurface ? '' : 'mt-1'} text-xs leading-relaxed text-neutral-600`}>
        When active, we respect quiet mode for push, email, and new inbox notifications everywhere in the
        app.
      </p>
      <ul className="mt-3 space-y-2">
        {DND_OPTIONS.map((option) => {
          const selected = prefs.dnd.mode === option.value;
          return (
            <li key={option.value}>
              <button
                type="button"
                disabled={saving}
                onClick={() => setDndMode(option.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  selected ? 'border-emerald-300 bg-emerald-50' : 'border-neutral-200 bg-white'
                }`}
              >
                <p className="text-sm font-semibold text-neutral-900">{option.label}</p>
                <p className="mt-0.5 text-xs text-neutral-600">{option.hint}</p>
              </button>
            </li>
          );
        })}
      </ul>
      {prefs.dnd.mode === 'schedule' ? (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-neutral-700">
            From
            <input
              type="date"
              disabled={saving}
              value={prefs.dnd.fromDate ?? ''}
              onChange={(e) => setDndDate('fromDate', e.target.value)}
              className="ios-input mt-1 !min-h-[44px] text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-neutral-700">
            To
            <input
              type="date"
              disabled={saving}
              value={prefs.dnd.toDate ?? ''}
              onChange={(e) => setDndDate('toDate', e.target.value)}
              className="ios-input mt-1 !min-h-[44px] text-sm"
            />
          </label>
        </div>
      ) : null}
    </>
  );

  const topicsBody = (
    <>
      {mobileSurface ? null : (
        <h2 className="text-sm font-semibold text-neutral-900">By notification type</h2>
      )}
      <p className={`${mobileSurface ? '' : 'mt-1'} text-xs leading-relaxed text-neutral-600`}>
        Choose how each category reaches you. In-app items still respect Do not disturb above.
      </p>
      <ul className="mt-4 space-y-3">
        {NOTIFICATION_PREFERENCE_TOPICS.map((topic) => {
          const copy = TOPIC_COPY[topic];
          const channels = prefs.topics[topic];
          return (
            <li
              key={topic}
              className="rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5"
            >
              <p className="text-sm font-semibold text-neutral-900">{copy.label}</p>
              <p className="text-xs text-neutral-500">{copy.hint}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ['inApp', 'In-app'],
                    ['push', 'Push'],
                    ['email', 'Email'],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-neutral-300 text-emerald-600"
                      checked={channels[key]}
                      disabled={saving}
                      onChange={(e) => toggleChannel(topic, key, e.target.checked)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      {message ? <p className="mt-2 text-xs text-emerald-700">{message}</p> : null}
    </>
  );

  if (mobileSurface) {
    return (
      <div className="space-y-4">
        <SettingsContentGroup title="Do not disturb">{dndBody}</SettingsContentGroup>
        <SettingsContentGroup title="By notification type">{topicsBody}</SettingsContentGroup>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard padding>{dndBody}</GlassCard>
      <GlassCard padding>{topicsBody}</GlassCard>
    </div>
  );
};

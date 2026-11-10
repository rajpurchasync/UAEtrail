import { useEffect, useState } from 'react';
import type { UserProfile } from '../../api/types';
import { fetchMeProfile, updateMeProfile } from '../../hooks/memberProfileApi';
import { GlassCard } from '../mobile/GlassCard';

type ProfileVisibility = NonNullable<UserProfile['profileVisibility']>;

const VISIBILITY_OPTIONS: Array<{
  value: ProfileVisibility;
  label: string;
  description: string;
}> = [
  {
    value: 'public',
    label: 'Public',
    description: 'Other signed-in members can view your public member card. Guests must sign in first.',
  },
  {
    value: 'group_members',
    label: 'Friends & groups',
    description: 'Full profile for people in your family or friends groups.',
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Hidden from browse; friends and outing co-participants can still view when allowed.',
  },
];

type ProfileVisibilitySectionProps = {
  /** Drop outer card and title when wrapped in {@link ConsumerDetailSection}. */
  embedded?: boolean;
};

export const ProfileVisibilitySection = ({ embedded = false }: ProfileVisibilitySectionProps) => {
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>('public');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetchMeProfile().then((profile) => {
      setProfileVisibility(profile.profileVisibility ?? 'public');
    });
  }, []);

  const handleChange = async (next: ProfileVisibility) => {
    if (next === profileVisibility || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateMeProfile({ profileVisibility: next });
      setProfileVisibility(next);
      setMessage('Visibility updated.');
    } catch {
      setMessage('Could not update visibility.');
    } finally {
      setSaving(false);
    }
  };

  const body = (
    <>
      {embedded ? (
        <p className="mb-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          Who can open your member profile. Guests are always asked to sign in first.
        </p>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-neutral-900">Profile visibility</h2>
          <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
            Who can open your member profile. Guests are always asked to sign in first.
          </p>
        </>
      )}
      <div className={embedded ? 'space-y-2' : 'mt-3 space-y-2'}>
        {VISIBILITY_OPTIONS.map((option) => {
          const selected = profileVisibility === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={saving}
              onClick={() => void handleChange(option.value)}
              className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                selected ? 'border-emerald-300 bg-emerald-50' : 'border-neutral-200 bg-white'
              }`}
            >
              <p className="text-sm font-semibold text-neutral-900">{option.label}</p>
              <p className="mt-0.5 text-xs text-neutral-600">{option.description}</p>
            </button>
          );
        })}
      </div>
      {message ? <p className="mt-2 text-xs text-emerald-700">{message}</p> : null}
    </>
  );

  if (embedded) {
    return <div className="min-w-0">{body}</div>;
  }

  return <GlassCard padding>{body}</GlassCard>;
};

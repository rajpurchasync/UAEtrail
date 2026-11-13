import { useCallback, useEffect, useState } from 'react';
import type {
  FindCrewVisibility,
  ProfileDateOfBirthShare,
  ProfileFieldAudience,
  ProfileFieldPrivacyKey,
  ProfileFieldPrivacySettings,
  ProfileFriendsListShare,
} from '@uaetrail/shared-types';
import {
  DEFAULT_FIND_CREW_VISIBILITY,
  DEFAULT_PROFILE_FIELD_PRIVACY,
  DEFAULT_PROFILE_FRIENDS_LIST_SHARE,
  mergeProfileFieldPrivacy,
} from '@uaetrail/shared-types';
import { GlassCard } from '../mobile/GlassCard';
import { AppSelect } from '../ui/AppSelect';
import {
  FIND_CREW_VISIBILITY_HINT,
  FIND_CREW_VISIBILITY_LABELS,
  PROFILE_DATE_OF_BIRTH_SHARE_HINT,
  PROFILE_DATE_OF_BIRTH_SHARE_LABELS,
  PROFILE_FIELD_AUDIENCE_LABELS,
  PROFILE_FIELD_PRIVACY_GROUPS,
  PROFILE_FRIENDS_LIST_SHARE_HINT,
  PROFILE_FRIENDS_LIST_SHARE_LABELS,
} from '../../content/profileFieldPrivacyCopy';
import {
  fetchMeProfile,
  updateMeProfileFieldPrivacy,
  type MemberProfilePrivacySettings,
} from '../../hooks/memberProfileApi';

const fieldPrivacyFromResponse = (response: MemberProfilePrivacySettings): ProfileFieldPrivacySettings => {
  const {
    dateOfBirthShare: _dob,
    friendsListShare: _friends,
    findCrewVisibility: _findCrew,
    ...fieldRest
  } = response;
  return mergeProfileFieldPrivacy(fieldRest);
};

const applyPrivacyResponse = (
  next: MemberProfilePrivacySettings,
  setters: {
    setSettings: (value: ProfileFieldPrivacySettings) => void;
    setDateOfBirthShare: (value: ProfileDateOfBirthShare) => void;
    setFriendsListShare: (value: ProfileFriendsListShare) => void;
    setFindCrewVisibility: (value: FindCrewVisibility) => void;
  }
) => {
  setters.setSettings(fieldPrivacyFromResponse(next));
  setters.setDateOfBirthShare(next.dateOfBirthShare);
  setters.setFriendsListShare(next.friendsListShare);
  setters.setFindCrewVisibility(next.findCrewVisibility);
};

const FRIENDS_LIST_OPTIONS = (
  [
    'only_me',
    'friends_crew',
    'friends_of_friends',
    'mutual_only',
  ] as const satisfies readonly ProfileFriendsListShare[]
).map((value) => ({
  value,
  label: PROFILE_FRIENDS_LIST_SHARE_LABELS[value],
}));

const FIND_CREW_OPTIONS = (
  ['friends', 'friends_of_friends', 'none'] as const satisfies readonly FindCrewVisibility[]
).map((value) => ({
  value,
  label: FIND_CREW_VISIBILITY_LABELS[value],
}));

const AUDIENCE_OPTIONS = (
  ['hidden', 'friends', 'friends_of_friends', 'public'] as const satisfies readonly ProfileFieldAudience[]
).map((value) => ({
  value,
  label: PROFILE_FIELD_AUDIENCE_LABELS[value],
}));

const DOB_OPTIONS = (
  [
    'hidden',
    'month_day_friends',
    'month_day_friends_of_friends',
    'month_day_public',
    'full_friends',
    'full_friends_of_friends',
    'full_public',
  ] as const satisfies readonly ProfileDateOfBirthShare[]
).map((value) => ({
  value,
  label: PROFILE_DATE_OF_BIRTH_SHARE_LABELS[value],
}));

type ProfileFieldPrivacySectionProps = {
  embedded?: boolean;
};

export const ProfileFieldPrivacySection = ({ embedded = false }: ProfileFieldPrivacySectionProps) => {
  const [settings, setSettings] = useState<ProfileFieldPrivacySettings>(DEFAULT_PROFILE_FIELD_PRIVACY);
  const [dateOfBirthShare, setDateOfBirthShare] = useState<ProfileDateOfBirthShare>('hidden');
  const [friendsListShare, setFriendsListShare] =
    useState<ProfileFriendsListShare>(DEFAULT_PROFILE_FRIENDS_LIST_SHARE);
  const [findCrewVisibility, setFindCrewVisibility] =
    useState<FindCrewVisibility>(DEFAULT_FIND_CREW_VISIBILITY);
  const [savingKey, setSavingKey] = useState<
    ProfileFieldPrivacyKey | 'dateOfBirthShare' | 'friendsListShare' | 'findCrewVisibility' | null
  >(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetchMeProfile().then((profile) => {
      if (profile.fieldPrivacy) {
        setSettings(profile.fieldPrivacy);
      }
      if (profile.dateOfBirthShare) {
        setDateOfBirthShare(profile.dateOfBirthShare);
      }
      if (profile.friendsListShare) {
        setFriendsListShare(profile.friendsListShare);
      }
      if (profile.findCrewVisibility) {
        setFindCrewVisibility(profile.findCrewVisibility);
      }
    });
  }, []);

  const saveField = useCallback(
    async (key: ProfileFieldPrivacyKey, value: ProfileFieldAudience) => {
      if (settings[key] === value || savingKey) return;
      setSavingKey(key);
      setMessage(null);
      const previous = settings[key];
      setSettings((current) => ({ ...current, [key]: value }));
      try {
        const next = await updateMeProfileFieldPrivacy({ fieldPrivacy: { [key]: value } });
        applyPrivacyResponse(next, {
          setSettings,
          setDateOfBirthShare,
          setFriendsListShare,
          setFindCrewVisibility,
        });
        setMessage('Saved.');
      } catch {
        setSettings((current) => ({ ...current, [key]: previous }));
        setMessage('Could not save. Try again.');
      } finally {
        setSavingKey(null);
      }
    },
    [savingKey, settings]
  );

  const saveDateOfBirthShare = useCallback(
    async (value: ProfileDateOfBirthShare) => {
      if (dateOfBirthShare === value || savingKey) return;
      setSavingKey('dateOfBirthShare');
      setMessage(null);
      const previous = dateOfBirthShare;
      setDateOfBirthShare(value);
      try {
        const next = await updateMeProfileFieldPrivacy({ dateOfBirthShare: value });
        applyPrivacyResponse(next, {
          setSettings,
          setDateOfBirthShare,
          setFriendsListShare,
          setFindCrewVisibility,
        });
        setMessage('Saved.');
      } catch {
        setDateOfBirthShare(previous);
        setMessage('Could not save. Try again.');
      } finally {
        setSavingKey(null);
      }
    },
    [dateOfBirthShare, savingKey]
  );

  const saveFriendsListShare = useCallback(
    async (value: ProfileFriendsListShare) => {
      if (friendsListShare === value || savingKey) return;
      setSavingKey('friendsListShare');
      setMessage(null);
      const previous = friendsListShare;
      setFriendsListShare(value);
      try {
        const next = await updateMeProfileFieldPrivacy({ friendsListShare: value });
        applyPrivacyResponse(next, {
          setSettings,
          setDateOfBirthShare,
          setFriendsListShare,
          setFindCrewVisibility,
        });
        setMessage('Saved.');
      } catch {
        setFriendsListShare(previous);
        setMessage('Could not save. Try again.');
      } finally {
        setSavingKey(null);
      }
    },
    [friendsListShare, savingKey]
  );

  const saveFindCrewVisibility = useCallback(
    async (value: FindCrewVisibility) => {
      if (findCrewVisibility === value || savingKey) return;
      setSavingKey('findCrewVisibility');
      setMessage(null);
      const previous = findCrewVisibility;
      setFindCrewVisibility(value);
      try {
        const next = await updateMeProfileFieldPrivacy({ findCrewVisibility: value });
        applyPrivacyResponse(next, {
          setSettings,
          setDateOfBirthShare,
          setFriendsListShare,
          setFindCrewVisibility,
        });
        setMessage('Saved.');
      } catch {
        setFindCrewVisibility(previous);
        setMessage('Could not save. Try again.');
      } finally {
        setSavingKey(null);
      }
    },
    [findCrewVisibility, savingKey]
  );

  const intro = (
    <p className={`text-xs leading-relaxed text-neutral-600 ${embedded ? 'mb-3' : 'mt-1'}`}>
      Choose what appears on your member card for{' '}
      <span className="font-medium text-neutral-800">all signed-in members</span>,{' '}
      <span className="font-medium text-neutral-800">friends of friends</span>, or{' '}
      <span className="font-medium text-neutral-800">friends and outing crew</span>. Guests must always sign in
      first. Sensitive fields default to private.
    </p>
  );

  const fields = (
    <div className={embedded ? 'space-y-5' : 'mt-4 space-y-5'}>
        <section>
          <h3 className="mb-2 px-1 text-sm font-bold text-neutral-800">Birth date on card</h3>
          <div className="flex flex-col gap-2 rounded-xl bg-neutral-50/80 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:border sm:border-neutral-100">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900">Date of birth</p>
              <p className="text-xs text-neutral-500">{PROFILE_DATE_OF_BIRTH_SHARE_HINT}</p>
            </div>
            <AppSelect
              className="w-full sm:w-56"
              size="compact"
              aria-label="Date of birth visibility"
              value={dateOfBirthShare}
              disabled={savingKey === 'dateOfBirthShare'}
              options={DOB_OPTIONS}
              onChange={(value) => void saveDateOfBirthShare(value)}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-2 px-1 text-sm font-bold text-neutral-800">Connections</h3>
          <div className="flex flex-col gap-2 rounded-xl bg-neutral-50/80 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:border sm:border-neutral-100">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900">Friends list on profile</p>
              <p className="text-xs text-neutral-500">{PROFILE_FRIENDS_LIST_SHARE_HINT}</p>
            </div>
            <AppSelect
              className="w-full sm:w-56"
              size="compact"
              aria-label="Friends list visibility"
              value={friendsListShare}
              disabled={savingKey === 'friendsListShare'}
              options={FRIENDS_LIST_OPTIONS}
              onChange={(value) => void saveFriendsListShare(value as ProfileFriendsListShare)}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-2 px-1 text-sm font-bold text-neutral-800">Find crew</h3>
          <div className="flex flex-col gap-2 rounded-xl bg-neutral-50/80 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:border sm:border-neutral-100">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900">Who can find you</p>
              <p className="text-xs text-neutral-500">{FIND_CREW_VISIBILITY_HINT}</p>
            </div>
            <AppSelect
              className="w-full sm:w-56"
              size="compact"
              aria-label="Find crew visibility"
              value={findCrewVisibility}
              disabled={savingKey === 'findCrewVisibility'}
              options={FIND_CREW_OPTIONS}
              onChange={(value) => void saveFindCrewVisibility(value as FindCrewVisibility)}
            />
          </div>
        </section>

        {PROFILE_FIELD_PRIVACY_GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="mb-2 px-1 text-sm font-bold text-neutral-800">{group.title}</h3>
            <ul className="space-y-3">
              {group.rows.map((row) => (
                <li
                  key={row.key}
                  className="flex flex-col gap-2 rounded-xl bg-neutral-50/80 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:border sm:border-neutral-100"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">{row.label}</p>
                    <p className="text-xs text-neutral-500">{row.hint}</p>
                  </div>
                  <AppSelect
                    className="w-full sm:w-52"
                    size="compact"
                    aria-label={`${row.label} visibility`}
                    value={settings[row.key]}
                    disabled={savingKey === row.key}
                    options={AUDIENCE_OPTIONS}
                    onChange={(value) => void saveField(row.key, value)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );

  const messageLine = message ? <p className="mt-2 text-xs text-emerald-700">{message}</p> : null;

  if (embedded) {
    return (
      <div className="min-w-0">
        {intro}
        {fields}
        {messageLine}
      </div>
    );
  }

  return (
    <GlassCard padding>
      <h2 className="text-sm font-semibold text-neutral-900">Field visibility</h2>
      {intro}
      {fields}
      {messageLine}
    </GlassCard>
  );
};

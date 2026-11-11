import { FormEvent, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { updateMeProfile } from '../hooks/memberProfileApi';
import { useMeProfile } from '../hooks/useMeProfile';
import { meProfileQueryKey, participantHubQueryKey } from '../hooks/clientQueryKeys';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { AppButton } from '../components/mobile/AppButton';
import { AppSelect } from '../components/ui/AppSelect';
import {
  USER_CITY_OPTIONS,
  USER_COUNTRY_OPTIONS,
  type UserCity,
  type UserCountryCode,
  type UserGender,
} from '../constants/userProfileOptions';
import { SignupLanguagePicker } from '../components/signup/SignupLanguagePicker';
import { formatLanguages, parseLanguagesList } from '../utils/profileLanguages';
import {
  formatDisplayNameFromParts,
  sanitizePersonNameInput,
  splitUndelimitedDisplayName,
  validatePersonName,
} from '../utils/personName';
import { meProfileSignupGateKey } from '../utils/signupProfileGate';
import { useProfileHubBackChrome } from '../hooks/useProfileHubBackChrome';
import { PROFILE_PATH } from '../config/routingCatalog';
import { navigateBack } from '../utils/backStack';
import type { MobileBackNavState } from '../utils/mobileBackNav';
import { ProfileFormDivider, ProfileFormField } from '../components/profile/ProfileFormSection';
import { ProfileGenderField } from '../components/profile/ProfileGenderField';
import { ProfileDateOfBirthDisplay } from '../components/profile/ProfileDateOfBirthDisplay';

type ProfileEditLocationState = MobileBackNavState & {
  profileEditFocus?: 'bio' | 'languages';
};

const nameInputClass = 'ios-input text-[16px]';

export const ProfileEdit = () => {
  const backChrome = useProfileHubBackChrome();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const { profile, loading } = useMeProfile();
  const hydratedRef = useRef(false);
  const bioFieldRef = useRef<HTMLDivElement>(null);
  const languagesFieldRef = useRef<HTMLDivElement>(null);
  const editFocus = (location.state as ProfileEditLocationState | null)?.profileEditFocus;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [givenName, setGivenName] = useState('');
  const [surname, setSurname] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<UserGender | ''>('');
  const [countryCode, setCountryCode] = useState<UserCountryCode | ''>('');
  const [city, setCity] = useState<UserCity | ''>('');
  const [languages, setLanguages] = useState<string[]>([]);

  useEffect(() => {
    if (!profile || hydratedRef.current) return;
    const names =
      profile.givenName && profile.surname
        ? { givenName: profile.givenName, surname: profile.surname }
        : splitUndelimitedDisplayName(profile.displayName ?? '');
    setGivenName(names.givenName);
    setSurname(names.surname);
    setBio(profile.bio ?? '');
    setGender(profile.gender ?? '');
    setCountryCode(profile.countryCode ?? (profile.city ? 'AE' : ''));
    setCity(profile.city ?? '');
    setLanguages(parseLanguagesList(profile.languages));
    hydratedRef.current = true;
  }, [profile]);

  useEffect(() => {
    if (!profile || loading || !editFocus) return;
    const target = editFocus === 'bio' ? bioFieldRef.current : languagesFieldRef.current;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const focusable =
      editFocus === 'bio'
        ? target?.querySelector('textarea')
        : target?.querySelector('input[type="search"]');
    if (focusable instanceof HTMLElement) {
      window.setTimeout(() => focusable.focus({ preventScroll: true }), 300);
    }
  }, [profile, loading, editFocus]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const givenErr = validatePersonName(givenName, 'Name');
    if (givenErr) {
      setError(givenErr);
      return;
    }
    const surnameErr = validatePersonName(surname, 'Surname');
    if (surnameErr) {
      setError(surnameErr);
      return;
    }
    if (!gender) {
      setError('Select how you identify.');
      return;
    }
    if (!countryCode) {
      setError('Select your country.');
      return;
    }
    if (countryCode === 'AE' && !city) {
      setError('Select your city or emirate.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const trimmedGiven = givenName.trim();
      const trimmedSurname = surname.trim();
      await updateMeProfile({
        givenName: trimmedGiven,
        surname: trimmedSurname,
        displayName: formatDisplayNameFromParts(trimmedGiven, trimmedSurname),
        bio: bio.trim() || undefined,
        gender,
        countryCode,
        city: countryCode === 'AE' ? city || undefined : undefined,
        languages: languages.length > 0 ? formatLanguages(languages) : undefined,
      });
      await refreshUser();
      if (user?.id) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: meProfileQueryKey(user.id) }),
          queryClient.invalidateQueries({ queryKey: participantHubQueryKey(user.id) }),
          queryClient.invalidateQueries({ queryKey: meProfileSignupGateKey(user.id) }),
        ]);
      }
      navigateBack(navigate, PROFILE_PATH);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const bioLength = bio.length;

  return (
    <ConsumerShell layout="stack" title="Edit profile" showJourney={false} back={backChrome} maxWidth="4xl">
      {loading ? (
        <p className="py-10 text-center text-sm text-neutral-500">Loading…</p>
      ) : (
        <form
          className="mx-auto w-full max-w-lg space-y-3 pb-nav-safe animate-fade-up"
          onSubmit={(e) => void onSubmit(e)}
        >
          <div className="glass-card space-y-4 px-3.5 py-4">
            <div className="grid grid-cols-2 gap-3">
              <ProfileFormField label="First name">
                <input
                  className={nameInputClass}
                  value={givenName}
                  onChange={(e) => setGivenName(sanitizePersonNameInput(e.target.value))}
                  autoComplete="given-name"
                />
              </ProfileFormField>
              <ProfileFormField label="Last name">
                <input
                  className={nameInputClass}
                  value={surname}
                  onChange={(e) => setSurname(sanitizePersonNameInput(e.target.value))}
                  autoComplete="family-name"
                />
              </ProfileFormField>
            </div>

            <ProfileFormDivider />

            <ProfileDateOfBirthDisplay dateOfBirth={profile?.dateOfBirth} />

            <ProfileFormField label="Gender">
              <ProfileGenderField value={gender} onChange={setGender} disabled={saving} />
            </ProfileFormField>

            <div ref={bioFieldRef} id="profile-edit-bio">
              <ProfileFormField
                label="Bio"
                accessory={
                  <span className="text-[11px] font-medium text-neutral-400 tabular-nums">{bioLength}/500</span>
                }
              >
                <textarea
                  className="ios-input min-h-[112px] resize-none text-[15px] leading-relaxed"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                />
              </ProfileFormField>
            </div>

            <ProfileFormDivider />

            <div ref={languagesFieldRef} id="profile-edit-languages">
              <ProfileFormField label="Speaks">
                <SignupLanguagePicker value={languages} onChange={setLanguages} />
              </ProfileFormField>
            </div>

            <ProfileFormDivider />

            <ProfileFormField label="Country">
              <AppSelect
                value={countryCode}
                onChange={(value) => {
                  const next = value as UserCountryCode;
                  setCountryCode(next);
                  if (next !== 'AE') setCity('');
                }}
                placeholder="Select country"
                aria-label="Country"
                options={USER_COUNTRY_OPTIONS}
              />
            </ProfileFormField>
            {countryCode === 'AE' ? (
              <ProfileFormField label="City / emirate">
                <AppSelect
                  value={city}
                  onChange={(value) => setCity(value as UserCity)}
                  placeholder="Select emirate"
                  aria-label="City or emirate"
                  options={USER_CITY_OPTIONS}
                />
              </ProfileFormField>
            ) : null}
          </div>

          {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}

          <AppButton type="submit" fullWidth disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </AppButton>
        </form>
      )}
    </ConsumerShell>
  );
};

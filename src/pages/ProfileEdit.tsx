import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { fetchMeProfile, updateMeProfile } from '../hooks/memberProfileApi';
import { useAuth } from '../context/AuthContext';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { AppButton } from '../components/mobile/AppButton';
import { GlassCard } from '../components/mobile/GlassCard';
import {
  USER_CITY_OPTIONS,
  USER_COUNTRY_OPTIONS,
  USER_GENDER_OPTIONS,
  type UserCity,
  type UserCountryCode,
  type UserGender,
} from '../constants/userProfileOptions';
import { SignupLanguagePicker } from '../components/signup/SignupLanguagePicker';
import { formatLanguages, parseLanguagesList } from '../utils/profileLanguages';
import {
  formatDisplayNameFromParts,
  sanitizePersonNameInput,
  splitLegacyDisplayName,
  validatePersonName,
} from '../utils/personName';
import { meProfileSignupGateKey } from '../utils/signupProfileGate';

export const ProfileEdit = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
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
    void fetchMeProfile()
      .then((p) => {
        const names =
          p.givenName && p.surname
            ? { givenName: p.givenName, surname: p.surname }
            : splitLegacyDisplayName(p.displayName ?? '');
        setGivenName(names.givenName);
        setSurname(names.surname);
        setBio(p.bio ?? '');
        setGender(p.gender ?? '');
        setCountryCode(p.countryCode ?? (p.city ? 'AE' : ''));
        setCity(p.city ?? '');
        setLanguages(parseLanguagesList(p.languages));
      })
      .finally(() => setLoading(false));
  }, []);

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
        await queryClient.invalidateQueries({ queryKey: meProfileSignupGateKey(user.id) });
      }
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ConsumerShell
      layout="stack"
      title="Edit profile"
      showJourney={false}
      back={{ fallbackTo: '/profile', label: 'Profile' }}
    >
      {loading ? (
        <p className="py-10 text-center text-sm text-neutral-500">Loading…</p>
      ) : (
        <form className="space-y-3 pb-nav-safe animate-fade-up" onSubmit={(e) => void onSubmit(e)}>
          <GlassCard padding className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">First name</label>
              <input
                className="ios-input text-[15px]"
                value={givenName}
                onChange={(e) => setGivenName(sanitizePersonNameInput(e.target.value))}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">Last name</label>
              <input
                className="ios-input text-[15px]"
                value={surname}
                onChange={(e) => setSurname(sanitizePersonNameInput(e.target.value))}
                autoComplete="family-name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">Gender</label>
              <div className="grid grid-cols-1 gap-2">
                {USER_GENDER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGender(option.value)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-medium ${
                      gender === option.value
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-neutral-200 bg-neutral-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">Bio</label>
              <textarea
                className="ios-input min-h-[100px] text-[15px]"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                placeholder="A line about what you like to do outside…"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">Speaks</label>
              <SignupLanguagePicker value={languages} onChange={setLanguages} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">Country</label>
              <select
                className="ios-input w-full text-[15px]"
                value={countryCode}
                onChange={(e) => {
                  const next = e.target.value as UserCountryCode | '';
                  setCountryCode(next);
                  if (next !== 'AE') setCity('');
                }}
              >
                <option value="">Select country</option>
                {USER_COUNTRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {countryCode === 'AE' ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-800">City / emirate</label>
                <select
                  className="ios-input w-full text-[15px]"
                  value={city}
                  onChange={(e) => setCity(e.target.value as UserCity)}
                >
                  <option value="">Select emirate</option>
                  {USER_CITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </GlassCard>
          <p className="px-1 text-xs text-neutral-500">
            Birthday is set when you join and cannot be changed here. Update photo from your profile hub.
          </p>
          {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
          <AppButton type="submit" fullWidth disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </AppButton>
        </form>
      )}
    </ConsumerShell>
  );
};

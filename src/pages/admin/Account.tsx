import { FormEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../../components/layout';
import { ADMIN_LINKS } from '../../constants';
import { ADMIN_INPUT_CLASS } from '../../components/ui/AppSelect';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { ProfilePhotoEditorField } from '../../components/account/ProfilePhotoEditorField';
import { DisplayPreferencesSection } from '../../components/profile/DisplayPreferencesSection';
import { useAuth } from '../../context/AuthContext';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import {
  fetchAdminStaffProfile,
  updateAdminStaffProfile,
} from '../../hooks/adminConsoleApi';
import { meProfileQueryKey } from '../../hooks/clientQueryKeys';
import {
  formatDisplayNameFromParts,
  sanitizePersonNameInput,
  splitUndelimitedDisplayName,
  validatePersonName,
} from '../../utils/personName';
import { formatE164Phone, isValidNationalPhone, splitStoredPhone } from '../../utils/phone';

export const Account = () => {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [givenName, setGivenName] = useState('');
  const [surname, setSurname] = useState('');
  const [bio, setBio] = useState('');
  const [dialCode, setDialCode] = useState('+971');
  const [nationalNumber, setNationalNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useSafeAsyncEffect(async (isActive) => {
    setLoading(true);
    setError(null);
    try {
      const profile = await fetchAdminStaffProfile();
      if (!isActive()) return;
      const names =
        profile.givenName && profile.surname
          ? { givenName: profile.givenName, surname: profile.surname }
          : splitUndelimitedDisplayName(profile.displayName ?? user?.displayName ?? '');
      setGivenName(names.givenName);
      setSurname(names.surname);
      setBio(profile.bio ?? '');
      setAvatarUrl(profile.avatarUrl ?? '');
      const phone = splitStoredPhone(profile.phone);
      setDialCode(phone.dial);
      setNationalNumber(phone.national);
    } catch (err) {
      if (isActive()) {
        setError(err instanceof Error ? err.message : 'Could not load account.');
      }
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [user?.displayName]);

  const saveAvatar = async (url: string) => {
    setError(null);
    setSuccess(null);
    try {
      await updateAdminStaffProfile({ avatarUrl: url || undefined });
      setAvatarUrl(url);
      await refreshUser();
      if (user?.id) {
        await queryClient.invalidateQueries({ queryKey: meProfileQueryKey(user.id) });
      }
      setSuccess('Photo saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save photo.');
    }
  };

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
    if (nationalNumber.trim() && !isValidNationalPhone(nationalNumber)) {
      setError('Enter a valid phone number.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const trimmedGiven = givenName.trim();
      const trimmedSurname = surname.trim();
      await updateAdminStaffProfile({
        givenName: trimmedGiven,
        surname: trimmedSurname,
        displayName: formatDisplayNameFromParts(trimmedGiven, trimmedSurname),
        bio: bio.trim() || undefined,
        phone: nationalNumber.trim() ? formatE164Phone(dialCode, nationalNumber) : undefined,
      });
      await refreshUser();
      if (user?.id) {
        await queryClient.invalidateQueries({ queryKey: meProfileQueryKey(user.id) });
      }
      setSuccess('Account saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Account" links={ADMIN_LINKS}>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Account</h2>
          <p className="text-sm text-gray-500 mt-1">
            Staff identity and display on this console. Outing history, privacy, cars, languages, and the rest of your
            member profile are on <span className="font-medium text-gray-700">Switch to visitor</span>.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <>
            <div className="bg-white border rounded-lg p-6 space-y-4">
              <h3 className="font-medium text-gray-900">Photo</h3>
              <ProfilePhotoEditorField
                value={avatarUrl || undefined}
                name={formatDisplayNameFromParts(givenName, surname) || 'Admin'}
                onChange={setAvatarUrl}
                onPhotoCommitted={(url) => void saveAvatar(url)}
                label="Display photo"
              />
            </div>

            <form className="bg-white border rounded-lg p-6 space-y-4" onSubmit={(e) => void onSubmit(e)}>
              <h3 className="font-medium text-gray-900">Profile</h3>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
              {success && <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded">{success}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-1 block">First name</span>
                  <input
                    className={`${ADMIN_INPUT_CLASS} w-full`}
                    value={givenName}
                    onChange={(e) => setGivenName(sanitizePersonNameInput(e.target.value))}
                    autoComplete="given-name"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-1 block">Last name</span>
                  <input
                    className={`${ADMIN_INPUT_CLASS} w-full`}
                    value={surname}
                    onChange={(e) => setSurname(sanitizePersonNameInput(e.target.value))}
                    autoComplete="family-name"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Email</span>
                <input className={`${ADMIN_INPUT_CLASS} w-full bg-gray-50`} value={user?.email ?? ''} readOnly />
              </label>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Phone</p>
                <PhoneInput
                  dialCode={dialCode}
                  nationalNumber={nationalNumber}
                  onDialCodeChange={setDialCode}
                  onNationalNumberChange={setNationalNumber}
                />
              </div>

              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-1 block">Bio</span>
                <textarea
                  className={`${ADMIN_INPUT_CLASS} w-full min-h-[96px]`}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={400}
                />
                <span className="text-xs text-gray-400">{bio.length}/400</span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </form>

            <DisplayPreferencesSection />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

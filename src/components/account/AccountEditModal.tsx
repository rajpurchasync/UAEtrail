import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserProfile } from '../../api/index';
import { DEFAULT_PHONE_DIAL } from '../../constants/phoneCountries';
import type { UserCountryCode, UserGender } from '../../constants/userProfileOptions';
import { AppButton } from '../mobile/AppButton';
import { Dialog } from '../ui/Dialog';
import { PhoneInput } from '../ui/PhoneInput';
import { buildProfileCompletion } from '../../utils/profileCompletion';
import { formatE164Phone, isValidNationalPhone, splitStoredPhone } from '../../utils/phone';
import { formatLanguages, parseLanguagesList } from '../../utils/profileLanguages';
import {
  MemberDetailsEditFields,
  validateMemberDetailsForm,
  type MemberDetailsFormValue,
} from '../profile/MemberDetailsEditFields';
import {
  PERSON_NAME_MAX,
  PERSON_NAME_MIN,
  formatDisplayNameFromParts,
  sanitizePersonNameInput,
  splitLegacyDisplayName,
  validatePersonName,
} from '../../utils/personName';

export interface AccountEditSavePayload {
  givenName: string;
  surname: string;
  displayName: string;
  bio?: string;
  phone?: string;
  dateOfBirth: string;
  gender: UserGender;
  countryCode: UserCountryCode;
  languages: string;
}

interface AccountEditModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  email: string;
  saving: boolean;
  message: string | null;
  onSave: (payload: AccountEditSavePayload) => void | Promise<void>;
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="mb-2 block text-sm font-semibold text-neutral-800">{children}</label>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">{children}</p>
);

export const AccountEditModal = ({
  open,
  onClose,
  profile,
  setProfile,
  email,
  saving,
  message,
  onSave,
}: AccountEditModalProps) => {
  const currentEmail = profile.email ?? email;
  const [phoneDial, setPhoneDial] = useState(DEFAULT_PHONE_DIAL);
  const [phoneNational, setPhoneNational] = useState('');
  const [memberDetails, setMemberDetails] = useState<MemberDetailsFormValue>({
    dateOfBirth: '',
    gender: '',
    countryCode: '',
    languages: [],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [givenName, setGivenName] = useState('');
  const [surname, setSurname] = useState('');

  const completion = useMemo(
    () =>
      buildProfileCompletion({
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        phone: profile.phone,
        dateOfBirth: memberDetails.dateOfBirth,
        gender: memberDetails.gender || null,
        countryCode: memberDetails.countryCode || null,
        languages: memberDetails.languages.length > 0 ? formatLanguages(memberDetails.languages) : null,
      }),
    [
      memberDetails.countryCode,
      memberDetails.dateOfBirth,
      memberDetails.gender,
      memberDetails.languages,
      profile.avatarUrl,
      profile.bio,
      profile.displayName,
      profile.phone,
    ]
  );

  useEffect(() => {
    if (!open) return;
    const parts = splitStoredPhone(profile.phone);
    setPhoneDial(parts.dial);
    setPhoneNational(parts.national);
    setMemberDetails({
      dateOfBirth: profile.dateOfBirth ?? '',
      gender: profile.gender ?? '',
      countryCode: profile.countryCode ?? (profile.city ? 'AE' : ''),
      languages: parseLanguagesList(profile.languages),
    });
    const names = profile.givenName && profile.surname
      ? { givenName: profile.givenName, surname: profile.surname }
      : splitLegacyDisplayName(profile.displayName);
    setGivenName(names.givenName);
    setSurname(names.surname);
    setFormError(null);
  }, [
    open,
    profile.city,
    profile.countryCode,
    profile.dateOfBirth,
    profile.displayName,
    profile.gender,
    profile.givenName,
    profile.languages,
    profile.phone,
    profile.surname,
  ]);

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const givenNameError = validatePersonName(givenName, 'Name');
    if (givenNameError) {
      setFormError(givenNameError);
      return;
    }
    const surnameError = validatePersonName(surname, 'Surname');
    if (surnameError) {
      setFormError(surnameError);
      return;
    }
    const trimmedGiven = givenName.trim();
    const trimmedSurname = surname.trim();
    const displayName = formatDisplayNameFromParts(trimmedGiven, trimmedSurname);

    const memberError = validateMemberDetailsForm(memberDetails);
    if (memberError) {
      setFormError(memberError);
      return;
    }

    let phone: string | undefined;
    if (phoneNational.trim()) {
      if (!isValidNationalPhone(phoneNational)) {
        setFormError('Enter a valid phone number.');
        return;
      }
      phone = formatE164Phone(phoneDial, phoneNational);
    }

    setFormError(null);
    const languages = formatLanguages(memberDetails.languages);
    const payload: AccountEditSavePayload = {
      givenName: trimmedGiven,
      surname: trimmedSurname,
      displayName,
      bio: profile.bio?.trim() || undefined,
      phone,
      dateOfBirth: memberDetails.dateOfBirth,
      gender: memberDetails.gender as UserGender,
      countryCode: memberDetails.countryCode as UserCountryCode,
      languages,
    };
    setProfile((prev) => ({
      ...prev,
      ...payload,
      givenName: trimmedGiven,
      surname: trimmedSurname,
    }));
    await onSave(payload);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit profile"
      variant="form"
      className="!p-0 !max-h-[min(92dvh,720px)]"
    >
      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleProfileSubmit}>
        <div className="shrink-0 border-b border-neutral-100 px-5 pb-4 pt-1">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-neutral-800">Profile {completion.percent}% complete</p>
            <span className="text-xs text-neutral-500">{completion.percent === 100 ? 'All set' : 'Keep going'}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${completion.percent}%` }}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section className="space-y-4">
            <SectionTitle>Basics</SectionTitle>
            <div>
              <FieldLabel>Name</FieldLabel>
              <input
                className="ios-input text-[15px]"
                value={givenName}
                onChange={(event) => setGivenName(sanitizePersonNameInput(event.target.value))}
                placeholder="First name"
                disabled={saving}
                minLength={PERSON_NAME_MIN}
                maxLength={PERSON_NAME_MAX}
                autoComplete="given-name"
              />
            </div>
            <div>
              <FieldLabel>Surname</FieldLabel>
              <input
                className="ios-input text-[15px]"
                value={surname}
                onChange={(event) => setSurname(sanitizePersonNameInput(event.target.value))}
                placeholder="Surname"
                disabled={saving}
                minLength={PERSON_NAME_MIN}
                maxLength={PERSON_NAME_MAX}
                autoComplete="family-name"
              />
            </div>
          </section>

          <section className="space-y-3">
            <SectionTitle>Member details</SectionTitle>
            <p className="text-xs text-neutral-500">Same details you added when signing up.</p>
            <MemberDetailsEditFields
              value={memberDetails}
              onChange={(patch) => setMemberDetails((prev) => ({ ...prev, ...patch }))}
              disabled={saving}
            />
          </section>

          <section className="space-y-3">
            <SectionTitle>About you</SectionTitle>
            <div>
              <FieldLabel>Bio</FieldLabel>
              <textarea
                className="ios-input min-h-[168px] resize-y text-[15px] leading-relaxed"
                value={profile.bio ?? ''}
                onChange={(event) => setProfile((prev) => ({ ...prev, bio: event.target.value }))}
                rows={7}
                maxLength={400}
                placeholder="Tell others about your hiking style, favourite trails, or what you host."
                disabled={saving}
              />
              <p className="mt-1.5 text-right text-xs text-neutral-400">
                {(profile.bio ?? '').length}/400
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <SectionTitle>Contact</SectionTitle>
            <div>
              <FieldLabel>Phone</FieldLabel>
              <PhoneInput
                dialCode={phoneDial}
                nationalNumber={phoneNational}
                onDialCodeChange={setPhoneDial}
                onNationalNumberChange={setPhoneNational}
                disabled={saving}
              />
            </div>
            <p className="text-xs text-neutral-500">
              Email: {currentEmail}.{' '}
              <Link to="/profile/settings" className="font-semibold text-emerald-600" onClick={onClose}>
                Change in Settings
              </Link>
            </p>
          </section>
        </div>

        <div className="shrink-0 space-y-2 border-t border-neutral-100 px-5 pb-[calc(var(--safe-bottom)+16px)] pt-4">
          {formError && <p className="text-sm text-red-600 text-center">{formError}</p>}
          {message && <p className="text-sm text-emerald-700 text-center font-medium">{message}</p>}
          <AppButton type="submit" disabled={saving} fullWidth>
            {saving ? 'Saving…' : 'Save profile'}
          </AppButton>
        </div>
      </form>
    </Dialog>
  );
};

interface AccountSignOutButtonProps {
  onSignOut: () => void;
}

export const AccountSignOutButton = ({ onSignOut, compact = false }: AccountSignOutButtonProps & { compact?: boolean }) => (
  <div className={compact ? 'mt-1 mb-2' : 'mt-5 mb-4'}>
    <button
      type="button"
      onClick={onSignOut}
      className="ios-btn w-full glass text-red-500 min-h-[50px] font-semibold active:bg-red-50/80"
    >
      <span aria-hidden>🚪</span>
      Sign out
    </button>
  </div>
);

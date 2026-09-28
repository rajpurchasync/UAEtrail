import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/index';
import type { UserProfile } from '../../api/types';
import { USER_COUNTRY_LABELS, USER_GENDER_OPTIONS } from '../../constants/userProfileOptions';
import { useAuth } from '../../context/AuthContext';
import { AppButton } from '../mobile/AppButton';
import { GlassCard } from '../mobile/GlassCard';
import { Dialog } from '../ui/Dialog';
import { formatLanguages, parseLanguagesList } from '../../utils/profileLanguages';
import { formatMemberAge, computeAgeFromDateOfBirth } from '../../utils/profileAge';
import { PRODUCT_SIGNUP_STEP_DOB } from '../../content/productNorthStar';
import { meProfileSignupGateKey } from '../../utils/signupProfileGate';
import {
  MemberDetailsEditFields,
  validateMemberDetailsForm,
  type MemberDetailsFormValue,
} from './MemberDetailsEditFields';

interface ProfileMemberDetailsCardProps {
  profile: Pick<UserProfile, 'dateOfBirth' | 'gender' | 'countryCode' | 'city' | 'languages'>;
  onUpdated: () => void | Promise<void>;
}

const genderLabel = (gender: UserProfile['gender']) =>
  USER_GENDER_OPTIONS.find((option) => option.value === gender)?.label ?? null;

export const ProfileMemberDetailsCard = ({ profile, onUpdated }: ProfileMemberDetailsCardProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<MemberDetailsFormValue>({
    dateOfBirth: '',
    gender: '',
    countryCode: '',
    languages: [],
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      dateOfBirth: profile.dateOfBirth ?? '',
      gender: profile.gender ?? '',
      countryCode: profile.countryCode ?? (profile.city ? 'AE' : ''),
      languages: parseLanguagesList(profile.languages),
    });
    setError(null);
  }, [open, profile]);

  const ageLabel = useMemo(() => {
    const dob = profile.dateOfBirth ?? '';
    return dob ? formatMemberAge(computeAgeFromDateOfBirth(dob)) : null;
  }, [profile.dateOfBirth]);

  const countryLabel = profile.countryCode
    ? USER_COUNTRY_LABELS[profile.countryCode]
    : profile.city
      ? USER_COUNTRY_LABELS.AE
      : null;
  const languages = parseLanguagesList(profile.languages);
  const genderText = genderLabel(profile.gender);

  const patchForm = (patch: Partial<MemberDetailsFormValue>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const save = async () => {
    const validationError = validateMemberDetailsForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.updateMeProfile({
        dateOfBirth: form.dateOfBirth,
        gender: form.gender as NonNullable<UserProfile['gender']>,
        countryCode: form.countryCode as NonNullable<UserProfile['countryCode']>,
        languages: formatLanguages(form.languages),
      });
      if (user?.id) {
        await queryClient.invalidateQueries({ queryKey: meProfileSignupGateKey(user.id) });
      }
      setOpen(false);
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save — try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block w-full text-left">
        <GlassCard padding className="transition-opacity active:opacity-90">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-neutral-800">Member details</h3>
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-base shadow-sm ring-1 ring-neutral-200/90"
              aria-hidden
            >
              ✏️
            </span>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">{PRODUCT_SIGNUP_STEP_DOB}</dt>
              <dd className="font-semibold text-neutral-900 text-right">
                {profile.dateOfBirth ? (ageLabel ?? profile.dateOfBirth) : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">Gender</dt>
              <dd className="font-semibold text-neutral-900 text-right">{genderText ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">Based in</dt>
              <dd className="font-semibold text-neutral-900 text-right">{countryLabel ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-neutral-500 mb-1">Languages</dt>
              <dd>
                {languages.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {languages.map((language) => (
                      <span
                        key={language}
                        className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-neutral-400">—</span>
                )}
              </dd>
            </div>
          </dl>
        </GlassCard>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Member details" variant="form">
        <div className="max-h-[min(70dvh,520px)] overflow-y-auto px-1">
          <MemberDetailsEditFields value={form} onChange={patchForm} disabled={saving} />
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <AppButton type="button" className="mt-4" fullWidth disabled={saving} onClick={() => void save()}>
          {saving ? 'Saving…' : 'Save'}
        </AppButton>
      </Dialog>
    </>
  );
};

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  BLOOD_GROUP_VALUES,
  MEDICAL_CONDITIONS_NA,
  type BloodGroup,
} from '@uaetrail/shared-types';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { AppButton } from '../components/mobile/AppButton';
import { AppSelect } from '../components/ui/AppSelect';
import { GlassCard } from '../components/mobile/GlassCard';
import { useMeProfile } from '../hooks/useMeProfile';
import { updateMeMedicalSafetyProfile } from '../hooks/memberProfileApi';
import { useAuth } from '../context/AuthContext';
import { meProfileQueryKey, memberStatusQueryKey } from '../hooks/clientQueryKeys';
import { useProfileHubBackChrome } from '../hooks/useProfileHubBackChrome';
import { navigateWithBackChrome } from '../utils/mobileBackNav';

export const ProfileSettingsSafety = () => {
  const backChrome = useProfileHubBackChrome();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const { profile, loading } = useMeProfile();
  const hydratedRef = useRef(false);

  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>('');
  const [conditionsMode, setConditionsMode] = useState<'na' | 'custom'>('na');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || hydratedRef.current) return;
    setBloodGroup(profile.bloodGroup ?? '');
    const cond = profile.medicalConditions?.trim() ?? '';
    if (cond === MEDICAL_CONDITIONS_NA) {
      setConditionsMode('na');
      setMedicalConditions('');
    } else if (cond) {
      setConditionsMode('custom');
      setMedicalConditions(cond);
    }
    setEmergencyContactName(profile.emergencyContactName ?? '');
    setEmergencyContactPhone(profile.emergencyContactPhone ?? '');
    hydratedRef.current = true;
  }, [profile]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!bloodGroup) {
      setError('Select your blood group.');
      return;
    }
    const conditions =
      conditionsMode === 'na' ? MEDICAL_CONDITIONS_NA : medicalConditions.trim();
    if (!conditions) {
      setError('Describe medical conditions or select N/A.');
      return;
    }
    if (emergencyContactName.trim().length < 2) {
      setError('Enter emergency contact name.');
      return;
    }
    if (emergencyContactPhone.trim().length < 8) {
      setError('Enter a valid emergency phone (include country code, e.g. +971…).');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateMeMedicalSafetyProfile({
        bloodGroup,
        medicalConditions: conditions,
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
      });
      await refreshUser();
      if (user?.id) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: meProfileQueryKey(user.id) }),
          queryClient.invalidateQueries({ queryKey: memberStatusQueryKey(user.id) }),
        ]);
      }
      navigateWithBackChrome(navigate, backChrome);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save safety profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ConsumerShell
      layout="stack"
      title="Safety & emergency"
      showJourney={false}
      back={backChrome}
    >
      {loading ? (
        <p className="py-10 text-center text-sm text-neutral-500">Loading…</p>
      ) : (
        <form className="space-y-3 pb-nav-safe animate-fade-up" onSubmit={(e) => void onSubmit(e)}>
          <p className="px-1 text-sm text-neutral-600">
            Required before you join outings. Hosts see this when you request a spot or RSVP.
          </p>
          <GlassCard padding className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">Blood group</label>
              <AppSelect
                value={bloodGroup}
                onChange={(value) => setBloodGroup(value as BloodGroup)}
                placeholder="Select…"
                aria-label="Blood group"
                options={BLOOD_GROUP_VALUES.map((value) => ({ value, label: value }))}
              />
            </div>
            <div>
              <span className="mb-2 block text-sm font-semibold text-neutral-800">Medical conditions</span>
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    conditionsMode === 'na'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-100 text-neutral-800'
                  }`}
                  onClick={() => setConditionsMode('na')}
                >
                  N/A — none to declare
                </button>
                <button
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    conditionsMode === 'custom'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-100 text-neutral-800'
                  }`}
                  onClick={() => setConditionsMode('custom')}
                >
                  Add details
                </button>
              </div>
              {conditionsMode === 'custom' ? (
                <textarea
                  className="ios-input min-h-[88px] text-[15px]"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="Allergies, asthma, medications hosts should know…"
                  maxLength={500}
                />
              ) : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">Emergency contact name</label>
              <input
                className="ios-input text-[15px]"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-800">Emergency contact phone</label>
              <input
                className="ios-input text-[15px]"
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="+971501234567"
                autoComplete="tel"
              />
            </div>
          </GlassCard>
          {error ? <p className="text-sm text-red-600 px-1">{error}</p> : null}
          <AppButton type="submit" disabled={saving} className="w-full">
            {saving ? 'Saving…' : 'Save safety profile'}
          </AppButton>
          <p className="px-1 text-xs text-neutral-500">
            <button
              type="button"
              className="font-semibold text-emerald-700"
              onClick={() => {
                navigateWithBackChrome(navigate, backChrome);
              }}
            >
              {`Back to ${backChrome.label}`}
            </button>
          </p>
        </form>
      )}
    </ConsumerShell>
  );
};

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronLeft, MapPin, ShoppingBag, User, X } from 'lucide-react';
import type { HostProfileType } from '@uaetrail/shared-types';
import { useAuth } from '../../context/AuthContext';
import { setActiveTenantId } from '../../api/tenant';
import { api } from '../../api/services';
import { COUNTRIES } from '../../constants';
import { DEFAULT_COUNTRY, getRegionsForCountry } from '../../config/regions';
import { PhoneInput } from '../ui/PhoneInput';
import { ImageUpload } from '../ui/ImageUpload';
import type { LocationPrecision } from '../explore/mobileCreateFlow';
import {
  buildBecomeHostFormPrefill,
  buildHostApplicationPayload,
  emptyBecomeHostForm,
  formatHostPhonePreview,
  type BecomeHostFormState,
} from './becomeHostForm';
import {
  getHostFlowSteps,
  hostFlowIntentProfileType,
  hostFlowPickSubtitle,
  hostFlowStepTitle,
  hostFlowSubmitLabel,
  hostFlowTitle,
  locationPickerTitle,
  maxDateOfBirthForHost,
  PROFILE_TYPE_OPTIONS,
  validateHostFlowStep,
  type HostFlowIntent,
  type HostFlowStep,
  type HostFlowStepId,
} from './becomeHostFlow';
import { useHostGate } from '../../hooks/useHostGate';

const MobileCreateLocationPicker = lazy(() =>
  import('../explore/MobileCreateLocationPicker').then((m) => ({ default: m.MobileCreateLocationPicker }))
);

const SheetHeader = ({
  title,
  onBack,
  onClose,
  showBack,
}: {
  title: string;
  onBack?: () => void;
  onClose: () => void;
  showBack?: boolean;
}) => (
  <div className="relative mb-4 flex items-center justify-between">
    {showBack ? (
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-0.5 text-sm font-semibold text-gray-700"
      >
        <ChevronLeft className="h-5 w-5" />
        Back
      </button>
    ) : (
      <span className="w-14" />
    )}
    <h2 className="absolute left-1/2 max-w-[60%] -translate-x-1/2 truncate text-base font-bold text-gray-900">
      {title}
    </h2>
    <button type="button" onClick={onClose} className="rounded-full p-1.5 text-gray-500" aria-label="Close">
      <X className="h-5 w-5" />
    </button>
  </div>
);

const NextButton = ({
  label = 'Next',
  disabled,
  loading,
  onClick,
}: {
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    disabled={disabled || loading}
    onClick={onClick}
    className="w-full rounded-2xl bg-rose-500 py-4 text-base font-bold text-white shadow-lg shadow-rose-500/25 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {loading ? 'Submitting…' : `${label} →`}
  </button>
);

interface MobileBecomeHostFlowProps {
  open: boolean;
  onClose: () => void;
  onSubmitted?: (tenantId: string | null) => void;
  signInHref: string;
  initialForm?: BecomeHostFormState;
  /** Use absolute positioning when nested inside explore map shell. */
  overlay?: 'fixed' | 'absolute';
  /** How the flow was opened — activity gate uses become-host; menu uses add-shop / add-agency. */
  intent?: HostFlowIntent;
}

export const MobileBecomeHostFlow = ({
  open,
  onClose,
  onSubmitted,
  signInHref,
  initialForm,
  overlay = 'fixed',
  intent = 'become-host',
}: MobileBecomeHostFlowProps) => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { hasGuideProfile, hasAgencyProfile, hasShopProfile } = useHostGate({
    enabled: open && Boolean(user),
  });

  const availableProfileOptions = useMemo(
    () =>
      PROFILE_TYPE_OPTIONS.filter((option) => {
        if (option.key === 'individual') return !hasGuideProfile;
        if (option.key === 'agency') return !hasAgencyProfile;
        if (option.key === 'shop') return !hasShopProfile;
        return true;
      }),
    [hasGuideProfile, hasAgencyProfile, hasShopProfile]
  );

  const [step, setStep] = useState<HostFlowStep>('pick');
  const [selectedType, setSelectedType] = useState<HostProfileType | null>(null);
  const [form, setForm] = useState<BecomeHostFormState>(emptyBecomeHostForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapPrecision, setMapPrecision] = useState<LocationPrecision>('specific');
  const [locationMapOpen, setLocationMapOpen] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);

  const lockedProfileType = hostFlowIntentProfileType(intent);
  const profileType = form.hostProfileType ?? selectedType ?? lockedProfileType;
  const flowSteps = useMemo(
    () => (profileType ? getHostFlowSteps(profileType) : []),
    [profileType]
  );
  const currentStepIndex =
    step !== 'pick' && profileType ? flowSteps.indexOf(step as HostFlowStepId) : -1;

  const patchForm = useCallback((patch: Partial<BecomeHostFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    if (!open) {
      setStep('pick');
      setSelectedType(null);
      setForm(emptyBecomeHostForm());
      setError(null);
      setSubmitting(false);
      setMapPrecision('specific');
      setLocationMapOpen(false);
      return;
    }

    if (!user) {
      navigate(signInHref);
      onClose();
      return;
    }

    if (lockedProfileType) {
      setSelectedType(lockedProfileType);
      setForm((prev) => ({ ...emptyBecomeHostForm(), ...prev, hostProfileType: lockedProfileType }));
      setStep(getHostFlowSteps(lockedProfileType)[0]);
    }

    if (initialForm) {
      setForm(initialForm);
      if (initialForm.hostProfileType) {
        setSelectedType(initialForm.hostProfileType);
        setStep(getHostFlowSteps(initialForm.hostProfileType)[0] ?? 'pick');
      } else if (lockedProfileType) {
        setSelectedType(lockedProfileType);
        setStep(getHostFlowSteps(lockedProfileType)[0]);
      }
      return;
    }

    let disposed = false;
    setPrefillLoading(true);
    Promise.all([api.getMeProfile(), api.getMyHostApplication()])
      .then(([profileRes, appRes]) => {
        if (disposed) return;
        const prefill = buildBecomeHostFormPrefill({
          displayName: profileRes.data.displayName,
          bio: profileRes.data.bio,
          phone: profileRes.data.phone,
          avatarUrl: profileRes.data.avatarUrl,
          application: appRes.data,
        });
        if (lockedProfileType) {
          prefill.hostProfileType = lockedProfileType;
        }
        setForm(prefill);
        if (lockedProfileType) {
          setSelectedType(lockedProfileType);
          setStep(getHostFlowSteps(lockedProfileType)[0]);
        } else if (prefill.hostProfileType) {
          setSelectedType(prefill.hostProfileType);
        }
      })
      .catch(() => {
        if (disposed) return;
        const fallback = buildBecomeHostFormPrefill({ displayName: user.displayName });
        if (lockedProfileType) {
          fallback.hostProfileType = lockedProfileType;
          setSelectedType(lockedProfileType);
          setStep(getHostFlowSteps(lockedProfileType)[0]);
        }
        setForm(fallback);
      })
      .finally(() => {
        if (!disposed) setPrefillLoading(false);
      });

    return () => {
      disposed = true;
    };
  }, [open, user, navigate, signInHref, onClose, initialForm, lockedProfileType]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const goToFirstStep = () => {
    if (!selectedType) return;
    patchForm({ hostProfileType: selectedType });
    setStep(getHostFlowSteps(selectedType)[0]);
    setError(null);
  };

  const goBack = () => {
    if (locationMapOpen) {
      setLocationMapOpen(false);
      setError(null);
      return;
    }
    if (lockedProfileType && step === getHostFlowSteps(lockedProfileType)[0]) {
      onClose();
      setError(null);
      return;
    }
    if (step === 'pick' || currentStepIndex <= 0) {
      setStep('pick');
      setError(null);
      return;
    }
    setStep(flowSteps[currentStepIndex - 1]);
    setError(null);
  };

  const goToStep = (target: HostFlowStepId) => {
    setLocationMapOpen(false);
    setStep(target);
    setError(null);
  };

  const goNext = () => {
    if (!profileType || step === 'pick') return;
    const validation = validateHostFlowStep(step as HostFlowStepId, form);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    if (currentStepIndex >= flowSteps.length - 1) return;
    setStep(flowSteps[currentStepIndex + 1]);
  };

  const handleSubmit = async () => {
    if (!user) return;
    const payload = buildHostApplicationPayload(form);
    if (!payload) {
      setError('Choose how you want to host.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.submitHostApplication(payload);
      const tenantId = res.data.requestedTenantId ?? null;
      if (tenantId) {
        setActiveTenantId(tenantId);
      }
      await refreshUser();
      onSubmitted?.(tenantId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const overlayClass = overlay === 'absolute' ? 'absolute inset-0 z-[1400]' : 'fixed inset-0 z-[1400]';
  const flowTitle = hostFlowTitle(intent, step);
  const stepHeading =
    step !== 'pick' && profileType ? hostFlowStepTitle(step as HostFlowStepId, profileType) : flowTitle;
  const showPickStep = step === 'pick' && !lockedProfileType;

  const locationMapOverlay =
    step === 'location' && locationMapOpen && profileType && profileType !== 'individual' ? (
      <div className={`${overlayClass} z-[1500] bg-neutral-100`}>
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-emerald-50" />}>
          <MobileCreateLocationPicker
            precision={mapPrecision}
            latitude={form.latitude}
            longitude={form.longitude}
            initialZoom={16}
            headerTitle={locationPickerTitle(profileType)}
            confirmLabel="Use this location"
            onPrecisionChange={setMapPrecision}
            onLocationChange={(latitude, longitude) => patchForm({ latitude, longitude })}
            onBack={() => setLocationMapOpen(false)}
            onClose={handleClose}
            onConfirm={() => setLocationMapOpen(false)}
          />
        </Suspense>
      </div>
    ) : null;

  return (
    <>
      {locationMapOverlay}
      {!locationMapOpen && (
      <div className={`${overlayClass} flex flex-col justify-end bg-black/35`}>
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={handleClose} />
      <div className="relative max-h-[min(78dvh,720px)] overflow-y-auto rounded-t-3xl bg-white px-5 pb-[calc(var(--safe-bottom)+4.5rem)] pt-3 shadow-2xl">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-neutral-200" />

        {prefillLoading && (showPickStep || lockedProfileType) && (
          <div className="py-16 text-center text-sm text-gray-500">Loading your profile…</div>
        )}

        {!prefillLoading && showPickStep && (
          <>
            <SheetHeader title={flowTitle} onClose={handleClose} />
            <p className="mb-4 text-sm text-gray-600">{hostFlowPickSubtitle(intent)}</p>
            <div className="space-y-3">
              {availableProfileOptions.map((option) => {
                const active = selectedType === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedType(option.key)}
                    className={`flex w-full items-start gap-3 rounded-2xl border-2 px-4 py-4 text-left transition ${
                      active
                        ? 'border-rose-500 bg-rose-50/60 shadow-sm'
                        : 'border-neutral-200 bg-white hover:border-rose-200'
                    }`}
                  >
                    <span className="text-3xl">{option.emoji}</span>
                    <span>
                      <p className={`text-sm font-bold ${active ? 'text-rose-600' : 'text-gray-900'}`}>
                        {option.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">{option.subtitle}</p>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 pb-2">
              <NextButton disabled={!selectedType} onClick={goToFirstStep} />
            </div>
          </>
        )}

        {step === 'name' && profileType && (
          <>
            <SheetHeader title={flowTitle} showBack onBack={goBack} onClose={handleClose} />
            <p className="mb-3 text-sm font-semibold text-gray-900">{stepHeading}</p>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                {profileType === 'individual' ? 'Full name' : 'Display name'}
              </span>
              <input
                value={profileType === 'individual' ? form.hostDisplayName : form.requestedName}
                onChange={(event) =>
                  patchForm(
                    profileType === 'individual'
                      ? { hostDisplayName: event.target.value }
                      : { requestedName: event.target.value }
                  )
                }
                placeholder={profileType === 'individual' ? 'Your name' : 'Business name'}
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-rose-400"
                maxLength={120}
                autoFocus
              />
            </label>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton
                disabled={
                  !(profileType === 'individual' ? form.hostDisplayName.trim() : form.requestedName.trim())
                }
                onClick={goNext}
              />
            </div>
          </>
        )}

        {step === 'dob' && profileType === 'individual' && (
          <>
            <SheetHeader title={flowTitle} showBack onBack={goBack} onClose={handleClose} />
            <p className="mb-3 text-sm font-semibold text-gray-900">{stepHeading}</p>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Date of birth</span>
              <input
                type="date"
                max={maxDateOfBirthForHost()}
                value={form.dateOfBirth}
                onChange={(event) => patchForm({ dateOfBirth: event.target.value })}
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900"
              />
            </label>
            <p className="mt-2 text-xs text-gray-500">You must be at least 15 years old to host.</p>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!form.dateOfBirth} onClick={goNext} />
            </div>
          </>
        )}

        {step === 'about' && profileType && (
          <>
            <SheetHeader title={flowTitle} showBack onBack={goBack} onClose={handleClose} />
            <p className="mb-3 text-sm font-semibold text-gray-900">{stepHeading}</p>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                {profileType === 'individual' ? 'About me' : 'About your business'}
              </span>
              <textarea
                value={form.bio}
                onChange={(event) => patchForm({ bio: event.target.value })}
                rows={4}
                placeholder="Why do you love the outdoors? What will people get from you?"
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-rose-400"
              />
            </label>
            <p className="mt-2 text-xs text-gray-500">At least 20 characters.</p>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={form.bio.trim().length < 20} onClick={goNext} />
            </div>
          </>
        )}

        {step === 'photo' && profileType && (
          <>
            <SheetHeader title={flowTitle} showBack onBack={goBack} onClose={handleClose} />
            <p className="mb-3 text-sm font-semibold text-gray-900">{stepHeading}</p>
            <ImageUpload
              images={form.profilePhoto ? [form.profilePhoto] : []}
              onChange={(urls) => patchForm({ profilePhoto: urls[0] ?? '' })}
              keyPrefix="host-profiles"
              kind="avatar"
              max={1}
              label=""
              preset="profile"
            />
            {profileType === 'individual' && (
              <p className="mt-2 text-xs text-gray-500">Optional — you can add one later.</p>
            )}
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 flex flex-col gap-2 pb-2">
              {profileType === 'individual' && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    goNext();
                  }}
                  className="w-full rounded-2xl border border-neutral-200 py-3 text-sm font-semibold text-gray-700"
                >
                  Skip for now
                </button>
              )}
              <NextButton
                disabled={profileType !== 'individual' && !form.profilePhoto.trim()}
                onClick={goNext}
              />
            </div>
          </>
        )}

        {step === 'contact' && profileType && (
          <>
            <SheetHeader title={flowTitle} showBack onBack={goBack} onClose={handleClose} />
            <p className="mb-3 text-sm font-semibold text-gray-900">{stepHeading}</p>
            <div className="space-y-4">
              <div>
                <span className="mb-2 block text-sm font-medium text-gray-700">Mobile number</span>
                <PhoneInput
                  dialCode={form.phoneCountryCode}
                  nationalNumber={form.phone}
                  onDialCodeChange={(phoneCountryCode) => patchForm({ phoneCountryCode })}
                  onNationalNumberChange={(phone) => patchForm({ phone })}
                  required
                  disabled={submitting}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Saved as {formatHostPhonePreview(form.phoneCountryCode, form.phone)}.
                </p>
              </div>
              {profileType !== 'individual' && (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">Website (optional)</span>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(event) => patchForm({ website: event.target.value })}
                    placeholder="https://"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-rose-400"
                  />
                </label>
              )}
            </div>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton onClick={goNext} />
            </div>
          </>
        )}

        {step === 'details' && profileType === 'individual' && (
          <>
            <SheetHeader title={flowTitle} showBack onBack={goBack} onClose={handleClose} />
            <p className="mb-3 text-sm font-semibold text-gray-900">{stepHeading}</p>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Nationality</span>
                <select
                  value={form.nationality}
                  onChange={(event) => patchForm({ nationality: event.target.value })}
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900"
                >
                  <option value="">Select</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="mb-2 block text-sm font-medium text-gray-700">Based in (UAE)</span>
                <div className="flex flex-wrap gap-2">
                  {getRegionsForCountry(DEFAULT_COUNTRY).map((region) => {
                    const active = form.residence === region;
                    return (
                      <button
                        key={region}
                        type="button"
                        onClick={() => patchForm({ residence: region })}
                        className={`rounded-full px-3 py-2 text-sm font-semibold ${
                          active ? 'bg-rose-500 text-white' : 'bg-neutral-100 text-gray-800'
                        }`}
                      >
                        {region}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Languages</span>
                <input
                  value={form.languages}
                  onChange={(event) => patchForm({ languages: event.target.value })}
                  placeholder="English, Arabic…"
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-rose-400"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Interests</span>
                <textarea
                  value={form.interests}
                  onChange={(event) => patchForm({ interests: event.target.value })}
                  rows={2}
                  placeholder="Hiking, camping, photography…"
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-rose-400"
                />
              </label>
            </div>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton onClick={goNext} />
            </div>
          </>
        )}

        {step === 'services' && profileType === 'agency' && (
          <>
            <SheetHeader title={flowTitle} showBack onBack={goBack} onClose={handleClose} />
            <p className="mb-3 text-sm font-semibold text-gray-900">{stepHeading}</p>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">What do you offer?</span>
              <textarea
                value={form.services}
                onChange={(event) => patchForm({ services: event.target.value })}
                rows={4}
                placeholder="Desert safaris, guided hikes, team building…"
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-rose-400"
              />
            </label>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!form.services.trim()} onClick={goNext} />
            </div>
          </>
        )}

        {step === 'location' && profileType && profileType !== 'individual' && (
          <>
            <SheetHeader title={flowTitle} showBack onBack={goBack} onClose={handleClose} />
            <p className="mb-3 text-sm font-semibold text-gray-900">{stepHeading}</p>
            <p className="mb-4 text-sm text-gray-600">
              Place your {profileType === 'agency' ? 'agency' : 'shop'} on the map so explorers can find you.
            </p>
            <button
              type="button"
              onClick={() => setLocationMapOpen(true)}
              className="w-full flex items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left hover:border-rose-300"
            >
              <span className="flex items-center gap-2 text-gray-800">
                <MapPin className="h-5 w-5 text-rose-500" />
                <span>
                  <span className="block text-sm font-bold">
                    {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                  </span>
                  <span className="text-xs text-gray-500">Tap to adjust on the map</span>
                </span>
              </span>
              <span className="text-xs font-semibold text-rose-600">Edit</span>
            </button>
            <div className="mt-4">
              <span className="mb-2 block text-sm font-medium text-gray-700">Region (optional)</span>
              <div className="flex flex-wrap gap-2">
                {getRegionsForCountry(DEFAULT_COUNTRY).map((region) => {
                  const active = form.region === region;
                  return (
                    <button
                      key={region}
                      type="button"
                      onClick={() => patchForm({ region })}
                      className={`rounded-full px-3 py-2 text-sm font-semibold ${
                        active ? 'bg-rose-500 text-white' : 'bg-neutral-100 text-gray-800'
                      }`}
                    >
                      {region}
                    </button>
                  );
                })}
              </div>
            </div>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton onClick={goNext} />
            </div>
          </>
        )}

        {step === 'review' && profileType && (
          <>
            <SheetHeader title={flowTitle} showBack onBack={goBack} onClose={handleClose} />
            <p className="mb-3 text-sm font-semibold text-gray-900">{stepHeading}</p>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-gray-700">
              <p className="flex items-center gap-2 font-semibold text-gray-900">
                {profileType === 'individual' ? (
                  <User className="h-4 w-4 text-emerald-600" />
                ) : profileType === 'agency' ? (
                  <Building2 className="h-4 w-4 text-indigo-600" />
                ) : (
                  <ShoppingBag className="h-4 w-4 text-rose-600" />
                )}
                {profileType === 'individual' ? form.hostDisplayName : form.requestedName}
              </p>
              <p className="mt-2 line-clamp-3 text-xs text-gray-600">{form.bio}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5" />
                {profileType === 'individual'
                  ? form.residence || 'UAE'
                  : `${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)}`}
              </p>
              <p className="mt-1 text-xs text-gray-500">{user?.email}</p>
            </div>

            {profileType !== 'individual' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    ['name', 'Name'],
                    ['about', 'About'],
                    ['contact', 'Contact'],
                    ['photo', 'Photo'],
                    ...(profileType === 'agency' ? ([['services', 'Services']] as const) : []),
                    ['location', 'Location'],
                  ] as const
                ).map(([target, label]) => (
                  <button
                    key={target}
                    type="button"
                    onClick={() => goToStep(target)}
                    className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-rose-300"
                  >
                    Edit {label}
                  </button>
                ))}
              </div>
            )}

            <p className="mt-3 text-xs text-gray-500">
              You&apos;ll be ready to host immediately. Admins may review or suspend accounts if needed.
            </p>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton label={hostFlowSubmitLabel(intent)} loading={submitting} onClick={handleSubmit} />
            </div>
          </>
        )}
      </div>
    </div>
      )}
    </>
  );
};

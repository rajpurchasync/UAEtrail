import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronLeft, MapPin, ShoppingBag, User, X } from 'lucide-react';
import type { HostProfileType } from '@uaetrail/shared-types';
import { useAuth } from '../../context/AuthContext';
import { setActiveTenantId } from '../../api/tenant';
import { api } from '../../api/services';
import { COUNTRIES } from '../../constants';
import { DEFAULT_COUNTRY, getRegionsForCountry } from '../../config/regions';
import { MAP_CONFIG } from '../../config/platform';
import { PhoneInput } from '../ui/PhoneInput';
import { AppSelect } from '../ui/AppSelect';
import { ImageUpload } from '../ui/ImageUpload';
import { AppButton } from '../mobile/AppButton';
import type { LocationPrecision } from '../../explore';
import {
  buildBecomeOrganisationFormPrefill,
  buildHostApplicationPayload,
  emptyBecomeOrganisationForm,
  formatOrganisationPhonePreview,
  type BecomeOrganisationFormState,
} from './becomeOrganisationForm';
import {
  getOrganisationFlowSteps,
  hostFlowIntentProfileType,
  organisationFlowPickSubtitle,
  organisationFlowStepTitle,
  organisationFlowSubmitLabel,
  organisationFlowTitle,
  locationPickerTitle,
  PROFILE_TYPE_OPTIONS,
  validateOrganisationFlowStep,
  type OrganisationFlowIntent,
  type OrganisationFlowStep,
  type OrganisationFlowStepId,
} from './becomeOrganisationFlow';
import { useOrganisationGate } from '../../hooks/useOrganisationGate';

const CreatePlacePicker = lazy(() =>
  import('../../explore/ui/CreatePlacePicker').then((m) => ({ default: m.CreatePlacePicker }))
);

const fieldClass =
  'w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';

const FlowHeader = ({
  title,
  onBack,
  onClose,
  showBack,
  stepCounter,
  progressPercent,
}: {
  title: string;
  onBack?: () => void;
  onClose: () => void;
  showBack?: boolean;
  stepCounter?: string | null;
  progressPercent?: number | null;
}) => (
  <div className="shrink-0 border-b border-neutral-100 bg-white/95 backdrop-blur-md">
    <div className="relative flex items-center justify-between px-4 pb-3 pt-safe-plus-2">
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-0.5 text-sm font-semibold text-emerald-700"
        >
          <ChevronLeft className="h-5 w-5" />
          Back
        </button>
      ) : (
        <span className="w-14" />
      )}
      <div className="absolute left-1/2 max-w-[58%] -translate-x-1/2 text-center">
        <h2 className="truncate text-base font-bold text-neutral-900">{title}</h2>
        {stepCounter && (
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">{stepCounter}</p>
        )}
      </div>
      <button type="button" onClick={onClose} className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100" aria-label="Close">
        <X className="h-5 w-5" />
      </button>
    </div>
    {progressPercent != null && (
      <div className="px-4 pb-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${Math.max(8, progressPercent)}%` }}
          />
        </div>
      </div>
    )}
  </div>
);

interface MobileBecomeOrganisationFlowProps {
  open: boolean;
  onClose: () => void;
  onSubmitted?: (tenantId: string | null) => void;
  signInHref: string;
  initialForm?: BecomeOrganisationFormState;
  /** Use absolute positioning when nested inside explore map shell. */
  overlay?: 'fixed' | 'absolute';
  /** How the flow was opened — activity gate uses become-host; menu uses add-shop / add-agency. */
  intent?: OrganisationFlowIntent;
}

export const MobileBecomeOrganisationFlow = ({
  open,
  onClose,
  onSubmitted,
  signInHref,
  initialForm,
  overlay = 'fixed',
  intent = 'become-host',
}: MobileBecomeOrganisationFlowProps) => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { hasGuideProfile, hasAgencyProfile, hasShopProfile } = useOrganisationGate({
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

  const [step, setStep] = useState<OrganisationFlowStep>('pick');
  const [selectedType, setSelectedType] = useState<HostProfileType | null>(null);
  const [form, setForm] = useState<BecomeOrganisationFormState>(emptyBecomeOrganisationForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapPrecision, setMapPrecision] = useState<LocationPrecision>('specific');
  const [locationMapOpen, setLocationMapOpen] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);

  const lockedProfileType = hostFlowIntentProfileType(intent);
  const profileType = form.hostProfileType ?? selectedType ?? lockedProfileType;
  const flowSteps = useMemo(
    () => (profileType ? getOrganisationFlowSteps(profileType, form) : []),
    [profileType, form.shopPresence]
  );
  const currentStepIndex =
    step !== 'pick' && profileType ? flowSteps.indexOf(step as OrganisationFlowStepId) : -1;

  const patchForm = useCallback((patch: Partial<BecomeOrganisationFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    if (!open) {
      setStep('pick');
      setSelectedType(null);
      setForm(emptyBecomeOrganisationForm());
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
      setForm((prev) => ({ ...emptyBecomeOrganisationForm(), ...prev, hostProfileType: lockedProfileType }));
      setStep(getOrganisationFlowSteps(lockedProfileType)[0]);
    }

    if (initialForm) {
      setForm(initialForm);
      if (initialForm.hostProfileType) {
        setSelectedType(initialForm.hostProfileType);
        setStep(getOrganisationFlowSteps(initialForm.hostProfileType)[0] ?? 'pick');
      } else if (lockedProfileType) {
        setSelectedType(lockedProfileType);
        setStep(getOrganisationFlowSteps(lockedProfileType)[0]);
      }
      return;
    }

    let disposed = false;
    setPrefillLoading(true);
    Promise.all([api.getMeProfile(), api.getMyOrganisationApplication()])
      .then(([profileRes, appRes]) => {
        if (disposed) return;
        const prefill = buildBecomeOrganisationFormPrefill({
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
          setStep(getOrganisationFlowSteps(lockedProfileType)[0]);
        } else if (prefill.hostProfileType) {
          setSelectedType(prefill.hostProfileType);
        }
      })
      .catch(() => {
        if (disposed) return;
        const fallback = buildBecomeOrganisationFormPrefill({ displayName: user.displayName });
        if (lockedProfileType) {
          fallback.hostProfileType = lockedProfileType;
          setSelectedType(lockedProfileType);
          setStep(getOrganisationFlowSteps(lockedProfileType)[0]);
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
    setStep(getOrganisationFlowSteps(selectedType)[0]);
    setError(null);
  };

  const goBack = () => {
    if (locationMapOpen) {
      setLocationMapOpen(false);
      setError(null);
      return;
    }
    if (lockedProfileType && step === getOrganisationFlowSteps(lockedProfileType)[0]) {
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

  const goToStep = (target: OrganisationFlowStepId) => {
    setLocationMapOpen(false);
    setStep(target);
    setError(null);
  };

  const goNext = () => {
    if (!profileType || step === 'pick') return;
    const validation = validateOrganisationFlowStep(step as OrganisationFlowStepId, form);
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
      setError('Choose your host type.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.submitOrganisationApplication(payload);
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
  const flowTitle = organisationFlowTitle(intent, step);
  const stepHeading =
    step !== 'pick' && profileType ? organisationFlowStepTitle(step as OrganisationFlowStepId, profileType) : flowTitle;
  const showPickStep = step === 'pick' && !lockedProfileType;
  const stepCounter =
    step !== 'pick' && profileType && currentStepIndex >= 0
      ? `Step ${currentStepIndex + 1} of ${flowSteps.length}`
      : null;
  const progressPercent =
    step !== 'pick' && profileType && flowSteps.length > 0 && currentStepIndex >= 0
      ? ((currentStepIndex + 1) / flowSteps.length) * 100
      : null;

  const locationMapOverlay =
    step === 'location' && locationMapOpen && profileType && profileType !== 'individual' ? (
      <div className={`${overlayClass} z-[1500] bg-neutral-100`}>
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-emerald-50" />}>
          <CreatePlacePicker
            precision={mapPrecision}
            latitude={form.latitude ?? MAP_CONFIG.defaultCenter.lat}
            longitude={form.longitude ?? MAP_CONFIG.defaultCenter.lng}
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
      <div className={`${overlayClass} flex flex-col bg-neutral-50`}>
        {(showPickStep || step !== 'pick' || lockedProfileType) && (
          <FlowHeader
            title={flowTitle}
            onClose={handleClose}
            showBack={step !== 'pick'}
            onBack={goBack}
            stepCounter={stepCounter}
            progressPercent={progressPercent}
          />
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 pb-[calc(var(--safe-bottom)+1rem)]">

        {prefillLoading && (showPickStep || lockedProfileType) && (
          <div className="py-16 text-center text-sm text-neutral-500">Loading your profile…</div>
        )}

        {!prefillLoading && showPickStep && (
          <>
            <p className="mb-4 text-sm leading-relaxed text-neutral-600">{organisationFlowPickSubtitle(intent)}</p>
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
                        ? 'border-emerald-500 bg-emerald-50/70 shadow-sm'
                        : 'border-neutral-200 bg-white hover:border-emerald-200'
                    }`}
                  >
                    <span className="text-3xl">{option.emoji}</span>
                    <span>
                      <p className={`text-sm font-bold ${active ? 'text-emerald-700' : 'text-neutral-900'}`}>
                        {option.title}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">{option.subtitle}</p>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5">
              <AppButton fullWidth disabled={!selectedType} onClick={goToFirstStep}>
                Next
              </AppButton>
            </div>
          </>
        )}

        {step === 'name' && profileType && (
          <>
            <p className="mb-3 text-sm font-semibold text-neutral-900">{stepHeading}</p>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-700">
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
                className={fieldClass}
                maxLength={120}
                autoFocus
              />
            </label>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5">
              <AppButton
                fullWidth
                disabled={
                  !(profileType === 'individual' ? form.hostDisplayName.trim() : form.requestedName.trim())
                }
                onClick={goNext}
              >
                Next
              </AppButton>
            </div>
          </>
        )}

        {step === 'about' && profileType && (
          <>
            <p className="mb-3 text-sm font-semibold text-neutral-900">{stepHeading}</p>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-700">
                {profileType === 'individual' ? 'About me' : 'About your business'}
              </span>
              <textarea
                value={form.bio}
                onChange={(event) => patchForm({ bio: event.target.value })}
                rows={4}
                placeholder="Why do you love the outdoors? What will people get from you?"
                className={fieldClass}
              />
            </label>
            <p className="mt-2 text-xs text-neutral-500">At least 20 characters.</p>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5">
              <AppButton fullWidth disabled={form.bio.trim().length < 20} onClick={goNext}>
                Next
              </AppButton>
            </div>
          </>
        )}

        {step === 'photo' && profileType && (
          <>
            <p className="mb-3 text-sm font-semibold text-neutral-900">{stepHeading}</p>
            <ImageUpload
              images={form.profilePhoto ? [form.profilePhoto] : []}
              onChange={(urls) => patchForm({ profilePhoto: urls[0] ?? '' })}
              keyPrefix="host-profiles"
              kind="avatar"
              max={1}
              label=""
              preset="profile"
            />
            <p className="mt-2 text-xs text-neutral-500">A clear photo helps joiners recognize you on activities.</p>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5">
              <AppButton fullWidth disabled={!form.profilePhoto.trim()} onClick={goNext}>
                Next
              </AppButton>
            </div>
          </>
        )}

        {step === 'contact' && profileType && (
          <>
            <p className="mb-3 text-sm font-semibold text-neutral-900">{stepHeading}</p>
            <div className="space-y-4">
              <div>
                <span className="mb-2 block text-sm font-medium text-neutral-700">Mobile number</span>
                <PhoneInput
                  dialCode={form.phoneCountryCode}
                  nationalNumber={form.phone}
                  onDialCodeChange={(phoneCountryCode) => patchForm({ phoneCountryCode })}
                  onNationalNumberChange={(phone) => patchForm({ phone })}
                  required
                  disabled={submitting}
                />
                <p className="mt-2 text-xs text-neutral-500">
                  Saved as {formatOrganisationPhonePreview(form.phoneCountryCode, form.phone)}.
                </p>
              </div>
              {profileType !== 'individual' && (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-neutral-700">
                    {profileType === 'shop' && form.shopPresence === 'online'
                      ? 'Shop website *'
                      : 'Website (optional)'}
                  </span>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(event) => patchForm({ website: event.target.value })}
                    placeholder="https://"
                    className={fieldClass}
                  />
                </label>
              )}
            </div>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5">
              <AppButton fullWidth onClick={goNext}>
                Next
              </AppButton>
            </div>
          </>
        )}

        {step === 'details' && profileType === 'individual' && (
          <>
            <p className="mb-3 text-sm font-semibold text-neutral-900">{stepHeading}</p>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-700">Nationality</span>
                <AppSelect
                  value={form.nationality}
                  onChange={(nationality) => patchForm({ nationality })}
                  options={COUNTRIES.map((country) => ({ value: country, label: country }))}
                  placeholder="Select"
                  inputClassName={fieldClass}
                  aria-label="Nationality"
                />
              </label>

              <div>
                <span className="mb-2 block text-sm font-medium text-neutral-700">Based in (UAE)</span>
                <div className="flex flex-wrap gap-2">
                  {getRegionsForCountry(DEFAULT_COUNTRY).map((region) => {
                    const active = form.residence === region;
                    return (
                      <button
                        key={region}
                        type="button"
                        onClick={() => patchForm({ residence: region })}
                        className={`rounded-full px-3 py-2 text-sm font-semibold ${
                          active ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-800'
                        }`}
                      >
                        {region}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-700">Languages</span>
                <input
                  value={form.languages}
                  onChange={(event) => patchForm({ languages: event.target.value })}
                  placeholder="English, Arabic…"
                  className={fieldClass}
                />
              </label>
            </div>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5">
              <AppButton fullWidth onClick={goNext}>
                Next
              </AppButton>
            </div>
          </>
        )}

        {step === 'services' && profileType === 'agency' && (
          <>
            <p className="mb-3 text-sm font-semibold text-neutral-900">{stepHeading}</p>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-700">What do you offer?</span>
              <textarea
                value={form.services}
                onChange={(event) => patchForm({ services: event.target.value })}
                rows={4}
                placeholder="Desert safaris, guided hikes, team building…"
                className={fieldClass}
              />
            </label>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5">
              <AppButton fullWidth disabled={!form.services.trim()} onClick={goNext}>
                Next
              </AppButton>
            </div>
          </>
        )}

        {step === 'presence' && profileType === 'shop' && (
          <>
            <p className="mb-3 text-sm font-semibold text-neutral-900">{stepHeading}</p>
            <p className="mb-4 text-sm text-neutral-600">
              Physical stores get a map pin. Online partners appear in the shop list with a link to your website.
            </p>
            <div className="grid gap-3">
              {(
                [
                  {
                    key: 'physical' as const,
                    title: 'Physical store',
                    detail: 'Show on the explore map with directions',
                  },
                  {
                    key: 'online' as const,
                    title: 'Online only',
                    detail: 'Listed as a partner — visitors go to your site',
                  },
                ] as const
              ).map((option) => {
                const active = form.shopPresence === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() =>
                      patchForm({
                        shopPresence: option.key,
                        ...(option.key === 'physical' && form.latitude == null
                          ? {
                              latitude: MAP_CONFIG.defaultCenter.lat,
                              longitude: MAP_CONFIG.defaultCenter.lng,
                            }
                          : option.key === 'online'
                            ? { latitude: null, longitude: null }
                            : {}),
                      })
                    }
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      active ? 'border-emerald-500 bg-emerald-50' : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <p className="text-sm font-bold text-neutral-900">{option.title}</p>
                    <p className="mt-1 text-xs text-neutral-600">{option.detail}</p>
                  </button>
                );
              })}
            </div>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5">
              <AppButton fullWidth disabled={!form.shopPresence} onClick={goNext}>
                Next
              </AppButton>
            </div>
          </>
        )}

        {step === 'location' && profileType && profileType !== 'individual' && !(profileType === 'shop' && form.shopPresence === 'online') && (
          <>
            <p className="mb-3 text-sm font-semibold text-neutral-900">{stepHeading}</p>
            <p className="mb-4 text-sm text-neutral-600">
              {profileType === 'agency'
                ? 'Optional office location for your public agency profile — not shown on the explore map.'
                : 'Pin your store so explorers can find you on the map.'}
            </p>
            <button
              type="button"
              onClick={() => setLocationMapOpen(true)}
              className="w-full flex items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left hover:border-emerald-300"
            >
              <span className="flex items-center gap-2 text-neutral-800">
                <MapPin className="h-5 w-5 text-emerald-600" />
                <span>
                  <span className="block text-sm font-bold">
                    {form.latitude != null && form.longitude != null
                      ? `${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)}`
                      : 'Choose on map'}
                  </span>
                  <span className="text-xs text-neutral-500">Tap to adjust on the map</span>
                </span>
              </span>
              <span className="text-xs font-semibold text-emerald-700">Edit</span>
            </button>
            <div className="mt-4">
              <span className="mb-2 block text-sm font-medium text-neutral-700">Region (optional)</span>
              <div className="flex flex-wrap gap-2">
                {getRegionsForCountry(DEFAULT_COUNTRY).map((region) => {
                  const active = form.region === region;
                  return (
                    <button
                      key={region}
                      type="button"
                      onClick={() => patchForm({ region })}
                      className={`rounded-full px-3 py-2 text-sm font-semibold ${
                        active ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      {region}
                    </button>
                  );
                })}
              </div>
            </div>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5">
              <AppButton fullWidth onClick={goNext}>
                Next
              </AppButton>
            </div>
          </>
        )}

        {step === 'review' && profileType && (
          <>
            <p className="mb-3 text-sm font-semibold text-neutral-900">{stepHeading}</p>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              <p className="flex items-center gap-2 font-semibold text-neutral-900">
                {profileType === 'individual' ? (
                  <User className="h-4 w-4 text-emerald-600" />
                ) : profileType === 'agency' ? (
                  <Building2 className="h-4 w-4 text-indigo-600" />
                ) : (
                  <ShoppingBag className="h-4 w-4 text-amber-600" />
                )}
                {profileType === 'individual' ? form.hostDisplayName : form.requestedName}
              </p>
              <p className="mt-2 line-clamp-3 text-xs text-neutral-600">{form.bio}</p>
              {profileType === 'individual' && form.languages && (
                <p className="mt-2 text-xs text-neutral-600">Languages: {form.languages}</p>
              )}
              <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
                <MapPin className="h-3.5 w-3.5" />
                {profileType === 'individual'
                  ? form.residence || 'UAE'
                  : profileType === 'shop' && form.shopPresence === 'online'
                    ? form.website.trim() || 'Online partner'
                    : form.latitude != null && form.longitude != null
                      ? `${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)}`
                      : form.region || 'UAE'}
              </p>
              <p className="mt-1 text-xs text-neutral-500">{user?.email}</p>
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
                    className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-emerald-300"
                  >
                    Edit {label}
                  </button>
                ))}
              </div>
            )}

            <p className="mt-3 text-xs text-neutral-500">
              You&apos;ll be ready to host immediately. Admins may review or suspend accounts if needed.
            </p>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5">
              <AppButton fullWidth disabled={submitting} onClick={handleSubmit}>
                {submitting ? 'Submitting…' : organisationFlowSubmitLabel(intent)}
              </AppButton>
            </div>
          </>
        )}
      </div>
    </div>
      )}
    </>
  );
};

/** @deprecated Use MobileBecomeOrganisationFlow */
export const MobileBecomeHostFlow = MobileBecomeOrganisationFlow;

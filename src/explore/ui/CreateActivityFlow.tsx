import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Car,
  ChevronLeft,
  Clock3,
  Lock,
  MapPin,
  Mountain,
  Tent,
  Users,
  X,
} from 'lucide-react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { useAuth } from '../../context/AuthContext';
import { useOrganisationGate } from '../../hooks/useOrganisationGate';
import { MobileMonthCalendar } from '../../components/mobile/MobileMonthCalendar';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import {
  buildDateOptions,
  CAPACITY_PRESETS,
  createFlowStepTitle,
  createTitlePlaceholder,
  defaultCapacityForKind,
  emptyCreateActivityDraft,
  formatCapacityLabel,
  getCreateFlowSteps,
  locationPickerConfirmLabel,
  locationPickerHint,
  locationPickerTitle,
  OFFLINE_PRICE_NOTE,
  priceModeLabel,
  priceModeOptions,
  publishCreateActivity,
  ACTIVITY_DIFFICULTY_OPTIONS,
  usesVenueHostFlow,
  VEHICLE_ACCESS_OPTIONS,
  validateDraftStep,
  type AudienceAccess,
  type CreateFlowStepId,
  type JoinMode,
  type LocationPrecision,
  type CreateActivityDraft,
  type CreateActivityKind,
  type TimeMode,
  type ActivityDifficulty,
  type VehicleAccess,
} from './organizeFlow';
import { organizePublishSeed, PARTICIPATION_TOGGLE_QUESTION, type OrganizeComposeKind } from '../compose';
import { MAP_CONFIG } from '../../config/platform';

const CreatePlacePicker = lazy(() =>
  import('./CreatePlacePicker').then((m) => ({ default: m.CreatePlacePicker }))
);

type FlowStep = 'type' | CreateFlowStepId;

const TYPE_OPTIONS: Array<{
  key: CreateActivityKind;
  title: string;
  subtitle: string;
  emoji: string;
}> = [
  { key: 'hiking', title: 'Hiking', subtitle: 'Trails & day hikes', emoji: '🥾' },
  { key: 'camping', title: 'Camping', subtitle: 'Overnight outdoors', emoji: '⛺' },
  { key: 'carpool', title: 'Rideshare', subtitle: 'Share a ride', emoji: '🚗' },
  { key: 'event', title: 'Other Outdoors', subtitle: 'Runs, meetups & more', emoji: '✨' },
];

interface CreateActivityFlowProps {
  open: boolean;
  onClose: () => void;
  onPublished?: (activity: ActivityDTO) => void | Promise<void>;
  onOpenHostApplication?: () => void;
  onBackToIntent?: () => void;
  signInHref: string;
  organizeKind?: OrganizeComposeKind | null;
  demandPrefill?: {
    draft: CreateActivityDraft;
    participantIntentId: string;
  } | null;
}

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
    <h2 className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-900">{title}</h2>
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
    className="w-full rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {loading ? 'Publishing…' : `${label} →`}
  </button>
);

export const CreateActivityFlow = ({
  open,
  onClose,
  onPublished,
  onOpenHostApplication,
  onBackToIntent,
  signInHref,
  organizeKind = null,
  demandPrefill = null,
}: CreateActivityFlowProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canPublish, canHostPaidActivities, tenantId, loading: hostGateLoading } = useOrganisationGate({ enabled: open && Boolean(user) });

  const [step, setStep] = useState<FlowStep>('type');
  const [draft, setDraft] = useState<CreateActivityDraft>(emptyCreateActivityDraft);
  const [selectedKind, setSelectedKind] = useState<CreateActivityKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMonthView, setShowMonthView] = useState(false);
  const [routeMapTarget, setRouteMapTarget] = useState<'from' | 'to' | null>(null);
  const [whereMapOpen, setWhereMapOpen] = useState(false);

  const kind = draft.kind ?? selectedKind;
  const flowSteps = useMemo(
    () => (kind ? getCreateFlowSteps(kind, draft.genericBuddy) : []),
    [kind, draft.genericBuddy]
  );
  const stepTitleOptions = useMemo(
    () => ({ genericBuddy: draft.genericBuddy }),
    [draft.genericBuddy]
  );
  const dateOptions = useMemo(() => buildDateOptions(), []);

  useEffect(() => {
    if (!open) {
      setStep('type');
      setDraft(emptyCreateActivityDraft());
      setSelectedKind(null);
      setError(null);
      setSubmitting(false);
      setShowMonthView(false);
      setRouteMapTarget(null);
      setWhereMapOpen(false);
      return;
    }

    if (demandPrefill?.draft.kind) {
      const prefillKind = demandPrefill.draft.kind;
      setDraft(demandPrefill.draft);
      setSelectedKind(prefillKind);
      setStep(getCreateFlowSteps(prefillKind, demandPrefill.draft.genericBuddy)[0]);
      setError(null);
      setSubmitting(false);
      setShowMonthView(false);
      setRouteMapTarget(null);
      setWhereMapOpen(false);
      return;
    }

    if (organizeKind) {
      const seed = organizePublishSeed(organizeKind);
      const createKind = seed.activityType;
      const nextDraft: CreateActivityDraft = {
        ...emptyCreateActivityDraft(),
        kind: createKind,
        genericBuddy: seed.genericBuddy,
        participationMode: seed.participationMode,
        capacity: defaultCapacityForKind(createKind),
        joinMode: 'open',
      };
      setDraft(nextDraft);
      setSelectedKind(createKind);
      setStep(getCreateFlowSteps(createKind, seed.genericBuddy)[0]);
      setError(null);
      setSubmitting(false);
      setShowMonthView(false);
      setRouteMapTarget(null);
      setWhereMapOpen(false);
      return;
    }

    if (!user) {
      navigate(signInHref);
      onClose();
    }
  }, [open, user, navigate, signInHref, onClose, demandPrefill, organizeKind]);

  const patchDraft = useCallback((patch: Partial<CreateActivityDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    if (!canHostPaidActivities && draft.priceMode === 'paid') {
      patchDraft({ priceMode: 'free', priceAmount: 0 });
    }
  }, [canHostPaidActivities, draft.priceMode, patchDraft]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const goToFirstStep = () => {
    if (!selectedKind) return;
    patchDraft({
      kind: selectedKind,
      capacity: defaultCapacityForKind(selectedKind),
      priceMode: 'free',
      priceAmount: 0,
      joinMode: selectedKind === 'carpool' ? 'open' : draft.joinMode,
    });
    setStep(getCreateFlowSteps(selectedKind)[0]);
  };

  const currentStepIndex = kind && step !== 'type' ? flowSteps.indexOf(step as CreateFlowStepId) : -1;

  const goBack = () => {
    if (routeMapTarget) {
      setRouteMapTarget(null);
      setError(null);
      return;
    }
    if (whereMapOpen) {
      setWhereMapOpen(false);
      setError(null);
      return;
    }
    if (step === 'type' || currentStepIndex <= 0) {
      if (demandPrefill) {
        onClose();
        return;
      }
      if (step === 'type') {
        onBackToIntent?.();
        onClose();
        return;
      }
      setStep('type');
      return;
    }
    setStep(flowSteps[currentStepIndex - 1]);
  };

  const goNext = () => {
    if (!kind || step === 'type') return;
    const validation = validateDraftStep(step as CreateFlowStepId, draft);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    if (currentStepIndex >= flowSteps.length - 1) return;
    setStep(flowSteps[currentStepIndex + 1]);
  };

  const handlePublish = async () => {
    if (!user?.id) return;

    if (hostGateLoading) return;

    if (!canPublish) {
      if (onOpenHostApplication) {
        onOpenHostApplication();
      } else {
        navigate('/become-host');
      }
      onClose();
      return;
    }

    if (!tenantId) {
      setError('Almost there — finish your host profile so you can share this activity.');
      return;
    }

    const validation = validateDraftStep('publish', draft);
    if (validation) {
      setError(validation);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const activity = await publishCreateActivity({
        draft: { ...draft, kind: draft.kind ?? selectedKind },
        tenantId,
        userId: user.id,
        participantIntentId: demandPrefill?.participantIntentId ?? null,
      });
      await onPublished?.(activity);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isPickupMapOpen = step === 'meeting' && whereMapOpen;
  const isDestMapOpen = step === 'to' && routeMapTarget === 'to';
  const isRouteMapOverlay = kind === 'carpool' && step === 'route' && routeMapTarget !== null;
  const isFullScreenLocationStep = isPickupMapOpen || isDestMapOpen || isRouteMapOverlay;

  const hasFromPin = draft.latitude != null && draft.longitude != null;
  const hasToPin = draft.toLatitude != null && draft.toLongitude != null;

  if (!open) return null;

  if ((isFullScreenLocationStep || isRouteMapOverlay) && kind) {
    const isToStep = isRouteMapOverlay
      ? routeMapTarget === 'to'
      : step === 'to';
    const lat = isToStep
      ? draft.toLatitude ?? MAP_CONFIG.exploreDefaultCenter.lat
      : draft.latitude ?? MAP_CONFIG.exploreDefaultCenter.lat;
    const lng = isToStep
      ? draft.toLongitude ?? MAP_CONFIG.exploreDefaultCenter.lng
      : draft.longitude ?? MAP_CONFIG.exploreDefaultCenter.lng;
    const mapEndpoint: 'from' | 'to' = isToStep ? 'to' : 'from';
    const mapStep: CreateFlowStepId = step as CreateFlowStepId;

    return (
      <div className="absolute inset-0 z-[1400] bg-neutral-100">
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-emerald-50" />}>
          <CreatePlacePicker
            precision={draft.locationPrecision}
            latitude={lat}
            longitude={lng}
            headerTitle={locationPickerTitle(mapStep, kind, mapEndpoint, stepTitleOptions)}
            confirmLabel={locationPickerConfirmLabel(kind, mapStep, mapEndpoint)}
            hint={locationPickerHint(kind, draft.locationPrecision)}
            onPrecisionChange={(locationPrecision: LocationPrecision) => patchDraft({ locationPrecision })}
            onLocationChange={(latitude, longitude) => {
              if (isToStep) {
                patchDraft({ toLatitude: latitude, toLongitude: longitude });
              } else {
                patchDraft({ latitude, longitude });
              }
            }}
            onBack={goBack}
            onClose={handleClose}
            onConfirm={() => {
              if (isRouteMapOverlay || isDestMapOpen) {
                setRouteMapTarget(null);
                setError(null);
                return;
              }
              if (isPickupMapOpen) {
                setWhereMapOpen(false);
                setError(null);
                return;
              }
              goNext();
            }}
          />
        </Suspense>
      </div>
    );
  }

  const stepTitle =
    step === 'type' || !kind
      ? demandPrefill
        ? 'Host this activity'
        : 'Organize'
      : createFlowStepTitle(step as CreateFlowStepId, kind, stepTitleOptions);

  const renderRoutePicker = (endpoint: 'from' | 'to') => {
    const isTo = endpoint === 'to';
    const placed = isTo ? hasToPin : hasFromPin;
    const lat = isTo ? draft.toLatitude : draft.latitude;
    const lng = isTo ? draft.toLongitude : draft.longitude;

    return (
      <button
        key={endpoint}
        type="button"
        onClick={() => setRouteMapTarget(endpoint)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left hover:border-emerald-300"
      >
        <span className="flex items-center gap-2 text-gray-800">
          <MapPin className={`h-5 w-5 ${isTo ? 'text-sky-500' : 'text-emerald-600'}`} />
          <span>
            <span className="block text-sm font-bold">{isTo ? 'To location' : 'From location'}</span>
            <span className="text-xs text-gray-500">
              {placed ? `${lat?.toFixed(4)}, ${lng?.toFixed(4)}` : 'Tap to choose on map'}
            </span>
          </span>
        </span>
        <span className="text-xs font-semibold text-emerald-700">{placed ? 'Edit' : 'Map'}</span>
      </button>
    );
  };

  return (
    <ExploreResponsiveSheet
      open
      onClose={handleClose}
      panelClassName="max-h-[min(78dvh,720px)] px-5 pb-[calc(var(--safe-bottom)+4.5rem)] pt-1 lg:px-6 lg:pb-6 lg:pt-2"
    >
        {step === 'type' && !demandPrefill && !organizeKind && (
          <>
            <SheetHeader title="I am hosting" showBack onBack={goBack} onClose={handleClose} />
            <div className="grid grid-cols-2 gap-3">
              {TYPE_OPTIONS.map((option) => {
                const active = selectedKind === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedKind(option.key)}
                    className={`rounded-2xl border-2 px-3 py-4 text-left transition ${
                      active
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                        : 'border-neutral-200 bg-white hover:border-emerald-200'
                    }`}
                  >
                    <span className="text-3xl font-emoji">{option.emoji}</span>
                    <p className={`mt-2 text-sm font-bold ${active ? 'text-emerald-700' : 'text-gray-900'}`}>
                      {option.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">{option.subtitle}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 pb-2">
              <NextButton disabled={!selectedKind} onClick={goToFirstStep} />
            </div>
          </>
        )}

        {step === 'route' && kind === 'carpool' && (
          <>
            <SheetHeader title={stepTitle} showBack onBack={goBack} onClose={handleClose} />
            <p className="mb-4 text-sm text-gray-600">Set both pickup and destination on the map.</p>
            <div className="space-y-3">
              {renderRoutePicker('from')}
              {renderRoutePicker('to')}
            </div>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!hasFromPin || !hasToPin} onClick={goNext} />
            </div>
          </>
        )}

        {step === 'title' && kind && (
          <>
            <SheetHeader title={stepTitle} showBack onBack={goBack} onClose={handleClose} />
            <label className="block">
              {!draft.genericBuddy && (
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  {kind === 'event' ? 'Event title' : kind === 'carpool' ? 'Title' : 'Activity title'}
                </span>
              )}
              <input
                value={draft.title}
                onChange={(event) => patchDraft({ title: event.target.value })}
                placeholder={createTitlePlaceholder(kind, stepTitleOptions)}
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
                maxLength={120}
                autoFocus
              />
            </label>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!draft.title.trim()} onClick={goNext} />
            </div>
          </>
        )}

        {step === 'meeting' && kind && (
          <>
            <SheetHeader title={stepTitle} showBack onBack={goBack} onClose={handleClose} />
            {kind === 'carpool' ? (
              <>
                <p className="mb-4 text-sm text-gray-600">Set the pickup meeting point on the map.</p>
                <button
                  type="button"
                  onClick={() => setWhereMapOpen(true)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left hover:border-emerald-300"
                >
                  <span className="flex items-center gap-2 text-gray-800">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <span>
                      <span className="block text-sm font-bold">Meeting point pin</span>
                      <span className="text-xs text-gray-500">
                        {hasFromPin
                          ? `${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
                          : 'Tap to choose on map'}
                      </span>
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">{hasFromPin ? 'Edit' : 'Map'}</span>
                </button>
              </>
            ) : draft.genericBuddy ? (
              <>
                <p className="mb-4 text-sm text-gray-600">Drop a pin for where you&apos;re starting from.</p>
                <button
                  type="button"
                  onClick={() => setWhereMapOpen(true)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left hover:border-emerald-300"
                >
                  <span className="flex items-center gap-2 text-gray-800">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <span>
                      <span className="block text-sm font-bold">Going from</span>
                      <span className="text-xs text-gray-500">
                        {hasFromPin
                          ? `${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
                          : 'Tap to choose on map'}
                      </span>
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">{hasFromPin ? 'Edit' : 'Map'}</span>
                </button>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-600">
                  Set where you&apos;re starting from and an optional meet time.
                </p>
                <button
                  type="button"
                  onClick={() => setWhereMapOpen(true)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left hover:border-emerald-300"
                >
                  <span className="flex items-center gap-2 text-gray-800">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <span>
                      <span className="block text-sm font-bold">Going from</span>
                      <span className="text-xs text-gray-500">
                        {hasFromPin
                          ? `${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
                          : 'Tap to choose on map'}
                      </span>
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">{hasFromPin ? 'Edit' : 'Map'}</span>
                </button>

                <label className="mt-4 block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Extra directions</span>
                  <textarea
                    value={draft.meetingPointInfo}
                    onChange={(event) => patchDraft({ meetingPointInfo: event.target.value })}
                    rows={3}
                    placeholder="e.g. Mall entrance B, look for the green flag, park on the left…"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
                    maxLength={500}
                  />
                  <span className="mt-1 block text-xs text-gray-500">Optional — helps people find the spot.</span>
                </label>

                <label className="mt-4 block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">Meet time</span>
                  <input
                    type="time"
                    value={draft.meetingTime}
                    onChange={(event) =>
                      patchDraft({ meetingTime: event.target.value, timeMode: 'specific', time: event.target.value })
                    }
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base font-semibold text-gray-900"
                  />
                </label>
              </>
            )}
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton
                disabled={
                  !hasFromPin ||
                  (kind !== 'carpool' && !draft.genericBuddy && !draft.meetingTime.trim())
                }
                onClick={goNext}
              />
            </div>
          </>
        )}

        {step === 'to' && kind === 'carpool' && (
          <>
            <SheetHeader title={stepTitle} showBack onBack={goBack} onClose={handleClose} />
            <p className="mb-4 text-sm text-gray-600">Set the destination on the map.</p>
            <button
              type="button"
              onClick={() => setRouteMapTarget('to')}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left hover:border-sky-300"
            >
              <span className="flex items-center gap-2 text-gray-800">
                <MapPin className="h-5 w-5 text-sky-500" />
                <span>
                  <span className="block text-sm font-bold">Destination pin</span>
                  <span className="text-xs text-gray-500">
                    {hasToPin
                      ? `${draft.toLatitude?.toFixed(4)}, ${draft.toLongitude?.toFixed(4)}`
                      : 'Tap to choose on map'}
                  </span>
                </span>
              </span>
              <span className="text-xs font-semibold text-sky-600">{hasToPin ? 'Edit' : 'Map'}</span>
            </button>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!hasToPin} onClick={goNext} />
            </div>
          </>
        )}

        {step === 'where' && kind && (
          <>
            <SheetHeader title={stepTitle} showBack onBack={goBack} onClose={handleClose} />
            <p className="mb-4 text-sm text-gray-600">
              {kind === 'camping'
                ? 'Choose where campers will meet or set up.'
                : 'Choose where participants should meet before the activity starts.'}
            </p>
            <button
              type="button"
              onClick={() => setWhereMapOpen(true)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left hover:border-emerald-300"
            >
              <span className="flex items-center gap-2 text-gray-800">
                <MapPin className="h-5 w-5 text-emerald-600" />
                <span>
                  <span className="block text-sm font-bold">
                    {kind === 'camping' ? 'Camp location' : 'Meeting point'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {hasFromPin
                      ? `${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
                      : 'Tap to choose on map'}
                  </span>
                </span>
              </span>
              <span className="text-xs font-semibold text-emerald-700">{hasFromPin ? 'Edit' : 'Map'}</span>
            </button>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!hasFromPin} onClick={goNext} />
            </div>
          </>
        )}

        {step === 'instructions' && kind && (
          <>
            <SheetHeader title={stepTitle} showBack onBack={goBack} onClose={handleClose} />
            {usesVenueHostFlow(kind) ? (
              <>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">
                    {kind === 'camping' ? 'About this camp' : 'About this event'}
                  </span>
                  <textarea
                    value={draft.description}
                    onChange={(event) => patchDraft({ description: event.target.value })}
                    rows={3}
                    placeholder={
                      kind === 'camping'
                        ? 'What to expect, overnight plan, vibe…'
                        : 'What to expect, schedule highlights, vibe…'
                    }
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
                    maxLength={1200}
                  />
                </label>
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">Mandatory instructions *</span>
                  <textarea
                    value={draft.additionalInstructions}
                    onChange={(event) => patchDraft({ additionalInstructions: event.target.value })}
                    rows={4}
                    placeholder="Safety rules, gear requirements, house rules joiners must accept…"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
                    maxLength={1000}
                  />
                  <span className="mt-1 block text-xs text-gray-500">
                    Joiners must read and agree to these before requesting a spot.
                  </span>
                </label>
                <p className="mt-4 mb-2 text-sm font-semibold text-gray-900">How many spots?</p>
                <div className="flex flex-wrap gap-2">
                  {CAPACITY_PRESETS.map((value) => {
                    const active = draft.capacity === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => patchDraft({ capacity: value })}
                        className={`rounded-full px-4 py-2 text-sm font-bold ${
                          active ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-gray-800'
                        }`}
                      >
                        {formatCapacityLabel(value)}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : kind === 'carpool' ? (
              <>
                <p className="mb-3 text-sm text-gray-600">
                  Riders must read and agree to these instructions before requesting a seat.
                </p>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">Mandatory ride instructions *</span>
                  <textarea
                    value={draft.description}
                    onChange={(event) => patchDraft({ description: event.target.value })}
                    rows={5}
                    placeholder="e.g. Meet at mall entrance, max 1 bag per person, no smoking…"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
                    maxLength={1200}
                  />
                </label>
              </>
            ) : null}
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton
                disabled={
                  (usesVenueHostFlow(kind) && !draft.additionalInstructions.trim()) ||
                  (kind === 'carpool' && !draft.description.trim())
                }
                onClick={goNext}
              />
            </div>
          </>
        )}

        {step === 'when' && kind && (
          <>
            <SheetHeader title={stepTitle} showBack onBack={goBack} onClose={handleClose} />
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {dateOptions.map((option) => {
                const active = draft.date === option.iso;
                return (
                  <button
                    key={option.iso}
                    type="button"
                    onClick={() => patchDraft({ date: option.iso })}
                    className={`flex h-[72px] w-[58px] shrink-0 flex-col items-center justify-center rounded-2xl border-2 text-sm font-semibold ${
                      active
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-neutral-200 bg-neutral-50 text-gray-800'
                    }`}
                  >
                    <span className="text-[11px] font-medium opacity-90">{option.label}</span>
                    <span className="text-xl font-bold leading-none">{option.day}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setShowMonthView((value) => !value)}
              className="mt-3 w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-2.5 text-sm font-semibold text-gray-800"
            >
              {showMonthView ? 'Hide monthly view' : 'Monthly view'}
            </button>
            {showMonthView && (
              <div className="mt-3">
                <MobileMonthCalendar selectedDate={draft.date} onSelectDate={(date) => patchDraft({ date })} />
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              {([
                { key: 'flexible' as TimeMode, title: 'Flexible', subtitle: 'Anytime', icon: CalendarDays },
                { key: 'specific' as TimeMode, title: 'Set time', subtitle: 'Exact start', icon: Clock3 },
              ]).map((option) => {
                const active = draft.timeMode === option.key;
                const Icon = option.icon;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => patchDraft({ timeMode: option.key })}
                    className={`rounded-2xl border-2 px-3 py-4 text-left ${
                      active ? 'border-emerald-600 bg-emerald-50/50' : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-gray-500'}`} />
                    <p className="mt-2 text-sm font-bold text-gray-900">{option.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{option.subtitle}</p>
                  </button>
                );
              })}
            </div>

            {draft.timeMode === 'specific' && (
              <label className="mt-4 block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Start time
                </span>
                <input
                  type="time"
                  value={draft.time}
                  onChange={(event) => patchDraft({ time: event.target.value, meetingTime: event.target.value })}
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base font-semibold text-gray-900"
                />
              </label>
            )}

            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-4 pb-2">
              <NextButton
                disabled={draft.timeMode === 'specific' && !draft.time}
                onClick={goNext}
              />
            </div>
          </>
        )}

        {step === 'spots' && kind && (
          <>
            <SheetHeader title={stepTitle} showBack onBack={goBack} onClose={handleClose} />
            <p className="mb-3 text-sm text-gray-600">
              {kind === 'carpool' ? 'How many seats can you offer?' : 'How many people can join?'}
            </p>
            <div className="flex flex-wrap gap-2">
              {CAPACITY_PRESETS.map((value) => {
                const active = draft.capacity === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => patchDraft({ capacity: value })}
                    className={`rounded-full px-4 py-2 text-sm font-bold ${
                      active ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-gray-800'
                    }`}
                  >
                    {formatCapacityLabel(value)}
                  </button>
                );
              })}
            </div>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton onClick={goNext} />
            </div>
          </>
        )}

        {step === 'transportation' && kind && (usesVenueHostFlow(kind) || kind === 'carpool') && (
          <>
            <SheetHeader title={stepTitle} showBack onBack={goBack} onClose={handleClose} />
            <p className="mb-3 text-sm text-gray-600">
              {kind === 'carpool'
                ? 'What vehicle are you offering and how many seats?'
                : kind === 'camping'
                  ? 'How can people reach the camp?'
                  : 'How can people reach the event?'}
            </p>
            <div className="space-y-3">
              {VEHICLE_ACCESS_OPTIONS.map((option) => {
                const active = draft.vehicleAccess === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => patchDraft({ vehicleAccess: option.value as VehicleAccess })}
                    className={`w-full rounded-2xl border-2 px-4 py-4 text-left ${
                      active ? 'border-emerald-600 bg-emerald-50/50' : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <p className="text-sm font-bold text-gray-900">
                      {kind === 'carpool' && option.value === 'sedan' ? 'Sedan' : option.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {kind === 'carpool'
                        ? option.value === '4x4'
                          ? 'Your ride requires or offers a 4x4'
                          : 'Standard car — sedan or similar'
                        : option.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>

            {kind === 'carpool' ? (
              <>
                <p className="mt-5 mb-2 text-sm font-semibold text-gray-900">Number of seats</p>
                <div className="flex flex-wrap gap-2">
                  {CAPACITY_PRESETS.filter((value) => value <= 8).map((value) => {
                    const active = draft.capacity === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => patchDraft({ capacity: value })}
                        className={`rounded-full px-4 py-2 text-sm font-bold ${
                          active ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-gray-800'
                        }`}
                      >
                        {formatCapacityLabel(value)}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton onClick={goNext} />
            </div>
          </>
        )}

        {step === 'audience' && kind && (
          <>
            <SheetHeader title={stepTitle} showBack onBack={goBack} onClose={handleClose} />
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-gray-900">{PARTICIPATION_TOGGLE_QUESTION}</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: 'approval' as const, title: 'Yes', subtitle: 'They request — you OK' },
                  { key: 'rsvp' as const, title: 'No', subtitle: 'Open — I\'m going' },
                ]).map((option) => {
                  const active = draft.participationMode === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => patchDraft({ participationMode: option.key })}
                      className={`rounded-2xl border-2 px-3 py-3 text-left ${
                        active ? 'border-emerald-600 bg-emerald-50/50' : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <p className="text-sm font-bold text-gray-900">{option.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{option.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            {!draft.genericBuddy && kind !== 'carpool' && (
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: 'open' as JoinMode, title: 'Public', subtitle: 'Listed on the explore map', icon: Users },
                  { key: 'private' as JoinMode, title: 'Private', subtitle: 'Link only — hidden from map', icon: Lock },
                ]).map((option) => {
                  const active = draft.joinMode === option.key;
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => patchDraft({ joinMode: option.key })}
                      className={`rounded-2xl border-2 px-3 py-4 text-left ${
                        active ? 'border-emerald-600 bg-emerald-50/50' : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-gray-500'}`} />
                      <p className="mt-2 text-sm font-bold text-gray-900">{option.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{option.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {!draft.genericBuddy && (draft.joinMode === 'open' || kind === 'carpool') && (
              <div className={`space-y-3 ${kind !== 'carpool' ? 'mt-4' : ''}`}>
                {kind === 'carpool' && (
                  <p className="text-sm text-gray-600">Who can request a seat in your ride?</p>
                )}
                <p className="text-sm font-semibold text-gray-900">Public options</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: 'anyone' as AudienceAccess, label: 'Anyone' },
                    { key: 'women_only' as AudienceAccess, label: 'Women only' },
                    ...(kind === 'event' || kind === 'carpool'
                      ? [{ key: 'others' as AudienceAccess, label: 'Others' }]
                      : []),
                  ]).map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() =>
                        patchDraft({
                          audienceAccess: option.key,
                          audienceOtherNote: option.key === 'others' ? draft.audienceOtherNote : '',
                        })
                      }
                      className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${
                        draft.audienceAccess === option.key
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-neutral-200 text-gray-800'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {(kind === 'event' || kind === 'carpool') && draft.audienceAccess === 'others' && (
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {kind === 'carpool' ? 'Who can join?' : 'Who can attend?'}
                    </span>
                    <input
                      value={draft.audienceOtherNote}
                      onChange={(event) => patchDraft({ audienceOtherNote: event.target.value })}
                      placeholder={
                        kind === 'carpool'
                          ? 'e.g. Colleagues only, same company, no smokers…'
                          : 'e.g. Members only, 18+, experienced runners…'
                      }
                      className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500"
                      maxLength={120}
                    />
                  </label>
                )}
                <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={draft.childrenAllowed}
                    onChange={(event) => patchDraft({ childrenAllowed: event.target.checked })}
                    className="rounded border-gray-300 text-emerald-600"
                  />
                  <span className="text-sm text-gray-800">Children allowed</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={draft.petsAllowed}
                    onChange={(event) => patchDraft({ petsAllowed: event.target.checked })}
                    className="rounded border-gray-300 text-emerald-600"
                  />
                  <span className="text-sm text-gray-800">Pets allowed</span>
                </label>
              </div>
            )}

            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton
                disabled={
                  (draft.joinMode === 'open' || kind === 'carpool') &&
                  draft.audienceAccess === 'others' &&
                  !draft.audienceOtherNote.trim()
                }
                onClick={goNext}
              />
            </div>
          </>
        )}

        {step === 'difficulty' && kind && (
          <>
            <SheetHeader title={stepTitle} showBack onBack={goBack} onClose={handleClose} />
            <div className="space-y-3">
              {ACTIVITY_DIFFICULTY_OPTIONS.map((option) => {
                const active = draft.difficulty === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => patchDraft({ difficulty: option.value as ActivityDifficulty })}
                    className={`w-full rounded-2xl border-2 px-4 py-4 text-left ${
                      active ? 'border-emerald-600 bg-emerald-50/50' : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <p className="text-sm font-bold text-gray-900">{option.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{option.subtitle}</p>
                  </button>
                );
              })}
            </div>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton onClick={goNext} />
            </div>
          </>
        )}

        {step === 'price' && kind && (
          <>
            <SheetHeader title={stepTitle} showBack onBack={goBack} onClose={handleClose} />
            <div className="grid grid-cols-2 gap-2">
              {priceModeOptions(kind, canHostPaidActivities).map((mode) => {
                const active = draft.priceMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() =>
                      patchDraft({
                        priceMode: mode,
                        priceAmount: mode === 'free' ? 0 : draft.priceAmount,
                      })
                    }
                    className={`rounded-2xl border-2 px-3 py-3 text-sm font-bold ${
                      active ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-neutral-200 text-gray-800'
                    }`}
                  >
                    {priceModeLabel(mode, kind)}
                  </button>
                );
              })}
            </div>
            {draft.priceMode !== 'free' && (
              <label className="mt-4 block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {draft.priceMode === 'shared' ? 'AED shared cost' : 'AED amount'}
                </span>
                <input
                  type="number"
                  min={1}
                  value={draft.priceAmount || ''}
                  onChange={(event) => patchDraft({ priceAmount: Number(event.target.value) || 0 })}
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base font-semibold text-gray-900"
                />
              </label>
            )}
            {draft.priceMode === 'shared' && (
              <label className="mt-3 block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  What is this cost shared for?
                </span>
                <textarea
                  value={draft.sharedCostNote}
                  onChange={(event) => patchDraft({ sharedCostNote: event.target.value })}
                  rows={2}
                  placeholder="e.g. Fuel, park entry, shared gear…"
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500"
                />
              </label>
            )}
            {draft.priceMode !== 'free' && (
              <p className="mt-2 text-xs text-gray-500">{OFFLINE_PRICE_NOTE}</p>
            )}
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton onClick={goNext} />
            </div>
          </>
        )}

        {step === 'information' && kind && (
          <>
            <SheetHeader title={stepTitle} showBack onBack={goBack} onClose={handleClose} />
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">About this activity</span>
              <textarea
                value={draft.description}
                onChange={(event) => patchDraft({ description: event.target.value })}
                rows={3}
                placeholder="Tell joiners what to expect — pace, distance, vibe, what makes this activity special…"
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
                maxLength={1200}
              />
              <span className="mt-1 block text-xs text-gray-500">Optional activity information for the listing.</span>
            </label>
            {kind === 'hiking' && (
              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-medium text-gray-700">Mandatory instructions *</span>
                <textarea
                  value={draft.additionalInstructions}
                  onChange={(event) => patchDraft({ additionalInstructions: event.target.value })}
                  rows={4}
                  placeholder="Safety rules, pace, gear, rules joiners must accept…"
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
                  maxLength={1000}
                />
                <span className="mt-1 block text-xs text-gray-500">
                  Joiners must read and agree to these before requesting a spot.
                </span>
              </label>
            )}
            <p className="mt-4 mb-2 text-sm font-semibold text-gray-900">
              {kind === 'carpool' ? 'How many seats?' : 'How many spots?'}
            </p>
            <div className="flex flex-wrap gap-2">
              {CAPACITY_PRESETS.map((value) => {
                const active = draft.capacity === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => patchDraft({ capacity: value })}
                    className={`rounded-full px-4 py-2 text-sm font-bold ${
                      active ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-gray-800'
                    }`}
                  >
                    {formatCapacityLabel(value)}
                  </button>
                );
              })}
            </div>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton
                disabled={kind === 'hiking' && !draft.additionalInstructions.trim()}
                onClick={goNext}
              />
            </div>
          </>
        )}

        {step === 'publish' && kind && (
          <>
            <SheetHeader title={stepTitle} showBack onBack={goBack} onClose={handleClose} />

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">{draft.title}</p>
              <p className="mt-1 text-xs text-gray-500">
                {kind === 'carpool' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-sky-500" />
                    Carpool
                  </span>
                ) : kind === 'camping' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Tent className="h-3.5 w-3.5 text-amber-600" />
                    Camping
                  </span>
                ) : kind === 'event' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-violet-600" />
                    Event
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Mountain className="h-3.5 w-3.5 text-emerald-600" />
                    Hiking
                  </span>
                )}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5" />
                {kind === 'carpool' && hasFromPin && hasToPin
                  ? `From ${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)} → To ${draft.toLatitude?.toFixed(4)}, ${draft.toLongitude?.toFixed(4)}`
                  : kind === 'carpool'
                    ? 'Set from and to on map'
                    : `Pin on map${draft.locationPrecision === 'general' ? ' · general area' : ' · exact spot'}`}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {formatCapacityLabel(draft.capacity)} {kind === 'carpool' ? 'seats' : 'spots'} · {draft.date}
                {draft.meetingTime ? ` · meet ${draft.meetingTime}` : draft.timeMode === 'specific' && draft.time ? ` · ${draft.time}` : ' · flexible time'}
              </p>
              {draft.meetingPointInfo.trim() && (
                <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">Meeting info: </span>
                  {draft.meetingPointInfo}
                </p>
              )}
              {draft.description.trim() && (
                <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">About: </span>
                  {draft.description}
                </p>
              )}
              {(draft.additionalInstructions.trim() || (kind === 'carpool' && draft.description.trim())) && (
                <p className="mt-2 line-clamp-3 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">Mandatory: </span>
                  {kind === 'carpool' ? draft.description : draft.additionalInstructions}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {draft.joinMode === 'private'
                  ? 'Private'
                  : draft.audienceAccess === 'women_only'
                    ? 'Women only'
                    : draft.audienceAccess === 'others'
                      ? draft.audienceOtherNote.trim() || 'Custom audience'
                      : 'Public · anyone'}
                {!draft.childrenAllowed ? ' · no children' : ''}
                {!draft.petsAllowed ? ' · no pets' : ''}
              </p>
              <p className="mt-1 text-xs text-gray-500 capitalize">
                {usesVenueHostFlow(kind) || kind === 'carpool'
                  ? `${draft.vehicleAccess === '4x4' ? '4x4 required' : kind === 'carpool' ? 'Sedan' : 'Sedan access'} · ${priceModeLabel(draft.priceMode, kind)}`
                  : `${draft.difficulty} · ${priceModeLabel(draft.priceMode, kind)}`}
              </p>
            </div>

            {kind !== 'carpool' && draft.joinMode === 'private' && (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Private activities are not shown on the public explore map. Share the activity link with your group after
                publishing.
              </p>
            )}

            {canPublish && draft.joinMode !== 'private' && (
              <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
                Publishing adds your activity to the explore map at the pin you chose. You can manage it from My
                activities.
              </p>
            )}

            {!canPublish && !hostGateLoading && (
              <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                Almost there — a quick intro first so people know who&apos;s hosting. We&apos;ll walk you through it.
              </p>
            )}

            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div className="mt-5 pb-2">
              <NextButton
                label={canPublish ? 'Publish' : 'Introduce yourself first'}
                loading={submitting || hostGateLoading}
                onClick={handlePublish}
              />
            </div>
          </>
        )}
    </ExploreResponsiveSheet>
  );
};

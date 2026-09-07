import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock3,
  Lock,
  MapPin,
  Mountain,
  Tent,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHostGate } from '../../hooks/useHostGate';
import { MobileAgeRangeSlider } from '../mobile/MobileAgeRangeSlider';
import { MobileMonthCalendar } from '../mobile/MobileMonthCalendar';
import {
  buildDateOptions,
  CAPACITY_PRESETS,
  createFlowStepTitle,
  defaultCapacityForKind,
  emptyMobileCreateDraft,
  getCreateFlowSteps,
  locationPickerConfirmLabel,
  locationPickerTitle,
  OFFLINE_PRICE_NOTE,
  priceModeLabel,
  priceModeOptions,
  publishMobileQuickActivity,
  validateDraftStep,
  type CreateFlowStepId,
  type JoinMode,
  type LocationPrecision,
  type MobileCreateDraft,
  type MobileCreateKind,
  type TimeMode,
} from './mobileCreateFlow';
import { MAP_CONFIG } from '../../config/platform';

const MobileCreateLocationPicker = lazy(() =>
  import('./MobileCreateLocationPicker').then((m) => ({ default: m.MobileCreateLocationPicker }))
);

type FlowStep = 'type' | CreateFlowStepId;

const TYPE_OPTIONS: Array<{
  key: MobileCreateKind;
  title: string;
  subtitle: string;
  emoji: string;
}> = [
  { key: 'hiking', title: 'Hiking', subtitle: 'Trails & day hikes', emoji: '🥾' },
  { key: 'camping', title: 'Camping', subtitle: 'Overnight outdoors', emoji: '⛺' },
  { key: 'event', title: 'Events', subtitle: 'Runs, meetups & more', emoji: '🎉' },
  { key: 'carpool', title: 'Carpool', subtitle: 'Share a ride', emoji: '🚗' },
];

interface MobileCreateActivityFlowProps {
  open: boolean;
  onClose: () => void;
  onPublished?: () => void;
  onOpenHostApplication?: () => void;
  onBackToIntent?: () => void;
  signInHref: string;
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
    className="w-full rounded-2xl bg-rose-500 py-4 text-base font-bold text-white shadow-lg shadow-rose-500/25 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {loading ? 'Publishing…' : `${label} →`}
  </button>
);

export const MobileCreateActivityFlow = ({
  open,
  onClose,
  onPublished,
  onOpenHostApplication,
  onBackToIntent,
  signInHref,
}: MobileCreateActivityFlowProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canPublish, canHostPaidActivities, tenantId, loading: hostGateLoading } = useHostGate({ enabled: open && Boolean(user) });

  const [step, setStep] = useState<FlowStep>('type');
  const [draft, setDraft] = useState<MobileCreateDraft>(emptyMobileCreateDraft);
  const [selectedKind, setSelectedKind] = useState<MobileCreateKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMonthView, setShowMonthView] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const kind = draft.kind ?? selectedKind;
  const flowSteps = useMemo(() => (kind ? getCreateFlowSteps(kind) : []), [kind]);
  const dateOptions = useMemo(() => buildDateOptions(), []);

  useEffect(() => {
    if (!open) {
      setStep('type');
      setDraft(emptyMobileCreateDraft());
      setSelectedKind(null);
      setError(null);
      setSubmitting(false);
      setShowMonthView(false);
      setShowMoreOptions(false);
      return;
    }

    if (!user) {
      navigate(signInHref);
      onClose();
    }
  }, [open, user, navigate, signInHref, onClose]);

  const patchDraft = useCallback((patch: Partial<MobileCreateDraft>) => {
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
    });
    setStep(getCreateFlowSteps(selectedKind)[0]);
  };

  const currentStepIndex = kind && step !== 'type' ? flowSteps.indexOf(step as CreateFlowStepId) : -1;

  const goBack = () => {
    if (step === 'type' || currentStepIndex <= 0) {
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
      setError('Set up your host profile before posting.');
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
      await publishMobileQuickActivity({
        draft: { ...draft, kind: draft.kind ?? selectedKind },
        tenantId,
        userId: user.id,
      });
      onPublished?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isLocationStep = step === 'where' || step === 'to';

  if (!open) return null;

  if (isLocationStep && kind) {
    const isToStep = step === 'to';
    const lat = isToStep ? draft.toLatitude ?? MAP_CONFIG.defaultCenter.lat : draft.latitude ?? MAP_CONFIG.defaultCenter.lat;
    const lng = isToStep ? draft.toLongitude ?? MAP_CONFIG.defaultCenter.lng : draft.longitude ?? MAP_CONFIG.defaultCenter.lng;

    return (
      <div className="absolute inset-0 z-[1400] bg-neutral-100">
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-emerald-50" />}>
          <MobileCreateLocationPicker
            precision={draft.locationPrecision}
            latitude={lat}
            longitude={lng}
            headerTitle={locationPickerTitle(step as CreateFlowStepId, kind)}
            confirmLabel={locationPickerConfirmLabel(step as CreateFlowStepId)}
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
            onConfirm={goNext}
          />
        </Suspense>
      </div>
    );
  }

  const stepTitle =
    step === 'type' || !kind ? 'What type?' : createFlowStepTitle(step as CreateFlowStepId, kind);

  return (
    <div className="absolute inset-0 z-[1400] flex flex-col justify-end bg-black/35 pb-[calc(var(--safe-bottom)+72px)]">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={handleClose} />
      <div className="relative max-h-[min(78dvh,720px)] overflow-y-auto rounded-t-3xl bg-white px-5 pb-4 pt-2 shadow-2xl">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-neutral-200" />

        {step === 'type' && (
          <>
            <SheetHeader title="What type?" showBack onBack={goBack} onClose={handleClose} />
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
                        ? 'border-rose-500 bg-rose-50/60 shadow-sm'
                        : 'border-neutral-200 bg-white hover:border-rose-200'
                    }`}
                  >
                    <span className="text-3xl">{option.emoji}</span>
                    <p className={`mt-2 text-sm font-bold ${active ? 'text-rose-600' : 'text-gray-900'}`}>
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

        {step === 'title' && kind && (
          <>
            <SheetHeader title={stepTitle} showBack onBack={goBack} onClose={handleClose} />
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">What are you hosting?</span>
              <input
                value={draft.title}
                onChange={(event) => patchDraft({ title: event.target.value })}
                placeholder="e.g. Sunrise trail run"
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-rose-400"
                maxLength={120}
              />
            </label>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!draft.title.trim()} onClick={goNext} />
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
                        ? 'border-rose-500 bg-rose-500 text-white'
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
                      active ? 'border-rose-500 bg-rose-50/50' : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'text-rose-500' : 'text-gray-500'}`} />
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
                  onChange={(event) => patchDraft({ time: event.target.value })}
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
                      active ? 'bg-rose-500 text-white' : 'bg-neutral-100 text-gray-800'
                    }`}
                  >
                    {value}
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

        {step === 'publish' && kind && (
          <>
            <SheetHeader title={stepTitle} showBack onBack={goBack} onClose={handleClose} />

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">
                {kind === 'carpool' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Car className="h-4 w-4 text-sky-500" />
                    Carpool
                  </span>
                ) : kind === 'camping' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Tent className="h-4 w-4 text-amber-600" />
                    Camping
                  </span>
                ) : kind === 'event' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-violet-600" />
                    {draft.title || 'Event'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Mountain className="h-4 w-4 text-emerald-600" />
                    Hiking
                  </span>
                )}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5" />
                {kind === 'carpool' ? 'From & to pins on map' : 'Pin on map'}
                {draft.locationPrecision === 'general' ? ' · general area' : ' · exact spot'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {draft.capacity} {kind === 'carpool' ? 'seats' : 'spots'} · {draft.date}
              </p>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-gray-900">Price label</p>
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
                        active ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-neutral-200 text-gray-800'
                      }`}
                    >
                      {priceModeLabel(mode, kind)}
                    </button>
                  );
                })}
              </div>
              {draft.priceMode !== 'free' && (
                <label className="mt-3 block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {draft.priceMode === 'shared'
                      ? kind === 'carpool'
                        ? 'AED per seat'
                        : 'AED shared cost'
                      : 'AED amount'}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={draft.priceAmount || ''}
                    onChange={(event) =>
                      patchDraft({ priceAmount: Number(event.target.value) || 0 })
                    }
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base font-semibold text-gray-900"
                    placeholder="0"
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
                    placeholder="e.g. Fuel and Salik, park entry fee, shared camping gear…"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-rose-400"
                  />
                </label>
              )}
              {!canHostPaidActivities && draft.priceMode !== 'paid' && kind !== 'carpool' && (
                <p className="mt-2 text-xs text-gray-500">
                  Individual hosts can post free or shared-cost activities. Paid listings require a business
                  profile (agency or shop).
                </p>
              )}
              {draft.priceMode !== 'free' && (
                <p className="mt-2 text-xs text-gray-500">{OFFLINE_PRICE_NOTE}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowMoreOptions((value) => !value)}
              className="mt-4 flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800"
            >
              More options
              {showMoreOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showMoreOptions && (
              <div className="mt-3 space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <MobileAgeRangeSlider
                  minAge={draft.ageMin}
                  maxAge={draft.ageMax}
                  onChange={(ageMin, ageMax) => patchDraft({ ageMin, ageMax })}
                />
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { key: 'open' as JoinMode, title: 'Open', subtitle: 'Anyone', icon: Users },
                    { key: 'private' as JoinMode, title: 'Private', subtitle: 'Invite only', icon: Lock },
                  ]).map((option) => {
                    const active = draft.joinMode === option.key;
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => patchDraft({ joinMode: option.key })}
                        className={`rounded-2xl border-2 px-3 py-4 text-left ${
                          active ? 'border-rose-500 bg-white' : 'border-neutral-200 bg-white/80'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${active ? 'text-rose-500' : 'text-gray-500'}`} />
                        <p className="mt-2 text-sm font-bold text-gray-900">{option.title}</p>
                        <p className="text-xs text-gray-500">{option.subtitle}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!canPublish && !hostGateLoading && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Set up your host profile before publishing. We&apos;ll walk you through it now.
              </p>
            )}

            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div className="mt-5 pb-2">
              <NextButton
                label={canPublish ? 'Publish' : 'Become a host first'}
                loading={submitting || hostGateLoading}
                onClick={handlePublish}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

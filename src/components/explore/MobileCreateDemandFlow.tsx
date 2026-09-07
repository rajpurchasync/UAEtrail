import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Car,
  ChevronLeft,
  Clock3,
  MapPin,
  Mountain,
  Tent,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MobileMonthCalendar } from '../mobile/MobileMonthCalendar';
import { MAP_CONFIG } from '../../config/platform';
import {
  buildDateOptions,
  DEMAND_PARTY_PRESETS,
  DEMAND_TYPE_OPTIONS,
  demandAreaFieldLabel,
  demandAreaPlaceholder,
  demandAreaTextRequired,
  demandAreaUsesMap,
  demandFlowStepTitle,
  emptyMobileDemandDraft,
  getDemandFlowSteps,
  publishMobileDemandRequest,
  validateDemandDraft,
  validateDemandStep,
  type DemandFlowStepId,
  type MobileDemandDraft,
  type MobileDemandKind,
} from './mobileDemandFlow';
import type { LocationPrecision, TimeMode } from './mobileCreateFlow';

const MobileCreateLocationPicker = lazy(() =>
  import('./MobileCreateLocationPicker').then((m) => ({ default: m.MobileCreateLocationPicker }))
);

type FlowStep = 'type' | DemandFlowStepId;

interface MobileCreateDemandFlowProps {
  open: boolean;
  onClose: () => void;
  onBackToIntent?: () => void;
  onSubmitted?: () => void;
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
  <div className="relative mb-3 flex items-center justify-between">
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
    <h2 className="absolute left-1/2 max-w-[72%] -translate-x-1/2 truncate text-base font-bold text-gray-900">
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
    className="w-full rounded-2xl bg-emerald-500 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {loading ? 'Posting…' : `${label} →`}
  </button>
);

const REVIEW_EDIT_LABELS: Partial<Record<DemandFlowStepId, string>> = {
  area: 'Location',
  when: 'When',
  from: 'From',
  to: 'To',
  persons: 'People',
  comment: 'Comment',
};

export const MobileCreateDemandFlow = ({
  open,
  onClose,
  onBackToIntent,
  onSubmitted,
  signInHref,
}: MobileCreateDemandFlowProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<FlowStep>('type');
  const [draft, setDraft] = useState<MobileDemandDraft>(emptyMobileDemandDraft);
  const [selectedKind, setSelectedKind] = useState<MobileDemandKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMonthView, setShowMonthView] = useState(false);
  const [areaMapOpen, setAreaMapOpen] = useState(false);
  const [fromMapOpen, setFromMapOpen] = useState(false);
  const [toMapOpen, setToMapOpen] = useState(false);

  const kind = draft.kind ?? selectedKind;
  const flowSteps = useMemo(() => (kind ? getDemandFlowSteps(kind) : []), [kind]);
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const currentStepIndex = kind && step !== 'type' ? flowSteps.indexOf(step as DemandFlowStepId) : -1;

  const headerTitle =
    step === 'type' || !kind
      ? 'What are you looking for?'
      : demandFlowStepTitle(step as DemandFlowStepId, kind);

  useEffect(() => {
    if (!open) {
      setStep('type');
      setDraft(emptyMobileDemandDraft());
      setSelectedKind(null);
      setError(null);
      setSubmitting(false);
      setShowMonthView(false);
      setAreaMapOpen(false);
      setFromMapOpen(false);
      setToMapOpen(false);
      return;
    }
    if (!user) {
      navigate(signInHref);
      onClose();
    }
  }, [open, user, navigate, signInHref, onClose]);

  const patchDraft = useCallback((patch: Partial<MobileDemandDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const goToFirstStep = () => {
    if (!selectedKind) return;
    patchDraft({ kind: selectedKind });
    setStep(getDemandFlowSteps(selectedKind)[0]);
    setError(null);
  };

  const goToStep = (target: DemandFlowStepId) => {
    setAreaMapOpen(false);
    setFromMapOpen(false);
    setToMapOpen(false);
    setStep(target);
    setError(null);
  };

  const goBack = () => {
    if (toMapOpen) {
      setToMapOpen(false);
      setError(null);
      return;
    }
    if (fromMapOpen) {
      setFromMapOpen(false);
      setError(null);
      return;
    }
    if (areaMapOpen) {
      setAreaMapOpen(false);
      setError(null);
      return;
    }
    if (step === 'type' || currentStepIndex <= 0) {
      if (step === 'type') {
        onBackToIntent?.();
        onClose();
        return;
      }
      setStep('type');
      setError(null);
      return;
    }
    setStep(flowSteps[currentStepIndex - 1]);
    setError(null);
  };

  const goNext = () => {
    if (!kind || step === 'type') return;
    const validation = validateDemandStep(step as DemandFlowStepId, draft);
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
    const validation = validateDemandDraft({ ...draft, kind: draft.kind ?? selectedKind });
    if (validation) {
      setError(validation);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await publishMobileDemandRequest({ ...draft, kind: draft.kind ?? selectedKind });
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post your request.');
    } finally {
      setSubmitting(false);
    }
  };

  const isMapOverlay =
    (step === 'area' && areaMapOpen) || (step === 'from' && fromMapOpen) || (step === 'to' && toMapOpen);

  if (!open) return null;

  if (isMapOverlay && kind) {
    const isToStep = step === 'to';
    const isFromStep = step === 'from';
    const lat = isToStep
      ? draft.toLatitude ?? MAP_CONFIG.exploreDefaultCenter.lat
      : draft.latitude ?? MAP_CONFIG.exploreDefaultCenter.lat;
    const lng = isToStep
      ? draft.toLongitude ?? MAP_CONFIG.exploreDefaultCenter.lng
      : draft.longitude ?? MAP_CONFIG.exploreDefaultCenter.lng;

    const mapTitle = isToStep ? 'Choose to' : isFromStep ? 'Choose from' : 'Where would you like to go?';

    return (
      <div className="absolute inset-0 z-[1400] bg-neutral-100">
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-emerald-50" />}>
          <MobileCreateLocationPicker
            precision={draft.locationPrecision}
            latitude={lat}
            longitude={lng}
            initialZoom={15}
            headerTitle={mapTitle}
            confirmLabel="Use this location"
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
              if (isToStep) {
                patchDraft({ toPinPlaced: true });
                setToMapOpen(false);
                goNext();
                return;
              }
              if (isFromStep) {
                patchDraft({ fromPinPlaced: true });
                setFromMapOpen(false);
                goNext();
                return;
              }
              patchDraft({ areaPinPlaced: true });
              setAreaMapOpen(false);
            }}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[1400] flex flex-col justify-end bg-black/35 pb-[calc(var(--safe-bottom)+72px)]">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={handleClose} />
      <div className="relative max-h-[min(78dvh,720px)] overflow-y-auto rounded-t-3xl bg-white px-5 pb-4 pt-2 shadow-2xl">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-neutral-200" />

        {step === 'type' && (
          <>
            <SheetHeader title={headerTitle} showBack onBack={goBack} onClose={handleClose} />
            <div className="grid grid-cols-2 gap-3">
              {DEMAND_TYPE_OPTIONS.map((option) => {
                const active = selectedKind === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedKind(option.key)}
                    className={`rounded-2xl border-2 px-3 py-4 text-left transition ${
                      active
                        ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
                        : 'border-neutral-200 bg-white hover:border-emerald-200'
                    }`}
                  >
                    <span className="text-3xl">{option.emoji}</span>
                    <p className={`mt-2 text-sm font-bold ${active ? 'text-emerald-600' : 'text-gray-900'}`}>
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

        {step === 'area' && kind && (
          <>
            <SheetHeader title={headerTitle} showBack onBack={goBack} onClose={handleClose} />
            <label className="block">
              <input
                value={draft.preferredArea}
                onChange={(event) => patchDraft({ preferredArea: event.target.value })}
                placeholder={demandAreaPlaceholder(kind)}
                aria-label={demandAreaFieldLabel(kind)}
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
                maxLength={200}
                autoFocus
              />
            </label>
            {demandAreaUsesMap(kind) && (
              <button
                type="button"
                onClick={() => setAreaMapOpen(true)}
                className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left hover:border-emerald-300"
              >
                <span className="flex items-center gap-2 text-gray-800">
                  <MapPin className="h-5 w-5 text-emerald-500" />
                  <span>
                    <span className="block text-sm font-bold">
                      {draft.areaPinPlaced
                        ? `${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
                        : 'Drop a pin on the map'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {draft.areaPinPlaced ? 'Tap to adjust' : 'Optional — place on map'}
                    </span>
                  </span>
                </span>
                <span className="text-xs font-semibold text-emerald-600">{draft.areaPinPlaced ? 'Edit' : 'Map'}</span>
              </button>
            )}
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton
                disabled={demandAreaTextRequired(kind) && !draft.preferredArea.trim()}
                onClick={goNext}
              />
            </div>
          </>
        )}

        {step === 'when' && kind && (
          <>
            <SheetHeader title={headerTitle} showBack onBack={goBack} onClose={handleClose} />
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {dateOptions.map((option) => {
                const active = draft.date === option.iso;
                return (
                  <button
                    key={option.iso}
                    type="button"
                    onClick={() => patchDraft({ date: option.iso })}
                    className={`flex h-[72px] w-[58px] shrink-0 flex-col items-center justify-center rounded-2xl border-2 text-sm font-semibold ${
                      active ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-neutral-200 bg-neutral-50 text-gray-800'
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
                { key: 'specific' as TimeMode, title: 'Set time', subtitle: 'Exact time', icon: Clock3 },
              ]).map((option) => {
                const active = draft.timeMode === option.key;
                const Icon = option.icon;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => patchDraft({ timeMode: option.key })}
                    className={`rounded-2xl border-2 px-3 py-4 text-left ${
                      active ? 'border-emerald-500 bg-emerald-50/50' : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'text-emerald-500' : 'text-gray-500'}`} />
                    <p className="mt-2 text-sm font-bold text-gray-900">{option.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{option.subtitle}</p>
                  </button>
                );
              })}
            </div>
            {draft.timeMode === 'specific' && (
              <label className="mt-4 block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Time</span>
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
              <NextButton disabled={draft.timeMode === 'specific' && !draft.time} onClick={goNext} />
            </div>
          </>
        )}

        {step === 'from' && kind === 'carpool' && (
          <>
            <SheetHeader title={headerTitle} showBack onBack={goBack} onClose={handleClose} />
            <p className="mb-4 text-sm text-gray-600">Set your pickup point on the map.</p>
            <button
              type="button"
              onClick={() => setFromMapOpen(true)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left hover:border-emerald-300"
            >
              <span className="flex items-center gap-2 text-gray-800">
                <MapPin className="h-5 w-5 text-emerald-500" />
                <span>
                  <span className="block text-sm font-bold">
                    {draft.fromPinPlaced
                      ? `${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
                      : 'Choose starting point'}
                  </span>
                  <span className="text-xs text-gray-500">Tap to open map</span>
                </span>
              </span>
              <span className="text-xs font-semibold text-emerald-600">{draft.fromPinPlaced ? 'Edit' : 'Map'}</span>
            </button>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!draft.fromPinPlaced} onClick={goNext} />
            </div>
          </>
        )}

        {step === 'to' && kind === 'carpool' && (
          <>
            <SheetHeader title={headerTitle} showBack onBack={goBack} onClose={handleClose} />
            <p className="mb-4 text-sm text-gray-600">Set your destination on the map.</p>
            <button
              type="button"
              onClick={() => setToMapOpen(true)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left hover:border-emerald-300"
            >
              <span className="flex items-center gap-2 text-gray-800">
                <MapPin className="h-5 w-5 text-emerald-500" />
                <span>
                  <span className="block text-sm font-bold">
                    {draft.toPinPlaced
                      ? `${draft.toLatitude?.toFixed(4)}, ${draft.toLongitude?.toFixed(4)}`
                      : 'Choose destination'}
                  </span>
                  <span className="text-xs text-gray-500">Tap to open map</span>
                </span>
              </span>
              <span className="text-xs font-semibold text-emerald-600">{draft.toPinPlaced ? 'Edit' : 'Map'}</span>
            </button>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!draft.toPinPlaced} onClick={goNext} />
            </div>
          </>
        )}

        {step === 'persons' && kind && (
          <>
            <SheetHeader title={headerTitle} showBack onBack={goBack} onClose={handleClose} />
            <p className="mb-3 text-sm text-gray-600">Including yourself</p>
            <div className="flex flex-wrap gap-2">
              {DEMAND_PARTY_PRESETS.map((value) => {
                const active = draft.partySize === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => patchDraft({ partySize: value })}
                    className={`rounded-full px-4 py-2 text-sm font-bold ${
                      active ? 'bg-emerald-500 text-white' : 'bg-neutral-100 text-gray-800'
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

        {step === 'comment' && kind && (
          <>
            <SheetHeader title={headerTitle} showBack onBack={goBack} onClose={handleClose} />
            <label className="block">
              <textarea
                value={draft.comment}
                onChange={(event) => patchDraft({ comment: event.target.value })}
                rows={4}
                placeholder="Share pace, gear needs, preferences, or anything others should know…"
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
                maxLength={1000}
              />
            </label>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton onClick={goNext} />
            </div>
          </>
        )}

        {step === 'review' && kind && (
          <>
            <SheetHeader title={headerTitle} showBack onBack={goBack} onClose={handleClose} />
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-gray-700">
              <p className="flex items-center gap-2 font-semibold text-gray-900">
                {kind === 'carpool' ? (
                  <Car className="h-4 w-4 text-sky-500" />
                ) : kind === 'camping' ? (
                  <Tent className="h-4 w-4 text-amber-600" />
                ) : kind === 'hiking' ? (
                  <Mountain className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Users className="h-4 w-4 text-emerald-600" />
                )}
                {DEMAND_TYPE_OPTIONS.find((option) => option.key === kind)?.title ?? kind}
              </p>
              {draft.preferredArea && (
                <p className="mt-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">{demandAreaFieldLabel(kind)}: </span>
                  {draft.preferredArea}
                </p>
              )}
              {draft.date && (
                <p className="mt-1 text-xs text-gray-500">
                  {draft.date}
                  {draft.timeMode === 'specific' && draft.time ? ` · ${draft.time}` : ' · flexible time'}
                </p>
              )}
              {kind === 'carpool' && draft.fromPinPlaced && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5" />
                  From: {draft.latitude?.toFixed(4)}, {draft.longitude?.toFixed(4)}
                </p>
              )}
              {kind === 'carpool' && draft.toPinPlaced && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5" />
                  To: {draft.toLatitude?.toFixed(4)}, {draft.toLongitude?.toFixed(4)}
                </p>
              )}
              {draft.areaPinPlaced && kind !== 'carpool' && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5" />
                  Map pin: {draft.latitude?.toFixed(4)}, {draft.longitude?.toFixed(4)}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">{draft.partySize} people</p>
              <p className="mt-2 line-clamp-4 text-xs text-gray-600">{draft.comment}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {flowSteps
                .filter((target) => target !== 'review')
                .map((target) => {
                  const editLabel =
                    target === 'area'
                      ? kind === 'event'
                        ? 'Activity'
                        : kind === 'guide'
                          ? 'Details'
                          : 'Location'
                      : REVIEW_EDIT_LABELS[target] ?? target;
                  return (
                    <button
                      key={target}
                      type="button"
                      onClick={() => goToStep(target)}
                      className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-emerald-300"
                    >
                      Edit {editLabel}
                    </button>
                  );
                })}
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Check everything looks right before posting. Your request will be visible to hosts and other explorers.
            </p>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton label="Post request" loading={submitting} onClick={handleSubmit} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

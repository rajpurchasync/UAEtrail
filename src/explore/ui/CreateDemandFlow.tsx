import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Car,
  Clock3,
  MapPin,
  Mountain,
  Tent,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MobileMonthCalendar } from '../../components/mobile/MobileMonthCalendar';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import { FlowSheetChrome } from './ExploreFlowSheetChrome';
import { FlowStepTextArea, FlowStepTextInput } from './useFlowSheetPrimaryFieldFocus';
import { EXPLORE_FLOW } from '../../config/exploreTheme';
import { MAP_CONFIG } from '../../config/platform';
import { EXPLORE_Z } from '../../config/exploreTheme';
import {
  buildDateOptions,
  buildDemandComment,
  DEMAND_PARTY_PRESETS,
  DEMAND_TYPE_OPTIONS,
  demandAdditionalInfoPlaceholder,
  demandAreaFieldLabel,
  demandAreaPlaceholder,
  demandAreaTextRequired,
  demandAreaUsesMap,
  demandFlowStepTitle,
  demandTitlePlaceholder,
  demandWhenShowsTime,
  emptyDemandDraft,
  getDemandFlowSteps,
  publishDemandRequest,
  usesCampingDemandFlow,
  usesHikingDemandFlow,
  usesEventDemandFlow,
  usesRideshareDemandFlow,
  usesGuidedDemandFlow,
  validateDemandDraft,
  validateDemandStep,
  type DemandFlowStepId,
  type DemandSubmitResult,
  type DemandDraft,
  type DemandKind,
} from './demandFlow';
import type { LocationPrecision, TimeMode } from './organizeFlow';
import type { FindComposeKind } from '../compose';
import { composeFlowIdFromRoute } from '../composeFlowCatalog';
import {
  clearDemandWizardSession,
  readDemandWizardSession,
  writeDemandWizardSession,
} from './composeWizardSession';
import { fromLocationLabel, GOING_FROM_LABEL, TO_LOCATION_LABEL } from '../createFlowCopy';
import {
  DemandRideshareDestinationStepBody,
  DemandDestinationStepBody,
  DemandTransportStepBody,
  DemandAudienceStepBody,
} from './demandWizardSteps';
import { DemandSubmitSuccessSheet } from './DemandSubmitSuccessSheet';
import { EXPLORE_REGION_PILL_LABELS } from '../../config/regions';

const CreatePlacePicker = lazy(() =>
  import('./CreatePlacePicker').then((m) => ({ default: m.CreatePlacePicker }))
);

type FlowStep = 'type' | DemandFlowStepId;

interface CreateDemandFlowProps {
  open: boolean;
  onClose: () => void;
  onBackToIntent?: () => void;
  onSubmitted?: (result: DemandSubmitResult) => void;
  signInHref: string;
  findKind?: FindComposeKind | null;
}

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
  title: 'Title',
  destination: 'Destination',
  area: 'Where',
  when: 'When',
  from: 'Going from',
  to: 'Destination',
  route: 'Route',
  persons: 'People',
  audience: 'Looking for',
  fitness: 'Fitness',
  requirements: 'Requirements',
  transport: 'Transport',
  info: 'Details',
  rideshare: 'Rideshare',
  comment: 'Comment',
};

export const CreateDemandFlow = ({
  open,
  onClose,
  onBackToIntent,
  onSubmitted,
  signInHref,
  findKind = null,
}: CreateDemandFlowProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<FlowStep>('type');
  const [draft, setDraft] = useState<DemandDraft>(emptyDemandDraft);
  const [selectedKind, setSelectedKind] = useState<DemandKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<DemandSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMonthView, setShowMonthView] = useState(false);
  const [areaMapOpen, setAreaMapOpen] = useState(false);
  const [routeMapTarget, setRouteMapTarget] = useState<'from' | 'to' | null>(null);

  const kind = draft.kind ?? selectedKind;
  const flowSteps = useMemo(() => (kind ? getDemandFlowSteps(kind) : []), [kind]);
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const currentStepIndex = kind && step !== 'type' ? flowSteps.indexOf(step as DemandFlowStepId) : -1;

  const headerTitle =
    step === 'type' || !kind
      ? 'Find'
      : demandFlowStepTitle(step as DemandFlowStepId, kind);

  const demandFlowId = useMemo(
    () => (findKind ? composeFlowIdFromRoute({ intent: 'find', kind: findKind }) : null),
    [findKind]
  );
  const demandInitKey = demandFlowId ?? null;
  const demandInitializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSubmitting(false);
      setShowMonthView(false);
      setAreaMapOpen(false);
      setRouteMapTarget(null);
      return;
    }
    if (findKind && demandFlowId) {
      if (demandInitializedRef.current === demandInitKey) return;

      const saved = readDemandWizardSession(demandFlowId);
      if (saved?.draft?.kind) {
        setDraft(saved.draft);
        setSelectedKind(saved.selectedKind);
        setStep(saved.step as FlowStep);
        setError(null);
        setSubmitting(false);
        setSubmitResult(null);
        setShowMonthView(false);
        setAreaMapOpen(false);
        setRouteMapTarget(null);
        demandInitializedRef.current = demandInitKey;
        return;
      }

      setDraft({ ...emptyDemandDraft(), kind: findKind });
      setSelectedKind(findKind);
      setStep(getDemandFlowSteps(findKind)[0]);
      setError(null);
      setSubmitting(false);
      setSubmitResult(null);
      setShowMonthView(false);
      setAreaMapOpen(false);
      setRouteMapTarget(null);
      demandInitializedRef.current = demandInitKey;
      return;
    }
    if (!user) {
      navigate(signInHref);
      onClose();
    }
  }, [open, user, navigate, signInHref, onClose, findKind, demandFlowId, demandInitKey]);

  useEffect(() => {
    if (!open || !demandFlowId || submitResult) return;
    writeDemandWizardSession(demandFlowId, { step, draft, selectedKind });
  }, [open, demandFlowId, step, draft, selectedKind, submitResult]);

  const patchDraft = useCallback((patch: Partial<DemandDraft>) => {
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
    setRouteMapTarget(null);
    setStep(target);
    setError(null);
  };

  const goBack = () => {
    if (routeMapTarget) {
      setRouteMapTarget(null);
      setError(null);
      return;
    }
    if (areaMapOpen) {
      setAreaMapOpen(false);
      setError(null);
      return;
    }
    if (step === 'type' || currentStepIndex <= 0) {
      if (step === 'type' || findKind) {
        onBackToIntent?.();
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
      const result = await publishDemandRequest({ ...draft, kind: draft.kind ?? selectedKind });
      if (demandFlowId) clearDemandWizardSession(demandFlowId);
      setSubmitResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post your request.');
    } finally {
      setSubmitting(false);
    }
  };

  const isMapOverlay =
    (step === 'area' && areaMapOpen) ||
    (step === 'route' && routeMapTarget !== null) ||
    ((step === 'to' || step === 'from') && routeMapTarget !== null);

  const renderMapPinPicker = (
    endpoint: 'from' | 'to',
    options: { title: string; accent: 'emerald' | 'sky' }
  ) => {
    const isTo = endpoint === 'to';
    const placed = isTo ? draft.toPinPlaced : draft.fromPinPlaced;
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
          <MapPin className={`h-5 w-5 ${options.accent === 'sky' ? 'text-sky-500' : 'text-emerald-500'}`} />
          <span>
            <span className="block text-sm font-bold">{options.title}</span>
            <span className="text-xs text-gray-500">
              {placed ? `${lat?.toFixed(4)}, ${lng?.toFixed(4)}` : 'Tap to choose on map'}
            </span>
          </span>
        </span>
        <span className={`text-xs font-semibold ${options.accent === 'sky' ? 'text-sky-600' : 'text-emerald-600'}`}>
          {placed ? 'Edit' : 'Map'}
        </span>
      </button>
    );
  };

  const renderRoutePicker = (endpoint: 'from' | 'to') => {
    const isTo = endpoint === 'to';
    const placed = isTo ? draft.toPinPlaced : draft.fromPinPlaced;
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
          <MapPin className={`h-5 w-5 ${isTo ? 'text-sky-500' : 'text-emerald-500'}`} />
          <span>
            <span className="block text-sm font-bold">{isTo ? TO_LOCATION_LABEL : fromLocationLabel(kind === 'rideshare' ? 'rideshare' : 'default')}</span>
            <span className="text-xs text-gray-500">
              {placed ? `${lat?.toFixed(4)}, ${lng?.toFixed(4)}` : 'Tap to choose on map'}
            </span>
          </span>
        </span>
        <span className="text-xs font-semibold text-emerald-600">{placed ? 'Edit' : 'Map'}</span>
      </button>
    );
  };

  if (!open) return null;

  const submittedKind = draft.kind ?? selectedKind;

  const handleSuccessPrimary = async () => {
    if (submitResult) {
      await onSubmitted?.(submitResult);
    }
    onClose();
  };

  if (submitResult && submittedKind) {
    return (
      <DemandSubmitSuccessSheet
        open={open}
        onClose={onClose}
        kind={submittedKind}
        draft={{ ...draft, kind: submittedKind }}
        visibleOnMap={submitResult.visibleOnMap}
        onPrimaryAction={handleSuccessPrimary}
      />
    );
  }

  if (isMapOverlay && kind) {
    const isToStep = routeMapTarget === 'to';
    const isFromStep = routeMapTarget === 'from';
    const lat = isToStep
      ? draft.toLatitude ?? MAP_CONFIG.exploreDefaultCenter.lat
      : draft.latitude ?? MAP_CONFIG.exploreDefaultCenter.lat;
    const lng = isToStep
      ? draft.toLongitude ?? MAP_CONFIG.exploreDefaultCenter.lng
      : draft.longitude ?? MAP_CONFIG.exploreDefaultCenter.lng;

    const mapTitle =
      step === 'to'
        ? 'Going to'
        : step === 'from' && kind === 'rideshare'
          ? GOING_FROM_LABEL
          : isToStep
            ? TO_LOCATION_LABEL
            : isFromStep
              ? GOING_FROM_LABEL
              : 'Where would you like to go?';

    return (
      <div className={`fixed inset-0 ${EXPLORE_Z.composeFlow} bg-neutral-100`}>
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-emerald-50" />}>
          <CreatePlacePicker
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
                setRouteMapTarget(null);
                setError(null);
                return;
              }
              if (isFromStep) {
                patchDraft({ fromPinPlaced: true });
                setRouteMapTarget(null);
                setError(null);
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
    <ExploreResponsiveSheet
      open
      onClose={handleClose}
      zClass={EXPLORE_Z.composeFlow}
      overlayFixed
      panelClassName="max-h-[min(78dvh,720px)] px-5 pb-[calc(var(--safe-bottom)+3rem)] pt-1 lg:px-6 lg:pb-6 lg:pt-2"
    >
        {step === 'type' && !findKind && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
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
                    <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 pb-2">
              <NextButton disabled={!selectedKind} onClick={goToFirstStep} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'title' && kind && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <label className="block">
              {!usesGuidedDemandFlow(kind) ? (
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  Share a few details so others know what you need
                </span>
              ) : null}
              {usesGuidedDemandFlow(kind) ? (
                <FlowStepTextInput
                  value={draft.title}
                  onChange={(event) => patchDraft({ title: event.target.value })}
                  placeholder={demandTitlePlaceholder(kind)}
                  aria-label={demandTitlePlaceholder(kind)}
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
                  maxLength={120}
                />
              ) : (
                <FlowStepTextArea
                  value={draft.title}
                  onChange={(event) => patchDraft({ title: event.target.value })}
                  placeholder={demandTitlePlaceholder(kind)}
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
                  maxLength={120}
                />
              )}
            </label>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!draft.title.trim()} onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'destination' && kind && (usesHikingDemandFlow(kind) || usesCampingDemandFlow(kind)) && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <DemandDestinationStepBody draft={draft} patchDraft={patchDraft} />
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!draft.preferredArea.trim()} onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'to' && kind === 'rideshare' && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <DemandRideshareDestinationStepBody
              draft={draft}
              patchDraft={patchDraft}
              onOpenMap={() => setRouteMapTarget('to')}
            />
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton
                disabled={
                  !draft.toPinPlaced ||
                  (draft.destinationTimeMode === 'specific' && !draft.destinationTime)
                }
                onClick={goNext}
              />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'from' && kind === 'rideshare' && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <p className="mb-4 text-sm text-gray-600">Pin where you are leaving from.</p>
            {renderMapPinPicker('from', { title: 'Pickup pin', accent: 'emerald' })}
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!draft.fromPinPlaced} onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'from' && kind && (usesHikingDemandFlow(kind) || usesCampingDemandFlow(kind)) && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <p className="mb-4 text-sm text-gray-600">Pin where you are leaving from.</p>
            {renderMapPinPicker('from', { title: 'Going from', accent: 'emerald' })}
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!draft.fromPinPlaced} onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'audience' &&
          kind &&
          (usesHikingDemandFlow(kind) ||
            usesCampingDemandFlow(kind) ||
            usesEventDemandFlow(kind) ||
            kind === 'rideshare') && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <DemandAudienceStepBody draft={draft} patchDraft={patchDraft} kind={kind} />
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={kind === 'hiking' && !draft.fitnessLevel} onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'transport' && kind && (usesHikingDemandFlow(kind) || usesCampingDemandFlow(kind)) && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <DemandTransportStepBody draft={draft} patchDraft={patchDraft} />
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton
                disabled={
                  !draft.transportMode ||
                  (draft.transportMode === 'self' && !draft.selfVehicleType) ||
                  (draft.transportMode === 'rideshare' && draft.rideshareSeatsNeeded < 1)
                }
                onClick={goNext}
              />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'area' && kind && usesEventDemandFlow(kind) && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <p className="mb-4 text-sm text-gray-600">Pin where you want this event to happen.</p>
            <button
              type="button"
              onClick={() => setAreaMapOpen(true)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left hover:border-emerald-300"
            >
              <span className="flex items-center gap-2 text-gray-800">
                <MapPin className="h-5 w-5 text-emerald-500" />
                <span>
                  <span className="block text-sm font-bold">Location pin</span>
                  <span className="text-xs text-gray-500">
                    {draft.areaPinPlaced
                      ? `${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
                      : 'Tap to choose on map'}
                  </span>
                </span>
              </span>
              <span className="text-xs font-semibold text-emerald-600">{draft.areaPinPlaced ? 'Edit' : 'Map'}</span>
            </button>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!draft.areaPinPlaced} onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'area' && kind && !usesEventDemandFlow(kind) && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
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
          </FlowSheetChrome>
        )}

        {step === 'when' && kind && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
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
              {demandWhenShowsTime(kind)
                ? ([
                    { key: 'flexible' as TimeMode, title: 'Flexible', subtitle: 'Rough window', icon: CalendarDays },
                    { key: 'specific' as TimeMode, title: 'Set time', subtitle: 'Exact time', icon: Clock3 },
                  ] as const).map((option) => {
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
                        <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
                      </button>
                    );
                  })
                : null}
            </div>
            {demandWhenShowsTime(kind) && draft.timeMode === 'specific' && (
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
              <NextButton
                disabled={demandWhenShowsTime(kind) && draft.timeMode === 'specific' && !draft.time}
                onClick={() => {
                  if (!demandWhenShowsTime(kind)) {
                    patchDraft({ timeMode: 'flexible', time: '' });
                  }
                  goNext();
                }}
              />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'route' && kind === 'rideshare' && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <p className="mb-4 text-sm text-gray-600">Set both pickup and destination on the map.</p>
            <div className="space-y-3">
              {renderRoutePicker('from')}
              {renderRoutePicker('to')}
            </div>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton
                disabled={!draft.fromPinPlaced || !draft.toPinPlaced}
                onClick={goNext}
              />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'persons' && kind && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
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
          </FlowSheetChrome>
        )}

        {step === 'info' && kind && usesGuidedDemandFlow(kind) && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <textarea
              value={draft.additionalInfo}
              onChange={(event) => patchDraft({ additionalInfo: event.target.value })}
              rows={4}
              placeholder={demandAdditionalInfoPlaceholder(kind)}
              aria-label={demandAdditionalInfoPlaceholder(kind)}
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
              maxLength={1000}
            />
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'comment' && kind && !usesGuidedDemandFlow(kind) && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
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
          </FlowSheetChrome>
        )}

        {step === 'review' && kind && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-gray-700">
              <p className="flex items-center gap-2 font-semibold text-gray-900">
                {kind === 'rideshare' ? (
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
              {draft.title && (
                <p className="mt-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">Title: </span>
                  {draft.title}
                </p>
              )}
              {(usesHikingDemandFlow(kind) || usesCampingDemandFlow(kind)) && draft.preferredArea && (
                <p className="mt-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">Destination: </span>
                  {EXPLORE_REGION_PILL_LABELS[draft.preferredArea] ?? draft.preferredArea}
                </p>
              )}
              {(usesHikingDemandFlow(kind) || usesCampingDemandFlow(kind)) && draft.fromPinPlaced && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                  Going from: {draft.latitude?.toFixed(4)}, {draft.longitude?.toFixed(4)}
                </p>
              )}
              {usesRideshareDemandFlow(kind) && draft.toPinPlaced && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-sky-500" />
                  Destination: {draft.toLatitude?.toFixed(4)}, {draft.toLongitude?.toFixed(4)}
                  {draft.destinationTimeMode === 'specific' && draft.destinationTime
                    ? ` · ${draft.destinationTime}`
                    : ' · flexible arrival'}
                </p>
              )}
              {usesRideshareDemandFlow(kind) && draft.fromPinPlaced && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                  {GOING_FROM_LABEL}: {draft.latitude?.toFixed(4)}, {draft.longitude?.toFixed(4)}
                </p>
              )}
              {draft.date && (
                <p className="mt-1 text-xs text-gray-500">
                  {draft.date}
                  {demandWhenShowsTime(kind) && draft.timeMode === 'specific' && draft.time
                    ? ` · ${draft.time}`
                    : demandWhenShowsTime(kind)
                      ? ' · flexible time'
                      : ''}
                </p>
              )}
              {usesEventDemandFlow(kind) && draft.areaPinPlaced && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                  Where: {draft.latitude?.toFixed(4)}, {draft.longitude?.toFixed(4)}
                </p>
              )}
              {(usesHikingDemandFlow(kind) || usesCampingDemandFlow(kind) || usesRideshareDemandFlow(kind) || usesEventDemandFlow(kind)) && (
                <p className="mt-1 text-xs text-gray-500">{draft.partySize} people</p>
              )}
              <p className="mt-2 line-clamp-6 whitespace-pre-line text-xs text-gray-600">
                {buildDemandComment(draft)}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {flowSteps
                .filter((target) => target !== 'review')
                .map((target) => {
                  const editLabel =
                    target === 'destination'
                      ? 'Destination'
                      : target === 'area'
                        ? 'Where'
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
              Check everything looks right before posting. Hosts and explorers nearby can message you or propose a
              matching activity.
            </p>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton label="Submit" loading={submitting} onClick={handleSubmit} />
            </div>
          </FlowSheetChrome>
        )}
    </ExploreResponsiveSheet>
  );
};

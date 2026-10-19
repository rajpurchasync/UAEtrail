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
import type { ActivityDTO } from '@uaetrail/shared-types';
import { useAuth } from '../../context/AuthContext';
import { fetchPublicActivityDetail } from '../../hooks/publicActivityClientApi';
import { MobileMonthCalendar } from '../../components/mobile/MobileMonthCalendar';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import { FlowSheetChrome } from './ExploreFlowSheetChrome';
import { FlowStepTextArea, FlowStepTextInput } from './useFlowSheetPrimaryFieldFocus';
import { EXPLORE_FLOW } from '../../config/exploreTheme';
import { MAP_CONFIG } from '../../config/platform';
import { EXPLORE_Z } from '../../config/exploreTheme';
import {
  buildDateOptions,
  buildSeekingComment,
  SEEKING_PARTY_PRESETS,
  SEEKING_TYPE_OPTIONS,
  seekingAdditionalInfoPlaceholder,
  seekingAreaFieldLabel,
  seekingAreaPlaceholder,
  seekingAreaTextRequired,
  seekingAreaUsesMap,
  seekingFlowStepTitle,
  seekingTitlePlaceholder,
  seekingWhenShowsTime,
  emptySeekingDraft,
  getSeekingFlowSteps,
  publishSeekingRequest,
  usesCampingSeekingFlow,
  usesHikingSeekingFlow,
  usesEventSeekingFlow,
  usesRideshareSeekingFlow,
  usesGuidedSeekingFlow,
  validateSeekingDraft,
  validateSeekingStep,
  type SeekingFlowStepId,
  type SeekingSubmitResult,
  type SeekingDraft,
  type SeekingKind,
} from './seekingFlowEngine';
import type { LocationPrecision, TimeMode } from './createFlowShared';
import { seekFixedCompose, type SeekingComposeKind } from '../compose';
import { areaLabelForId } from '../hostingPublishArea';
import { areaIdForExploreAreaSlug } from '../exploreAreaFilter';
import { useExplorePublishedAreas } from '../useExplorePublishedAreas';
import { SeekingCuratedAreaStep } from './SeekingCuratedAreaStep';
import { composeFlowIdFromRoute } from '../composeFlowCatalog';
import {
  clearSeekingWizardSession,
  readSeekingWizardSession,
  writeSeekingWizardSession,
} from './composeWizardSession';
import { fromLocationLabel, GOING_FROM_LABEL, TO_LOCATION_LABEL } from '../createFlowCopy';
import {
  SeekingRideshareDestinationStepBody,
  SeekingDestinationStepBody,
  SeekingTransportStepBody,
  SeekingAudienceStepBody,
} from './seekingWizardSteps';
import { SeekingSubmitSuccessSheet } from './SeekingSubmitSuccessSheet';
import { EXPLORE_REGION_PILL_LABELS } from '../../config/regions';

const CreatePlacePicker = lazy(() =>
  import('./CreatePlacePicker').then((m) => ({ default: m.CreatePlacePicker }))
);

type FlowStep = 'type' | SeekingFlowStepId;

interface CreateSeekingFlowProps {
  open: boolean;
  onClose: () => void;
  onBackToIntent?: () => void;
  onSubmitted?: (result: SeekingSubmitResult) => void;
  signInHref: string;
  seekKind?: SeekingComposeKind | null;
  exploreAreaSlug?: string | null;
  tenantId?: string | null;
  onCreateLinkedRideshare?: (parent: ActivityDTO) => void;
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

const REVIEW_EDIT_LABELS: Partial<Record<SeekingFlowStepId, string>> = {
  title: 'Title',
  destination: 'Destination',
  area: 'Where',
  curatedArea: 'Area & pin',
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

export const CreateSeekingFlow = ({
  open,
  onClose,
  onBackToIntent,
  onSubmitted,
  signInHref,
  seekKind = null,
  exploreAreaSlug = null,
  tenantId = null,
  onCreateLinkedRideshare,
}: CreateSeekingFlowProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<FlowStep>('type');
  const [draft, setDraft] = useState<SeekingDraft>(emptySeekingDraft);
  const [selectedKind, setSelectedKind] = useState<SeekingKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SeekingSubmitResult | null>(null);
  const [publishedActivity, setPublishedActivity] = useState<ActivityDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMonthView, setShowMonthView] = useState(false);
  const [areaMapOpen, setAreaMapOpen] = useState(false);
  const publishedAreas = useExplorePublishedAreas();
  const [routeMapTarget, setRouteMapTarget] = useState<'from' | 'to' | null>(null);

  useEffect(() => {
    if (!submitResult?.activityId) {
      setPublishedActivity(null);
      return;
    }
    let cancelled = false;
    void fetchPublicActivityDetail(submitResult.activityId)
      .then((detail) => {
        if (!cancelled) setPublishedActivity(detail.activity);
      })
      .catch(() => {
        if (!cancelled) setPublishedActivity(null);
      });
    return () => {
      cancelled = true;
    };
  }, [submitResult?.activityId]);

  const kind = draft.kind ?? selectedKind;
  const flowSteps = useMemo(() => (kind ? getSeekingFlowSteps(kind) : []), [kind]);
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const currentStepIndex = kind && step !== 'type' ? flowSteps.indexOf(step as SeekingFlowStepId) : -1;

  const headerTitle =
    step === 'type' || !kind
      ? 'Find'
      : seekingFlowStepTitle(step as SeekingFlowStepId, kind);

  const seekingFlowId = useMemo(
    () =>
      seekKind ? composeFlowIdFromRoute(seekFixedCompose(seekKind)) : null,
    [seekKind]
  );
  const seekingInitKey = seekingFlowId ?? null;
  const seekingInitializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSubmitting(false);
      setShowMonthView(false);
      setAreaMapOpen(false);
      setRouteMapTarget(null);
      return;
    }
    if (seekKind && seekingFlowId) {
      if (seekingInitializedRef.current === seekingInitKey) return;

      const saved = readSeekingWizardSession(seekingFlowId);
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
        seekingInitializedRef.current = seekingInitKey;
        return;
      }

      const areaId = areaIdForExploreAreaSlug(publishedAreas, exploreAreaSlug);
      setDraft({
        ...emptySeekingDraft(),
        kind: seekKind,
        ...(areaId ? { areaId } : {}),
      });
      setSelectedKind(seekKind);
      setStep(getSeekingFlowSteps(seekKind)[0]);
      setError(null);
      setSubmitting(false);
      setSubmitResult(null);
      setShowMonthView(false);
      setAreaMapOpen(false);
      setRouteMapTarget(null);
      seekingInitializedRef.current = seekingInitKey;
      return;
    }
    if (!user) {
      navigate(signInHref);
      onClose();
    }
  }, [
    open,
    user,
    navigate,
    signInHref,
    onClose,
    seekKind,
    seekingFlowId,
    seekingInitKey,
    exploreAreaSlug,
    publishedAreas,
  ]);

  useEffect(() => {
    if (!open || !seekingFlowId || submitResult) return;
    writeSeekingWizardSession(seekingFlowId, { step, draft, selectedKind });
  }, [open, seekingFlowId, step, draft, selectedKind, submitResult]);

  const patchDraft = useCallback((patch: Partial<SeekingDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const goToFirstStep = () => {
    if (!selectedKind) return;
    patchDraft({ kind: selectedKind });
    setStep(getSeekingFlowSteps(selectedKind)[0]);
    setError(null);
  };

  const goToStep = (target: SeekingFlowStepId) => {
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
      if (step === 'type' || seekKind) {
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
    const validation = validateSeekingStep(step as SeekingFlowStepId, draft);
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
    const validation = validateSeekingDraft({ ...draft, kind: draft.kind ?? selectedKind });
    if (validation) {
      setError(validation);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await publishSeekingRequest({ ...draft, kind: draft.kind ?? selectedKind });
      if (seekingFlowId) clearSeekingWizardSession(seekingFlowId);
      setSubmitResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post your request.');
    } finally {
      setSubmitting(false);
    }
  };

  const isMapOverlay =
    ((step === 'area' || step === 'curatedArea') && areaMapOpen) ||
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
      <SeekingSubmitSuccessSheet
        open={open}
        onClose={onClose}
        kind={submittedKind}
        draft={{ ...draft, kind: submittedKind }}
        visibleOnMap={submitResult.visibleOnMap}
        tenantId={tenantId}
        publishedActivity={publishedActivity}
        onPrimaryAction={handleSuccessPrimary}
        onCreateLinkedRideshare={onCreateLinkedRideshare}
        onRideshareLinked={() => {
          if (submitResult.activityId) {
            void fetchPublicActivityDetail(submitResult.activityId).then((detail) => {
              setPublishedActivity(detail.activity);
            });
          }
        }}
      />
    );
  }

  if (isMapOverlay && kind) {
    const isToStep = routeMapTarget === 'to';
    const isFromStep = routeMapTarget === 'from';
    const curatedCenter = draft.areaId
      ? publishedAreas.find((area) => area.id === draft.areaId)?.center
      : null;
    const lat = isToStep
      ? draft.toLatitude ?? MAP_CONFIG.exploreDefaultCenter.lat
      : curatedCenter?.latitude ?? draft.latitude ?? MAP_CONFIG.exploreDefaultCenter.lat;
    const lng = isToStep
      ? draft.toLongitude ?? MAP_CONFIG.exploreDefaultCenter.lng
      : curatedCenter?.longitude ?? draft.longitude ?? MAP_CONFIG.exploreDefaultCenter.lng;

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
        {step === 'type' && !seekKind && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <div className="grid grid-cols-2 gap-3">
              {SEEKING_TYPE_OPTIONS.map((option) => {
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
              {!usesGuidedSeekingFlow(kind) ? (
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  Share a few details so others know what you need
                </span>
              ) : null}
              {usesGuidedSeekingFlow(kind) ? (
                <FlowStepTextInput
                  value={draft.title}
                  onChange={(event) => patchDraft({ title: event.target.value })}
                  placeholder={seekingTitlePlaceholder(kind)}
                  aria-label={seekingTitlePlaceholder(kind)}
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
                  maxLength={120}
                />
              ) : (
                <FlowStepTextArea
                  value={draft.title}
                  onChange={(event) => patchDraft({ title: event.target.value })}
                  placeholder={seekingTitlePlaceholder(kind)}
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

        {step === 'curatedArea' && kind && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <SeekingCuratedAreaStep
              areaId={draft.areaId}
              pinPlaced={draft.areaPinPlaced}
              latitude={draft.latitude}
              longitude={draft.longitude}
              onAreaIdChange={(next) => {
                const center = next ? publishedAreas.find((area) => area.id === next)?.center : null;
                patchDraft({
                  areaId: next,
                  areaPinPlaced: false,
                  ...(center
                    ? { latitude: center.latitude, longitude: center.longitude }
                    : {}),
                });
              }}
              onOpenMap={() => setAreaMapOpen(true)}
            />
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton
                disabled={!draft.areaId || !draft.areaPinPlaced}
                onClick={goNext}
              />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'destination' && kind && (usesHikingSeekingFlow(kind) || usesCampingSeekingFlow(kind)) && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <SeekingDestinationStepBody draft={draft} patchDraft={patchDraft} />
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!draft.preferredArea.trim()} onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'to' && kind === 'rideshare' && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <SeekingRideshareDestinationStepBody
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

        {step === 'from' && kind && (usesHikingSeekingFlow(kind) || usesCampingSeekingFlow(kind)) && (
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
          (usesHikingSeekingFlow(kind) ||
            usesCampingSeekingFlow(kind) ||
            usesEventSeekingFlow(kind) ||
            kind === 'rideshare') && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <SeekingAudienceStepBody draft={draft} patchDraft={patchDraft} kind={kind} />
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={kind === 'hiking' && !draft.fitnessLevel} onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'transport' && kind && (usesHikingSeekingFlow(kind) || usesCampingSeekingFlow(kind)) && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <SeekingTransportStepBody draft={draft} patchDraft={patchDraft} />
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

        {step === 'area' && kind && usesEventSeekingFlow(kind) && (
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

        {step === 'area' && kind && !usesEventSeekingFlow(kind) && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <label className="block">
              <input
                value={draft.preferredArea}
                onChange={(event) => patchDraft({ preferredArea: event.target.value })}
                placeholder={seekingAreaPlaceholder(kind)}
                aria-label={seekingAreaFieldLabel(kind)}
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
                maxLength={200}
                autoFocus
              />
            </label>
            {seekingAreaUsesMap(kind) && (
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
                disabled={seekingAreaTextRequired(kind) && !draft.preferredArea.trim()}
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
              {seekingWhenShowsTime(kind)
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
            {seekingWhenShowsTime(kind) && draft.timeMode === 'specific' && (
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
                disabled={seekingWhenShowsTime(kind) && draft.timeMode === 'specific' && !draft.time}
                onClick={() => {
                  if (!seekingWhenShowsTime(kind)) {
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
              {SEEKING_PARTY_PRESETS.map((value) => {
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

        {step === 'info' && kind && usesGuidedSeekingFlow(kind) && (
          <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
            <textarea
              value={draft.additionalInfo}
              onChange={(event) => patchDraft({ additionalInfo: event.target.value })}
              rows={4}
              placeholder={seekingAdditionalInfoPlaceholder(kind)}
              aria-label={seekingAdditionalInfoPlaceholder(kind)}
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
              maxLength={1000}
            />
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'comment' && kind && !usesGuidedSeekingFlow(kind) && (
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
                {SEEKING_TYPE_OPTIONS.find((option) => option.key === kind)?.title ?? kind}
              </p>
              {draft.title && (
                <p className="mt-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">Title: </span>
                  {draft.title}
                </p>
              )}
              {(usesHikingSeekingFlow(kind) || usesCampingSeekingFlow(kind)) && draft.preferredArea && (
                <p className="mt-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">Destination: </span>
                  {EXPLORE_REGION_PILL_LABELS[draft.preferredArea] ?? draft.preferredArea}
                </p>
              )}
              {(usesHikingSeekingFlow(kind) || usesCampingSeekingFlow(kind)) && draft.fromPinPlaced && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                  Going from: {draft.latitude?.toFixed(4)}, {draft.longitude?.toFixed(4)}
                </p>
              )}
              {usesRideshareSeekingFlow(kind) && draft.toPinPlaced && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-sky-500" />
                  Destination: {draft.toLatitude?.toFixed(4)}, {draft.toLongitude?.toFixed(4)}
                  {draft.destinationTimeMode === 'specific' && draft.destinationTime
                    ? ` · ${draft.destinationTime}`
                    : ' · flexible arrival'}
                </p>
              )}
              {usesRideshareSeekingFlow(kind) && draft.fromPinPlaced && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                  {GOING_FROM_LABEL}: {draft.latitude?.toFixed(4)}, {draft.longitude?.toFixed(4)}
                </p>
              )}
              {draft.date && (
                <p className="mt-1 text-xs text-gray-500">
                  {draft.date}
                  {seekingWhenShowsTime(kind) && draft.timeMode === 'specific' && draft.time
                    ? ` · ${draft.time}`
                    : seekingWhenShowsTime(kind)
                      ? ' · flexible time'
                      : ''}
                </p>
              )}
              {usesEventSeekingFlow(kind) && draft.areaPinPlaced && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                  Where: {draft.latitude?.toFixed(4)}, {draft.longitude?.toFixed(4)}
                </p>
              )}
              {(usesHikingSeekingFlow(kind) || usesCampingSeekingFlow(kind) || usesRideshareSeekingFlow(kind) || usesEventSeekingFlow(kind)) && (
                <p className="mt-1 text-xs text-gray-500">{draft.partySize} people</p>
              )}
              <p className="mt-2 line-clamp-6 whitespace-pre-line text-xs text-gray-600">
                {buildSeekingComment(draft)}
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

            {draft.areaId ? (
              <p className="mt-3 text-xs text-gray-600">
                Area: <span className="font-semibold">{areaLabelForId(draft.areaId, publishedAreas) ?? draft.areaId}</span>
              </p>
            ) : null}

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

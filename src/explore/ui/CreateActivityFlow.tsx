import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  CalendarDays,
  Car,
  ClipboardCheck,
  Clock3,
  Lock,
  MapPin,
  MoreHorizontal,
  Mountain,
  Tent,
  UserRound,
  Users,
} from 'lucide-react';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { useAuth } from '../../context/AuthContext';
import { useOrganisationGate } from '../../hooks/useOrganisationGate';
import { MobileMonthCalendar } from '../../components/mobile/MobileMonthCalendar';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import { FlowSheetChrome } from './ExploreFlowSheetChrome';
import { FlowStepTextInput } from './useFlowSheetPrimaryFieldFocus';
import { exploreFlowChoiceCardClass, exploreFlowKindTileClass } from './exploreFlowUi';
import { EXPLORE_FLOW, EXPLORE_Z } from '../../config/exploreTheme';
import {
  buildDateOptions,
  CAPACITY_PRESETS,
  createFlowStepTitle,
  createTitlePlaceholder,
  defaultCapacityForKind,
  emptyCreateActivityDraft,
  formatCapacityLabel,
  formatHikeCapacityLabel,
  getCreateFlowSteps,
  locationPickerConfirmLabel,
  locationPickerHint,
  locationPickerTitle,
  OFFLINE_PRICE_NOTE,
  priceModeLabel,
  priceModeOptions,
  publishCreateActivity,
  validateDraftStep,
  resolveRideshareVehicleLabel,
  isHikingOrganizeFlow,
  isCampingOrganizeFlow,
  isEventOrganizeFlow,
  isActivityOrganizeFlow,
  isRideshareOrganizeFlow,
  isStructuredOrganizeFlow,
  usesGoingFromOrganizeStep,
  resolveActivityTopicLabel,
  type AudienceAccess,
  type CreateFlowStepId,
  type JoinMode,
  type LocationPrecision,
  type CreateActivityDraft,
  type CreateActivityKind,
  type TimeMode,
} from './organizeFlow';
import {
  HIKE_APPROVAL_NO_SUBTITLE,
  HIKE_PRIVATE_EVENT_INFO,
} from '../createFlowCopy';
import {
  organizePublishSeed,
  PARTICIPATION_TOGGLE_QUESTION,
  type OrganizeComposeKind,
} from '../compose';
import {
  HikingAboutTrailStepBody,
  HikingAudienceStepBody,
  HikingDestinationStepBody,
  HikingDifficultyStepBody,
  HikingJoinKitStepBody,
  HikingSpotsStepBody,
} from './organizeHikingWizardSteps';
import {
  CampingAboutStepBody,
  CampingDestinationStepBody,
  CampingJoinKitStepBody,
  CampingParticipantsStepBody,
  CampingTransportationStepBody,
} from './organizeCampingWizardSteps';
import {
  EventAboutStepBody,
  EventChildrenAllowedField,
  EventDestinationStepBody,
  EventJoinKitStepBody,
} from './organizeEventWizardSteps';
import { RideshareAudienceStepBody, RideshareSeatsStepBody, RideshareTransportationStepBody } from './organizeRideshareWizardSteps';
import {
  ActivityInstructionsStepBody,
  ActivityTypeStepBody,
} from './organizeActivitiesWizardSteps';
import { usePlaceRegistry } from '../../hooks/usePlaceRegistry';
import {
  CARPOOL_PICKUP_HINT,
  EXTRA_DIRECTIONS_LABEL,
  fromLocationLabel,
  GOING_FROM_HINT,
  GOING_FROM_NOTES_PREVIEW_LABEL,
  GOING_FROM_WITH_TIME_HINT,
  JOIN_RULES_LABEL,
  JOIN_RULES_PREVIEW_LABEL,
  ORGANIZE_DEMAND_PREFILL_TITLE,
  ORGANIZE_HOST_PROFILE_ERROR,
  ORGANIZE_INTRO_PROMPT,
  ORGANIZE_PUBLISH_SUCCESS_BODY,
  ORGANIZE_PUBLISH_SUCCESS_TITLE,
  ORGANIZE_PUBLISH_VIEW_ON_MAP,
  ORGANIZE_TYPE_SHEET_TITLE,
  PICKUP_POINT_LABEL,
  RIDE_RULES_LABEL,
  TO_LOCATION_LABEL,
  WHERE_STEP_CAMP_HINT,
  WHERE_STEP_HINT,
} from '../createFlowCopy';
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
  const [meetingPointMapOpen, setMeetingPointMapOpen] = useState(false);
  const [publishedActivity, setPublishedActivity] = useState<ActivityDTO | null>(null);

  const kind = draft.kind ?? selectedKind;
  const hikingFlow = isHikingOrganizeFlow(kind, draft.genericBuddy);
  const campingFlow = isCampingOrganizeFlow(kind, draft.genericBuddy);
  const eventFlow = isEventOrganizeFlow(kind, draft.genericBuddy);
  const activityFlow = isActivityOrganizeFlow(kind, draft.genericBuddy);
  const rideshareFlow = isRideshareOrganizeFlow(kind, draft.genericBuddy);
  const goingFromFlow = usesGoingFromOrganizeStep(kind, draft.genericBuddy);
  const structuredFlow = isStructuredOrganizeFlow(kind, draft.genericBuddy);
  const registryPlaceType =
    kind === 'hiking' || kind === 'camping' || kind === 'event' ? kind : undefined;
  const registryPlaces = usePlaceRegistry({
    enabled: open && structuredFlow && Boolean(registryPlaceType),
    placeType: registryPlaceType,
  });
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
      setMeetingPointMapOpen(false);
      setPublishedActivity(null);
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
      setMeetingPointMapOpen(false);
      setPublishedActivity(null);
      return;
    }

    if (organizeKind) {
      const seed = organizePublishSeed(organizeKind);
      const createKind = seed.createKind;
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
      setMeetingPointMapOpen(false);
      setPublishedActivity(null);
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
      ...(selectedKind === 'carpool'
        ? { joinMode: 'open' as const, participationMode: 'approval' as const }
        : {}),
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
    if (meetingPointMapOpen) {
      setMeetingPointMapOpen(false);
      setError(null);
      return;
    }
    if (step === 'type' || currentStepIndex <= 0) {
      if (demandPrefill) {
        onClose();
        return;
      }
      if (step === 'type' || organizeKind) {
        onBackToIntent?.();
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
      setError(ORGANIZE_HOST_PROFILE_ERROR);
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
      setPublishedActivity(activity);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewOnMap = async () => {
    if (publishedActivity) {
      await onPublished?.(publishedActivity);
    }
    onClose();
  };

  const isPickupMapOpen = step === 'meeting' && whereMapOpen;
  const isMeetingPointMapOpen = step === 'meeting_point' && meetingPointMapOpen;
  const isDestMapOpen = step === 'to' && routeMapTarget === 'to';
  const isRouteMapOverlay = kind === 'carpool' && step === 'route' && routeMapTarget !== null;
  const isFullScreenLocationStep = isPickupMapOpen || isDestMapOpen || isRouteMapOverlay || isMeetingPointMapOpen;

  const hasFromPin = draft.latitude != null && draft.longitude != null;
  const hasToPin = draft.toLatitude != null && draft.toLongitude != null;

  if (!open) return null;

  if (publishedActivity) {
    return (
      <ExploreResponsiveSheet open={open} onClose={onClose}>
        <FlowSheetChrome title={ORGANIZE_PUBLISH_SUCCESS_TITLE} onClose={onClose} onBack={onClose}>
          <p className="text-sm leading-relaxed text-gray-600">{ORGANIZE_PUBLISH_SUCCESS_BODY}</p>
          <p className="mt-2 text-base font-semibold text-gray-900">{publishedActivity.title}</p>
          <div className="mt-5 pb-2">
            <NextButton label={ORGANIZE_PUBLISH_VIEW_ON_MAP} onClick={handleViewOnMap} />
          </div>
        </FlowSheetChrome>
      </ExploreResponsiveSheet>
    );
  }

  if ((isFullScreenLocationStep || isRouteMapOverlay) && kind) {
    const isMeetingPin = step === 'meeting_point';
    const isToStep = isRouteMapOverlay
      ? routeMapTarget === 'to'
      : step === 'to';
    const lat = isMeetingPin
      ? draft.meetingLatitude ?? MAP_CONFIG.exploreDefaultCenter.lat
      : isToStep
        ? draft.toLatitude ?? MAP_CONFIG.exploreDefaultCenter.lat
        : draft.latitude ?? MAP_CONFIG.exploreDefaultCenter.lat;
    const lng = isMeetingPin
      ? draft.meetingLongitude ?? MAP_CONFIG.exploreDefaultCenter.lng
      : isToStep
        ? draft.toLongitude ?? MAP_CONFIG.exploreDefaultCenter.lng
        : draft.longitude ?? MAP_CONFIG.exploreDefaultCenter.lng;
    const mapEndpoint: 'from' | 'to' = isToStep ? 'to' : 'from';
    const mapStep: CreateFlowStepId = step as CreateFlowStepId;

    return (
      <div className={`fixed inset-0 ${EXPLORE_Z.composeFlow} bg-neutral-100`}>
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
              if (isMeetingPin) {
                patchDraft({ meetingLatitude: latitude, meetingLongitude: longitude });
                return;
              }
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
              if (isMeetingPointMapOpen) {
                setMeetingPointMapOpen(false);
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
        ? ORGANIZE_DEMAND_PREFILL_TITLE
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
            <span className="block text-sm font-bold">{isTo ? TO_LOCATION_LABEL : fromLocationLabel('carpool')}</span>
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
      zClass={EXPLORE_Z.composeFlow}
      overlayFixed
      panelClassName="max-h-[min(78dvh,720px)] px-5 pb-[calc(var(--safe-bottom)+3rem)] pt-1 lg:px-6 lg:pb-6 lg:pt-2"
    >
        {step === 'type' && !demandPrefill && !organizeKind && (
          <FlowSheetChrome title={ORGANIZE_TYPE_SHEET_TITLE} onClose={handleClose} onBack={goBack}>
            <div className={EXPLORE_FLOW.choiceGrid2}>
              {TYPE_OPTIONS.map((option) => {
                const active = selectedKind === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedKind(option.key)}
                    className={exploreFlowKindTileClass(active)}
                  >
                    <span className="text-3xl font-emoji">{option.emoji}</span>
                    <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.title}</p>
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

        {step === 'activity_type' && activityFlow && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <ActivityTypeStepBody draft={draft} patchDraft={patchDraft} />
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!draft.activityTopic} onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'route' && kind === 'carpool' && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <p className="mb-4 text-sm text-gray-600">Set both pickup and destination on the map.</p>
            <div className="space-y-3">
              {renderRoutePicker('from')}
              {renderRoutePicker('to')}
            </div>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!hasFromPin || !hasToPin} onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'title' && kind && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <label className="block">
              <FlowStepTextInput
                value={draft.title}
                onChange={(event) => patchDraft({ title: event.target.value })}
                placeholder={createTitlePlaceholder(kind, stepTitleOptions)}
                aria-label={createTitlePlaceholder(kind, stepTitleOptions)}
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
                maxLength={120}
              />
            </label>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!draft.title.trim()} onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'meeting' && kind && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            {kind === 'carpool' ? (
              <>
                <p className="mb-4 text-sm text-gray-600">{CARPOOL_PICKUP_HINT}</p>
                <button
                  type="button"
                  onClick={() => setWhereMapOpen(true)}
                  className={EXPLORE_FLOW.mapPinCard}
                >
                  <span className="flex items-center gap-2 text-gray-800">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <span>
                      <span className="block text-sm font-bold">{PICKUP_POINT_LABEL}</span>
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
                <p className="mb-4 text-sm text-gray-600">{GOING_FROM_HINT}</p>
                <button
                  type="button"
                  onClick={() => setWhereMapOpen(true)}
                  className={EXPLORE_FLOW.mapPinCard}
                >
                  <span className="flex items-center gap-2 text-gray-800">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm text-gray-800">
                      {hasFromPin
                        ? `${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
                        : 'Tap to choose on map'}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">{hasFromPin ? 'Edit' : 'Map'}</span>
                </button>
              </>
            ) : goingFromFlow ? (
              <>
                <p className="mb-4 text-sm text-gray-600">{GOING_FROM_HINT}</p>
                {activityFlow && draft.meetingLatitude != null ? (
                  <button
                    type="button"
                    onClick={() =>
                      patchDraft({
                        latitude: draft.meetingLatitude,
                        longitude: draft.meetingLongitude,
                        fromLabel: draft.meetingPointLabel || draft.fromLabel,
                      })
                    }
                    className="mb-3 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-left text-sm font-semibold text-gray-800"
                  >
                    Same as meeting point
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setWhereMapOpen(true)}
                  className={EXPLORE_FLOW.mapPinCard}
                >
                  <span className="flex items-center gap-2 text-gray-800">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm text-gray-800">
                      {hasFromPin
                        ? `${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
                        : 'Tap to choose on map'}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">{hasFromPin ? 'Edit' : 'Map'}</span>
                </button>
                <label className="mt-4 block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">{EXTRA_DIRECTIONS_LABEL}</span>
                  <textarea
                    value={draft.goingFromNotes}
                    onChange={(event) => patchDraft({ goingFromNotes: event.target.value })}
                    rows={3}
                    placeholder="e.g. Mall entrance B, look for the green flag…"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
                    maxLength={500}
                  />
                  <span className="mt-1 block text-xs text-gray-500">Optional — for the going-from pin.</span>
                </label>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-600">{GOING_FROM_WITH_TIME_HINT}</p>
                <button
                  type="button"
                  onClick={() => setWhereMapOpen(true)}
                  className={EXPLORE_FLOW.mapPinCard}
                >
                  <span className="flex items-center gap-2 text-gray-800">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm text-gray-800">
                      {hasFromPin
                        ? `${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
                        : 'Tap to choose on map'}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">{hasFromPin ? 'Edit' : 'Map'}</span>
                </button>

                <label className="mt-4 block">
                  <span className="mb-1 block text-sm font-medium text-gray-700">{EXTRA_DIRECTIONS_LABEL}</span>
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
                  !(hasFromPin || (activityFlow && draft.meetingLatitude != null && draft.meetingLongitude != null)) ||
                  (!goingFromFlow &&
                    !structuredFlow &&
                    kind !== 'carpool' &&
                    !draft.genericBuddy &&
                    !draft.meetingTime.trim())
                }
                onClick={goNext}
              />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'to' && kind === 'carpool' && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
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
          </FlowSheetChrome>
        )}

        {step === 'where' && kind && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <p className="mb-4 text-sm text-gray-600">
              {kind === 'camping' ? WHERE_STEP_CAMP_HINT : WHERE_STEP_HINT}
            </p>
            <button
              type="button"
              onClick={() => setWhereMapOpen(true)}
              className={EXPLORE_FLOW.mapPinCard}
            >
              <span className="flex items-center gap-2 text-gray-800">
                <MapPin className="h-5 w-5 text-emerald-600" />
                <span className="text-sm text-gray-800">
                  {hasFromPin
                    ? `${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
                    : kind === 'camping'
                      ? 'Tap to choose camp location'
                      : 'Tap to choose on map'}
                </span>
              </span>
              <span className="text-xs font-semibold text-emerald-700">{hasFromPin ? 'Edit' : 'Map'}</span>
            </button>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!hasFromPin} onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'instructions' && activityFlow && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <ActivityInstructionsStepBody draft={draft} patchDraft={patchDraft} />
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!draft.joinKit.trim()} onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'instructions' && kind === 'event' && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">About this event</span>
              <textarea
                value={draft.description}
                onChange={(event) => patchDraft({ description: event.target.value })}
                rows={3}
                placeholder="What to expect, schedule highlights, vibe…"
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
                maxLength={1200}
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-gray-700">{JOIN_RULES_LABEL}</span>
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
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!draft.additionalInstructions.trim()} onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'instructions' && kind === 'carpool' && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <p className="mb-3 text-sm text-gray-600">
              Riders must read and agree to these instructions before requesting a seat.
            </p>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">{RIDE_RULES_LABEL}</span>
              <textarea
                value={draft.description}
                onChange={(event) => patchDraft({ description: event.target.value })}
                rows={5}
                placeholder="e.g. Meet at mall entrance, max 1 bag per person, no smoking…"
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-500"
                maxLength={1200}
              />
            </label>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton disabled={!draft.description.trim()} onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'when' && kind && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
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

            <div className={`mt-4 ${EXPLORE_FLOW.choiceGrid2}`}>
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
                    className={exploreFlowChoiceCardClass(active)}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-gray-500'}`} />
                    <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.title}</p>
                    <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
                  </button>
                );
              })}
            </div>

            {draft.timeMode === 'specific' && (
              <>
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
                {hikingFlow && (
                  <label className="mt-3 block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      End time (approx.)
                    </span>
                    <input
                      type="time"
                      value={draft.endTime}
                      onChange={(event) => patchDraft({ endTime: event.target.value })}
                      className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base font-semibold text-gray-900"
                    />
                  </label>
                )}
              </>
            )}

            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-4 pb-2">
              <NextButton
                disabled={draft.timeMode === 'specific' && !draft.time}
                onClick={goNext}
              />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'spots' && kind && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            {rideshareFlow ? (
              <RideshareSeatsStepBody draft={draft} patchDraft={patchDraft} />
            ) : hikingFlow || eventFlow || activityFlow ? (
              <>
                <HikingSpotsStepBody draft={draft} patchDraft={patchDraft} />
                {eventFlow || activityFlow ? (
                  <EventChildrenAllowedField draft={draft} patchDraft={patchDraft} />
                ) : null}
              </>
            ) : campingFlow ? (
              <CampingParticipantsStepBody draft={draft} patchDraft={patchDraft} />
            ) : (
              <>
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
              </>
            )}
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'transportation' && kind && (hikingFlow || campingFlow || eventFlow || activityFlow) && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <CampingTransportationStepBody
              draft={draft}
              patchDraft={patchDraft}
              hint={
                activityFlow
                  ? 'How can people reach the meeting spot?'
                  : campingFlow
                    ? undefined
                    : hikingFlow
                      ? 'How can people reach the trailhead?'
                      : 'How can people reach the event?'
              }
            />
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'transportation' && rideshareFlow && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <RideshareTransportationStepBody draft={draft} patchDraft={patchDraft} />
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'audience' && kind && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            {(structuredFlow || activityFlow) ? (
              <HikingAudienceStepBody draft={draft} patchDraft={patchDraft} />
            ) : rideshareFlow ? (
              <RideshareAudienceStepBody draft={draft} patchDraft={patchDraft} />
            ) : (
              <>
            <div className="mb-4">
              <p className={`mb-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{PARTICIPATION_TOGGLE_QUESTION}</p>
              <div className={EXPLORE_FLOW.choiceGrid2}>
                {([
                  {
                    key: 'approval' as const,
                    title: 'Yes',
                    subtitle: 'They request — you OK',
                    icon: ClipboardCheck,
                  },
                  {
                    key: 'rsvp' as const,
                    title: 'No',
                    subtitle: HIKE_APPROVAL_NO_SUBTITLE,
                    icon: BadgeCheck,
                  },
                ]).map((option) => {
                  const active = draft.participationMode === option.key;
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => patchDraft({ participationMode: option.key })}
                      className={exploreFlowChoiceCardClass(active)}
                    >
                      <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-gray-500'}`} />
                      <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.title}</p>
                      <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            {!draft.genericBuddy && kind !== 'carpool' && (
              <div className={EXPLORE_FLOW.choiceGrid2}>
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
                      onClick={() =>
                        patchDraft(
                          option.key === 'private'
                            ? { joinMode: 'private', participationMode: 'rsvp' }
                            : { joinMode: option.key }
                        )
                      }
                      className={exploreFlowChoiceCardClass(active)}
                    >
                      <Icon className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-gray-500'}`} />
                      <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.title}</p>
                      <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {!draft.genericBuddy && kind !== 'carpool' && draft.joinMode === 'private' && (
              <p className="mt-4 rounded-xl bg-neutral-50 px-3 py-2 text-sm text-gray-600">
                {HIKE_PRIVATE_EVENT_INFO}
              </p>
            )}

            {!draft.genericBuddy && (draft.joinMode === 'open' || kind === 'carpool') && (
              <div className={`space-y-3 ${kind !== 'carpool' ? 'mt-4' : ''}`}>
                {kind === 'carpool' && (
                  <p className="text-sm text-gray-600">Who can request a seat in your ride?</p>
                )}
                <p className={`${EXPLORE_FLOW.choiceCardTitle}`}>Public options</p>
                <div className={EXPLORE_FLOW.choiceGrid2}>
                  {([
                    {
                      key: 'anyone' as AudienceAccess,
                      title: 'Anyone',
                      subtitle: 'Open to all',
                      icon: Users,
                    },
                    {
                      key: 'women_only' as AudienceAccess,
                      title: 'Women only',
                      subtitle: 'For women',
                      icon: UserRound,
                    },
                    ...(kind === 'event' || kind === 'carpool'
                      ? [
                          {
                            key: 'others' as AudienceAccess,
                            title: 'Others',
                            subtitle: 'Custom restriction',
                            icon: MoreHorizontal,
                          },
                        ]
                      : []),
                  ]).map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() =>
                          patchDraft({
                            audienceAccess: option.key,
                            audienceOtherNote: option.key === 'others' ? draft.audienceOtherNote : '',
                          })
                        }
                        className={exploreFlowChoiceCardClass(draft.audienceAccess === option.key)}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            draft.audienceAccess === option.key ? 'text-emerald-600' : 'text-gray-500'
                          }`}
                        />
                        <p className={`mt-2 ${EXPLORE_FLOW.choiceCardTitle}`}>{option.title}</p>
                        <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
                      </button>
                    );
                  })}
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
              </>
            )}

            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton
                disabled={
                  !structuredFlow &&
                  (draft.joinMode === 'open' || kind === 'carpool') &&
                  draft.audienceAccess === 'others' &&
                  !draft.audienceOtherNote.trim()
                }
                onClick={goNext}
              />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'difficulty' && hikingFlow && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <HikingDifficultyStepBody draft={draft} patchDraft={patchDraft} />
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'price' && kind && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
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
          </FlowSheetChrome>
        )}

        {step === 'destination' && structuredFlow && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            {campingFlow ? (
              <CampingDestinationStepBody
                draft={draft}
                patchDraft={patchDraft}
                tenantId={tenantId}
                registryPlaces={registryPlaces}
              />
            ) : eventFlow ? (
              <EventDestinationStepBody
                draft={draft}
                patchDraft={patchDraft}
                tenantId={tenantId}
                registryPlaces={registryPlaces}
              />
            ) : (
              <HikingDestinationStepBody
                draft={draft}
                patchDraft={patchDraft}
                tenantId={tenantId}
                registryPlaces={registryPlaces}
              />
            )}
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'about_trail' && structuredFlow && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            {campingFlow ? (
              <CampingAboutStepBody draft={draft} patchDraft={patchDraft} />
            ) : eventFlow ? (
              <EventAboutStepBody draft={draft} patchDraft={patchDraft} />
            ) : (
              <HikingAboutTrailStepBody draft={draft} patchDraft={patchDraft} />
            )}
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'meeting_point' && (structuredFlow || activityFlow) && !meetingPointMapOpen && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            <p className="mb-3 text-sm text-gray-600">
              {activityFlow
                ? 'Drop the pin where people should meet.'
                : eventFlow
                  ? 'Drop the pin where people should meet.'
                  : GOING_FROM_HINT}
            </p>
            <button
              type="button"
              onClick={() => setMeetingPointMapOpen(true)}
              className="w-full rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 px-4 py-4 text-left"
            >
              <p className="text-sm font-bold text-emerald-800">
                {draft.meetingLatitude != null ? 'Update meeting point pin' : 'Drop meeting point on map'}
              </p>
              {draft.meetingLatitude != null && (
                <p className="mt-1 text-xs text-gray-600">
                  {draft.meetingLatitude.toFixed(4)}, {draft.meetingLongitude?.toFixed(4)}
                </p>
              )}
            </button>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Label (optional)</span>
              <input
                value={draft.meetingPointLabel}
                onChange={(event) => patchDraft({ meetingPointLabel: event.target.value })}
                placeholder="e.g. Mall car park"
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base"
              />
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Extra directions</span>
              <textarea
                value={draft.meetingPointInfo}
                onChange={(event) => patchDraft({ meetingPointInfo: event.target.value })}
                rows={3}
                placeholder="Landmark, WhatsApp on arrival, etc."
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base"
              />
            </label>
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'join_kit' && structuredFlow && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
            {campingFlow ? (
              <CampingJoinKitStepBody draft={draft} patchDraft={patchDraft} />
            ) : eventFlow ? (
              <EventJoinKitStepBody draft={draft} patchDraft={patchDraft} />
            ) : (
              <HikingJoinKitStepBody draft={draft} patchDraft={patchDraft} />
            )}
            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="mt-5 pb-2">
              <NextButton onClick={goNext} />
            </div>
          </FlowSheetChrome>
        )}

        {step === 'information' && kind && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>
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
                <span className="mb-2 block text-sm font-medium text-gray-700">{JOIN_RULES_LABEL}</span>
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
          </FlowSheetChrome>
        )}

        {step === 'publish' && kind && (
          <FlowSheetChrome title={stepTitle} onClose={handleClose} onBack={goBack}>

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
                ) : kind === 'activity' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MoreHorizontal className="h-3.5 w-3.5 text-emerald-600" />
                    {draft.activityTopic ? resolveActivityTopicLabel(draft.activityTopic) : 'Activity'}
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
                {structuredFlow
                  ? eventFlow
                    ? `Meet at ${draft.meetingLatitude?.toFixed(4)}, ${draft.meetingLongitude?.toFixed(4)}`
                    : `Going from ${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}${
                        draft.meetingLatitude != null
                          ? ` · Meet ${draft.meetingLatitude.toFixed(4)}, ${draft.meetingLongitude?.toFixed(4)}`
                          : ''
                      }`
                  : activityFlow
                    ? `Meet ${draft.meetingLatitude?.toFixed(4)}, ${draft.meetingLongitude?.toFixed(4)}${
                        hasFromPin
                          ? ` · From ${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)}`
                          : ''
                      }`
                  : kind === 'carpool' && hasFromPin && hasToPin
                    ? `From ${draft.latitude?.toFixed(4)}, ${draft.longitude?.toFixed(4)} → To ${draft.toLatitude?.toFixed(4)}, ${draft.toLongitude?.toFixed(4)}`
                    : kind === 'carpool'
                      ? 'Set from and to on map'
                      : `Pin on map${draft.locationPrecision === 'general' ? ' · general area' : ' · exact spot'}`}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {structuredFlow || activityFlow ? formatHikeCapacityLabel(draft.capacity) : formatCapacityLabel(draft.capacity)}{' '}
                {kind === 'carpool' ? 'seats' : 'spots'} · {draft.date}
                {hikingFlow && draft.timeMode === 'specific' && draft.endTime
                  ? ` · ${draft.time || draft.meetingTime}–${draft.endTime}`
                  : !structuredFlow && draft.meetingTime
                    ? ` · meet ${draft.meetingTime}`
                    : draft.timeMode === 'specific' && draft.time
                      ? ` · ${draft.time}`
                      : ' · flexible time'}
              </p>
              {activityFlow && draft.joinKit.trim() && (
                <p className="mt-2 line-clamp-3 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">{JOIN_RULES_PREVIEW_LABEL}</span>
                  {draft.joinKit}
                </p>
              )}
              {structuredFlow && draft.trailName.trim() && (
                <p className="mt-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">
                    {campingFlow ? 'Camp: ' : eventFlow ? 'Venue: ' : 'Trail: '}
                  </span>
                  {draft.trailName}
                </p>
              )}
              {structuredFlow && draft.aboutTrail.trim() && (
                <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">About: </span>
                  {draft.aboutTrail}
                </p>
              )}
              {structuredFlow && draft.joinKit.trim() && (
                <p className="mt-2 line-clamp-3 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">{JOIN_RULES_PREVIEW_LABEL}</span>
                  {draft.joinKit}
                </p>
              )}
              {!structuredFlow && draft.meetingPointInfo.trim() && (
                <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">{GOING_FROM_NOTES_PREVIEW_LABEL}</span>
                  {draft.meetingPointInfo}
                </p>
              )}
              {!structuredFlow && draft.description.trim() && (
                <p className="mt-2 line-clamp-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">About: </span>
                  {draft.description}
                </p>
              )}
              {(draft.additionalInstructions.trim() || (kind === 'carpool' && draft.description.trim())) &&
                !structuredFlow && (
                <p className="mt-2 line-clamp-3 text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">{JOIN_RULES_PREVIEW_LABEL}</span>
                  {kind === 'carpool' ? draft.description : draft.additionalInstructions}
                </p>
              )}
              {(structuredFlow || activityFlow) && !rideshareFlow && (
              <p className="mt-1 text-xs text-gray-500">
                {draft.joinMode === 'private'
                  ? 'Private'
                  : !draft.participantsOpenToAll && draft.limitedWomenOnly
                    ? 'Women only'
                    : !draft.participantsOpenToAll && draft.limitedMinAgeEnabled
                      ? `Ages ${draft.ageMin}+`
                      : 'Public · anyone'}
                {!draft.childrenAllowed ? ' · no children' : ''}
                {!draft.petsAllowed ? ' · no pets' : ''}
                {draft.participationMode === 'approval' ? ' · request to join' : " · I'm going"}
              </p>
              )}
              {rideshareFlow && (
                <p className="mt-1 text-xs text-gray-500">
                  Public on map · request to join
                  {!draft.participantsOpenToAll && draft.limitedWomenOnly ? ' · women only' : ''}
                  {!draft.childrenAllowed ? ' · no children' : ''}
                  {!draft.petsAllowed ? ' · no pets' : ''}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 capitalize">
                {hikingFlow
                  ? `${draft.difficulty} · ${draft.vehicleAccess === '4x4' ? '4x4 required' : 'Sedan access'} · ${priceModeLabel(draft.priceMode, kind)}`
                  : campingFlow
                    ? `${draft.vehicleAccess === '4x4' ? '4x4 required' : 'Sedan access'} · ${priceModeLabel(draft.priceMode, kind)}`
                    : rideshareFlow
                      ? `${resolveRideshareVehicleLabel(draft.vehicleAccess)} · ${priceModeLabel(draft.priceMode, kind)}`
                    : activityFlow
                      ? `${draft.vehicleAccess === '4x4' ? '4x4 required' : 'Sedan access'} · ${priceModeLabel(draft.priceMode, kind)}`
                      : kind === 'event'
                        ? `${draft.vehicleAccess === '4x4' ? '4x4 required' : 'Sedan access'} · ${priceModeLabel(draft.priceMode, kind)}`
                        : `${draft.difficulty} · ${priceModeLabel(draft.priceMode, kind)}`}
              </p>
            </div>

            {(hikingFlow || activityFlow) && draft.joinMode !== 'private' && (
              <label className="mt-4 flex items-start gap-3 rounded-2xl border border-neutral-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={draft.carPoolEnabled}
                  onChange={(event) => patchDraft({ carPoolEnabled: event.target.checked })}
                  className="mt-0.5 rounded border-gray-300 text-emerald-600"
                />
                <span className="text-sm text-gray-800">
                  <span className="font-semibold text-gray-900">Offer carpool</span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    Let joiners know you can help with a ride — coordinate seats in chat after publishing.
                  </span>
                </span>
              </label>
            )}

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
                {ORGANIZE_INTRO_PROMPT}
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
          </FlowSheetChrome>
        )}
    </ExploreResponsiveSheet>
  );
};

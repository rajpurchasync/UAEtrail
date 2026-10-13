import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { allowedActivityPricingModes, type ActivityDTO } from '@uaetrail/shared-types';
import { publishOrganizeActivity as publishCreateActivity } from '../../services/organizeActivityPublish';
import { useAuth } from '../../context/AuthContext';
import { afterOrganizeActivityPublishClientRefresh } from '../../hooks/organizePublishClientEffects';
import { useMemberStatus } from '../../hooks/useMemberStatus';
import { setActiveTenantId } from '../../api/tenant';
import { listOrganizePublishProfiles, resolveOrganizePublishingProfileKind } from '../organizePublishTenants';
import {
  organizePublishGateHref,
  organizePublishGateInputFromMemberStatus,
} from '../../utils/organizePublishGate';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { validateOrganizePlaceArea } from '../organizePublishArea';
import {
  buildDateOptions,
  createFlowStepTitle,
  defaultCapacityForKind,
  emptyCreateActivityDraft,
  getCreateFlowSteps,
  locationPickerConfirmLabel,
  locationPickerHint,
  locationPickerTitle,
  validateDraftStep,
  isHikingOrganizeFlow,
  isCampingOrganizeFlow,
  isEventOrganizeFlow,
  isActivityOrganizeFlow,
  isRideshareOrganizeFlow,
  isStructuredOrganizeFlow,
  usesGoingFromOrganizeStep,
  type CreateFlowStepId,
  type LocationPrecision,
  type CreateActivityDraft,
  type CreateActivityKind,
} from './organizeFlow';
import { organizePublishSeed, type OrganizeComposeKind } from '../compose';
import { composeFlowIdFromRoute, defaultParticipationForOrganizeRoute } from '../composeFlowCatalog';
import {
  clearOrganizeWizardSession,
  organizeWizardSessionScope,
  readOrganizeWizardSession,
  writeOrganizeWizardSession,
} from './composeWizardSession';
import { usePlaceRegistry } from '../../hooks/usePlaceRegistry';
import {
  fromLocationLabel,
  ORGANIZE_DEMAND_PREFILL_TITLE,
  ORGANIZE_RIDESHARE_LINKED_NOTICE,
  ORGANIZE_PROFILE_INCOMPLETE_ERROR,
  TO_LOCATION_LABEL,
} from '../createFlowCopy';
import { MAP_CONFIG } from '../../config/platform';
import { OrganizePublishSuccessSheet } from './OrganizePublishSuccessSheet';
import { registryPlaceTypeForOrganizeFlow, type OrganizeCatalogFlow } from './organizeFlows';
import type { OrganizeWizardPrefill } from './organizeWizardPrefill';
import { renderOrganizeWizardSteps } from './organizeWizard/OrganizeWizardSteps';
import type { OrganizeWizardContext } from './organizeWizard/organizeWizardContext';
const CreatePlacePicker = lazy(() =>
  import('./CreatePlacePicker').then((m) => ({ default: m.CreatePlacePicker }))
);

type FlowStep = 'type' | CreateFlowStepId;

export interface CreateActivityFlowProps {
  open: boolean;
  onClose: () => void;
  onPublished?: (activity: ActivityDTO) => void | Promise<void>;
  onOpenHostApplication?: () => void;
  onBackToIntent?: () => void;
  signInHref: string;
  organizeKind?: OrganizeComposeKind | null;
  /** Locked catalog flow from `composeFlowCatalog` (FAB organize sub-kind). */
  catalogFlow?: OrganizeCatalogFlow | null;
  demandPrefill?: OrganizeWizardPrefill | null;
  onCreateLinkedRideshare?: (parentActivity: ActivityDTO) => void;
  planWithBuddyUserId?: string | null;
}

export const CreateActivityFlow = ({
  open,
  onClose,
  onPublished,
  onOpenHostApplication,
  onBackToIntent,
  signInHref,
  organizeKind = null,
  catalogFlow = null,
  demandPrefill = null,
  onCreateLinkedRideshare,
  planWithBuddyUserId = null,
}: CreateActivityFlowProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const {
    canPublish,
    profileComplete,
    isCommunityHost,
    hostTiers,
    canHostPaidActivities,
    tenantId: defaultTenantId,
    ownedProfiles,
    loading: hostGateLoading,
  } = useMemberStatus({ enabled: open && Boolean(user) });

  const publishTenantOptions = useMemo(
    () => listOrganizePublishProfiles(ownedProfiles),
    [ownedProfiles]
  );
  const [publishTenantId, setPublishTenantIdState] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const pick =
      (defaultTenantId && publishTenantOptions.some((p) => p.tenantId === defaultTenantId)
        ? defaultTenantId
        : publishTenantOptions[0]?.tenantId) ?? null;
    setPublishTenantIdState(pick);
  }, [open, defaultTenantId, publishTenantOptions]);

  const setPublishTenantId = useCallback((id: string) => {
    setPublishTenantIdState(id);
    setActiveTenantId(id);
  }, []);

  const tenantId = publishTenantId ?? defaultTenantId;
  const publishingProfileKind = useMemo(() => {
    const profile = publishTenantOptions.find((p) => p.tenantId === tenantId);
    return profile ? resolveOrganizePublishingProfileKind(profile) : null;
  }, [publishTenantOptions, tenantId]);
  const memberDisplayName = user?.displayName ?? null;

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
  const [rideshareOfferNotice, setRideshareOfferNotice] = useState<string | null>(null);

  const kind = draft.kind ?? selectedKind;
  const hikingFlow = isHikingOrganizeFlow(kind, draft.genericBuddy);
  const campingFlow = isCampingOrganizeFlow(kind, draft.genericBuddy);
  const eventFlow = isEventOrganizeFlow(kind, draft.genericBuddy);
  const activityFlow = isActivityOrganizeFlow(kind, draft.genericBuddy);
  const rideshareFlow = isRideshareOrganizeFlow(kind, draft.genericBuddy);
  const goingFromFlow = usesGoingFromOrganizeStep(kind, draft.genericBuddy);
  const structuredFlow = isStructuredOrganizeFlow(kind, draft.genericBuddy);
  const registryPlaceType = catalogFlow
    ? registryPlaceTypeForOrganizeFlow(catalogFlow)
    : kind === 'hiking' || kind === 'camping' || kind === 'event'
      ? kind
      : undefined;
  const registryPlaces = usePlaceRegistry({
    enabled: open && structuredFlow && Boolean(registryPlaceType),
    placeType: registryPlaceType,
  });
  const flowSteps = useMemo(() => {
    if (!kind) return [];
    if (catalogFlow) {
      return catalogFlow.getSteps({
        placeLabelSource: draft.placeLabelSource,
        registryPlaceId: draft.registryPlaceId,
        genericBuddy: draft.genericBuddy,
      });
    }
    return getCreateFlowSteps(kind, draft.genericBuddy, {
      placeLabelSource: draft.placeLabelSource,
      registryPlaceId: draft.registryPlaceId,
    });
  }, [kind, catalogFlow, draft.genericBuddy, draft.placeLabelSource, draft.registryPlaceId]);

  useEffect(() => {
    if (!kind || step === 'type') return;
    const id = step as CreateFlowStepId;
    if (flowSteps.includes(id)) return;
    const meetingIdx = flowSteps.indexOf('meeting_point');
    setStep(meetingIdx >= 0 ? flowSteps[meetingIdx] : flowSteps[0] ?? 'title');
  }, [flowSteps, step, kind]);
  const stepTitleOptions = useMemo(
    () => ({ genericBuddy: draft.genericBuddy }),
    [draft.genericBuddy]
  );
  const dateOptions = useMemo(() => buildDateOptions(), []);

  const organizeFlowId = useMemo(
    () =>
      organizeKind ? composeFlowIdFromRoute({ intent: 'organize', kind: organizeKind }) : null,
    [organizeKind]
  );
  const wizardSessionScope = useMemo(
    () => organizeWizardSessionScope(demandPrefill),
    [
      demandPrefill?.participantIntentId,
      demandPrefill?.sourceActivityId,
      demandPrefill?.linkToParentActivityId,
    ]
  );
  const wizardInitKey = organizeFlowId
    ? `${organizeFlowId}:${wizardSessionScope ?? ''}`
    : demandPrefill
      ? 'prefill'
      : null;
  const wizardInitializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSubmitting(false);
      setShowMonthView(false);
      setRouteMapTarget(null);
      setWhereMapOpen(false);
      setMeetingPointMapOpen(false);
      return;
    }

    if (wizardInitKey && wizardInitializedRef.current === wizardInitKey) return;

    if (demandPrefill?.draft.kind) {
      const prefillKind = demandPrefill.draft.kind;
      setDraft(demandPrefill.draft);
      setSelectedKind(prefillKind);
      const steps = catalogFlow
        ? catalogFlow.getSteps({
            placeLabelSource: demandPrefill.draft.placeLabelSource,
            registryPlaceId: demandPrefill.draft.registryPlaceId,
            genericBuddy: demandPrefill.draft.genericBuddy,
          })
        : getCreateFlowSteps(prefillKind, demandPrefill.draft.genericBuddy);
      setStep(steps[0] ?? 'title');
      setError(null);
      setSubmitting(false);
      setShowMonthView(false);
      setRouteMapTarget(null);
      setWhereMapOpen(false);
      setMeetingPointMapOpen(false);
      setPublishedActivity(null);
      wizardInitializedRef.current = wizardInitKey;
      return;
    }

    if (organizeKind && organizeFlowId) {
      const saved = readOrganizeWizardSession(organizeFlowId, wizardSessionScope);
      if (saved?.draft?.kind) {
        setDraft(saved.draft);
        setSelectedKind(saved.selectedKind);
        setStep(saved.step as FlowStep);
        setError(null);
        setSubmitting(false);
        setShowMonthView(false);
        setRouteMapTarget(null);
        setWhereMapOpen(false);
        setMeetingPointMapOpen(false);
        setPublishedActivity(null);
        wizardInitializedRef.current = wizardInitKey;
        return;
      }

      const seed = organizePublishSeed(organizeKind);
      const createKind = seed.createKind;
      const participationMode =
        defaultParticipationForOrganizeRoute(organizeKind) ?? seed.participationMode;
      const nextDraft: CreateActivityDraft = {
        ...emptyCreateActivityDraft(),
        kind: createKind,
        genericBuddy: seed.genericBuddy,
        participationMode,
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
      wizardInitializedRef.current = wizardInitKey;
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
    demandPrefill,
    organizeKind,
    catalogFlow,
    organizeFlowId,
    wizardSessionScope,
    wizardInitKey,
  ]);

  useEffect(() => {
    if (!open || !organizeFlowId || publishedActivity) return;
    writeOrganizeWizardSession(
      organizeFlowId,
      { step, draft, selectedKind },
      wizardSessionScope
    );
  }, [open, organizeFlowId, wizardSessionScope, step, draft, selectedKind, publishedActivity]);

  const patchDraft = useCallback((patch: Partial<CreateActivityDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    const allowed = new Set(allowedActivityPricingModes(hostTiers, { publishingProfileKind }));
    if (!allowed.has(draft.priceMode)) {
      patchDraft({ priceMode: 'free', priceAmount: 0 });
    }
  }, [hostTiers, publishingProfileKind, draft.priceMode, patchDraft]);

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
      ...(selectedKind === 'rideshare'
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
      const returnPath = `${location.pathname}${location.search}`;
      if (onOpenHostApplication) {
        onOpenHostApplication();
      } else {
        navigate(
          organizePublishGateHref(
            returnPath,
            organizePublishGateInputFromMemberStatus({
              viewerUserId: user?.id ?? null,
              profileComplete,
              canPublish,
              isCommunityHost,
              hostTiers,
            })
          )
        );
      }
      onClose();
      return;
    }

    if (!tenantId) {
      setError(ORGANIZE_PROFILE_INCOMPLETE_ERROR);
      return;
    }

    const validation = validateDraftStep('publish', draft);
    if (validation) {
      setError(validation);
      return;
    }
    const placeAreaValidation = validateOrganizePlaceArea(draft, registryPlaces);
    if (placeAreaValidation) {
      setError(placeAreaValidation);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const linkedIntentId = demandPrefill?.participantIntentId ?? null;
      const activity = await publishCreateActivity({
        draft: { ...draft, kind: draft.kind ?? selectedKind, rideshareEnabled: false },
        tenantId,
        userId: user.id,
        participantIntentId: linkedIntentId,
        sourceActivityId: demandPrefill?.sourceActivityId ?? null,
        linkToParentActivityId: demandPrefill?.linkToParentActivityId ?? null,
      });
      await afterOrganizeActivityPublishClientRefresh(queryClient, {
        activityId: activity.id,
        linkedParticipantIntentId: linkedIntentId,
      });
      if (organizeFlowId) clearOrganizeWizardSession(organizeFlowId, wizardSessionScope);
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
  const isWhereMapOpen = step === 'where' && whereMapOpen;
  const isMeetingPointMapOpen = step === 'meeting_point' && meetingPointMapOpen;
  const isDestMapOpen = step === 'to' && routeMapTarget === 'to';
  const isRouteMapOverlay = kind === 'rideshare' && step === 'route' && routeMapTarget !== null;
  const isFullScreenLocationStep =
    isPickupMapOpen || isWhereMapOpen || isDestMapOpen || isRouteMapOverlay || isMeetingPointMapOpen;

  const hasFromPin = draft.latitude != null && draft.longitude != null;
  const hasToPin = draft.toLatitude != null && draft.toLongitude != null;

  const stepTitle =
    step === 'type' || !kind
      ? demandPrefill
        ? ORGANIZE_DEMAND_PREFILL_TITLE
        : 'Organize'
      : createFlowStepTitle(step as CreateFlowStepId, kind, stepTitleOptions);

  const renderRoutePicker = useCallback(
    (endpoint: 'from' | 'to') => {
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
              <span className="block text-sm font-bold">{isTo ? TO_LOCATION_LABEL : fromLocationLabel('rideshare')}</span>
              <span className="text-xs text-gray-500">
                {placed ? `${lat?.toFixed(4)}, ${lng?.toFixed(4)}` : 'Tap to choose on map'}
              </span>
            </span>
          </span>
          <span className="text-xs font-semibold text-emerald-700">{placed ? 'Edit' : 'Map'}</span>
        </button>
      );
    },
    [draft.latitude, draft.longitude, draft.toLatitude, draft.toLongitude, hasFromPin, hasToPin]
  );

  const wizardCtx = useMemo((): OrganizeWizardContext => ({
    step,
    stepTitle,
    kind,
    draft,
    patchDraft,
    catalogFlow: catalogFlow ?? null,
    organizeKind: organizeKind ?? null,
    demandPrefill: demandPrefill ?? null,
    error,
    tenantId,
    publishTenantOptions,
    publishTenantId: tenantId,
    setPublishTenantId,
    memberDisplayName,
    registryPlaces,
    canPublish,
    hostTiers,
    publishingProfileKind,
    canHostPaidActivities,
    hostGateLoading,
    submitting,
    stepTitleOptions,
    dateOptions,
    showMonthView,
    setShowMonthView,
    hasFromPin,
    hasToPin,
    meetingPointMapOpen,
    setMeetingPointMapOpen,
    setWhereMapOpen,
    setRouteMapTarget,
    selectedKind,
    setSelectedKind,
    goNext,
    goBack,
    goToFirstStep,
    handleClose,
    handlePublish,
    renderRoutePicker,
    hikingFlow,
    campingFlow,
    eventFlow,
    activityFlow,
    rideshareFlow,
    structuredFlow,
    goingFromFlow,
  }), [
    step,
    stepTitle,
    kind,
    draft,
    patchDraft,
    catalogFlow,
    organizeKind,
    demandPrefill,
    error,
    tenantId,
    publishTenantOptions,
    setPublishTenantId,
    memberDisplayName,
    registryPlaces,
    canPublish,
    hostTiers,
    publishingProfileKind,
    canHostPaidActivities,
    hostGateLoading,
    submitting,
    stepTitleOptions,
    dateOptions,
    showMonthView,
    hasFromPin,
    hasToPin,
    meetingPointMapOpen,
    whereMapOpen,
    selectedKind,
    goNext,
    goBack,
    goToFirstStep,
    handleClose,
    handlePublish,
    renderRoutePicker,
    hikingFlow,
    campingFlow,
    eventFlow,
    activityFlow,
    rideshareFlow,
    structuredFlow,
    goingFromFlow,
  ]);

  if (!open) return null;

  if (publishedActivity && kind) {
    const showPostPublishRideshare =
      draft.joinMode !== 'private' &&
      (catalogFlow?.postPublishRideshare === true ||
        (!catalogFlow && (hikingFlow || campingFlow || eventFlow || activityFlow)));

    return (
      <OrganizePublishSuccessSheet
        open={open}
        onClose={onClose}
        tenantId={tenantId}
        publishedActivity={publishedActivity}
        draft={draft}
        kind={kind}
        showPostPublishRideshare={showPostPublishRideshare}
        rideshareNotice={rideshareOfferNotice}
        onCreateLinkedRideshare={() => {
          if (onCreateLinkedRideshare) {
            onCreateLinkedRideshare(publishedActivity);
            return;
          }
          setRideshareOfferNotice('Open this plan from Explore to create a linked rideshare.');
        }}
        onRideshareLinked={() => {
          setRideshareOfferNotice(ORGANIZE_RIDESHARE_LINKED_NOTICE);
          void onPublished?.(publishedActivity);
        }}
        onRideshareLinkError={(message) => setRideshareOfferNotice(message)}
        onViewOnMap={handleViewOnMap}
        planWithBuddyUserId={planWithBuddyUserId}
      />
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
              if (isPickupMapOpen || isWhereMapOpen) {
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

  return (
    <ExploreResponsiveSheet
      open
      onClose={handleClose}
      zClass={EXPLORE_Z.composeFlow}
      overlayFixed
      panelClassName="max-h-[min(78dvh,720px)] px-5 pb-[calc(var(--safe-bottom)+3rem)] pt-1 lg:px-6 lg:pb-6 lg:pt-2"
    >
        {renderOrganizeWizardSteps(wizardCtx)}
    </ExploreResponsiveSheet>
  );
};

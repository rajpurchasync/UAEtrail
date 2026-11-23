import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  allowedActivityPricingModes,
  defaultHikingPackingItems,
  withHikingKitExtras,
  type ActivityDTO,
} from '@uaetrail/shared-types';
import {
  publishHostingActivity as publishCreateActivity,
  updateHostingActivity,
} from '../../services/hostingActivityPublish';
import { createDraftFromPastActivity } from './hostingFromActivity';
import { useAuth } from '../../context/AuthContext';
import { afterHostingActivityPublishClientRefresh } from '../../hooks/hostingPublishClientEffects';
import { useMemberStatus } from '../../hooks/useMemberStatus';
import { setActiveTenantId } from '../../api/tenant';
import { listHostingPublishProfiles, resolveHostingPublishingProfileKind } from '../hostingPublishTenants';
import {
  memberPublishGateHref,
  memberPublishGateInputFromMemberStatus,
} from '../../utils/memberPublishGate';
import { ComposeWizardShell } from '../create/ComposeWizardShell';
import {
  ComposeMapEntryRow,
  ComposePlacePickerOverlay,
  COMPOSE_MAP_INTENTS,
  dismissComposeMapIfOpen,
  formatComposeMapCoord,
  useComposeMapSession,
} from '../create/interactions';
import { bundleHostingWizardPages, wizardPageContaining } from '../create/composeWideWizard';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { MeetingPointPickerIntent } from './hostingWizard/hostingWizardContext';
import { useComposeWizardExitBack } from '../create/useComposeWizardExitBack';
import {
  composeWizardHasDraftContent,
  finishComposeFlowClose,
  isPastWizardStep,
  requestComposeFlowClose,
} from './composeFlowClose';
import { validateHostingPlaceArea } from '../hostingPublishArea';
import { useExplorePublishedAreas } from '../useExplorePublishedAreas';
import {
  areaRowInCatalogCountry,
  DEFAULT_PLACE_CATALOG_COUNTRY,
  nearestPlaceCatalogHostingLeaf,
} from '../../places/placeCatalogDestinationIndex';
import {
  enrichHostingCatalogPlacePick,
  patchPickHostingCatalogPlace,
} from './hostingDestinationDraft';
import {
  HOSTING_DESTINATION_MAP_SEARCH_TITLE,
} from '../createFlowCopy';
import {
  applyHostDestinationMapLocation,
  hostDestinationMapCenter,
  isHostDestinationCatalogMap,
  isHostDestinationCustomMap,
  isHostDestinationMap,
} from './hostingWizard/hostDestinationMap';
import { hostHasProRideshareMapDestination } from '../rideshareDestinationPolicy';
import {
  buildDateOptions,
  createFlowStepTitle,
  defaultCapacityForKind,
  emptyCreateActivityDraft,
  hydrateCreateActivityDraft,
  getCreateFlowSteps,
  locationPickerConfirmLabel,
  locationPickerHint,
  locationPickerTitle,
  validateDraftStep,
  isHikingHostingFlow,
  isCampingHostingFlow,
  isEventHostingFlow,
  isActivityHostingFlow,
  isRideshareHostingFlow,
  isStructuredHostingFlow,
  usesGoingFromHostingStep,
  type CreateFlowStepId,
  type LocationPrecision,
  type CreateActivityDraft,
  type CreateActivityKind,
} from './hostingFlowEngine';
import { hostingPublishSeed, type HostComposeKind } from '../compose';
import { composeFlowIdFromRoute, defaultParticipationForHostRoute } from '../composeFlowCatalog';
import {
  clearHostingWizardSession,
  findHostingWizardLinkSessionScope,
  hostingWizardSessionScope,
  readHostingWizardSession,
  writeHostingWizardSession,
} from './composeWizardSession';
import { usePlaceRegistry } from '../../hooks/usePlaceRegistry';
import {
  fromLocationLabel,
  HOSTING_RIDESHARE_LINKED_NOTICE,
  HOME_START_UNMATCHED,
  HOSTING_PROFILE_INCOMPLETE_ERROR,
  TO_LOCATION_LABEL,
} from '../createFlowCopy';
import { reverseCommunityCity } from '../../lib/placeSearch';
import { MAP_CONFIG } from '../../config/platform';
import { HostingPublishSuccessSheet } from './HostingPublishSuccessSheet';
import {
  HOSTING_PUBLISH_FLOW_IDLE,
  hostingPublishFlowBlocksSessionPersist,
  hostingPublishFlowIsPublishing,
  hostingPublishFlowPublishedActivity,
  type HostingPublishFlowStatus,
} from './hostingPublishFlowStatus';
import { registryPlaceTypeForHostingKindFlow, type HostingKindFlow } from './hostingFlows';
import type { HostingWizardPrefill } from './hostingWizardPrefill';
import { renderHostingWizardSteps } from './hostingWizard/HostingWizardSteps';
import type { HostingWizardContext } from './hostingWizard/hostingWizardContext';

type HostingMapIntent =
  | typeof COMPOSE_MAP_INTENTS.hostDestinationCatalog
  | typeof COMPOSE_MAP_INTENTS.hostCustomSpot
  | typeof COMPOSE_MAP_INTENTS.hostGoingFrom
  | typeof COMPOSE_MAP_INTENTS.hostMeeting
  | typeof COMPOSE_MAP_INTENTS.hostRouteFrom
  | typeof COMPOSE_MAP_INTENTS.hostRouteTo;

type FlowStep = 'type' | CreateFlowStepId;

export interface CreateHostingActivityFlowProps {
  open: boolean;
  onClose: () => void;
  onPublished?: (activity: ActivityDTO) => void | Promise<void>;
  onOpenHostApplication?: () => void;
  onBackToIntent?: () => void;
  signInHref: string;
  hostComposeKind?: HostComposeKind | null;
  /** Locked per-kind hosting flow from `composeFlowCatalog` (FAB → hosting sub-kind). */
  hostingKindFlow?: HostingKindFlow | null;
  seekingPrefill?: HostingWizardPrefill | null;
  onCreateLinkedRideshare?: (parentActivity: ActivityDTO) => void;
  planWithBuddyUserId?: string | null;
  /** Plan manage / host console — update this outing in place (not a new map publish). */
  editActivity?: ActivityDTO | null;
}

export const CreateHostingActivityFlow = ({
  open,
  onClose,
  onPublished,
  onOpenHostApplication,
  onBackToIntent,
  signInHref,
  hostComposeKind = null,
  hostingKindFlow = null,
  seekingPrefill = null,
  planWithBuddyUserId = null,
  editActivity = null,
}: CreateHostingActivityFlowProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const {
    canPublish,
    profileComplete,
    guideProfileComplete,
    isCommunityHost,
    hostTiers,
    canHostPaidActivities,
    tenantId: defaultTenantId,
    ownedProfiles,
    loading: hostGateLoading,
  } = useMemberStatus({ enabled: open && Boolean(user) });

  const publishTenantOptions = useMemo(
    () => listHostingPublishProfiles(ownedProfiles),
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
    return profile ? resolveHostingPublishingProfileKind(profile) : null;
  }, [publishTenantOptions, tenantId]);
  const memberDisplayName = user?.displayName ?? null;

  const [step, setStep] = useState<FlowStep>('type');
  const [draft, setDraft] = useState<CreateActivityDraft>(emptyCreateActivityDraft);
  const [selectedKind, setSelectedKind] = useState<CreateActivityKind | null>(null);
  const [publishStatus, setPublishStatus] = useState<HostingPublishFlowStatus>(
    HOSTING_PUBLISH_FLOW_IDLE
  );
  const [error, setError] = useState<string | null>(null);
  const [showMonthView, setShowMonthView] = useState(false);
  const mapSession = useComposeMapSession<HostingMapIntent>();
  const { openMap, closeMap } = mapSession;
  const [meetingPickerIntent, setMeetingPickerIntent] = useState<MeetingPointPickerIntent>('search');
  const publishedActivity = hostingPublishFlowPublishedActivity(publishStatus);
  const submitting = hostingPublishFlowIsPublishing(publishStatus);
  const [rideshareOfferNotice, setRideshareOfferNotice] = useState<string | null>(null);

  const kind = draft.kind ?? selectedKind;
  const hikingFlow = isHikingHostingFlow(kind, draft.genericBuddy);
  const campingFlow = isCampingHostingFlow(kind, draft.genericBuddy);
  const eventFlow = isEventHostingFlow(kind, draft.genericBuddy);
  const activityFlow = isActivityHostingFlow(kind, draft.genericBuddy);
  const rideshareFlow = isRideshareHostingFlow(kind, draft.genericBuddy);
  const goingFromFlow = usesGoingFromHostingStep(kind, draft.genericBuddy);
  const structuredFlow = isStructuredHostingFlow(kind, draft.genericBuddy);
  const registryPlaceType = hostingKindFlow
    ? registryPlaceTypeForHostingKindFlow(hostingKindFlow)
    : kind === 'hiking' || kind === 'camping' || kind === 'event'
      ? kind
      : undefined;
  const publishedAreas = useExplorePublishedAreas();
  const catalogCountry = DEFAULT_PLACE_CATALOG_COUNTRY;
  const destinationAreas = useMemo(
    () => publishedAreas.filter((row) => areaRowInCatalogCountry(row, catalogCountry)),
    [publishedAreas, catalogCountry]
  );

  const catalogPlaces = usePlaceRegistry({
    enabled: structuredFlow && Boolean(registryPlaceType),
    placeType: registryPlaceType,
    countryCode:
      hikingFlow || campingFlow || eventFlow ? catalogCountry : undefined,
  });
  const flowSteps = useMemo(() => {
    if (!kind) return [];
    if (hostingKindFlow) {
      return hostingKindFlow.getSteps({
        placeLabelSource: draft.placeLabelSource,
        registryPlaceId: draft.registryPlaceId,
        genericBuddy: draft.genericBuddy,
      });
    }
    return getCreateFlowSteps(kind, draft.genericBuddy, {
      placeLabelSource: draft.placeLabelSource,
      registryPlaceId: draft.registryPlaceId,
    });
  }, [kind, hostingKindFlow, draft.genericBuddy, draft.placeLabelSource, draft.registryPlaceId]);
  const wizardPages = useMemo(
    () => (isMobile ? flowSteps.map((id) => [id]) : bundleHostingWizardPages(flowSteps)),
    [flowSteps, isMobile]
  );

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

  const hostingFlowId = useMemo(
    () =>
      hostComposeKind
        ? composeFlowIdFromRoute({ composeKind: 'activity', kind: hostComposeKind })
        : null,
    [hostComposeKind]
  );
  const wizardPrefill = useMemo(
    () =>
      seekingPrefill ??
      (editActivity ? { draft: createDraftFromPastActivity(editActivity) } : null),
    [seekingPrefill, editActivity]
  );
  const wizardSessionScope = useMemo(() => {
    if (editActivity) return `edit:${editActivity.id}`;
    const fromPrefill = hostingWizardSessionScope(wizardPrefill);
    if (fromPrefill) return fromPrefill;
    if (hostingFlowId) return findHostingWizardLinkSessionScope(hostingFlowId);
    return undefined;
  }, [editActivity, wizardPrefill, hostingFlowId]);
  const wizardInitKey = editActivity
    ? `edit:${editActivity.id}`
    : hostingFlowId
      ? `${hostingFlowId}:${wizardSessionScope ?? ''}`
      : wizardPrefill
        ? 'prefill'
        : null;
  const wizardInitializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setPublishStatus(HOSTING_PUBLISH_FLOW_IDLE);
      setShowMonthView(false);
      closeMap();
      return;
    }

    if (wizardInitKey && wizardInitializedRef.current === wizardInitKey) return;

    if (wizardPrefill?.draft.kind) {
      const prefillKind = wizardPrefill.draft.kind;
      setDraft(hydrateCreateActivityDraft(wizardPrefill.draft));
      setSelectedKind(prefillKind);
      const steps = hostingKindFlow
        ? hostingKindFlow.getSteps({
            placeLabelSource: wizardPrefill.draft.placeLabelSource,
            registryPlaceId: wizardPrefill.draft.registryPlaceId,
            genericBuddy: wizardPrefill.draft.genericBuddy,
          })
        : getCreateFlowSteps(prefillKind, wizardPrefill.draft.genericBuddy);
      setStep(steps[0] ?? 'title');
      setError(null);
      setPublishStatus(HOSTING_PUBLISH_FLOW_IDLE);
      setShowMonthView(false);
      closeMap();
      wizardInitializedRef.current = wizardInitKey;
      return;
    }

    if (hostComposeKind && hostingFlowId) {
      const saved = readHostingWizardSession(hostingFlowId, wizardSessionScope);
      if (saved?.draft?.kind) {
        setDraft(hydrateCreateActivityDraft(saved.draft));
        setSelectedKind(saved.selectedKind);
        setStep(saved.step as FlowStep);
        setError(null);
        setPublishStatus(HOSTING_PUBLISH_FLOW_IDLE);
        setShowMonthView(false);
        closeMap();
        wizardInitializedRef.current = wizardInitKey;
        return;
      }

      const seed = hostingPublishSeed(hostComposeKind);
      const createKind = seed.createKind;
      const participationMode =
        defaultParticipationForHostRoute(hostComposeKind) ?? seed.participationMode;
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
      setPublishStatus(HOSTING_PUBLISH_FLOW_IDLE);
      setShowMonthView(false);
      closeMap();
      wizardInitializedRef.current = wizardInitKey;
      return;
    }

    if (!user) {
      onClose();
    }
  }, [
    open,
    user,
    navigate,
    signInHref,
    onClose,
    wizardPrefill,
    editActivity,
    hostComposeKind,
    hostingKindFlow,
    hostingFlowId,
    wizardSessionScope,
    wizardInitKey,
    closeMap,
  ]);

  useEffect(() => {
    if (!open || !hostingFlowId || hostingPublishFlowBlocksSessionPersist(publishStatus)) return;
    const linkToParentActivityId =
      wizardPrefill?.linkToParentActivityId ??
      readHostingWizardSession(hostingFlowId, wizardSessionScope)?.linkToParentActivityId;
    writeHostingWizardSession(
      hostingFlowId,
      {
        step,
        draft,
        selectedKind,
        ...(linkToParentActivityId ? { linkToParentActivityId } : {}),
        ...(wizardPrefill?.sourceActivityId ? { sourceActivityId: wizardPrefill.sourceActivityId } : {}),
      },
      wizardSessionScope
    );
  }, [
    open,
    hostingFlowId,
    wizardSessionScope,
    step,
    draft,
    selectedKind,
    publishStatus,
    wizardPrefill?.linkToParentActivityId,
    wizardPrefill?.sourceActivityId,
  ]);

  const patchDraft = useCallback((patch: Partial<CreateActivityDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const closeMapOverlay = useCallback(() => {
    closeMap();
    setError(null);
  }, [closeMap]);

  const pickHostingCatalogPlaceById = useCallback(
    (placeId: string) => {
      const place = catalogPlaces.find((row) => row.id === placeId);
      const patch = patchPickHostingCatalogPlace(
        draft,
        placeId,
        catalogPlaces,
        destinationAreas,
        catalogCountry
      );
      patchDraft(patch);
      closeMapOverlay();
      if (!place) return;
      void enrichHostingCatalogPlacePick(place, patch).then((extra) => {
        if (extra) patchDraft(extra);
      });
    },
    [catalogCountry, catalogPlaces, closeMapOverlay, destinationAreas, draft, patchDraft]
  );

  const openDestinationCatalogMap = useCallback(() => {
    openMap(COMPOSE_MAP_INTENTS.hostDestinationCatalog);
  }, [openMap]);

  const openDestinationCustomSpotMap = useCallback(() => {
    openMap(COMPOSE_MAP_INTENTS.hostCustomSpot);
  }, [openMap]);

  const openGoingFromMap = useCallback(() => {
    openMap(COMPOSE_MAP_INTENTS.hostGoingFrom);
  }, [openMap]);

  const openMeetingPointMap = useCallback(() => {
    openMap(COMPOSE_MAP_INTENTS.hostMeeting);
  }, [openMap]);

  const openRouteMap = useCallback(
    (target: 'from' | 'to') => {
      openMap(
        target === 'to' ? COMPOSE_MAP_INTENTS.hostRouteTo : COMPOSE_MAP_INTENTS.hostRouteFrom
      );
    },
    [openMap]
  );

  useEffect(() => {
    const allowed = new Set(allowedActivityPricingModes(hostTiers, { publishingProfileKind }));
    if (!allowed.has(draft.priceMode)) {
      patchDraft({ priceMode: 'free', priceAmount: 0 });
    }
  }, [hostTiers, publishingProfileKind, draft.priceMode, patchDraft]);

  useEffect(() => {
    if (draft.kind !== 'hiking' && draft.kind !== 'event') return;
    const next = withHikingKitExtras(draft.packingItems ?? []);
    if (next.length === (draft.packingItems ?? []).length) return;
    patchDraft({ packingItems: next });
  }, [draft.kind, draft.packingItems, patchDraft]);

  const finishClose = useCallback(() => {
    if (submitting) return;
    finishComposeFlowClose(onClose);
  }, [submitting, onClose]);

  const currentStepIndex = kind && step !== 'type' ? flowSteps.indexOf(step as CreateFlowStepId) : -1;
  const widePageSteps = useMemo(
    () =>
      kind && step !== 'type' ? wizardPageContaining(wizardPages, step as CreateFlowStepId) : [],
    [kind, step, wizardPages]
  );
  const currentPageIndex =
    kind && step !== 'type'
      ? wizardPages.findIndex((page) => page.includes(step as CreateFlowStepId))
      : -1;

  const composeDraftFields = useMemo(
    () => ({
      title: draft.title,
      description: draft.description || draft.aboutTrail,
      notes: draft.additionalInstructions || draft.joinKit,
      placeLabel: draft.trailName || draft.rideshareFromLabel,
      locationLabel: draft.meetingPointLabel || draft.rideshareToLabel,
    }),
    [
      draft.aboutTrail,
      draft.additionalInstructions,
      draft.description,
      draft.joinKit,
      draft.meetingPointLabel,
      draft.rideshareFromLabel,
      draft.rideshareToLabel,
      draft.title,
      draft.trailName,
    ]
  );

  const hasComposeDraft = useMemo(
    () => composeWizardHasDraftContent(composeDraftFields),
    [composeDraftFields]
  );

  const composeInProgress = useMemo(
    () =>
      isPastWizardStep(currentStepIndex) ||
      (step === 'type' && selectedKind != null) ||
      hasComposeDraft,
    [currentStepIndex, hasComposeDraft, selectedKind, step]
  );

  const requestClose = useCallback(
    () =>
      requestComposeFlowClose(
        { hasDraft: hasComposeDraft, inProgress: composeInProgress },
        finishClose
      ),
    [composeInProgress, finishClose, hasComposeDraft]
  );

  const exitWizardBack = useComposeWizardExitBack(requestClose, onBackToIntent);

  const goToFirstStep = useCallback(() => {
    if (!selectedKind) return;
    patchDraft({
      kind: selectedKind,
      capacity: defaultCapacityForKind(selectedKind),
      priceMode: 'free',
      priceAmount: 0,
      ...(selectedKind === 'rideshare'
        ? { joinMode: 'open' as const, participationMode: 'approval' as const }
        : {}),
      ...(selectedKind === 'hiking'
        ? { packingAckMode: 'strict' as const, packingItems: defaultHikingPackingItems() }
        : selectedKind === 'event'
          ? { packingAckMode: 'lenient' as const, packingItems: defaultHikingPackingItems() }
          : {}),
    });
    setStep(getCreateFlowSteps(selectedKind)[0]);
  }, [patchDraft, selectedKind]);

  const goBack = useCallback(() => {
    if (dismissComposeMapIfOpen(mapSession.open, closeMap)) {
      setError(null);
      return;
    }
    if (step === 'type' || currentPageIndex <= 0) {
      if (wizardPrefill || editActivity) {
        requestClose();
        return;
      }
      if (step === 'type' && !hostComposeKind) {
        exitWizardBack();
        return;
      }
      if (currentPageIndex <= 0) {
        exitWizardBack();
        return;
      }
      setStep('type');
      return;
    }
    setStep(wizardPages[currentPageIndex - 1][0]);
  }, [
    mapSession.open,
    closeMap,
    step,
    currentPageIndex,
    wizardPrefill,
    editActivity,
    hostComposeKind,
    requestClose,
    exitWizardBack,
    wizardPages,
  ]);

  const goNext = useCallback(() => {
    if (!kind || step === 'type') return;
    for (const id of widePageSteps) {
      const validation = validateDraftStep(id, draft);
      if (validation) {
        setError(validation);
        return;
      }
    }
    setError(null);
    if (currentPageIndex < 0 || currentPageIndex >= wizardPages.length - 1) return;
    setStep(wizardPages[currentPageIndex + 1][0]);
  }, [kind, step, draft, currentPageIndex, wizardPages, widePageSteps]);

  const handlePublish = useCallback(async () => {
    if (!user?.id) return;

    if (hostGateLoading) return;

    if (!canPublish) {
      const returnPath = `${location.pathname}${location.search}`;
      if (onOpenHostApplication) {
        onOpenHostApplication();
      } else {
        navigate(
          memberPublishGateHref(
            returnPath,
            memberPublishGateInputFromMemberStatus({
              viewerUserId: user?.id ?? null,
              profileComplete,
              guideProfileComplete,
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
      setError(HOSTING_PROFILE_INCOMPLETE_ERROR);
      return;
    }

    const validation = validateDraftStep('publish', draft);
    if (validation) {
      setError(validation);
      return;
    }
    const placeAreaValidation = validateHostingPlaceArea(draft, catalogPlaces);
    if (placeAreaValidation) {
      setError(placeAreaValidation);
      return;
    }

    setPublishStatus({ kind: 'submitting' });
    setError(null);
    try {
      const normalizedDraft = { ...draft, kind: draft.kind ?? selectedKind, rideshareEnabled: false };
      if (editActivity) {
        const updated = await updateHostingActivity({
          activityId: editActivity.id,
          draft: normalizedDraft,
          tenantId,
          userId: user.id,
        });
        await afterHostingActivityPublishClientRefresh(queryClient, {
          activityId: updated.id,
          userId: user.id,
        });
        await onPublished?.(updated);
        setPublishStatus(HOSTING_PUBLISH_FLOW_IDLE);
        onClose();
        return;
      }
      const activity = await publishCreateActivity({
        draft: normalizedDraft,
        tenantId,
        userId: user.id,
        sourceActivityId: wizardPrefill?.sourceActivityId ?? null,
        linkToParentActivityId:
          wizardPrefill?.linkToParentActivityId ??
          readHostingWizardSession(hostingFlowId!, wizardSessionScope)?.linkToParentActivityId ??
          null,
      });
      await afterHostingActivityPublishClientRefresh(queryClient, {
        activityId: activity.id,
        userId: user.id,
      });
      if (hostingFlowId) clearHostingWizardSession(hostingFlowId, wizardSessionScope);
      setPublishStatus({ kind: 'submitted', result: activity });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish. Try again.');
      setPublishStatus(HOSTING_PUBLISH_FLOW_IDLE);
    }
  }, [
    user?.id,
    hostGateLoading,
    canPublish,
    location.pathname,
    location.search,
    onOpenHostApplication,
    navigate,
    profileComplete,
    guideProfileComplete,
    isCommunityHost,
    hostTiers,
    onClose,
    tenantId,
    draft,
    catalogPlaces,
    wizardPrefill,
    editActivity,
    hostingFlowId,
    wizardSessionScope,
    queryClient,
    selectedKind,
    onPublished,
  ]);

  const handleViewOnMap = async () => {
    if (publishedActivity) {
      await onPublished?.(publishedActivity);
    }
    onClose();
  };

  const mapIntent = mapSession.intent;
  const isPickupMapOpen = step === 'meeting' && mapIntent === COMPOSE_MAP_INTENTS.hostGoingFrom;
  const isWhereMapOpen = step === 'where' && mapIntent === COMPOSE_MAP_INTENTS.hostGoingFrom;
  const isDestinationCatalogMapOpen = isHostDestinationCatalogMap(mapIntent);
  const isCustomSpotMapOpen = isHostDestinationCustomMap(mapIntent);
  const isMeetingPointMapOpen = mapIntent === COMPOSE_MAP_INTENTS.hostMeeting;
  const isDestMapOpen = mapIntent === COMPOSE_MAP_INTENTS.hostRouteTo && step === 'to';
  const isRouteMapOverlay =
    mapIntent === COMPOSE_MAP_INTENTS.hostRouteFrom ||
    (mapIntent === COMPOSE_MAP_INTENTS.hostRouteTo && step === 'route');

  const hasFromPin = draft.latitude != null && draft.longitude != null;
  const hasToPin = draft.toLatitude != null && draft.toLongitude != null;

  const widePageTitle =
    editActivity
      ? 'Edit outing'
      : step === 'type' || !kind
        ? 'Host an outing'
        : widePageSteps.length > 1
          ? 'Outing details'
          : createFlowStepTitle(step as CreateFlowStepId, kind, stepTitleOptions);
  const stepTitle = widePageTitle;

  const renderRoutePicker = useCallback(
    (endpoint: 'from' | 'to') => {
      const isTo = endpoint === 'to';
      const placed = isTo ? hasToPin : hasFromPin;
      const lat = isTo ? draft.toLatitude : draft.latitude;
      const lng = isTo ? draft.toLongitude : draft.longitude;

      return (
        <ComposeMapEntryRow
          key={endpoint}
          title={isTo ? TO_LOCATION_LABEL : fromLocationLabel('rideshare')}
          subtitle={formatComposeMapCoord(lat, lng, placed)}
          placed={placed}
          accent={isTo ? 'sky' : 'emerald'}
          onOpen={() => openRouteMap(endpoint)}
        />
      );
    },
    [
      draft.latitude,
      draft.longitude,
      draft.toLatitude,
      draft.toLongitude,
      hasFromPin,
      hasToPin,
      openRouteMap,
    ]
  );

  const wizardCtx = useMemo((): HostingWizardContext => ({
    step,
    widePageSteps,
    widePageTitle,
    stepTitle,
    kind,
    draft,
    patchDraft,
    hostingKindFlow: hostingKindFlow ?? null,
    hostComposeKind: hostComposeKind ?? null,
    seekingPrefill: wizardPrefill ?? null,
    error,
    tenantId,
    publishTenantOptions,
    publishTenantId: tenantId,
    setPublishTenantId,
    memberDisplayName,
    catalogPlaces,
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
    setMeetingPickerIntent,
    openGoingFromMap,
    openMeetingPointMap,
    openDestinationCatalogMap,
    openDestinationCustomSpotMap,
    openRouteMap,
    selectedKind,
    setSelectedKind,
    goNext,
    goBack,
    goToFirstStep,
    handleClose: requestClose,
    handlePublish,
    renderRoutePicker,
    hikingFlow,
    campingFlow,
    eventFlow,
    activityFlow,
    rideshareFlow,
    structuredFlow,
    goingFromFlow,
    isEditMode: Boolean(editActivity),
    editActivityId: editActivity?.id ?? null,
  }), [
    step,
    widePageSteps,
    widePageTitle,
    stepTitle,
    kind,
    draft,
    patchDraft,
    hostingKindFlow,
    hostComposeKind,
    wizardPrefill,
    editActivity,
    error,
    tenantId,
    publishTenantOptions,
    setPublishTenantId,
    memberDisplayName,
    catalogPlaces,
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
    openGoingFromMap,
    openMeetingPointMap,
    openDestinationCatalogMap,
    openDestinationCustomSpotMap,
    openRouteMap,
    selectedKind,
    goNext,
    goBack,
    goToFirstStep,
    requestClose,
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

  if (publishedActivity && kind && !editActivity) {
    const showPostPublishRideshare =
      draft.joinMode !== 'private' &&
      (hostingKindFlow?.postPublishRideshare === true ||
        (!hostingKindFlow && (hikingFlow || campingFlow || eventFlow || activityFlow)));

    return (
      <HostingPublishSuccessSheet
        open={open}
        onClose={onClose}
        tenantId={tenantId}
        publishedActivity={publishedActivity}
        draft={draft}
        kind={kind}
        showPostPublishRideshare={showPostPublishRideshare}
        rideshareNotice={rideshareOfferNotice}
        onRideshareLinked={() => {
          setRideshareOfferNotice(HOSTING_RIDESHARE_LINKED_NOTICE);
          void onPublished?.(publishedActivity);
        }}
        onRideshareLinkError={(message) => setRideshareOfferNotice(message)}
        onViewOnMap={handleViewOnMap}
        planWithBuddyUserId={planWithBuddyUserId}
      />
    );
  }

  const hostMapOpen = mapSession.open && Boolean(kind);
  let mapOverlay: ReactNode = null;
  if (hostMapOpen && kind) {
    const isMeetingPin = isMeetingPointMapOpen;
    const isCustomSpotPin = isCustomSpotMapOpen;
    const isCatalogDestinationPin = isDestinationCatalogMapOpen;
    const isToStep = mapIntent === COMPOSE_MAP_INTENTS.hostRouteTo;
    const hikeCampMeeting = isMeetingPin && (hikingFlow || campingFlow);
    const selectedCatalogPlace = catalogPlaces.find((row) => row.id === draft.registryPlaceId) ?? null;
    const destinationCenter = isHostDestinationMap(mapIntent)
      ? hostDestinationMapCenter(mapIntent, draft, selectedCatalogPlace)
      : null;
    const lat = destinationCenter
      ? destinationCenter.lat
      : isMeetingPin
        ? draft.meetingLatitude ?? draft.trailLatitude ?? MAP_CONFIG.exploreDefaultCenter.lat
        : isToStep
          ? draft.toLatitude ?? MAP_CONFIG.exploreDefaultCenter.lat
          : draft.latitude ?? MAP_CONFIG.exploreDefaultCenter.lat;
    const lng = destinationCenter
      ? destinationCenter.lng
      : isMeetingPin
        ? draft.meetingLongitude ?? draft.trailLongitude ?? MAP_CONFIG.exploreDefaultCenter.lng
        : isToStep
          ? draft.toLongitude ?? MAP_CONFIG.exploreDefaultCenter.lng
          : draft.longitude ?? MAP_CONFIG.exploreDefaultCenter.lng;
    const mapEndpoint: 'from' | 'to' = isToStep || isCustomSpotPin ? 'to' : 'from';
    const mapStep: CreateFlowStepId = step as CreateFlowStepId;
    const pinAlreadySet = isCustomSpotPin
      ? draft.trailLatitude != null && draft.trailLongitude != null
      : isMeetingPin
        ? draft.meetingLatitude != null && draft.meetingLongitude != null
        : isToStep
          ? hasToPin
          : hasFromPin;

    mapOverlay = (
      <ComposePlacePickerOverlay
            open
            openInAdjustMode={
              isCatalogDestinationPin
                ? true
                : hikeCampMeeting
                  ? meetingPickerIntent !== 'search'
                  : pinAlreadySet
            }
            initialPhase={
              isCatalogDestinationPin
                ? 'adjust'
                : hikeCampMeeting
                  ? meetingPickerIntent === 'search'
                    ? 'search'
                    : 'adjust'
                  : undefined
            }
            startCoordsEditing={hikeCampMeeting && meetingPickerIntent === 'edit'}
            onPlaceLabel={
              isMeetingPin
                ? (label: string) => {
                    const trimmed = label.trim();
                    if (trimmed) patchDraft({ meetingPointLabel: trimmed });
                  }
                : undefined
            }
            precision={draft.locationPrecision}
            latitude={lat}
            longitude={lng}
            headerTitle={
              isCatalogDestinationPin
                ? HOSTING_DESTINATION_MAP_SEARCH_TITLE
                : locationPickerTitle(mapStep, kind, mapEndpoint, stepTitleOptions)
            }
            confirmLabel={locationPickerConfirmLabel(kind, mapStep, mapEndpoint)}
            hint={locationPickerHint(kind, draft.locationPrecision)}
            onPrecisionChange={(locationPrecision: LocationPrecision) => patchDraft({ locationPrecision })}
            onLocationChange={(latitude: number, longitude: number) => {
              if (isHostDestinationMap(mapIntent)) {
                const patch = applyHostDestinationMapLocation(mapIntent, latitude, longitude);
                if (patch) patchDraft(patch);
                return;
              }
              if (isMeetingPin) {
                patchDraft({ meetingLatitude: latitude, meetingLongitude: longitude });
                return;
              }
              if (isToStep) {
                if (hostHasProRideshareMapDestination(hostTiers)) {
                  patchDraft({ toLatitude: latitude, toLongitude: longitude });
                } else {
                  patchDraft({
                    toLatitude: latitude,
                    toLongitude: longitude,
                    rideshareDestinationKind: null,
                    rideshareDestinationActivityId: null,
                    rideshareDestinationPlaceId: null,
                    rideshareDestinationDetailLine: null,
                    rideshareDestinationPlaceLabel: null,
                    toLabel: '',
                  });
                }
              } else {
                patchDraft({ latitude, longitude });
              }
            }}
            onBack={goBack}
            onClose={requestClose}
            onConfirm={(_confirmLat: number, _confirmLng: number) => {
              if (isCatalogDestinationPin) {
                const pinLat = draft.trailLatitude;
                const pinLng = draft.trailLongitude;
                if (pinLat != null && pinLng != null) {
                  const nearest = nearestPlaceCatalogHostingLeaf(pinLat, pinLng, catalogPlaces);
                  if (nearest) {
                    pickHostingCatalogPlaceById(nearest.id);
                    return;
                  }
                }
                closeMapOverlay();
                return;
              }
              if (isRouteMapOverlay || isDestMapOpen) {
                if (isToStep && hostHasProRideshareMapDestination(hostTiers)) {
                  patchDraft({
                    rideshareDestinationKind: 'map',
                    rideshareDestinationActivityId: null,
                    rideshareDestinationPlaceId: null,
                    rideshareDestinationDetailLine: null,
                    rideshareDestinationPlaceLabel: null,
                  });
                }
                closeMapOverlay();
                return;
              }
              if (isPickupMapOpen || isWhereMapOpen) {
                if (isPickupMapOpen && kind === 'hiking' && !draft.genericBuddy) {
                  const latitude = draft.latitude;
                  const longitude = draft.longitude;
                  if (latitude == null || longitude == null) return;
                  void reverseCommunityCity(latitude, longitude).then((place) => {
                    if (!place) {
                      setError(HOME_START_UNMATCHED);
                      return;
                    }
                    patchDraft({
                      fromLocationPrecise: true,
                      fromLabel: place.label,
                      latitude,
                      longitude,
                    });
                    closeMapOverlay();
                  });
                  return;
                }
                closeMapOverlay();
                return;
              }
              if (isCustomSpotMapOpen) {
                closeMapOverlay();
                return;
              }
              if (isMeetingPointMapOpen) {
                closeMapOverlay();
                return;
              }
              goNext();
            }}
      />
    );
  }

  return (
    <ComposeWizardShell
      mapOpen={hostMapOpen}
      mapOverlay={mapOverlay}
      onClose={requestClose}
      isMobile={isMobile}
    >
      {renderHostingWizardSteps(wizardCtx)}
    </ComposeWizardShell>
  );
};

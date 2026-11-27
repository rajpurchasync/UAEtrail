import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  allowedActivityPricingModes,
  withHikingKitExtras,
  type ActivityDTO,
} from '@uaetrail/shared-types';
import { runHostingActivityFlowPublish } from './hostingActivityFlowPublish';
import { createDraftFromPastActivity } from './hostingFromActivity';
import { useAuth } from '../../context/AuthContext';
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
import { useExplorePublishedDestinations } from '../useExplorePublishedDestinations';
import {
  areaRowInCatalogCountry,
  DEFAULT_PLACE_CATALOG_COUNTRY,
} from '../../places/placeCatalogDestinationIndex';
import {
  buildDateOptions,
  createFlowStepTitle,
  getCreateFlowSteps,
  isHikingHostingFlow,
  isCampingHostingFlow,
  isEventHostingFlow,
  isActivityHostingFlow,
  isRideshareHostingFlow,
  isStructuredHostingFlow,
  usesGoingFromHostingStep,
  emptyCreateActivityDraft,
  type CreateFlowStepId,
  type CreateActivityDraft,
  type CreateActivityKind,
} from './hostingFlowEngine';
import type { HostComposeKind } from '../compose';
import { composeFlowIdFromRoute } from '../composeFlowCatalog';
import { findHostingWizardLinkSessionScope, hostingWizardSessionScope } from './composeWizardSession';
import { usePlaceRegistry } from '../../hooks/usePlaceRegistry';
import {
  fromLocationLabel,
  HOSTING_RIDESHARE_LINKED_NOTICE,
  TO_LOCATION_LABEL,
} from '../createFlowCopy';
import { HostingPublishSuccessSheet } from './HostingPublishSuccessSheet';
import {
  HOSTING_PUBLISH_FLOW_IDLE,
  hostingPublishFlowIsPublishing,
  hostingPublishFlowPublishedActivity,
  type HostingPublishFlowStatus,
} from './hostingPublishFlowStatus';
import { registryPlaceTypeForHostingKindFlow, type HostingKindFlow } from './hostingFlows';
import type { HostingWizardPrefill } from './hostingWizardPrefill';
import { renderHostingWizardSteps } from './hostingWizard/HostingWizardSteps';
import type { HostingWizardContext } from './hostingWizard/hostingWizardContext';
import { CreateHostingActivityFlowMapOverlay } from './CreateHostingActivityFlowMapOverlay';
import type { HostingActivityFlowStep, HostingMapIntent } from './hostingActivityFlowTypes';
import { resolveHostingActivityFlowMapChrome } from './hostingActivityFlowMapChrome';
import { useHostingActivityFlowMapActions } from './useHostingActivityFlowMapActions';
import { useHostingActivityFlowNavigation } from './useHostingActivityFlowNavigation';
import { useHostingActivityFlowWizardLifecycle } from './useHostingActivityFlowWizardLifecycle';

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
  planWithFriendUserId?: string | null;
  /** Plan manage / host console — update this outing in place (not a new map publish). */
  editActivity?: ActivityDTO | null;
}

export const CreateHostingActivityFlow = ({
  open,
  onClose,
  onPublished,
  onOpenHostApplication,
  onBackToIntent,
  signInHref: _signInHref,
  hostComposeKind = null,
  hostingKindFlow = null,
  seekingPrefill = null,
  planWithFriendUserId = null,
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

  const [step, setStep] = useState<HostingActivityFlowStep>('type');
  const [draft, setDraft] = useState<CreateActivityDraft>(() => emptyCreateActivityDraft());
  const [selectedKind, setSelectedKind] = useState<CreateActivityKind | null>(null);
  const [publishStatus, setPublishStatus] = useState<HostingPublishFlowStatus>(
    HOSTING_PUBLISH_FLOW_IDLE
  );
  const [error, setError] = useState<string | null>(null);
  const [showMonthView, setShowMonthView] = useState(false);
  const mapSession = useComposeMapSession<HostingMapIntent>();
  const { closeMap, openMap } = mapSession;
  void openMap;
  const [meetingPickerIntent, setMeetingPickerIntent] = useState<MeetingPointPickerIntent>('search');
  const publishedActivity = hostingPublishFlowPublishedActivity(publishStatus);
  const submitting = hostingPublishFlowIsPublishing(publishStatus);
  const [rideshareOfferNotice, setRideshareOfferNotice] = useState<string | null>(null);

  const kind = draft.kind ?? selectedKind;
  const hikingFlow = isHikingHostingFlow(kind, draft.communityHostFlow);
  const campingFlow = isCampingHostingFlow(kind, draft.communityHostFlow);
  const eventFlow = isEventHostingFlow(kind, draft.communityHostFlow);
  const activityFlow = isActivityHostingFlow(kind, draft.communityHostFlow);
  const rideshareFlow = isRideshareHostingFlow(kind, draft.communityHostFlow);
  const goingFromFlow = usesGoingFromHostingStep(kind, draft.communityHostFlow);
  const structuredFlow = isStructuredHostingFlow(kind, draft.communityHostFlow);
  const registryPlaceType = hostingKindFlow
    ? registryPlaceTypeForHostingKindFlow(hostingKindFlow)
    : kind === 'hiking' || kind === 'camping' || kind === 'event'
      ? kind
      : undefined;
  const publishedDestinations = useExplorePublishedDestinations();
  const catalogCountry = DEFAULT_PLACE_CATALOG_COUNTRY;
  const destinationAreas = useMemo(
    () => publishedDestinations.filter((row) => areaRowInCatalogCountry(row, catalogCountry)),
    [publishedDestinations, catalogCountry]
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
        communityHostFlow: draft.communityHostFlow,
      });
    }
    return getCreateFlowSteps(kind, draft.communityHostFlow, {
      placeLabelSource: draft.placeLabelSource,
      registryPlaceId: draft.registryPlaceId,
    });
  }, [kind, hostingKindFlow, draft.communityHostFlow, draft.placeLabelSource, draft.registryPlaceId]);
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
    () => ({ communityHostFlow: draft.communityHostFlow }),
    [draft.communityHostFlow]
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

  useHostingActivityFlowWizardLifecycle({
    open,
    user,
    onClose,
    closeMap,
    wizardPrefill,
    editActivity,
    hostComposeKind,
    hostingKindFlow,
    hostingFlowId,
    wizardSessionScope,
    wizardInitKey,
    hostingFlowIdForPersist: hostingFlowId,
    step,
    draft,
    selectedKind,
    publishStatus,
    setError,
    setPublishStatus,
    setShowMonthView,
    setDraft,
    setSelectedKind,
    setStep,
  });

  const patchDraft = useCallback((patch: Partial<CreateActivityDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const {
    closeMapOverlay,
    pickHostingCatalogPlaceById,
    openDestinationCatalogMap,
    openDestinationCustomSpotMap,
    openGoingFromMap,
    openMeetingPointMap,
    openRouteMap,
  } = useHostingActivityFlowMapActions({
    mapSession,
    draft,
    patchDraft,
    catalogPlaces,
    destinationAreas,
    catalogCountry,
    setError,
  });

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

  const { goToFirstStep, goBack, goNext } = useHostingActivityFlowNavigation({
    mapSession,
    closeMap,
    setError,
    step,
    setStep,
    kind,
    draft,
    selectedKind,
    patchDraft,
    wizardPages,
    widePageSteps,
    currentPageIndex,
    wizardPrefill,
    editActivity,
    hostComposeKind,
    requestClose,
    exitWizardBack,
  });

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

    setPublishStatus({ kind: 'submitting' });
    setError(null);
    const result = await runHostingActivityFlowPublish({
      userId: user.id,
      tenantId,
      draft,
      selectedKind,
      catalogPlaces,
      editActivity,
      wizardPrefill,
      hostingFlowId,
      wizardSessionScope,
      queryClient,
    });
    if (result.outcome === 'validation_error') {
      setError(result.message);
      setPublishStatus(HOSTING_PUBLISH_FLOW_IDLE);
      return;
    }
    if (result.outcome === 'publish_error') {
      setError(result.message);
      setPublishStatus(HOSTING_PUBLISH_FLOW_IDLE);
      return;
    }
    if (result.outcome === 'updated') {
      await onPublished?.(result.activity);
      setPublishStatus(HOSTING_PUBLISH_FLOW_IDLE);
      onClose();
      return;
    }
    setPublishStatus({ kind: 'submitted', result: result.activity });
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

  const mapIntent = mapSession.intent as HostingMapIntent | null;
  const {
    isPickupMapOpen,
    isWhereMapOpen,
    isDestinationCatalogMapOpen,
    isCustomSpotMapOpen,
    isMeetingPointMapOpen,
    isDestMapOpen,
    isRouteMapOverlay,
  } = useMemo(() => resolveHostingActivityFlowMapChrome(step, mapIntent), [step, mapIntent]);

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
        planWithFriendUserId={planWithFriendUserId}
      />
    );
  }

  const hostMapOpen = mapSession.open && Boolean(kind);
  const mapOverlay: ReactNode =
    hostMapOpen && kind && mapIntent ? (
      <CreateHostingActivityFlowMapOverlay
        kind={kind}
        step={step}
        mapIntent={mapIntent}
        draft={draft}
        patchDraft={patchDraft}
        catalogPlaces={catalogPlaces}
        hikingFlow={hikingFlow}
        campingFlow={campingFlow}
        meetingPickerIntent={meetingPickerIntent}
        hostTiers={hostTiers}
        stepTitleOptions={stepTitleOptions}
        hasFromPin={hasFromPin}
        hasToPin={hasToPin}
        isDestinationCatalogMapOpen={isDestinationCatalogMapOpen}
        isCustomSpotMapOpen={isCustomSpotMapOpen}
        isMeetingPointMapOpen={isMeetingPointMapOpen}
        isDestMapOpen={isDestMapOpen}
        isRouteMapOverlay={isRouteMapOverlay}
        isPickupMapOpen={isPickupMapOpen}
        isWhereMapOpen={isWhereMapOpen}
        onBack={goBack}
        onClose={requestClose}
        onGoNext={goNext}
        onPickCatalogPlaceById={pickHostingCatalogPlaceById}
        onCloseMapOverlay={closeMapOverlay}
        onError={setError}
      />
    ) : null;

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

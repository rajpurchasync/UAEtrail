import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { useAuth } from '../../context/AuthContext';
import { useMemberStatus } from '../../hooks/useMemberStatus';
import { fetchPublicActivityDetail } from '../../hooks/publicActivityClientApi';
import { ComposeWizardShell } from '../create/ComposeWizardShell';
import { MAP_CONFIG } from '../../config/platform';
import {
  ComposePlacePickerOverlay,
  COMPOSE_MAP_INTENTS,
  dismissComposeMapIfOpen,
  useComposeMapSession,
} from '../create/interactions';
import { useIsMobile } from '../../hooks/useIsMobile';
import { bundleAvailabilityWizardPages, wizardPageContaining } from '../create/composeWideWizard';
import { useComposeWizardExitBack } from '../create/useComposeWizardExitBack';
import {
  composeWizardHasDraftContent,
  finishComposeFlowClose,
  isPastWizardStep,
  requestComposeFlowClose,
} from './composeFlowClose';
import {
  buildDateOptions,
  availabilityFixedFlowStepTitle,
  emptyAvailabilityFixedDraft,
  getAvailabilityFixedFlowSteps,
  getIntentFixedWizardSteps,
  publishAvailabilityFixedSlot,
  validateAvailabilityFixedDraft,
  validateAvailabilityFixedStep,
  type IntentFixedWizardStepId,
  type AvailabilityFixedSubmitResult,
  type AvailabilityFixedDraft,
  type AvailabilityFixedKind,
} from './intentFixedFlowEngine';
import type { LocationPrecision } from './createFlowShared';
import { intentFixedCompose, type IntentFixedComposeKind } from '../compose';
import { destinationIdForExploreDestinationSlug } from '../exploreDestinationFilter';
import { useExplorePublishedDestinations } from '../useExplorePublishedDestinations';
import { composeFlowIdFromRoute } from '../composeFlowCatalog';
import {
  clearAvailabilityWizardSession,
  readAvailabilityWizardSession,
  writeAvailabilityWizardSession,
} from './composeWizardSession';
import { GOING_FROM_LABEL, TO_LOCATION_LABEL } from '../createFlowCopy';
import { AvailabilityFixedSubmitSuccessSheet } from './AvailabilityFixedSubmitSuccessSheet';
import {
  AVAILABILITY_FIXED_SUBMIT_FLOW_IDLE,
  availabilityFixedSubmitFlowBlocksSessionPersist,
  availabilityFixedSubmitFlowIsSubmitting,
  availabilityFixedSubmitFlowResult,
  type AvailabilityFixedSubmitFlowStatus,
} from './availabilityFixedSubmitFlowStatus';
import { renderAvailabilityWizardSteps } from './availabilityWizard/steps';
import type { AvailabilityWizardContext } from './availabilityWizard/availabilityWizardContext';

type SeekingMapIntent =
  | typeof COMPOSE_MAP_INTENTS.seekFrom
  | typeof COMPOSE_MAP_INTENTS.seekTo;

type FlowStep = 'type' | IntentFixedWizardStepId;

interface CreateAvailabilityFixedFlowProps {
  open: boolean;
  onClose: () => void;
  onBackToIntent?: () => void;
  onSubmitted?: (result: AvailabilityFixedSubmitResult) => void;
  signInHref: string;
  availabilityFixedKind?: IntentFixedComposeKind | null;
  exploredestinationSlug?: string | null;
  tenantId?: string | null;
  onCreateLinkedRideshare?: (parent: ActivityDTO) => void;
}

export const CreateAvailabilityFixedFlow = ({
  open,
  onClose,
  onBackToIntent,
  onSubmitted,
  signInHref,
  availabilityFixedKind = null,
  exploreDestinationSlug = null,
  tenantId = null,
  onCreateLinkedRideshare,
}: CreateAvailabilityFixedFlowProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canHostPaidActivities } = useMemberStatus();
  const isMobile = useIsMobile();

  const [step, setStep] = useState<FlowStep>('type');
  const [draft, setDraft] = useState<AvailabilityFixedDraft>(emptyAvailabilityFixedDraft);
  const [selectedKind, setSelectedKind] = useState<AvailabilityFixedKind | null>(null);
  const [submitStatus, setSubmitStatus] = useState<AvailabilityFixedSubmitFlowStatus>(
    AVAILABILITY_FIXED_SUBMIT_FLOW_IDLE
  );
  const [publishedActivity, setPublishedActivity] = useState<ActivityDTO | null>(null);
  const submitting = availabilityFixedSubmitFlowIsSubmitting(submitStatus);
  const submitResult = availabilityFixedSubmitFlowResult(submitStatus);
  const [error, setError] = useState<string | null>(null);
  const [showMonthView, setShowMonthView] = useState(false);
  const publishedAreas = useExplorePublishedDestinations();
  const mapSession = useComposeMapSession<SeekingMapIntent>();
  const { openMap, closeMap } = mapSession;

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
  const flowSteps = useMemo(
    () => (kind ? getIntentFixedWizardSteps(kind, draft.capacity) : []),
    [kind, draft.capacity]
  );
  const wizardPages = useMemo(() => {
    const tail = kind ? getAvailabilityFixedFlowSteps(kind) : [];
    const pages =
      isMobile
        ? flowSteps.map((id) => [id])
        : [
            ...flowSteps
              .filter((id) => id === 'lane' || id === 'engagementTerms')
              .map((id) => [id] as IntentFixedWizardStepId[]),
            ...(tail.length > 0 ? bundleAvailabilityWizardPages(tail) : []),
          ];
    return pages.length > 0 ? pages : flowSteps.map((id) => [id]);
  }, [flowSteps, isMobile, kind]);
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const currentStepIndex =
    kind && step !== 'type' ? flowSteps.indexOf(step as IntentFixedWizardStepId) : -1;
  const widePageSteps =
    kind && step !== 'type' ? wizardPageContaining(wizardPages, step as IntentFixedWizardStepId) : [];
  const currentPageIndex =
    kind && step !== 'type'
      ? wizardPages.findIndex((page) => page.includes(step as IntentFixedWizardStepId))
      : -1;
  const pageHas = (id: IntentFixedWizardStepId) => widePageSteps.includes(id);

  const headerTitle =
    step === 'type' || !kind
      ? 'Find'
      : widePageSteps.length > 1
        ? availabilityFixedFlowStepTitle(widePageSteps[0], kind)
        : step === 'lane' || step === 'engagementTerms'
          ? step === 'lane'
            ? 'Available to go as'
            : 'Guide terms'
          : availabilityFixedFlowStepTitle(step as AvailabilityFixedFlowStepId, kind);

  const availabilityFixedFlowId = useMemo(
    () =>
      availabilityFixedKind ? composeFlowIdFromRoute(intentFixedCompose(availabilityFixedKind)) : null,
    [availabilityFixedKind]
  );
  const availabilityFixedInitKey = availabilityFixedFlowId ?? null;
  const availabilityFixedInitializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSubmitStatus(AVAILABILITY_FIXED_SUBMIT_FLOW_IDLE);
      setShowMonthView(false);
      closeMap();
      return;
    }
    if (availabilityFixedKind && availabilityFixedFlowId) {
      if (availabilityFixedInitializedRef.current === availabilityFixedInitKey) return;

      const saved = readAvailabilityWizardSession(availabilityFixedFlowId);
      if (saved?.draft?.kind) {
        setDraft(saved.draft);
        setSelectedKind(saved.selectedKind);
        setStep(saved.step as FlowStep);
        setError(null);
        setSubmitStatus(AVAILABILITY_FIXED_SUBMIT_FLOW_IDLE);
        setShowMonthView(false);
        closeMap();
        availabilityFixedInitializedRef.current = availabilityFixedInitKey;
        return;
      }

      const destinationId = destinationIdForExploreDestinationSlug(publishedAreas, exploreDestinationSlug);
      setDraft({
        ...emptyAvailabilityFixedDraft(),
        kind: availabilityFixedKind,
        ...(destinationId ? { destinationId } : {}),
      });
      setSelectedKind(availabilityFixedKind);
      setStep('lane');
      setError(null);
      setSubmitStatus(AVAILABILITY_FIXED_SUBMIT_FLOW_IDLE);
      setShowMonthView(false);
      closeMap();
      availabilityFixedInitializedRef.current = availabilityFixedInitKey;
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
    availabilityFixedKind,
    availabilityFixedFlowId,
    availabilityFixedInitKey,
    exploreDestinationSlug,
    publishedAreas,
    closeMap,
  ]);

  useEffect(() => {
    if (!open || !availabilityFixedFlowId || availabilityFixedSubmitFlowBlocksSessionPersist(submitStatus)) {
      return;
    }
    writeAvailabilityWizardSession(availabilityFixedFlowId, { step, draft, selectedKind });
  }, [open, availabilityFixedFlowId, step, draft, selectedKind, submitStatus]);

  const patchDraft = useCallback((patch: Partial<AvailabilityFixedDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const finishClose = () => {
    if (submitting) return;
    finishComposeFlowClose(onClose);
  };

  const hasComposeDraft = composeWizardHasDraftContent({
    title: draft.title,
    notes: draft.comment || draft.additionalInfo,
    placeLabel: draft.preferredArea,
  });
  const composeInProgress =
    isPastWizardStep(currentStepIndex) ||
    (step === 'type' && selectedKind != null) ||
    hasComposeDraft;

  const requestClose = () =>
    requestComposeFlowClose({ hasDraft: hasComposeDraft, inProgress: composeInProgress }, finishClose);

  const exitWizardBack = useComposeWizardExitBack(requestClose, onBackToIntent);

  const goToFirstStep = () => {
    if (!selectedKind) return;
    patchDraft({ kind: selectedKind });
    setStep('lane');
    setError(null);
  };

  const goToStep = (target: IntentFixedWizardStepId) => {
    closeMap();
    setStep(target);
    setError(null);
  };

  const goBack = () => {
    if (dismissComposeMapIfOpen(mapSession.open, closeMap)) {
      setError(null);
      return;
    }
    if (step === 'type' || currentPageIndex <= 0) {
      if (step === 'type' && !availabilityFixedKind) {
        exitWizardBack();
        setError(null);
        return;
      }
      if (currentPageIndex <= 0) {
        exitWizardBack();
        setError(null);
        return;
      }
      setStep('type');
      setError(null);
      return;
    }
    setStep(wizardPages[currentPageIndex - 1][0]);
    setError(null);
  };

  const goNext = () => {
    if (!kind || step === 'type') return;
    for (const id of widePageSteps) {
      const validation = validateAvailabilityFixedStep(id, draft);
      if (validation) {
        setError(validation);
        return;
      }
    }
    setError(null);
    if (currentPageIndex < 0 || currentPageIndex >= wizardPages.length - 1) return;
    setStep(wizardPages[currentPageIndex + 1][0]);
  };

  const handleSubmit = async () => {
    if (!user) return;
    const validation = validateAvailabilityFixedDraft({ ...draft, kind: draft.kind ?? selectedKind });
    if (validation) {
      setError(validation);
      return;
    }
    setSubmitStatus({ kind: 'submitting' });
    setError(null);
    try {
      const result = await publishAvailabilityFixedSlot({ ...draft, kind: draft.kind ?? selectedKind });
      if (availabilityFixedFlowId) clearAvailabilityWizardSession(availabilityFixedFlowId);
      setSubmitStatus({ kind: 'submitted', result });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post your request.');
      setSubmitStatus(AVAILABILITY_FIXED_SUBMIT_FLOW_IDLE);
    }
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
      <AvailabilityFixedSubmitSuccessSheet
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

  const seekMapOpen = mapSession.open && Boolean(kind);
  const isToStep = mapSession.intent === COMPOSE_MAP_INTENTS.seekTo;
  const mapOverlay = seekMapOpen ? (
      <ComposePlacePickerOverlay
        open
        openInAdjustMode={isToStep ? draft.toPinPlaced : draft.fromPinPlaced}
        precision={draft.locationPrecision}
        latitude={
          isToStep
      ? draft.toLatitude ?? MAP_CONFIG.exploreDefaultCenter.lat
            : draft.latitude ?? MAP_CONFIG.exploreDefaultCenter.lat
        }
        longitude={
          isToStep
      ? draft.toLongitude ?? MAP_CONFIG.exploreDefaultCenter.lng
            : draft.longitude ?? MAP_CONFIG.exploreDefaultCenter.lng
        }
            initialZoom={15}
        headerTitle={
          isToStep ? (step === 'to' ? 'Going to' : TO_LOCATION_LABEL) : GOING_FROM_LABEL
        }
            confirmLabel="Use this location"
            onPrecisionChange={(locationPrecision: LocationPrecision) => patchDraft({ locationPrecision })}
            onLocationChange={(latitude: number, longitude: number) => {
              if (isToStep) {
                patchDraft({ toLatitude: latitude, toLongitude: longitude });
              } else {
                patchDraft({ latitude, longitude });
              }
            }}
            onBack={goBack}
            onClose={requestClose}
            onConfirm={(confirmLat: number, confirmLng: number) => {
              if (isToStep) {
                patchDraft({
                  toLatitude: confirmLat,
                  toLongitude: confirmLng,
                  toPinPlaced: true,
                });
              } else {
                patchDraft({
                  latitude: confirmLat,
                  longitude: confirmLng,
                  fromPinPlaced: true,
                });
              }
              closeMap();
              setError(null);
            }}
          />
  ) : null;

  return (
    <ComposeWizardShell
      mapOpen={seekMapOpen}
      mapOverlay={mapOverlay}
      onClose={requestClose}
      isMobile={isMobile}
    >
      {renderAvailabilityWizardSteps({
        step,
        availabilityFixedKind,
        kind,
        selectedKind,
        setSelectedKind,
        draft,
        patchDraft,
        error,
        submitting,
        headerTitle,
        widePageSteps,
        pageHas,
        flowSteps,
        dateOptions,
        showMonthView,
        setShowMonthView,
        publishedAreas,
        goNext,
        goBack,
        goToFirstStep,
        goToStep,
        requestClose,
        handleSubmit: () => {
          void handleSubmit();
        },
        openMap,
        canHostPaidActivities,
      } satisfies AvailabilityWizardContext)}
    </ComposeWizardShell>
  );
};

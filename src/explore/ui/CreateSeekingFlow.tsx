import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ActivityDTO } from '@uaetrail/shared-types';
import { useAuth } from '../../context/AuthContext';
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
import { bundleSeekingWizardPages, wizardPageContaining } from '../create/composeWideWizard';
import { useComposeWizardExitBack } from '../create/useComposeWizardExitBack';
import {
  composeWizardHasDraftContent,
  finishComposeFlowClose,
  isPastWizardStep,
  requestComposeFlowClose,
} from './composeFlowClose';
import {
  buildDateOptions,
  seekingFlowStepTitle,
  emptySeekingDraft,
  getSeekingFlowSteps,
  publishSeekingRequest,
  validateSeekingDraft,
  validateSeekingStep,
  type SeekingFlowStepId,
  type SeekingSubmitResult,
  type SeekingDraft,
  type SeekingKind,
} from './seekingFlowEngine';
import type { LocationPrecision } from './createFlowShared';
import { seekFixedCompose, type SeekingComposeKind } from '../compose';
import { areaIdForExploreAreaSlug } from '../exploreAreaFilter';
import { useExplorePublishedAreas } from '../useExplorePublishedAreas';
import { composeFlowIdFromRoute } from '../composeFlowCatalog';
import {
  clearSeekingWizardSession,
  readSeekingWizardSession,
  writeSeekingWizardSession,
} from './composeWizardSession';
import { GOING_FROM_LABEL, TO_LOCATION_LABEL } from '../createFlowCopy';
import { SeekingSubmitSuccessSheet } from './SeekingSubmitSuccessSheet';
import { renderSeekingWizardSteps } from './seekingWizard/steps';
import type { SeekingWizardContext } from './seekingWizard/seekingWizardContext';

type SeekingMapIntent =
  | typeof COMPOSE_MAP_INTENTS.seekFrom
  | typeof COMPOSE_MAP_INTENTS.seekTo;

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
  const isMobile = useIsMobile();

  const [step, setStep] = useState<FlowStep>('type');
  const [draft, setDraft] = useState<SeekingDraft>(emptySeekingDraft);
  const [selectedKind, setSelectedKind] = useState<SeekingKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SeekingSubmitResult | null>(null);
  const [publishedActivity, setPublishedActivity] = useState<ActivityDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMonthView, setShowMonthView] = useState(false);
  const publishedAreas = useExplorePublishedAreas();
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
  const flowSteps = useMemo(() => (kind ? getSeekingFlowSteps(kind) : []), [kind]);
  const wizardPages = useMemo(
    () => (isMobile ? flowSteps.map((id) => [id]) : bundleSeekingWizardPages(flowSteps)),
    [flowSteps, isMobile]
  );
  const dateOptions = useMemo(() => buildDateOptions(), []);
  const currentStepIndex = kind && step !== 'type' ? flowSteps.indexOf(step as SeekingFlowStepId) : -1;
  const widePageSteps =
    kind && step !== 'type' ? wizardPageContaining(wizardPages, step as SeekingFlowStepId) : [];
  const currentPageIndex =
    kind && step !== 'type'
      ? wizardPages.findIndex((page) => page.includes(step as SeekingFlowStepId))
      : -1;
  const pageHas = (id: SeekingFlowStepId) => widePageSteps.includes(id);

  const headerTitle =
    step === 'type' || !kind
      ? 'Find'
      : widePageSteps.length > 1
        ? seekingFlowStepTitle(widePageSteps[0], kind)
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
      closeMap();
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
        closeMap();
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
      closeMap();
      seekingInitializedRef.current = seekingInitKey;
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
    seekKind,
    seekingFlowId,
    seekingInitKey,
    exploreAreaSlug,
    publishedAreas,
    closeMap,
  ]);

  useEffect(() => {
    if (!open || !seekingFlowId || submitResult) return;
    writeSeekingWizardSession(seekingFlowId, { step, draft, selectedKind });
  }, [open, seekingFlowId, step, draft, selectedKind, submitResult]);

  const patchDraft = useCallback((patch: Partial<SeekingDraft>) => {
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
    setStep(getSeekingFlowSteps(selectedKind)[0]);
    setError(null);
  };

  const goToStep = (target: SeekingFlowStepId) => {
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
      if (step === 'type' && !seekKind) {
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
      const validation = validateSeekingStep(id, draft);
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
            onLocationChange={(latitude, longitude) => {
              if (isToStep) {
                patchDraft({ toLatitude: latitude, toLongitude: longitude });
              } else {
                patchDraft({ latitude, longitude });
              }
            }}
            onBack={goBack}
            onClose={requestClose}
            onConfirm={() => {
              if (isToStep) {
                patchDraft({ toPinPlaced: true });
          } else {
            patchDraft({ fromPinPlaced: true });
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
      {renderSeekingWizardSteps({
        step,
        seekKind,
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
      } satisfies SeekingWizardContext)}
    </ComposeWizardShell>
  );
};

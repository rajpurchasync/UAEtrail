import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlaceKind } from '@uaetrail/shared-types';
import { useNavigate } from 'react-router-dom';
import { facilityDetailPath } from '@uaetrail/shared-types';
import { useAuth } from '../../context/AuthContext';
import { useExplorePublishedDestinations } from '../useExplorePublishedDestinations';
import { destinationIdForExploreDestinationSlug } from '../exploreDestinationFilter';
import { inferEmirateFromPin } from '../hostingPublishDestination';
import { AddSubmitSuccessSheet } from './AddSubmitSuccessSheet';
import { fetchPublicPlaceDetail } from '../../hooks/placeDetailClientApi';
import type { AddSubmitResult } from './addFlow';
import {
  applyFacilityAddParentPlace,
  emptyFacilityAddDraft,
  FACILITY_ADD_STEPS,
  facilityAddStepTitle,
  submitFacilityAdd,
  validateFacilityAddStep,
  type FacilityAddDraft,
  type FacilityAddStepId,
} from './addFacilityFlow';
import {
  COMPOSE_SUBMIT_FLOW_IDLE,
  composeSubmitFlowBlocksSessionPersist,
  composeSubmitFlowIsSubmitting,
  composeSubmitFlowResult,
  type ComposeSubmitFlowStatus,
} from './composeSubmitFlowStatus';
import {
  clearAddWizardSession,
  readAddWizardSession,
  writeAddWizardSession,
} from './composeWizardSession';
import { ComposeWizardShell } from '../create/ComposeWizardShell';
import { useComposeWizardExitBack } from '../create/useComposeWizardExitBack';
import {
  composeWizardHasDraftContent,
  finishComposeFlowClose,
  isPastWizardStep,
  requestComposeFlowClose,
} from './composeFlowClose';
import type { LocationPrecision } from './createFlowShared';
import { MAP_CONFIG } from '../../config/platform';
import {
  ComposePlacePickerOverlay,
  COMPOSE_MAP_INTENTS,
  dismissComposeMapIfOpen,
  useComposeMapSession,
} from '../create/interactions';
import { renderFacilityAddWizardSteps } from './addWizard/facility/FacilityAddWizardSteps';
import type { FacilityAddWizardContext } from './addWizard/facilityWizardContext';

type Props = {
  open: boolean;
  onClose: () => void;
  onBackToIntent?: () => void;
  onSubmitted?: (result: AddSubmitResult) => void;
  signInHref: string;
  exploredestinationSlug?: string | null;
  /** `facilityOnPlace` deep link — prefill `parentPlaceId`. */
  facilityOnPlaceId?: string | null;
};

export const CreateAddFacilityFlow = ({
  open,
  onClose,
  onBackToIntent,
  onSubmitted,
  signInHref,
  exploreDestinationSlug = null,
  facilityOnPlaceId = null,
}: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const publishedDestinations = useExplorePublishedDestinations();

  const [step, setStep] = useState<FacilityAddStepId>('title');
  const [draft, setDraft] = useState<FacilityAddDraft>(() => emptyFacilityAddDraft());
  const [submitStatus, setSubmitStatus] = useState<ComposeSubmitFlowStatus<AddSubmitResult>>(
    COMPOSE_SUBMIT_FLOW_IDLE
  );
  const submitting = composeSubmitFlowIsSubmitting(submitStatus);
  const submitResult = composeSubmitFlowResult(submitStatus);
  const [error, setError] = useState<string | null>(null);
  const mapSession = useComposeMapSession<typeof COMPOSE_MAP_INTENTS.addFacilityLocation>();
  const [mapPrecision, setMapPrecision] = useState<LocationPrecision>('specific');

  const flowSteps = FACILITY_ADD_STEPS;
  const currentStepIndex = flowSteps.indexOf(step);
  const headerTitle = facilityAddStepTitle(step);
  const initializedRef = useRef(false);
  const parentPrefillRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSubmitStatus(COMPOSE_SUBMIT_FLOW_IDLE);
      mapSession.closeMap();
      return;
    }
    if (!initializedRef.current) {
      const saved = readAddWizardSession('facility');
      if (saved?.draft && 'facilityKind' in saved.draft) {
        setDraft(saved.draft as FacilityAddDraft);
        setStep(saved.step as FacilityAddStepId);
      } else {
        setStep('title');
        const destinationId = destinationIdForExploreDestinationSlug(publishedDestinations, exploreDestinationSlug);
        setDraft({
          ...emptyFacilityAddDraft(),
          ...(destinationId ? { destinationId } : {}),
        });
      }
      setSubmitStatus(COMPOSE_SUBMIT_FLOW_IDLE);
      initializedRef.current = true;
    }
    if (!user) {
      onClose();
    }
  }, [open, user, navigate, signInHref, onClose, exploreDestinationSlug, publishedDestinations]);

  useEffect(() => {
    if (!open) initializedRef.current = false;
  }, [open]);

  useEffect(() => {
    if (!open || composeSubmitFlowBlocksSessionPersist(submitStatus)) return;
    writeAddWizardSession('facility', { step, draft });
  }, [open, step, draft, submitStatus]);

  const patchDraft = useCallback((patch: Partial<FacilityAddDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const selectFacilityKind = useCallback(
    (facilityKind: PlaceKind) => {
      setError(null);
      patchDraft({ facilityKind });
      if (step !== 'facilityType') return;
      const idx = flowSteps.indexOf('facilityType');
      if (idx >= 0 && idx < flowSteps.length - 1) {
        setStep(flowSteps[idx + 1]);
      }
    },
    [flowSteps, patchDraft, step]
  );

  useEffect(() => {
    const placeId = facilityOnPlaceId?.trim();
    if (!open || !placeId || !user) return;
    if (parentPrefillRef.current === placeId) return;
    parentPrefillRef.current = placeId;
    let cancelled = false;
    void fetchPublicPlaceDetail(placeId)
      .then((place) => {
        if (cancelled) return;
        setDraft((prev) => ({ ...prev, ...applyFacilityAddParentPlace(place) }));
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load the trail for this link. Pick a trail on the next steps.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, user, facilityOnPlaceId]);

  const finishClose = () => {
    if (submitting) return;
    finishComposeFlowClose(onClose);
  };

  const hasComposeDraft = composeWizardHasDraftContent({
    title: draft.title,
    description: draft.description,
  });
  const composeInProgress = isPastWizardStep(currentStepIndex) || hasComposeDraft;

  const requestClose = () =>
    requestComposeFlowClose({ hasDraft: hasComposeDraft, inProgress: composeInProgress }, finishClose);

  const exitWizardBack = useComposeWizardExitBack(requestClose, onBackToIntent);

  const goBack = () => {
    if (dismissComposeMapIfOpen(mapSession.open, mapSession.closeMap)) {
      setError(null);
      return;
    }
    if (currentStepIndex <= 0) {
      exitWizardBack();
      return;
    }
    setStep(flowSteps[currentStepIndex - 1]);
    setError(null);
  };

  const goNext = () => {
    const validation = validateFacilityAddStep(step, draft);
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
    const validation = validateFacilityAddStep('review', draft);
    if (validation) {
      setError(validation);
      return;
    }
    setSubmitStatus({ kind: 'submitting' });
    setError(null);
    try {
      const result = await submitFacilityAdd(draft);
      clearAddWizardSession('facility');
      setSubmitStatus({ kind: 'submitted', result });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your facility.');
      setSubmitStatus(COMPOSE_SUBMIT_FLOW_IDLE);
    }
  };

  const handleSuccessView = async () => {
    if (!submitResult) return;
    onSubmitted?.(submitResult);
    navigate(facilityDetailPath(submitResult.location.id));
    onClose();
  };

  if (!open) return null;

  if (submitResult) {
    return (
      <AddSubmitSuccessSheet
        open={open}
        onClose={onClose}
        result={submitResult}
        title={draft.title.trim()}
        onViewPending={handleSuccessView}
        variant="facility"
      />
    );
  }

  const curatedCenter = draft.destinationId
    ? publishedDestinations.find((area) => area.id === draft.destinationId)?.center
    : null;
  const lat =
    (draft.locationPinPlaced ? draft.latitude : null) ??
    curatedCenter?.latitude ??
    draft.latitude ??
    MAP_CONFIG.exploreDefaultCenter.lat;
  const lng =
    (draft.locationPinPlaced ? draft.longitude : null) ??
    curatedCenter?.longitude ??
    draft.longitude ??
    MAP_CONFIG.exploreDefaultCenter.lng;
  const mapOverlay = mapSession.open ? (
      <ComposePlacePickerOverlay
        open
        openInAdjustMode={draft.locationPinPlaced}
        precision={mapPrecision}
        latitude={lat}
        longitude={lng}
        onPrecisionChange={setMapPrecision}
            onLocationChange={(nextLat: number, nextLng: number) => {
          patchDraft({ latitude: nextLat, longitude: nextLng });
        }}
        onBack={goBack}
        onClose={requestClose}
            onConfirm={(confirmLat: number, confirmLng: number) => {
          const inferred = inferEmirateFromPin(confirmLat, confirmLng, publishedDestinations);
          patchDraft({
            latitude: confirmLat,
            longitude: confirmLng,
            locationPinPlaced: true,
            emirate: draft.countryCode === 'AE' ? inferred ?? draft.emirate : draft.emirate,
          });
          mapSession.closeMap();
          setError(null);
        }}
        headerTitle={facilityAddStepTitle('location')}
        confirmLabel="Confirm location"
        hint="Drop the pin where this facility is."
      />
  ) : null;

  return (
    <ComposeWizardShell
      mapOpen={mapSession.open}
      mapOverlay={mapOverlay}
      onClose={requestClose}
      layout="compact"
    >
      {renderFacilityAddWizardSteps({
        step,
        headerTitle,
        draft,
        patchDraft,
        error,
        submitting,
        publishedDestinations,
        goNext,
        goBack,
        requestClose,
        handleSubmit: () => {
          void handleSubmit();
        },
        openLocationMap: () => mapSession.openMap(COMPOSE_MAP_INTENTS.addFacilityLocation),
        selectFacilityKind,
      } satisfies FacilityAddWizardContext)}
    </ComposeWizardShell>
  );
};

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlaceKind } from '@uaetrail/shared-types';
import { useNavigate } from 'react-router-dom';
import { facilityDetailPath } from '@uaetrail/shared-types';
import { useAuth } from '../../context/AuthContext';
import { useExplorePublishedAreas } from '../useExplorePublishedAreas';
import { areaIdForExploreAreaSlug } from '../exploreAreaFilter';
import { inferEmirateFromPin } from '../hostingPublishArea';
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
  exploreAreaSlug?: string | null;
  /** `facilityOnPlace` deep link — prefill `parentPlaceId`. */
  facilityOnPlaceId?: string | null;
};

export const CreateAddFacilityFlow = ({
  open,
  onClose,
  onBackToIntent,
  onSubmitted,
  signInHref,
  exploreAreaSlug = null,
  facilityOnPlaceId = null,
}: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const publishedAreas = useExplorePublishedAreas();

  const [step, setStep] = useState<FacilityAddStepId>('title');
  const [draft, setDraft] = useState<FacilityAddDraft>(() => emptyFacilityAddDraft());
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<AddSubmitResult | null>(null);
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
      setSubmitting(false);
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
        const areaId = areaIdForExploreAreaSlug(publishedAreas, exploreAreaSlug);
        setDraft({
          ...emptyFacilityAddDraft(),
          ...(areaId ? { areaId } : {}),
        });
      }
      setSubmitResult(null);
      initializedRef.current = true;
    }
    if (!user) {
      onClose();
    }
  }, [open, user, navigate, signInHref, onClose, exploreAreaSlug, publishedAreas]);

  useEffect(() => {
    if (!open) initializedRef.current = false;
  }, [open]);

  useEffect(() => {
    if (!open || submitResult) return;
    writeAddWizardSession('facility', { step, draft });
  }, [open, step, draft, submitResult]);

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
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitFacilityAdd(draft);
      clearAddWizardSession('facility');
      setSubmitResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your facility.');
    } finally {
      setSubmitting(false);
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

  const curatedCenter = draft.areaId
    ? publishedAreas.find((area) => area.id === draft.areaId)?.center
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
        onLocationChange={(nextLat, nextLng) => {
          patchDraft({ latitude: nextLat, longitude: nextLng });
        }}
        onBack={goBack}
        onClose={requestClose}
        onConfirm={(confirmLat, confirmLng) => {
          const inferred = inferEmirateFromPin(confirmLat, confirmLng, publishedAreas);
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
        publishedAreas,
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

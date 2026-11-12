import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MAP_CONFIG } from '../../config/platform';
import {
  ComposePlacePickerOverlay,
  COMPOSE_MAP_INTENTS,
  dismissComposeMapIfOpen,
  useComposeMapSession,
} from '../create/interactions';
import { useIsMobile } from '../../hooks/useIsMobile';
import { ComposeWizardShell } from '../create/ComposeWizardShell';
import { bundleAddWizardPages, wizardPageContaining } from '../create/composeWideWizard';
import { useComposeWizardExitBack } from '../create/useComposeWizardExitBack';
import {
  composeWizardHasDraftContent,
  finishComposeFlowClose,
  isPastWizardStep,
  requestComposeFlowClose,
} from './composeFlowClose';
import type { AddVenueKind } from '../addTypes';
import { useExplorePublishedAreas } from '../useExplorePublishedAreas';
import { areaIdForExploreAreaSlug } from '../exploreAreaFilter';
import {
  addFlowStepTitle,
  emptyAddDraft,
  getAddFlowSteps,
  publishAddVenue,
  validateAddStep,
  type AddFlowStepId,
  type AddSubmitResult,
  type AddDraft,
} from './addFlow';
import type { LocationPrecision } from './createFlowShared';
import { inferEmirateFromPin } from '../hostingPublishArea';
import { AddSubmitSuccessSheet } from './AddSubmitSuccessSheet';
import {
  clearAddWizardSession,
  readAddWizardSession,
  writeAddWizardSession,
} from './composeWizardSession';
import { ADD_KIND_LABELS } from './addWizard/AddWizardChrome';
import { renderAddWizardSteps } from './addWizard/steps';
import type { AddWizardContext } from './addWizard/addWizardContext';

interface CreateAddFlowProps {
  open: boolean;
  kind: AddVenueKind;
  onClose: () => void;
  onBackToIntent?: () => void;
  onSubmitted?: (result: AddSubmitResult) => void;
  signInHref: string;
  exploreAreaSlug?: string | null;
}

export const CreateAddFlow = ({
  open,
  kind,
  onClose,
  onBackToIntent,
  onSubmitted,
  signInHref,
  exploreAreaSlug = null,
}: CreateAddFlowProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const publishedAreas = useExplorePublishedAreas();

  const [step, setStep] = useState<AddFlowStepId>('title');
  const [draft, setDraft] = useState<AddDraft>(() => ({
    ...emptyAddDraft(),
    kind,
  }));
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<AddSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapSession = useComposeMapSession<
    typeof COMPOSE_MAP_INTENTS.addLocation | typeof COMPOSE_MAP_INTENTS.addParking
  >();
  const [mapPrecision, setMapPrecision] = useState<LocationPrecision>('specific');

  const flowSteps = useMemo(() => getAddFlowSteps(kind), [kind]);
  const wizardPages = useMemo(
    () => (isMobile ? flowSteps.map((id) => [id]) : bundleAddWizardPages(flowSteps)),
    [flowSteps, isMobile]
  );
  const widePageSteps = wizardPageContaining(wizardPages, step);
  const currentPageIndex = wizardPages.findIndex((page) => page.includes(step));
  const pageHas = (id: AddFlowStepId) => widePageSteps.includes(id);
  const currentStepIndex = flowSteps.indexOf(step);
  const kindMeta = ADD_KIND_LABELS[kind];
  const KindIcon = kindMeta.icon;
  const headerTitle =
    widePageSteps.length > 1 ? `Add ${kindMeta.title}` : addFlowStepTitle(step, kind);

  const addInitKey = kind;
  const addInitializedRef = useRef<AddVenueKind | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSubmitting(false);
      mapSession.closeMap();
      return;
    }
    if (addInitializedRef.current !== addInitKey) {
      const saved = readAddWizardSession(kind);
      if (saved?.draft && kind !== 'facility') {
        setDraft(saved.draft as AddDraft);
        setStep(saved.step as AddFlowStepId);
      } else {
        setStep('title');
        const areaId = areaIdForExploreAreaSlug(publishedAreas, exploreAreaSlug);
        setDraft({
          ...emptyAddDraft(),
          kind,
          ...(areaId ? { areaId } : {}),
        });
      }
      setSubmitResult(null);
      addInitializedRef.current = addInitKey;
    }
    if (!user) {
      onClose();
    }
  }, [open, user, navigate, signInHref, onClose, kind, addInitKey, exploreAreaSlug, publishedAreas]);

  useEffect(() => {
    if (!open || submitResult) return;
    writeAddWizardSession(kind, { step, draft });
  }, [open, kind, step, draft, submitResult]);

  const patchDraft = useCallback((patch: Partial<AddDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const finishClose = () => {
    if (submitting) return;
    finishComposeFlowClose(onClose);
  };

  const hasComposeDraft = composeWizardHasDraftContent({
    title: draft.title,
    description: draft.description,
    placeLabel: draft.areaLabel,
  });
  const composeInProgress = isPastWizardStep(currentStepIndex) || hasComposeDraft;

  const requestClose = () =>
    requestComposeFlowClose({ hasDraft: hasComposeDraft, inProgress: composeInProgress }, finishClose);

  const exitWizardBack = useComposeWizardExitBack(requestClose, onBackToIntent);

  const goToStep = (target: AddFlowStepId) => {
    mapSession.closeMap();
    setStep(target);
    setError(null);
  };

  const goBack = () => {
    if (dismissComposeMapIfOpen(mapSession.open, mapSession.closeMap)) {
      setError(null);
      return;
    }
    if (currentPageIndex <= 0) {
      exitWizardBack();
      return;
    }
    setStep(wizardPages[currentPageIndex - 1][0]);
    setError(null);
  };

  const goNext = () => {
    for (const id of widePageSteps) {
      const validation = validateAddStep(id, { ...draft, kind });
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
    const validation = validateAddStep('review', { ...draft, kind });
    if (validation) {
      setError(validation);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await publishAddVenue({ ...draft, kind });
      clearAddWizardSession(kind);
      setSubmitResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your contribution.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const handleSuccessView = async () => {
    if (!submitResult) return;
    onSubmitted?.(submitResult);
    const type = submitResult.location.activityType;
    if (type === 'shop') {
      navigate(`/shop/${submitResult.location.id}`);
    } else if (type === 'camping') {
      navigate(`/camp/${submitResult.location.id}`);
    } else if (type === 'event') {
      navigate(`/venue/${submitResult.location.id}`);
    } else {
      navigate(`/trail/${submitResult.location.id}`);
    }
    onClose();
  };

  if (submitResult) {
    return (
      <AddSubmitSuccessSheet
        open={open}
        onClose={onClose}
        result={submitResult}
        title={draft.title.trim()}
        onViewPending={handleSuccessView}
      />
    );
  }

  const isParkingMap = mapSession.intent === COMPOSE_MAP_INTENTS.addParking;
  const isLocationMap = mapSession.intent === COMPOSE_MAP_INTENTS.addLocation;
  const addMapOpen = mapSession.open && (isParkingMap || isLocationMap);
    const curatedCenter = draft.areaId
      ? publishedAreas.find((area) => area.id === draft.areaId)?.center
      : null;
  const lat = isParkingMap
      ? draft.parkingLat ?? MAP_CONFIG.exploreDefaultCenter.lat
      : curatedCenter?.latitude ?? draft.latitude ?? MAP_CONFIG.exploreDefaultCenter.lat;
  const lng = isParkingMap
      ? draft.parkingLng ?? MAP_CONFIG.exploreDefaultCenter.lng
      : curatedCenter?.longitude ?? draft.longitude ?? MAP_CONFIG.exploreDefaultCenter.lng;
  const pinAlreadySet = isParkingMap ? draft.parkingPinPlaced : draft.locationPinPlaced;
  const mapOverlay = addMapOpen ? (
      <ComposePlacePickerOverlay
        open
            openInAdjustMode={pinAlreadySet}
            precision={mapPrecision}
            latitude={lat}
            longitude={lng}
            onPrecisionChange={setMapPrecision}
            onLocationChange={(nextLat, nextLng) => {
          if (isParkingMap) {
                patchDraft({ parkingLat: nextLat, parkingLng: nextLng });
              } else {
                patchDraft({ latitude: nextLat, longitude: nextLng });
              }
            }}
            onBack={goBack}
            onClose={requestClose}
            onConfirm={() => {
          if (isParkingMap) {
                patchDraft({ parkingPinPlaced: true });
              } else {
            const inferred = inferEmirateFromPin(draft.latitude, draft.longitude, publishedAreas);
                patchDraft({
                  locationPinPlaced: true,
              emirate: draft.countryCode === 'AE' ? inferred ?? draft.emirate : draft.emirate,
                });
              }
          mapSession.closeMap();
              setError(null);
            }}
        headerTitle={isParkingMap ? 'Pin parking location' : addFlowStepTitle('location', kind)}
        confirmLabel={isParkingMap ? 'Confirm parking' : 'Confirm location'}
            hint={
          isParkingMap
                ? 'Where should people park before starting?'
                : kind === 'hiking'
                  ? 'Drop the pin at the trail starting point.'
                  : kind === 'camping'
                    ? 'Drop the pin where campers meet or set up.'
                    : 'Drop the pin where this place is.'
            }
          />
  ) : null;

  return (
    <ComposeWizardShell
      mapOpen={addMapOpen}
      mapOverlay={mapOverlay}
      onClose={requestClose}
      isMobile={isMobile}
    >
      {renderAddWizardSteps({
        kind,
        kindTitle: kindMeta.title,
        KindIcon,
        draft,
        patchDraft,
        error,
        submitting,
        headerTitle,
        widePageSteps,
        pageHas,
        flowSteps,
        publishedAreas,
        goNext,
        goBack,
        goToStep,
        requestClose,
        handleSubmit: () => {
          void handleSubmit();
        },
        openMap: mapSession.openMap,
      } satisfies AddWizardContext)}
    </ComposeWizardShell>
  );
};

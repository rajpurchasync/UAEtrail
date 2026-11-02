import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { placeDetailPath } from '@uaetrail/shared-types';
import { useAuth } from '../../context/AuthContext';
import { useExplorePublishedAreas } from '../useExplorePublishedAreas';
import { areaIdForExploreAreaSlug } from '../exploreAreaFilter';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { inferEmirateFromPin } from '../hostingPublishArea';
import { placeRegionReady } from '../../config/regions';
import { EmirateFromPinField } from './EmirateFromPinField';
import { AddCuratedAreaStep } from './AddCuratedAreaStep';
import { AddSubmitSuccessSheet } from './AddSubmitSuccessSheet';
import { AddFacilityPreview } from './AddFacilityPreview';
import type { AddSubmitResult } from './addFlow';
import {
  emptyFacilityAddDraft,
  FACILITY_ADD_OPTIONS,
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
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import { FlowSheetChrome } from './ExploreFlowSheetChrome';
import { COMPOSE_SHEET_DRAG_HINT } from '../../hooks/useMobileBrowseSheetImmersive';
import { useComposeSheetExpandedState } from '../create/ComposeSheetExpandedContext';
import { useComposeWizardExitBack } from '../create/useComposeWizardExitBack';
import {
  composeWizardHasDraftContent,
  finishComposeFlowClose,
  isPastWizardStep,
  requestComposeFlowClose,
} from './composeFlowClose';
import { FlowStepTextInput } from './useFlowSheetPrimaryFieldFocus';
import type { LocationPrecision } from './createFlowShared';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { MAP_CONFIG } from '../../config/platform';
import { exploreFlowKindTileClass } from './exploreFlowUi';
import { ComposeWizardPrimaryButton } from './ComposeWizardPrimaryButton';

const CreatePlacePicker = lazy(() =>
  import('./CreatePlacePicker').then((m) => ({ default: m.CreatePlacePicker }))
);

type Props = {
  open: boolean;
  onClose: () => void;
  onBackToIntent?: () => void;
  onSubmitted?: (result: AddSubmitResult) => void;
  signInHref: string;
  exploreAreaSlug?: string | null;
};

const NextButton = ({
  disabled,
  loading,
  label = 'Next',
  onClick,
}: {
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  onClick: () => void;
}) => (
  <ComposeWizardPrimaryButton
    label={label}
    disabled={disabled}
    loading={loading}
    onClick={onClick}
    tone="flow"
  />
);

export const CreateAddFacilityFlow = ({
  open,
  onClose,
  onBackToIntent,
  onSubmitted,
  signInHref,
  exploreAreaSlug = null,
}: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const publishedAreas = useExplorePublishedAreas();

  const [step, setStep] = useState<FacilityAddStepId>('title');
  const [draft, setDraft] = useState<FacilityAddDraft>(() => emptyFacilityAddDraft());
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<AddSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationMapOpen, setLocationMapOpen] = useState(false);
  const [mapPrecision, setMapPrecision] = useState<LocationPrecision>('specific');
  const { sheetExpanded, expandSheet } = useComposeSheetExpandedState();

  const flowSteps = FACILITY_ADD_STEPS;
  const currentStepIndex = flowSteps.indexOf(step);
  const headerTitle = facilityAddStepTitle(step);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSubmitting(false);
      setLocationMapOpen(false);
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
    if (locationMapOpen) {
      setLocationMapOpen(false);
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
    navigate(
      placeDetailPath(submitResult.location.activityType, submitResult.location.id)
    );
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

  if (locationMapOpen) {
    const curatedCenter = draft.areaId
      ? publishedAreas.find((area) => area.id === draft.areaId)?.center
      : null;
    const lat =
      curatedCenter?.latitude ?? draft.latitude ?? MAP_CONFIG.exploreDefaultCenter.lat;
    const lng =
      curatedCenter?.longitude ?? draft.longitude ?? MAP_CONFIG.exploreDefaultCenter.lng;

    return (
      <div className={`fixed inset-0 ${EXPLORE_Z.composeFlow} bg-neutral-100`}>
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-emerald-50" />}>
          <CreatePlacePicker
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
            onConfirm={() => {
              const inferred = inferEmirateFromPin(
                draft.latitude,
                draft.longitude,
                publishedAreas
              );
              patchDraft({
                locationPinPlaced: true,
                emirate: draft.countryCode === 'AE' ? inferred ?? draft.emirate : draft.emirate,
              });
              setLocationMapOpen(false);
              setError(null);
            }}
            headerTitle={facilityAddStepTitle('location')}
            confirmLabel="Confirm location"
            hint="Drop the pin where this facility is."
          />
        </Suspense>
      </div>
    );
  }

  return (
    <ExploreResponsiveSheet
      open
      onClose={requestClose}
      zClass={EXPLORE_Z.composeFlow}
      overlayFixed
      mobileComposeChrome
      expanded={sheetExpanded}
      onExpand={expandSheet}
      expandHint={COMPOSE_SHEET_DRAG_HINT}
      panelClassName="px-5 pb-[calc(var(--safe-bottom)+1rem)] pt-0 lg:px-6 lg:pb-6 lg:pt-2"
    >
      {step === 'title' && (
        <FlowSheetChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <FlowStepTextInput
            value={draft.title}
            onChange={(event) => patchDraft({ title: event.target.value })}
            placeholder="e.g. Hatta Dam car park"
            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
            maxLength={120}
          />
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={!draft.title.trim()} onClick={goNext} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'facilityType' && (
        <FlowSheetChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <div className="grid grid-cols-2 gap-2">
            {FACILITY_ADD_OPTIONS.map((option) => (
              <button
                key={option.kind}
                type="button"
                onClick={() => patchDraft({ facilityKind: option.kind })}
                className={exploreFlowKindTileClass(draft.facilityKind === option.kind)}
              >
                <span className="text-xl font-emoji" aria-hidden>{option.emoji}</span>
                <p className="mt-1 text-sm font-semibold text-neutral-900">{option.label}</p>
              </button>
            ))}
          </div>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={!draft.facilityKind} onClick={goNext} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'curatedArea' && (
        <FlowSheetChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <AddCuratedAreaStep
            areaId={draft.areaId}
            allowNewArea={false}
            onAreaIdChange={(next) => {
              const center = next ? publishedAreas.find((area) => area.id === next)?.center : null;
              patchDraft({
                areaId: next,
                locationPinPlaced: false,
                ...(center ? { latitude: center.latitude, longitude: center.longitude } : {}),
              });
            }}
          />
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={!draft.areaId} onClick={goNext} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'location' && (
        <FlowSheetChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <button
            type="button"
            onClick={() => setLocationMapOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left hover:border-emerald-300"
          >
            <span className="flex items-center gap-2 text-gray-800">
              <MapPin className="h-5 w-5 text-emerald-500" />
              <span>
                <span className="block text-sm font-bold">Facility location</span>
                <span className="text-xs text-gray-500">
                  {draft.locationPinPlaced && draft.latitude != null && draft.longitude != null
                    ? `${draft.latitude.toFixed(4)}, ${draft.longitude.toFixed(4)}`
                    : 'Tap to choose on map'}
                </span>
              </span>
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              {draft.locationPinPlaced ? 'Edit' : 'Map'}
            </span>
          </button>
          <EmirateFromPinField
            pinned={draft.locationPinPlaced}
            inferred={inferEmirateFromPin(draft.latitude, draft.longitude, publishedAreas)}
            countryCode={draft.countryCode}
            onCountryChange={(countryCode) => patchDraft({ countryCode })}
            value={draft.emirate}
            onChange={(emirate) => patchDraft({ emirate })}
          />
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton
              disabled={
                !draft.locationPinPlaced ||
                draft.latitude == null ||
                !placeRegionReady(
                  draft.countryCode,
                  draft.emirate,
                  inferEmirateFromPin(draft.latitude, draft.longitude, publishedAreas)
                )
              }
              onClick={goNext}
            />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'image' && (
        <FlowSheetChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <ImageUpload
            images={draft.images}
            onChange={(images) => patchDraft({ images })}
            max={5}
          />
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={!draft.images.length} onClick={goNext} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'description' && (
        <FlowSheetChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <textarea
            value={draft.description}
            onChange={(event) => patchDraft({ description: event.target.value })}
            rows={5}
            maxLength={3000}
            placeholder="Hours, access notes, what to expect nearby…"
            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
          />
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={draft.description.trim().length < 20} onClick={goNext} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'review' && (
        <FlowSheetChrome title={headerTitle} onClose={requestClose} onBack={goBack}>
          <AddFacilityPreview draft={draft} publishedAreas={publishedAreas} />
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 flex flex-col gap-2 pb-2">
            <NextButton loading={submitting} label="Submit for review" onClick={() => void handleSubmit()} />
          </div>
        </FlowSheetChrome>
      )}
    </ExploreResponsiveSheet>
  );
};

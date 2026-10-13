import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car } from 'lucide-react';
import { MapPin, Mountain, ShoppingBag, Sparkles, Tent } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MAP_CONFIG } from '../../config/platform';
import { EXPLORE_Z } from '../../config/exploreTheme';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
import { FlowSheetChrome } from './ExploreFlowSheetChrome';
import { FlowStepTextInput } from './useFlowSheetPrimaryFieldFocus';
import type { ContributeVenueKind } from '../contributeTypes';
import {
  ACTIVITY_DIFFICULTY_OPTIONS,
  contributeDescriptionPlaceholder,
  contributeFlowStepTitle,
  contributeTitlePlaceholder,
  emptyContributeDraft,
  getContributeFlowSteps,
  publishContributeVenue,
  validateContributeStep,
  type ContributeFlowStepId,
  type ContributeSubmitResult,
  type ContributeDraft,
} from './contributeFlow';
import type { LocationPrecision, ActivityDifficulty } from './organizeFlow';
import { getVenueStateFilterOptions } from '../../config/regions';
import { ContributeHikingTrailPreview } from './ContributeHikingTrailPreview';
import { ContributeCampingSpotPreview } from './ContributeCampingSpotPreview';
import { ContributeSubmitSuccessSheet } from './ContributeSubmitSuccessSheet';
import { CAMPING_CONTRIBUTE_SURFACE_OPTIONS } from './contributeFlows/surfaces';
import { SHOP_DELIVERY_RADIUS_KM_OPTIONS } from './contributeFlows/shop';
import { ContributeShopPreview } from './ContributeShopPreview';
import {
  CONTRIBUTE_REVIEW_FOOTER_CAMP,
  CONTRIBUTE_REVIEW_FOOTER_SHOP,
  CONTRIBUTE_REVIEW_FOOTER_TRAIL,
} from '../createFlowCopy';
import {
  clearContributeWizardSession,
  readContributeWizardSession,
  writeContributeWizardSession,
} from './composeWizardSession';

const CreatePlacePicker = lazy(() =>
  import('./CreatePlacePicker').then((m) => ({ default: m.CreatePlacePicker }))
);

interface CreateContributeFlowProps {
  open: boolean;
  kind: ContributeVenueKind;
  onClose: () => void;
  onBackToIntent?: () => void;
  onSubmitted?: (result: ContributeSubmitResult) => void;
  signInHref: string;
}

const KIND_LABELS: Record<ContributeVenueKind, { title: string; icon: typeof Mountain }> = {
  hiking: { title: 'Hiking Trails', icon: Mountain },
  camping: { title: 'Camping Spots', icon: Tent },
  shop: { title: 'Shops', icon: ShoppingBag },
  event: { title: 'Others', icon: Sparkles },
};

const REVIEW_EDIT_LABELS: Partial<Record<ContributeFlowStepId, string>> = {
  title: 'Title',
  location: 'Location',
  surface: 'Surface',
  image: 'Photos',
  description: 'Description',
  about: 'About',
  trail_stats: 'Distance',
  transport: 'Transport',
  difficulty: 'Difficulty',
  parking: 'Parking',
  contact: 'Contact',
  shop_products: 'Products',
  shop_keywords: 'Keywords',
  shop_delivery: 'Delivery',
  shop_phone: 'Phone',
  shop_email: 'Email',
};

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
    className="w-full rounded-2xl bg-emerald-500 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {loading ? 'Submitting…' : `${label} →`}
  </button>
);

export const CreateContributeFlow = ({
  open,
  kind,
  onClose,
  onBackToIntent,
  onSubmitted,
  signInHref,
}: CreateContributeFlowProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<ContributeFlowStepId>('title');
  const [draft, setDraft] = useState<ContributeDraft>(() => ({
    ...emptyContributeDraft(),
    kind,
  }));
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<ContributeSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationMapOpen, setLocationMapOpen] = useState(false);
  const [parkingMapOpen, setParkingMapOpen] = useState(false);
  const [mapPrecision, setMapPrecision] = useState<LocationPrecision>('specific');

  const flowSteps = useMemo(() => getContributeFlowSteps(kind), [kind]);
  const currentStepIndex = flowSteps.indexOf(step);
  const headerTitle = contributeFlowStepTitle(step, kind);
  const kindMeta = KIND_LABELS[kind];
  const KindIcon = kindMeta.icon;

  const contributeInitKey = kind;
  const contributeInitializedRef = useRef<ContributeVenueKind | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      setSubmitting(false);
      setLocationMapOpen(false);
      setParkingMapOpen(false);
      return;
    }
    if (contributeInitializedRef.current !== contributeInitKey) {
      const saved = readContributeWizardSession(kind);
      if (saved?.draft) {
        setDraft(saved.draft);
        setStep(saved.step as ContributeFlowStepId);
      } else {
        setStep('title');
        setDraft({ ...emptyContributeDraft(), kind });
      }
      setSubmitResult(null);
      contributeInitializedRef.current = contributeInitKey;
    }
    if (!user) {
      navigate(signInHref);
      onClose();
    }
  }, [open, user, navigate, signInHref, onClose, kind, contributeInitKey]);

  useEffect(() => {
    if (!open || submitResult) return;
    writeContributeWizardSession(kind, { step, draft });
  }, [open, kind, step, draft, submitResult]);

  const patchDraft = useCallback((patch: Partial<ContributeDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const goToStep = (target: ContributeFlowStepId) => {
    setLocationMapOpen(false);
    setParkingMapOpen(false);
    setStep(target);
    setError(null);
  };

  const goBack = () => {
    if (locationMapOpen) {
      setLocationMapOpen(false);
      setError(null);
      return;
    }
    if (parkingMapOpen) {
      setParkingMapOpen(false);
      setError(null);
      return;
    }
    if (currentStepIndex <= 0) {
      onBackToIntent?.();
      onClose();
      return;
    }
    setStep(flowSteps[currentStepIndex - 1]);
    setError(null);
  };

  const goNext = () => {
    const validation = validateContributeStep(step, { ...draft, kind });
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
    const validation = validateContributeStep('review', { ...draft, kind });
    if (validation) {
      setError(validation);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await publishContributeVenue({ ...draft, kind });
      clearContributeWizardSession(kind);
      setSubmitResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your contribution.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderPinButton = (
    placed: boolean,
    lat: number | null,
    lng: number | null,
    label: string,
    onOpen: () => void
  ) => (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 px-4 py-4 text-left hover:border-emerald-300"
    >
      <span className="flex items-center gap-2 text-gray-800">
        <MapPin className="h-5 w-5 text-emerald-500" />
        <span>
          <span className="block text-sm font-bold">{label}</span>
          <span className="text-xs text-gray-500">
            {placed && lat != null && lng != null
              ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
              : 'Tap to choose on map'}
          </span>
        </span>
      </span>
      <span className="text-xs font-semibold text-emerald-600">{placed ? 'Edit' : 'Map'}</span>
    </button>
  );

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
      <ContributeSubmitSuccessSheet
        open={open}
        onClose={onClose}
        result={submitResult}
        title={draft.title.trim()}
        onViewPending={handleSuccessView}
      />
    );
  }

  if (locationMapOpen || parkingMapOpen) {
    const isParking = parkingMapOpen;
    const lat = isParking
      ? draft.parkingLat ?? MAP_CONFIG.exploreDefaultCenter.lat
      : draft.latitude ?? MAP_CONFIG.exploreDefaultCenter.lat;
    const lng = isParking
      ? draft.parkingLng ?? MAP_CONFIG.exploreDefaultCenter.lng
      : draft.longitude ?? MAP_CONFIG.exploreDefaultCenter.lng;

    return (
      <div className={`fixed inset-0 ${EXPLORE_Z.composeFlow} bg-neutral-100`}>
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-emerald-50" />}>
          <CreatePlacePicker
            precision={mapPrecision}
            latitude={lat}
            longitude={lng}
            onPrecisionChange={setMapPrecision}
            onLocationChange={(nextLat, nextLng) => {
              if (isParking) {
                patchDraft({ parkingLat: nextLat, parkingLng: nextLng });
              } else {
                patchDraft({ latitude: nextLat, longitude: nextLng });
              }
            }}
            onBack={goBack}
            onClose={handleClose}
            onConfirm={() => {
              if (isParking) {
                patchDraft({ parkingPinPlaced: true });
                setParkingMapOpen(false);
              } else {
                patchDraft({ locationPinPlaced: true });
                setLocationMapOpen(false);
              }
              setError(null);
            }}
            headerTitle={isParking ? 'Pin parking location' : contributeFlowStepTitle('location', kind)}
            confirmLabel={isParking ? 'Confirm parking' : 'Confirm location'}
            hint={
              isParking
                ? 'Where should people park before starting?'
                : kind === 'hiking'
                  ? 'Drop the pin at the trail starting point.'
                  : kind === 'camping'
                    ? 'Drop the pin where campers meet or set up.'
                    : 'Drop the pin where this place is.'
            }
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
      {step === 'title' && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          <label className="block">
            <FlowStepTextInput
              value={draft.title}
              onChange={(event) => patchDraft({ title: event.target.value })}
              placeholder={contributeTitlePlaceholder(kind)}
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
              maxLength={120}
            />
          </label>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={!draft.title.trim()} onClick={goNext} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'location' && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-semibold text-gray-800">Emirate / state</span>
            <select
              value={draft.emirate}
              onChange={(event) => patchDraft({ emirate: event.target.value })}
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
            >
              {getVenueStateFilterOptions().map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {(kind === 'hiking' || kind === 'camping' || kind === 'event') && (
            <label className="mb-4 block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-800">
                Area or landmark <span className="font-normal text-gray-500">(optional)</span>
              </span>
              <FlowStepTextInput
                value={draft.areaLabel}
                onChange={(event) => patchDraft({ areaLabel: event.target.value })}
                placeholder="e.g. Wadi Shawka Dam, Hatta visitor park"
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
                maxLength={120}
              />
            </label>
          )}
          <p className="mb-4 text-sm text-gray-600">
            {kind === 'hiking'
              ? 'Pin where the trail starts.'
              : kind === 'camping'
                ? 'Pin the camp location on the map.'
              : kind === 'shop'
                ? 'Pin where your shop is on the map.'
                : 'Pin this spot on the map.'}
          </p>
          {renderPinButton(
            draft.locationPinPlaced,
            draft.latitude,
            draft.longitude,
            kind === 'hiking'
              ? 'Starting point'
              : kind === 'camping'
                ? 'Camp location'
                : kind === 'shop'
                  ? 'Shop pin'
                  : 'Location pin',
            () => setLocationMapOpen(true)
          )}
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={!draft.locationPinPlaced || !draft.emirate.trim()} onClick={goNext} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'image' && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          {kind === 'hiking' || kind === 'camping' ? (
            <p className="mb-3 text-sm text-gray-600">At least 1 photo required · up to 5.</p>
          ) : kind === 'shop' ? (
            <p className="mb-3 text-sm text-gray-600">One shop cover image (logo or storefront).</p>
          ) : null}
          <ImageUpload
            images={draft.images}
            onChange={(urls) =>
              patchDraft({ images: urls.slice(0, kind === 'shop' ? 1 : 5) })
            }
            keyPrefix="locations"
            kind="location"
            max={kind === 'shop' ? 1 : 5}
            label=""
            preset="rectangle"
          />
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={!draft.images.length} onClick={goNext} />
          </div>
        </FlowSheetChrome>
      )}

      {(step === 'description' || step === 'about') && kind !== 'shop' && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          <textarea
            value={draft.description}
            onChange={(event) => patchDraft({ description: event.target.value })}
            rows={5}
            placeholder={
              kind === 'hiking' && step === 'about'
                ? 'Trail highlights, best season, water, shade, and what hikers should know…'
                : kind === 'camping' && step === 'about'
                  ? 'What makes this spot good for camping? Access, shade, facilities, and tips…'
                  : contributeDescriptionPlaceholder(kind)
            }
            className="w-full resize-none rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
            maxLength={3000}
            autoFocus
          />
          {(kind === 'hiking' || kind === 'camping') && step === 'about' && (
            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-neutral-200 px-4 py-3">
              <input
                type="checkbox"
                checked={draft.childFriendly}
                onChange={(event) => patchDraft({ childFriendly: event.target.checked })}
                className="size-5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-800">Family-friendly spot</span>
            </label>
          )}
          <p className="mt-2 text-xs text-gray-500">At least 20 characters.</p>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={draft.description.trim().length < 20} onClick={goNext} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'about' && kind === 'shop' && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          <textarea
            value={draft.description}
            onChange={(event) => patchDraft({ description: event.target.value })}
            rows={5}
            placeholder="Tell explorers what your shop is about — who you serve and what makes you different…"
            className="w-full resize-none rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-violet-400"
            maxLength={2000}
            autoFocus
          />
          <p className="mt-2 text-xs text-gray-500">At least 20 characters.</p>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={draft.description.trim().length < 20} onClick={goNext} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'shop_products' && kind === 'shop' && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          <textarea
            value={draft.shopProductsServices}
            onChange={(event) => patchDraft({ shopProductsServices: event.target.value })}
            rows={5}
            placeholder="e.g. Camping gear rental, stove fuel, guided kit checks…"
            className="w-full resize-none rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-violet-400"
            maxLength={2000}
            autoFocus
          />
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={draft.shopProductsServices.trim().length < 10} onClick={goNext} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'shop_keywords' && kind === 'shop' && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          <textarea
            value={draft.shopSearchKeywords}
            onChange={(event) => patchDraft({ shopSearchKeywords: event.target.value })}
            rows={3}
            placeholder="hiking boots, camping, 4x4 gear — separate with commas"
            className="w-full resize-none rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-violet-400"
            maxLength={500}
            autoFocus
          />
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={draft.shopSearchKeywords.trim().length < 3} onClick={goNext} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'trail_stats' && kind === 'hiking' && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-800">Distance (km)</span>
              <input
                type="number"
                min={0.1}
                step={0.1}
                inputMode="decimal"
                value={draft.trailDistanceKm ?? ''}
                onChange={(event) => {
                  const raw = event.target.value;
                  patchDraft({ trailDistanceKm: raw === '' ? null : Number(raw) });
                }}
                placeholder="e.g. 8.5"
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-800">Elevation gain (m)</span>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={draft.trailElevationM ?? ''}
                onChange={(event) => {
                  const raw = event.target.value;
                  patchDraft({ trailElevationM: raw === '' ? null : Number(raw) });
                }}
                placeholder="e.g. 450"
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
              />
            </label>
          </div>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton
              disabled={
                draft.trailDistanceKm == null ||
                draft.trailDistanceKm <= 0 ||
                draft.trailElevationM == null ||
                draft.trailElevationM < 0
              }
              onClick={goNext}
            />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'surface' && kind === 'camping' && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          <p className="mb-4 text-sm text-gray-600">What is the ground like? Pick all that apply.</p>
          <div className="flex flex-wrap gap-2">
            {CAMPING_CONTRIBUTE_SURFACE_OPTIONS.map((surface) => {
              const active = draft.surfaceTypes.includes(surface);
              return (
                <button
                  key={surface}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? draft.surfaceTypes.filter((entry) => entry !== surface)
                      : [...draft.surfaceTypes, surface];
                    patchDraft({ surfaceTypes: next });
                  }}
                  className={`rounded-full border-2 px-4 py-2 text-sm font-semibold ${
                    active
                      ? 'border-amber-600 bg-amber-50 text-amber-950'
                      : 'border-neutral-200 bg-white text-gray-700'
                  }`}
                >
                  {surface}
                </button>
              );
            })}
          </div>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={!draft.surfaceTypes.length} onClick={goNext} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'transport' && (kind === 'hiking' || kind === 'camping') && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          <p className="mb-4 text-sm text-gray-600">
            {kind === 'hiking'
              ? 'How can people reach the trailhead?'
              : 'How can people reach the camp area?'}
          </p>
          <div className="grid grid-cols-1 gap-3">
            {[
              { key: 'sedan' as const, title: 'Sedan', subtitle: 'Standard car access' },
              { key: '4x4' as const, title: '4x4', subtitle: 'Off-road or sand track' },
            ].map((option) => {
              const active =
                option.key === 'sedan' ? draft.transportSedan : draft.transport4x4;
              const accent = kind === 'camping' ? 'amber' : 'emerald';
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() =>
                    patchDraft(
                      option.key === 'sedan'
                        ? { transportSedan: !draft.transportSedan }
                        : { transport4x4: !draft.transport4x4 }
                    )
                  }
                  className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left ${
                    active
                      ? accent === 'amber'
                        ? 'border-amber-500 bg-amber-50/50'
                        : 'border-emerald-500 bg-emerald-50/50'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  <Car
                    className={`h-5 w-5 ${
                      active
                        ? accent === 'amber'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                        : 'text-gray-400'
                    }`}
                  />
                  <span>
                    <span className="block text-sm font-bold text-gray-900">{option.title}</span>
                    <span className="text-xs text-gray-500">{option.subtitle}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={!draft.transportSedan && !draft.transport4x4} onClick={goNext} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'difficulty' && kind === 'hiking' && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          <div className="grid grid-cols-1 gap-3">
            {ACTIVITY_DIFFICULTY_OPTIONS.map((option) => {
              const active = draft.difficulty === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => patchDraft({ difficulty: option.value as ActivityDifficulty })}
                  className={`rounded-2xl border-2 px-4 py-4 text-left ${
                    active ? 'border-emerald-500 bg-emerald-50/50' : 'border-neutral-200 bg-white'
                  }`}
                >
                  <p className="text-sm font-bold text-gray-900">{option.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{option.subtitle}</p>
                </button>
              );
            })}
          </div>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={!draft.difficulty} onClick={goNext} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'parking' && kind === 'event' && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          <p className="mb-4 text-sm text-gray-600">Where should people park before heading in?</p>
          {renderPinButton(
            draft.parkingPinPlaced,
            draft.parkingLat,
            draft.parkingLng,
            'Parking pin',
            () => setParkingMapOpen(true)
          )}
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={!draft.parkingPinPlaced} onClick={goNext} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'shop_delivery' && kind === 'shop' && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          <p className="mb-4 text-sm text-gray-600">Do you deliver gear or services?</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: false, label: 'No' },
              { value: true, label: 'Yes' },
            ].map((option) => {
              const active = draft.shopDeliveryOffered === option.value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() =>
                    patchDraft({
                      shopDeliveryOffered: option.value,
                      shopDeliveryRadiusKm: option.value ? draft.shopDeliveryRadiusKm : null,
                    })
                  }
                  className={`rounded-2xl border-2 py-4 text-sm font-bold ${
                    active ? 'border-violet-600 bg-violet-50 text-violet-900' : 'border-neutral-200'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {draft.shopDeliveryOffered === true ? (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-gray-800">Delivery distance</p>
              <div className="flex flex-wrap gap-2">
                {SHOP_DELIVERY_RADIUS_KM_OPTIONS.map((km) => {
                  const active = draft.shopDeliveryRadiusKm === km;
                  return (
                    <button
                      key={km}
                      type="button"
                      onClick={() => patchDraft({ shopDeliveryRadiusKm: km })}
                      className={`rounded-full border-2 px-4 py-2 text-sm font-semibold ${
                        active
                          ? 'border-violet-600 bg-violet-50 text-violet-900'
                          : 'border-neutral-200 text-gray-700'
                      }`}
                    >
                      {km} km
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton
              disabled={
                draft.shopDeliveryOffered === null ||
                (draft.shopDeliveryOffered && draft.shopDeliveryRadiusKm == null)
              }
              onClick={goNext}
            />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'shop_phone' && kind === 'shop' && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Mobile number</span>
            <PhoneInput
              dialCode={draft.phoneCountryCode}
              nationalNumber={draft.phone}
              onDialCodeChange={(value) => patchDraft({ phoneCountryCode: value })}
              onNationalNumberChange={(value) => patchDraft({ phone: value })}
              required
            />
          </label>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={!draft.phone.trim()} onClick={goNext} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'shop_email' && kind === 'shop' && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Shop email</span>
            <input
              type="email"
              value={draft.contactEmail}
              onChange={(event) => patchDraft({ contactEmail: event.target.value })}
              placeholder="shop@example.com"
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-violet-400"
              autoFocus
            />
          </label>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={!draft.contactEmail.trim()} onClick={goNext} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'review' && kind === 'hiking' && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          <ContributeHikingTrailPreview draft={{ ...draft, kind }} />
          <div className="mt-3 flex flex-wrap gap-2">
            {flowSteps
              .filter((target) => target !== 'review')
              .map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => goToStep(target)}
                  className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-emerald-300"
                >
                  Edit {REVIEW_EDIT_LABELS[target] ?? target}
                </button>
              ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">{CONTRIBUTE_REVIEW_FOOTER_TRAIL}</p>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton label="Submit" loading={submitting} onClick={handleSubmit} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'review' && kind === 'camping' && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          <ContributeCampingSpotPreview draft={{ ...draft, kind }} />
          <div className="mt-3 flex flex-wrap gap-2">
            {flowSteps
              .filter((target) => target !== 'review')
              .map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => goToStep(target)}
                  className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-amber-300"
                >
                  Edit {REVIEW_EDIT_LABELS[target] ?? target}
                </button>
              ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">{CONTRIBUTE_REVIEW_FOOTER_CAMP}</p>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton label="Submit" loading={submitting} onClick={handleSubmit} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'review' && kind === 'shop' && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          <ContributeShopPreview draft={{ ...draft, kind }} />
          <div className="mt-3 flex flex-wrap gap-2">
            {flowSteps
              .filter((target) => target !== 'review')
              .map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => goToStep(target)}
                  className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-violet-300"
                >
                  Edit {REVIEW_EDIT_LABELS[target] ?? target}
                </button>
              ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">{CONTRIBUTE_REVIEW_FOOTER_SHOP}</p>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton label="Submit" loading={submitting} onClick={handleSubmit} />
          </div>
        </FlowSheetChrome>
      )}

      {step === 'review' && kind !== 'hiking' && kind !== 'camping' && kind !== 'shop' && (
        <FlowSheetChrome title={headerTitle} onClose={handleClose} onBack={goBack}>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-gray-700">
            <p className="flex items-center gap-2 font-semibold text-gray-900">
              <KindIcon className="h-4 w-4 text-emerald-600" />
              {kindMeta.title}
            </p>
            {draft.title && (
              <p className="mt-2 text-xs text-gray-600">
                <span className="font-semibold text-gray-700">Title: </span>
                {draft.title}
              </p>
            )}
            {draft.locationPinPlaced && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                Location: {draft.latitude?.toFixed(4)}, {draft.longitude?.toFixed(4)}
              </p>
            )}
            {draft.images[0] && (
              <p className="mt-1 text-xs text-gray-500">{draft.images.length} photo{draft.images.length === 1 ? '' : 's'}</p>
            )}
            {draft.description.trim() && (
              <p className="mt-2 line-clamp-4 text-xs text-gray-600">{draft.description}</p>
            )}
            {draft.parkingPinPlaced && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="h-3.5 w-3.5 text-sky-500" />
                Parking: {draft.parkingLat?.toFixed(4)}, {draft.parkingLng?.toFixed(4)}
              </p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {flowSteps
              .filter((target) => target !== 'review')
              .map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => goToStep(target)}
                  className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-emerald-300"
                >
                  Edit {REVIEW_EDIT_LABELS[target] ?? target}
                </button>
              ))}
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Your venue will be reviewed before it appears on the map for others to discover and host at.
          </p>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton label="Submit" loading={submitting} onClick={handleSubmit} />
          </div>
        </FlowSheetChrome>
      )}
    </ExploreResponsiveSheet>
  );
};

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Mountain, ShoppingBag, Sparkles, Tent, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MAP_CONFIG } from '../../config/platform';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';
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
import { formatHostPhonePreview } from '../../components/organisation-console/becomeHostForm';

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
  shop: { title: 'Outdoor shops', icon: ShoppingBag },
  event: { title: 'Others', icon: Sparkles },
};

const REVIEW_EDIT_LABELS: Partial<Record<ContributeFlowStepId, string>> = {
  title: 'Title',
  location: 'Location',
  image: 'Image',
  description: 'Description',
  difficulty: 'Difficulty',
  parking: 'Parking',
  contact: 'Contact',
};

const SheetHeader = ({
  title,
  onBack,
  onClose,
  showBack,
}: {
  title: string;
  onBack?: () => void;
  onClose: () => void;
  showBack?: boolean;
}) => (
  <div className="relative mb-3 flex items-center justify-between">
    {showBack ? (
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-0.5 text-sm font-semibold text-gray-700"
      >
        <ChevronLeft className="h-5 w-5" />
        Back
      </button>
    ) : (
      <span className="w-14" />
    )}
    <h2 className="absolute left-1/2 max-w-[72%] -translate-x-1/2 truncate text-base font-bold text-gray-900">
      {title}
    </h2>
    <button type="button" onClick={onClose} className="rounded-full p-1.5 text-gray-500" aria-label="Close">
      <X className="h-5 w-5" />
    </button>
  </div>
);

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
  const [error, setError] = useState<string | null>(null);
  const [locationMapOpen, setLocationMapOpen] = useState(false);
  const [parkingMapOpen, setParkingMapOpen] = useState(false);
  const [mapPrecision, setMapPrecision] = useState<LocationPrecision>('specific');

  const flowSteps = useMemo(() => getContributeFlowSteps(kind), [kind]);
  const currentStepIndex = flowSteps.indexOf(step);
  const headerTitle = contributeFlowStepTitle(step, kind);
  const kindMeta = KIND_LABELS[kind];
  const KindIcon = kindMeta.icon;

  useEffect(() => {
    if (!open) {
      setStep('title');
      setDraft({ ...emptyContributeDraft(), kind });
      setError(null);
      setSubmitting(false);
      setLocationMapOpen(false);
      setParkingMapOpen(false);
      return;
    }
    if (!user) {
      navigate(signInHref);
      onClose();
    }
  }, [open, user, navigate, signInHref, onClose, kind]);

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
      const submitDraft = { ...draft, kind };
      if (kind === 'shop' && draft.contactEmail.trim()) {
        submitDraft.description = `${draft.description.trim()}\n\nEmail: ${draft.contactEmail.trim()}`;
      }
      const result = await publishContributeVenue(submitDraft);
      onSubmitted?.(result);
      onClose();
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

  if (locationMapOpen || parkingMapOpen) {
    const isParking = parkingMapOpen;
    const lat = isParking
      ? draft.parkingLat ?? MAP_CONFIG.exploreDefaultCenter.lat
      : draft.latitude ?? MAP_CONFIG.exploreDefaultCenter.lat;
    const lng = isParking
      ? draft.parkingLng ?? MAP_CONFIG.exploreDefaultCenter.lng
      : draft.longitude ?? MAP_CONFIG.exploreDefaultCenter.lng;

    return (
      <div className="absolute inset-0 z-[1400] bg-neutral-100">
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
                  ? 'Drop the pin at the trail start.'
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
      panelClassName="max-h-[min(78dvh,720px)] px-5 pb-[calc(var(--safe-bottom)+4.5rem)] pt-1 lg:px-6 lg:pb-6 lg:pt-2"
    >
      {step === 'title' && (
        <>
          <SheetHeader title={headerTitle} showBack onBack={goBack} onClose={handleClose} />
          <label className="block">
            <input
              value={draft.title}
              onChange={(event) => patchDraft({ title: event.target.value })}
              placeholder={contributeTitlePlaceholder(kind)}
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
              maxLength={120}
              autoFocus
            />
          </label>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={!draft.title.trim()} onClick={goNext} />
          </div>
        </>
      )}

      {step === 'location' && (
        <>
          <SheetHeader title={headerTitle} showBack onBack={goBack} onClose={handleClose} />
          <p className="mb-4 text-sm text-gray-600">
            {kind === 'hiking'
              ? 'Pin where the trail starts.'
              : kind === 'shop'
                ? 'Pin where your shop is on the map.'
                : 'Pin this spot on the map.'}
          </p>
          {renderPinButton(
            draft.locationPinPlaced,
            draft.latitude,
            draft.longitude,
            kind === 'hiking' ? 'Start location pin' : 'Location pin',
            () => setLocationMapOpen(true)
          )}
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={!draft.locationPinPlaced} onClick={goNext} />
          </div>
        </>
      )}

      {step === 'image' && (
        <>
          <SheetHeader title={headerTitle} showBack onBack={goBack} onClose={handleClose} />
          <ImageUpload
            images={draft.images}
            onChange={(urls) => patchDraft({ images: urls })}
            keyPrefix="locations"
            kind="location"
            max={5}
            label=""
            preset="rectangle"
          />
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={!draft.images.length} onClick={goNext} />
          </div>
        </>
      )}

      {step === 'description' && (
        <>
          <SheetHeader title={headerTitle} showBack onBack={goBack} onClose={handleClose} />
          <textarea
            value={draft.description}
            onChange={(event) => patchDraft({ description: event.target.value })}
            rows={5}
            placeholder={contributeDescriptionPlaceholder(kind)}
            className="w-full resize-none rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
            maxLength={3000}
            autoFocus
          />
          <p className="mt-2 text-xs text-gray-500">At least 20 characters.</p>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={draft.description.trim().length < 20} onClick={goNext} />
          </div>
        </>
      )}

      {step === 'difficulty' && kind === 'hiking' && (
        <>
          <SheetHeader title={headerTitle} showBack onBack={goBack} onClose={handleClose} />
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
        </>
      )}

      {step === 'parking' && kind !== 'shop' && (
        <>
          <SheetHeader title={headerTitle} showBack onBack={goBack} onClose={handleClose} />
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
        </>
      )}

      {step === 'contact' && kind === 'shop' && (
        <>
          <SheetHeader title={headerTitle} showBack onBack={goBack} onClose={handleClose} />
          <div className="space-y-4">
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
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Email (optional)</span>
              <input
                type="email"
                value={draft.contactEmail}
                onChange={(event) => patchDraft({ contactEmail: event.target.value })}
                placeholder="shop@example.com"
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-emerald-400"
              />
            </label>
          </div>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton disabled={!draft.phone.trim()} onClick={goNext} />
          </div>
        </>
      )}

      {step === 'review' && (
        <>
          <SheetHeader title={headerTitle} showBack onBack={goBack} onClose={handleClose} />
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
                {kind === 'hiking' ? 'Start: ' : 'Location: '}
                {draft.latitude?.toFixed(4)}, {draft.longitude?.toFixed(4)}
              </p>
            )}
            {draft.images[0] && (
              <p className="mt-1 text-xs text-gray-500">{draft.images.length} photo{draft.images.length === 1 ? '' : 's'}</p>
            )}
            {draft.description.trim() && (
              <p className="mt-2 line-clamp-4 text-xs text-gray-600">{draft.description}</p>
            )}
            {kind === 'hiking' && draft.difficulty && (
              <p className="mt-1 text-xs text-gray-500">
                Difficulty: {ACTIVITY_DIFFICULTY_OPTIONS.find((option) => option.value === draft.difficulty)?.title}
              </p>
            )}
            {kind !== 'shop' && draft.parkingPinPlaced && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="h-3.5 w-3.5 text-sky-500" />
                Parking: {draft.parkingLat?.toFixed(4)}, {draft.parkingLng?.toFixed(4)}
              </p>
            )}
            {kind === 'shop' && draft.phone.trim() && (
              <p className="mt-1 text-xs text-gray-500">
                Contact: {formatHostPhonePreview(draft.phoneCountryCode, draft.phone)}
                {draft.contactEmail.trim() ? ` · ${draft.contactEmail.trim()}` : ''}
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
            {kind === 'shop'
              ? 'Your shop listing will be reviewed before it appears on the map.'
              : 'Your venue will be reviewed before it appears on the map for others to discover and host at.'}
          </p>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 pb-2">
            <NextButton label="Submit" loading={submitting} onClick={handleSubmit} />
          </div>
        </>
      )}
    </ExploreResponsiveSheet>
  );
};

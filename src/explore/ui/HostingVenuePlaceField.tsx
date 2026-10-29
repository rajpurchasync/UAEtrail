import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { AreaPublicDTO, PlaceDTO } from '@uaetrail/shared-types';
import { placeDetailPath } from '@uaetrail/shared-types';
import type { ActivityType } from '../../config/activityTypes';
import { AppSelect } from '../../components/ui/AppSelect';
import { PlaceSelect } from '../../components/ui/PlaceSelect';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { EXPLORE_FLOW } from '../../config/exploreTheme';
import {
  HOSTING_VENUE_CUSTOM_NAME_BACK,
  HOSTING_VENUE_CUSTOM_NAME_TOGGLE,
  HOSTING_VENUE_CUSTOM_REVIEW_NOTE,
  HOSTING_VENUE_REGISTRY_LABEL,
} from '../createFlowCopy';
import {
  ACTIVITY_DIFFICULTY_OPTIONS,
  resolveActivityDifficultyLabel,
  type ActivityDifficulty,
  type CreateActivityDraft,
} from './hostingFlowEngine';
import { fetchPublishedAreas } from '../../hooks/areaHubClientApi';
import { useExplorePublishedAreas } from '../useExplorePublishedAreas';
import {
  inferEmirateFromPin,
  resolvePublishedAreaForPoint,
  resolvePublishedAreaIdForPoint,
} from '../hostingPublishArea';
import { EmirateFromPinField } from './EmirateFromPinField';
import { applyRegistryPlaceToHostingDraft } from './hostingPlaceRegistryDraft';
import { exploreFlowChoiceCardClass } from './exploreFlowUi';

type PatchDraft = (patch: Partial<CreateActivityDraft>) => void;

export type HostingVenuePlaceFieldProps = {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
  tenantId?: string | null;
  /** Venue rows from {@link fetchPlaceCatalog} for this place type. */
  registryPlaces: PlaceDTO[];
  placeType: ActivityType;
  customNameLabel: string;
  customNamePlaceholder: string;
  showDifficulty?: boolean;
  /** Show registry-sourced difficulty above the picker (hiking destination). */
  registryDifficultyHint?: boolean;
  /** Open the map picker to pin a new (non-registry) spot. */
  onOpenSpotMap?: () => void;
};

export const HostingVenuePlaceField = ({
  draft,
  patchDraft,
  tenantId,
  registryPlaces,
  placeType,
  customNameLabel,
  customNamePlaceholder,
  showDifficulty = false,
  registryDifficultyHint = false,
  onOpenSpotMap,
}: HostingVenuePlaceFieldProps) => {
  const custom = draft.placeLabelSource === 'custom';
  const selectedPlace = registryPlaces.find((place) => place.id === draft.registryPlaceId);
  const hasRegistryVenue = Boolean(draft.registryPlaceId);
  const areas = useExplorePublishedAreas();
  const spotPinned = draft.trailLatitude != null && draft.trailLongitude != null;
  const inferredArea =
    spotPinned && draft.trailLatitude != null && draft.trailLongitude != null
      ? resolvePublishedAreaForPoint(draft.trailLatitude, draft.trailLongitude, areas)
      : null;
  const matchedArea =
    inferredArea ?? areas.find((area) => area.id === draft.customPlaceAreaId) ?? null;
  const inferredEmirate = spotPinned
    ? inferEmirateFromPin(
        draft.trailLatitude,
        draft.trailLongitude,
        areas,
        `${draft.trailName} ${draft.customPlaceProposedAreaName}`
      )
    : null;

  useEffect(() => {
    if (!custom || !spotPinned || draft.trailLatitude == null || draft.trailLongitude == null) {
      return;
    }
    const hit = resolvePublishedAreaForPoint(draft.trailLatitude, draft.trailLongitude, areas);
    const emirate = inferEmirateFromPin(
      draft.trailLatitude,
      draft.trailLongitude,
      areas,
      `${draft.trailName} ${draft.customPlaceProposedAreaName}`
    );
    if (hit) {
      if (
        draft.customPlaceAreaId !== hit.id ||
        draft.customPlaceProposedAreaName ||
        (emirate && draft.customPlaceEmirate !== emirate)
      ) {
        patchDraft({
          customPlaceAreaId: hit.id,
          customPlaceProposedAreaName: '',
          ...(emirate ? { customPlaceEmirate: emirate } : {}),
        });
      }
      return;
    }
    if (emirate && draft.customPlaceEmirate !== emirate) {
      patchDraft({ customPlaceEmirate: emirate });
    }
    if (draft.customPlaceAreaId && !draft.customPlaceProposedAreaName.trim()) {
      const stillListed = areas.some((area) => area.id === draft.customPlaceAreaId);
      if (!stillListed) {
        patchDraft({ customPlaceAreaId: null });
      }
    }
  }, [
    custom,
    spotPinned,
    draft.trailLatitude,
    draft.trailLongitude,
    draft.customPlaceAreaId,
    draft.customPlaceProposedAreaName,
    draft.trailName,
    draft.customPlaceEmirate,
    areas,
    patchDraft,
  ]);

  const onRegistryPick = (placeId: string) => {
    const place = registryPlaces.find((item) => item.id === placeId);
    if (!place) {
      patchDraft({
        registryPlaceId: placeId,
        registryPlaceAreaId: null,
        placeLabelSource: 'registry',
      });
      return;
    }
    const basePatch = applyRegistryPlaceToHostingDraft(draft, place);
    patchDraft(basePatch);
    if (basePatch.registryPlaceAreaId) return;
    const lat = place.latitude;
    const lng = place.longitude;
    if (lat == null || lng == null) return;
    void fetchPublishedAreas().then((areas) => {
      const inferred = resolvePublishedAreaIdForPoint(lat, lng, areas);
      if (inferred) {
        patchDraft({ registryPlaceAreaId: inferred });
      }
    });
  };

  return (
    <>
      {!custom ? (
        <>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">
              {HOSTING_VENUE_REGISTRY_LABEL}
            </span>
            <PlaceSelect
              value={draft.registryPlaceId ?? ''}
              onChange={onRegistryPick}
              tenantId={tenantId ?? undefined}
              activityType={placeType}
              places={registryPlaces}
              required={false}
              placeholder="Select venue…"
            />
          </label>
          {selectedPlace ? (
            <>
              <p className="mt-2 text-xs text-gray-600">
                Registry venue ·{' '}
                <Link
                  to={placeDetailPath(selectedPlace.activityType, selectedPlace.id)}
                  className="font-semibold text-emerald-700 underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  View place details
                </Link>
              </p>
              {registryDifficultyHint && placeType === 'hiking' ? (
                <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-950">
                  Trail difficulty from registry:{' '}
                  <span className="font-semibold">{resolveActivityDifficultyLabel(draft.difficulty)}</span>
                  {showDifficulty ? ' — change below if this outing is different.' : null}
                </p>
              ) : null}
              {!selectedPlace.areaId?.trim() && !draft.registryPlaceAreaId ? (
                <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  This venue isn’t linked to a map area yet, so it can’t be published on Explore. Choose another
                  trail from the list, or add a new spot below for admin review.
                </p>
              ) : null}
            </>
          ) : null}
          {!hasRegistryVenue ? (
            <button
              type="button"
              onClick={() =>
                patchDraft({
                  placeLabelSource: 'custom',
                  registryPlaceId: null,
                  registryPlaceAreaId: null,
                })
              }
              className="mt-4 text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline"
            >
              {HOSTING_VENUE_CUSTOM_NAME_TOGGLE}
            </button>
          ) : null}
        </>
      ) : (
        <>
          <p className="mb-3 text-sm text-gray-600">{HOSTING_VENUE_CUSTOM_REVIEW_NOTE}</p>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">{customNameLabel}</span>
            <input
              value={draft.trailName}
              onChange={(event) =>
                patchDraft({
                  trailName: event.target.value,
                  registryPlaceId: null,
                  placeLabelSource: 'custom',
                })
              }
              placeholder={customNamePlaceholder}
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-base"
              maxLength={120}
            />
          </label>
          {onOpenSpotMap ? (
            <button
              type="button"
              onClick={onOpenSpotMap}
              className="mt-4 w-full rounded-2xl border border-neutral-200 py-3 text-sm font-semibold text-neutral-800 hover:border-emerald-300"
            >
              {spotPinned
                ? `Spot pinned · ${draft.trailLatitude!.toFixed(4)}, ${draft.trailLongitude!.toFixed(4)}`
                : 'Pin this spot on the map'}
            </button>
          ) : null}
          {spotPinned && inferredArea ? (
            <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
              Area from your pin: <span className="font-semibold">{inferredArea.name}</span>
              {inferredArea.region ? ` · ${inferredArea.region}` : ''}
            </p>
          ) : null}
          {spotPinned && !inferredArea ? (
            <div className="mt-3 space-y-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-3">
              <p className="text-sm text-sky-950">
                {draft.trailName.trim()
                  ? `We’ll submit “${draft.trailName.trim()}” as a new area with this spot. Both stay pending until an admin approves them.`
                  : 'We’ll submit this as a new area with the spot. Both stay pending until an admin approves them.'}
              </p>
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-amber-900">
                  Existing area
                </span>
                <AppSelect
                  className="w-full"
                  value={draft.customPlaceProposedAreaName.trim() ? '' : draft.customPlaceAreaId ?? ''}
                  disabled={areas.length === 0}
                  placeholder="Choose an existing area…"
                  options={[
                    { value: '', label: 'Choose an existing area…' },
                    ...areas.map((area: AreaPublicDTO) => ({
                      value: area.id,
                      label: `${area.name} · ${area.region}`,
                    })),
                  ]}
                  onChange={(next) =>
                    patchDraft({
                      customPlaceAreaId: next.trim() ? next : null,
                      customPlaceProposedAreaName: '',
                    })
                  }
                  inputClassName="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-neutral-900"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-amber-900">
                  Or name a new area
                </span>
                <input
                  value={draft.customPlaceProposedAreaName}
                  onChange={(event) =>
                    patchDraft({
                      customPlaceProposedAreaName: event.target.value,
                      customPlaceAreaId: event.target.value.trim() ? null : draft.customPlaceAreaId,
                    })
                  }
                  placeholder="e.g. Wadi Al Helo"
                  className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm"
                  maxLength={80}
                />
              </label>
              {matchedArea && !draft.customPlaceProposedAreaName.trim() ? (
                <p className="text-xs text-amber-900">Using {matchedArea.name}.</p>
              ) : null}
            </div>
          ) : null}
          <EmirateFromPinField
            pinned={spotPinned}
            inferred={inferredEmirate}
            value={draft.customPlaceEmirate}
            onChange={(customPlaceEmirate) => patchDraft({ customPlaceEmirate })}
          />
          <div className="mt-4">
            <ImageUpload
              images={draft.customPlaceImages}
              onChange={(urls) => patchDraft({ customPlaceImages: urls.slice(0, 5) })}
              keyPrefix="locations"
              tenantId={tenantId ?? undefined}
              kind="location"
              max={5}
              label="Photo (required)"
              preset="location"
            />
          </div>
          <button
            type="button"
            onClick={() =>
              patchDraft({
                placeLabelSource: 'registry',
                trailName: '',
                customPlaceImages: [],
                customPlaceAreaId: null,
                customPlaceProposedAreaName: '',
                customPlaceEmirate: '',
                trailLatitude: null,
                trailLongitude: null,
              })
            }
            className="mt-3 text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline"
          >
            {HOSTING_VENUE_CUSTOM_NAME_BACK}
          </button>
        </>
      )}

      {showDifficulty ? (
        <>
          <p className={`mb-2 mt-4 ${EXPLORE_FLOW.choiceCardTitle}`}>Difficulty</p>
          <div className="space-y-2">
            {ACTIVITY_DIFFICULTY_OPTIONS.map((option) => {
              const active = draft.difficulty === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => patchDraft({ difficulty: option.value as ActivityDifficulty })}
                  className={exploreFlowChoiceCardClass(active)}
                >
                  <p className={EXPLORE_FLOW.choiceCardTitle}>{option.title}</p>
                  <p className={EXPLORE_FLOW.choiceCardSubtitle}>{option.subtitle}</p>
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </>
  );
};

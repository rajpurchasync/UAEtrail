import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { AreaPublicDTO, PlaceDTO } from '@uaetrail/shared-types';
import { placeDetailPath } from '@uaetrail/shared-types';
import type { ActivityType } from '../../config/activityTypes';
import { AppSelect } from '../../components/ui/AppSelect';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { EXPLORE_FLOW } from '../../config/exploreTheme';
import {
  HOSTING_DESTINATION_CATALOG_LEAF_LINK_CAMPING,
  HOSTING_DESTINATION_CATALOG_LEAF_LINK_EVENT,
  HOSTING_DESTINATION_CATALOG_LEAF_LINK_HIKING,
  HOSTING_DESTINATION_CATALOG_LEAF_VIEW,
  HOSTING_DESTINATION_CUSTOM_NAME_BACK,
  HOSTING_DESTINATION_CUSTOM_NAME_TOGGLE,
  HOSTING_DESTINATION_CUSTOM_REVIEW_NOTE,
  HOSTING_DESTINATION_PICK_PLACE_FIRST,
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
import { HostingDestinationCascade } from './HostingDestinationCascade';
import {
  DEFAULT_PLACE_CATALOG_COUNTRY,
  inferPlaceCatalogLadderFromRow,
  placeCatalogPlaceGroupLabelForKey,
} from '../../places/placeCatalogDestinationIndex';
import {
  patchHostingDestinationAreaChange,
  patchHostingDestinationClearTrailSlot,
  patchHostingDestinationPlaceGroupChange,
  patchHostingDestinationReset,
  patchHostingDestinationStartCustomTrail,
  patchHostingDestinationStateChange,
} from './hostingDestinationDraft';

type PatchDraft = (patch: Partial<CreateActivityDraft>) => void;

export type HostingDestinationFieldProps = {
  draft: CreateActivityDraft;
  patchDraft: PatchDraft;
  tenantId?: string | null;
  /** Place catalog rows from {@link fetchPlaceCatalog}. */
  catalogPlaces: PlaceDTO[];
  placeType: ActivityType;
  customNameLabel: string;
  customNamePlaceholder: string;
  showDifficulty?: boolean;
  registryDifficultyHint?: boolean;
  onOpenSpotMap?: () => void;
};

export const HostingDestinationField = ({
  draft,
  patchDraft,
  tenantId,
  catalogPlaces,
  placeType,
  customNameLabel,
  customNamePlaceholder,
  showDifficulty = false,
  registryDifficultyHint = false,
  onOpenSpotMap,
}: HostingDestinationFieldProps) => {
  const [placeGateMessage, setPlaceGateMessage] = useState<string | null>(null);

  const custom = draft.placeLabelSource === 'custom';
  const customUnderPlace = custom && Boolean(draft.venueCascadePlaceGroup?.trim());
  const customGreenfield = custom && !customUnderPlace;
  const selectedPlace = catalogPlaces.find((place) => place.id === draft.registryPlaceId);
  const hasCatalogLeaf = Boolean(draft.registryPlaceId);
  const catalogLeafKindLabel =
    placeType === 'camping'
      ? HOSTING_DESTINATION_CATALOG_LEAF_LINK_CAMPING
      : placeType === 'event'
        ? HOSTING_DESTINATION_CATALOG_LEAF_LINK_EVENT
        : HOSTING_DESTINATION_CATALOG_LEAF_LINK_HIKING;
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
        (emirate && !draft.customPlaceEmirate.trim())
      ) {
        patchDraft({
          customPlaceAreaId: hit.id,
          customPlaceProposedAreaName: '',
          ...(emirate && !draft.customPlaceEmirate.trim() ? { customPlaceEmirate: emirate } : {}),
        });
      }
      return;
    }
    if (emirate && !draft.customPlaceEmirate.trim()) {
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

  const catalogCountry = draft.customPlaceCountry || DEFAULT_PLACE_CATALOG_COUNTRY;

  useEffect(() => {
    if (custom || !draft.registryPlaceId) return;
    if (draft.venueCascadeState?.trim() && draft.venueCascadePlaceGroup?.trim()) return;
    const place = catalogPlaces.find((row) => row.id === draft.registryPlaceId);
    if (!place) return;
    const inferred = inferPlaceCatalogLadderFromRow(place, areas, catalogCountry);
    patchDraft({
      venueCascadeState: inferred.state,
      registryPlaceAreaId: draft.registryPlaceAreaId ?? inferred.areaId ?? null,
      venueCascadePlaceGroup: inferred.placeGroup,
    });
  }, [
    custom,
    draft.registryPlaceId,
    draft.registryPlaceAreaId,
    draft.venueCascadeState,
    draft.venueCascadePlaceGroup,
    catalogPlaces,
    areas,
    catalogCountry,
    patchDraft,
  ]);

  const onRegistryPick = (placeId: string) => {
    setPlaceGateMessage(null);
    const place = catalogPlaces.find((item) => item.id === placeId);
    if (!place) {
      patchDraft({
        registryPlaceId: placeId,
        placeLabelSource: 'registry',
      });
      return;
    }
    const inferred = inferPlaceCatalogLadderFromRow(place, areas, catalogCountry);
    const basePatch = applyRegistryPlaceToHostingDraft(draft, place);
    patchDraft({
      ...basePatch,
      venueCascadeState: inferred.state,
      venueCascadePlaceGroup: inferred.placeGroup,
      registryPlaceAreaId:
        basePatch.registryPlaceAreaId ?? inferred.areaId ?? draft.registryPlaceAreaId,
    });
    if (basePatch.registryPlaceAreaId || inferred.areaId) return;
    const lat = place.latitude;
    const lng = place.longitude;
    if (lat == null || lng == null) return;
    void fetchPublishedAreas().then((published) => {
      const inferredAreaId = resolvePublishedAreaIdForPoint(lat, lng, published);
      if (inferredAreaId) {
        patchDraft({ registryPlaceAreaId: inferredAreaId });
      }
    });
  };

  const startCustomTrailUnderPlace = () => {
    if (!draft.venueCascadePlaceGroup?.trim()) {
      setPlaceGateMessage(HOSTING_DESTINATION_PICK_PLACE_FIRST);
      return;
    }
    setPlaceGateMessage(null);
    patchDraft(patchHostingDestinationStartCustomTrail(draft));
  };

  const placeContextLabel =
    customUnderPlace && draft.venueCascadePlaceGroup
      ? placeCatalogPlaceGroupLabelForKey(catalogPlaces, draft.venueCascadePlaceGroup)
      : null;

  return (
    <>
      {customGreenfield ? null : (
        <HostingDestinationCascade
          state={draft.venueCascadeState}
          areaId={draft.registryPlaceAreaId ?? ''}
          placeGroup={draft.venueCascadePlaceGroup}
          draftRegistryPlaceId={draft.registryPlaceId}
          catalogPlaces={catalogPlaces}
          areas={areas}
          placeType={placeType}
          countryCode={catalogCountry}
          placeGateMessage={placeGateMessage}
          hideTrailRow={customUnderPlace}
          showFind={!custom}
          onPatchDraft={(patch) => {
            setPlaceGateMessage(null);
            patchDraft(patch);
          }}
          onStateChange={(next) => patchDraft(patchHostingDestinationStateChange(next))}
          onAreaChange={(next) => patchDraft(patchHostingDestinationAreaChange(next))}
          onPlaceGroupChange={(next) => patchDraft(patchHostingDestinationPlaceGroupChange(next))}
          onPickTrail={onRegistryPick}
          onClearTrail={() => patchDraft(patchHostingDestinationClearTrailSlot())}
          onAddNewTrail={startCustomTrailUnderPlace}
          onReset={() => {
            setPlaceGateMessage(null);
            patchDraft(patchHostingDestinationReset());
          }}
        />
      )}

      {custom ? (
        <div className="mt-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4">
          {placeContextLabel ? (
            <p className="text-xs font-semibold text-emerald-900">
              New trail under · {placeContextLabel}
            </p>
          ) : null}
          <p className={`text-sm text-gray-600 ${placeContextLabel ? 'mt-2' : ''}`}>
            {HOSTING_DESTINATION_CUSTOM_REVIEW_NOTE}
          </p>
          <label className="mt-3 block">
            <span className={EXPLORE_FLOW.composeFieldLabel}>{customNameLabel}</span>
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
              className={`${EXPLORE_FLOW.composeField} mt-1 w-full`}
              maxLength={120}
            />
          </label>
          {onOpenSpotMap ? (
            <button
              type="button"
              onClick={onOpenSpotMap}
              className="mt-3 flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-neutral-200 bg-white px-4 py-4 text-left hover:border-emerald-300"
            >
              <span className="flex items-center gap-2 text-gray-800">
                <MapPin className="h-5 w-5 text-emerald-600" />
                <span>
                  <span className="block text-sm font-bold">Pin on map</span>
                  <span className="text-xs text-gray-500">
                    {spotPinned && draft.trailLatitude != null && draft.trailLongitude != null
                      ? `${draft.trailLatitude.toFixed(4)}, ${draft.trailLongitude.toFixed(4)}`
                      : 'Required — drop the trail on the map'}
                  </span>
                </span>
              </span>
              <span className="text-xs font-semibold text-emerald-700">{spotPinned ? 'Edit' : 'Map'}</span>
            </button>
          ) : null}
          {spotPinned && inferredArea ? (
            <p className="mt-3 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-950">
              Area from pin: <span className="font-semibold">{inferredArea.name}</span>
              {inferredArea.region ? ` · ${inferredArea.region}` : ''}
            </p>
          ) : null}
          {spotPinned && !inferredArea && !customUnderPlace ? (
            <div className="mt-3 space-y-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-3">
              <label className="block">
                <span className={EXPLORE_FLOW.composeFieldLabel}>Existing area</span>
                <AppSelect
                  className="mt-1 w-full"
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
                  inputClassName={`${EXPLORE_FLOW.composeField} w-full`}
                />
              </label>
              <label className="block">
                <span className={EXPLORE_FLOW.composeFieldLabel}>Or name a new area</span>
                <input
                  value={draft.customPlaceProposedAreaName}
                  onChange={(event) =>
                    patchDraft({
                      customPlaceProposedAreaName: event.target.value,
                      customPlaceAreaId: event.target.value.trim() ? null : draft.customPlaceAreaId,
                    })
                  }
                  placeholder="e.g. Wadi Al Helo"
                  className={`${EXPLORE_FLOW.composeField} mt-1 w-full`}
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
            countryCode={draft.customPlaceCountry || catalogCountry}
            onCountryChange={(customPlaceCountry) => patchDraft({ customPlaceCountry })}
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
            onClick={() => {
              setPlaceGateMessage(null);
              patchDraft({
                placeLabelSource: 'registry',
                trailName: '',
                customPlaceImages: [],
                customPlaceProposedAreaName: '',
                customPlaceEmirate: '',
                trailLatitude: null,
                trailLongitude: null,
              });
            }}
            className="mt-3 text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline"
          >
            {HOSTING_DESTINATION_CUSTOM_NAME_BACK}
          </button>
        </div>
      ) : null}

      {selectedPlace ? (
        <>
          <p className="mt-2 text-xs text-gray-600">
            {catalogLeafKindLabel} ·{' '}
            <Link
              to={placeDetailPath(selectedPlace.activityType, selectedPlace.id)}
              className="font-semibold text-emerald-700 underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {HOSTING_DESTINATION_CATALOG_LEAF_VIEW}
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
              This trail isn’t linked to a map area yet. Pick another trail or add a new one under this place.
            </p>
          ) : null}
        </>
      ) : null}

      {!custom && !hasCatalogLeaf && !draft.venueCascadePlaceGroup?.trim() ? (
        <button
          type="button"
          onClick={() => {
            setPlaceGateMessage(null);
            patchDraft({
              placeLabelSource: 'custom',
              registryPlaceId: null,
              registryPlaceAreaId: null,
              venueCascadeState: '',
              venueCascadePlaceGroup: '',
            });
          }}
          className="mt-4 text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline"
        >
          {HOSTING_DESTINATION_CUSTOM_NAME_TOGGLE}
        </button>
      ) : null}

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

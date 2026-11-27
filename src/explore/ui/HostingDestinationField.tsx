import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { PlaceDTO } from '@uaetrail/shared-types';
import { placeDetailPath } from '@uaetrail/shared-types';
import type { ActivityType } from '../../config/activityTypes';
import { EXPLORE_FLOW } from '../../config/exploreTheme';
import {
  HOSTING_DESTINATION_CATALOG_LEAF_LINK_CAMPING,
  HOSTING_DESTINATION_CATALOG_LEAF_LINK_EVENT,
  HOSTING_DESTINATION_CATALOG_LEAF_LINK_HIKING,
  HOSTING_DESTINATION_CATALOG_LEAF_VIEW,
  HOSTING_DESTINATION_CUSTOM_NAME_BACK,
  HOSTING_DESTINATION_CUSTOM_REVIEW_NOTE,
} from '../createFlowCopy';
import { type CreateActivityDraft } from './hostingFlowEngine';
import { useExplorePublishedDestinations } from '../useExplorePublishedDestinations';
import { inferEmirateFromPin, resolvePublishedDestinationForPoint } from '../hostingPublishDestination';
import { HostingDestinationCascade, HostingDestinationUaeChip } from './HostingDestinationCascade';
import {
  ComposeMapEntryRow,
  formatComposeMapCoord,
} from '../create/interactions';
import {
  areaRowInCatalogCountry,
  DEFAULT_PLACE_CATALOG_COUNTRY,
  inferPlaceCatalogLadderFromRow,
} from '../../places/placeCatalogDestinationIndex';
import {
  patchHostingDestinationAreaChange,
  patchHostingDestinationBackToListed,
  patchHostingDestinationClearTrailSlot,
  patchHostingDestinationEnterCustom,
  patchHostingDestinationPlaceGroupChange,
  patchHostingDestinationReset,
  patchHostingDestinationCountryChange,
  patchHostingDestinationStateChange,
  patchPickHostingCatalogPlace,
  enrichHostingCatalogPlacePick,
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
  onOpenSpotMap?: () => void;
};

export const HostingDestinationField = ({
  draft,
  patchDraft,
  catalogPlaces,
  placeType,
  customNameLabel,
  customNamePlaceholder,
  onOpenSpotMap,
}: HostingDestinationFieldProps) => {
  const custom = draft.placeLabelSource === 'custom';
  const selectedPlace = catalogPlaces.find((place) => place.id === draft.registryPlaceId);
  const catalogLeafKindLabel =
    placeType === 'camping'
      ? HOSTING_DESTINATION_CATALOG_LEAF_LINK_CAMPING
      : placeType === 'event'
        ? HOSTING_DESTINATION_CATALOG_LEAF_LINK_EVENT
        : HOSTING_DESTINATION_CATALOG_LEAF_LINK_HIKING;
  const publishedDestinations = useExplorePublishedDestinations();
  const catalogCountry = DEFAULT_PLACE_CATALOG_COUNTRY;
  const areas = useMemo(
    () => publishedDestinations.filter((row) => areaRowInCatalogCountry(row, catalogCountry)),
    [publishedDestinations, catalogCountry]
  );
  const spotPinned = draft.trailLatitude != null && draft.trailLongitude != null;
  const inferredArea =
    custom && spotPinned && draft.trailLatitude != null && draft.trailLongitude != null
      ? resolvePublishedDestinationForPoint(draft.trailLatitude, draft.trailLongitude, areas)
      : null;

  useEffect(() => {
    if (draft.customPlaceCountry && draft.customPlaceCountry !== catalogCountry) {
      patchDraft(patchHostingDestinationCountryChange(catalogCountry));
    }
  }, [catalogCountry, draft.customPlaceCountry, patchDraft]);

  useEffect(() => {
    if (!custom || !spotPinned || draft.trailLatitude == null || draft.trailLongitude == null) {
      return;
    }
    const hit = resolvePublishedDestinationForPoint(draft.trailLatitude, draft.trailLongitude, areas);
    const emirate = inferEmirateFromPin(
      draft.trailLatitude,
      draft.trailLongitude,
      areas,
      draft.trailName
    );
    const patch: Partial<CreateActivityDraft> = {};
    if (hit && !draft.customPlaceDestinationId?.trim()) {
      patch.customPlaceDestinationId = hit.id;
      patch.registryPlaceDestinationId = hit.id;
    }
    if (emirate && !draft.customPlaceEmirate.trim()) {
      patch.customPlaceEmirate = emirate;
    }
    if (emirate && !draft.venueCascadeState.trim()) {
      patch.venueCascadeState = emirate;
    }
    if (Object.keys(patch).length > 0) patchDraft(patch);
  }, [
    custom,
    spotPinned,
    draft.trailLatitude,
    draft.trailLongitude,
    draft.customPlaceDestinationId,
    draft.customPlaceEmirate,
    draft.venueCascadeState,
    draft.trailName,
    areas,
    patchDraft,
  ]);

  useEffect(() => {
    if (custom || !draft.registryPlaceId) return;
    if (draft.venueCascadeState?.trim() && draft.venueCascadePlaceGroup?.trim()) return;
    const place = catalogPlaces.find((row) => row.id === draft.registryPlaceId);
    if (!place) return;
    const inferred = inferPlaceCatalogLadderFromRow(place, areas, catalogCountry, catalogPlaces);
    const nextAreaId = draft.registryPlaceDestinationId ?? inferred.destinationId ?? null;
    if (
      inferred.state === draft.venueCascadeState &&
      nextAreaId === draft.registryPlaceDestinationId &&
      inferred.placeGroup === draft.venueCascadePlaceGroup
    ) {
      return;
    }
    patchDraft({
      venueCascadeState: inferred.state,
      registryPlaceDestinationId: nextAreaId,
      venueCascadePlaceGroup: inferred.placeGroup,
    });
  }, [
    custom,
    draft.registryPlaceId,
    draft.registryPlaceDestinationId,
    draft.venueCascadeState,
    draft.venueCascadePlaceGroup,
    catalogPlaces,
    areas,
    catalogCountry,
    patchDraft,
  ]);

  const onRegistryPick = (placeId: string) => {
    const place = catalogPlaces.find((item) => item.id === placeId);
    const patch = patchPickHostingCatalogPlace(
      draft,
      placeId,
      catalogPlaces,
      areas,
      catalogCountry
    );
    patchDraft(patch);
    if (!place) return;
    void enrichHostingCatalogPlacePick(place, patch).then((extra) => {
      if (extra) patchDraft(extra);
    });
  };

  return (
    <>
      <div className="mb-3">
        <HostingDestinationUaeChip />
      </div>
      {custom ? (
        <>
          <p className="text-sm text-gray-600">{HOSTING_DESTINATION_CUSTOM_REVIEW_NOTE}</p>
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
        </>
      ) : null}
      <div className={custom ? 'mt-3' : undefined}>
        <HostingDestinationCascade
          state={draft.venueCascadeState || draft.customPlaceEmirate}
          destinationId={draft.registryPlaceDestinationId ?? draft.customPlaceDestinationId ?? ''}
          placeGroup={draft.venueCascadePlaceGroup}
          draftRegistryPlaceId={draft.registryPlaceId}
          catalogPlaces={catalogPlaces}
          areas={areas}
          placeType={placeType}
          countryCode={catalogCountry}
          hidePlaceAndTrail={custom}
          showFind={!custom}
          onPatchDraft={patchDraft}
          onStateChange={(next) => {
            if (custom) {
              patchDraft({
                venueCascadeState: next,
                customPlaceEmirate: next,
                registryPlaceDestinationId: null,
                customPlaceDestinationId: null,
                venueCascadePlaceGroup: '',
              });
              return;
            }
            patchDraft(patchHostingDestinationStateChange(next));
          }}
          onAreaChange={(next) => {
            if (custom) {
              patchDraft({
                registryPlaceDestinationId: next.trim() ? next : null,
                customPlaceDestinationId: next.trim() ? next : null,
                venueCascadePlaceGroup: '',
              });
              return;
            }
            patchDraft(patchHostingDestinationAreaChange(next));
          }}
          onPlaceGroupChange={(next) => patchDraft(patchHostingDestinationPlaceGroupChange(next))}
          onPickTrail={onRegistryPick}
          onClearTrail={() => patchDraft(patchHostingDestinationClearTrailSlot())}
          onAddNew={custom ? undefined : () => patchDraft(patchHostingDestinationEnterCustom(draft))}
          onReset={() => patchDraft(patchHostingDestinationReset())}
        />
      </div>

      {custom ? (
        <div className="mt-3">
          {onOpenSpotMap ? (
            <ComposeMapEntryRow
              title="Pin on map"
              subtitle={formatComposeMapCoord(draft.trailLatitude, draft.trailLongitude, spotPinned)}
              placed={spotPinned}
              onOpen={onOpenSpotMap}
            />
          ) : null}
          {spotPinned && inferredArea ? (
            <p className="mt-3 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-950">
              Area from pin: <span className="font-semibold">{inferredArea.name}</span>
              {inferredArea.region ? ` · ${inferredArea.region}` : ''}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => patchDraft(patchHostingDestinationBackToListed())}
            className="mt-3 text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline"
          >
            {HOSTING_DESTINATION_CUSTOM_NAME_BACK}
          </button>
        </div>
      ) : null}

      {!custom && selectedPlace ? (
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
          {!selectedPlace.destinationId?.trim() && !draft.registryPlaceDestinationId ? (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              This trail isn’t linked to a map area yet. Pick another listed trail, or add a new one.
            </p>
          ) : null}
        </>
      ) : null}
    </>
  );
};

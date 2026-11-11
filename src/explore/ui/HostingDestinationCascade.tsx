import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { AreaPublicDTO, PlaceDTO } from '@uaetrail/shared-types';
import type { ActivityType } from '../../config/activityTypes';
import { SUPPORTED_COUNTRIES, subdivisionNoun, type CountryCode } from '../../config/regions';
import { AppSelect } from '../../components/ui/AppSelect';
import { EXPLORE_FLOW } from '../../config/exploreTheme';
import {
  HOSTING_DESTINATION_ADD_TRAIL_NEW,
  HOSTING_DESTINATION_EMPTY_ROUTES_PROMPT,
  HOSTING_DESTINATION_FIND_PLACEHOLDER,
  HOSTING_DESTINATION_LEAF_HINT,
  HOSTING_DESTINATION_SEARCH_GROUP_AREA,
  HOSTING_DESTINATION_SEARCH_GROUP_PLACE,
  HOSTING_DESTINATION_SEARCH_GROUP_ROUTE,
  HOSTING_DESTINATION_PICK_PLACE_FIRST,
  HOSTING_DESTINATION_RESET_LABEL,
  HOSTING_DESTINATION_SELECT_AREA,
  HOSTING_DESTINATION_SELECT_COUNTRY,
  HOSTING_DESTINATION_SELECT_PLACE,
  HOSTING_DESTINATION_SELECT_STATE,
  HOSTING_DESTINATION_SELECT_TRAIL_CAMP_LABEL,
  HOSTING_DESTINATION_SELECT_TRAIL_EVENT_LABEL,
  HOSTING_DESTINATION_SELECT_TRAIL_LABEL,
} from '../createFlowCopy';
import {
  DEFAULT_PLACE_CATALOG_COUNTRY,
  buildPlaceCatalogAreaOptions,
  buildPlaceCatalogPlaceGroupOptions,
  buildPlaceCatalogStateOptions,
  filterPlaceCatalogRowsInArea,
  filterPlaceCatalogTrailRowsInGroup,
  scopePlaceCatalogDestination,
  searchPlaceCatalogDestination,
  type PlaceCatalogDestinationSearchHit,
} from '../../places/placeCatalogDestinationIndex';
import type { CreateActivityDraft } from './hostingFlowEngine';
import {
  applyHostingDestinationSearchHit,
  patchHostingDestinationCatalogLeafLadder,
} from './hostingDestinationDraft';

const fieldClass = EXPLORE_FLOW.composeField;
const labelClass = EXPLORE_FLOW.composeFieldLabel;

type Props = {
  state: string;
  areaId: string;
  placeGroup: string;
  draftRegistryPlaceId: string | null;
  /** Rows from {@link fetchPlaceCatalog} — place catalog, not a hosting registry. */
  catalogPlaces: PlaceDTO[];
  areas: AreaPublicDTO[];
  placeType: ActivityType;
  countryCode?: CountryCode;
  onStateChange: (state: string) => void;
  onAreaChange: (areaId: string) => void;
  onPlaceGroupChange: (placeGroup: string) => void;
  onPickTrail: (placeId: string) => void;
  onClearTrail: () => void;
  onPatchDraft: (patch: Partial<CreateActivityDraft>) => void;
  onAddNewTrail?: () => void;
  onReset: () => void;
  onCountryChange?: (countryCode: CountryCode) => void;
  placeGateMessage?: string | null;
  hideTrailRow?: boolean;
  showFind?: boolean;
};

const searchGroupLabel = (hit: PlaceCatalogDestinationSearchHit): string => {
  if (hit.kind === 'trail') return HOSTING_DESTINATION_SEARCH_GROUP_ROUTE;
  if (hit.kind === 'place') return HOSTING_DESTINATION_SEARCH_GROUP_PLACE;
  return HOSTING_DESTINATION_SEARCH_GROUP_AREA;
};

const trailStepCopy = (placeType: ActivityType): { label: string; placeholder: string } => {
  if (placeType === 'camping') {
    return {
      label: HOSTING_DESTINATION_SELECT_TRAIL_CAMP_LABEL,
      placeholder: 'Select camp spot…',
    };
  }
  if (placeType === 'event') {
    return {
      label: HOSTING_DESTINATION_SELECT_TRAIL_EVENT_LABEL,
      placeholder: 'Select venue…',
    };
  }
  return {
    label: HOSTING_DESTINATION_SELECT_TRAIL_LABEL,
    placeholder: 'Select trail…',
  };
};

export const HostingDestinationCascade = ({
  state,
  areaId,
  placeGroup,
  draftRegistryPlaceId,
  catalogPlaces,
  areas,
  placeType,
  countryCode = DEFAULT_PLACE_CATALOG_COUNTRY,
  onStateChange,
  onAreaChange,
  onPlaceGroupChange,
  onPickTrail,
  onClearTrail,
  onPatchDraft,
  onAddNewTrail,
  onReset,
  onCountryChange,
  placeGateMessage,
  hideTrailRow = false,
  showFind = true,
}: Props) => {
  const [query, setQuery] = useState('');
  const stateColumnLabel = subdivisionNoun(countryCode);

  const searchHits = useMemo(
    () => searchPlaceCatalogDestination(query, catalogPlaces, areas, countryCode),
    [query, catalogPlaces, areas, countryCode]
  );

  const onSearchHit = (hit: PlaceCatalogDestinationSearchHit) => {
    if (hit.kind === 'trail') {
      const row = catalogPlaces.find((place) => place.id === hit.placeId);
      if (row) {
        onPatchDraft(patchHostingDestinationCatalogLeafLadder(row, areas, countryCode, catalogPlaces));
      }
      onPickTrail(hit.placeId);
      setQuery('');
      return;
    }
    const patch = applyHostingDestinationSearchHit(hit, areas, countryCode);
    if (patch) onPatchDraft(patch);
    setQuery('');
  };

  const catalog = useMemo(
    () => scopePlaceCatalogDestination(catalogPlaces, areas, countryCode),
    [catalogPlaces, areas, countryCode]
  );

  const stateOptions = useMemo(() => buildPlaceCatalogStateOptions(countryCode), [countryCode]);

  const areaOptions = useMemo(
    () => buildPlaceCatalogAreaOptions(catalogPlaces, areas, state, countryCode),
    [catalogPlaces, areas, state, countryCode]
  );

  const selectedArea = areaOptions.find((row) => row.id === areaId) ?? null;

  const placesInArea = useMemo(() => {
    if (!selectedArea) return [];
    return filterPlaceCatalogRowsInArea(catalog.places, selectedArea, catalog.areas);
  }, [catalog.places, catalog.areas, selectedArea]);

  const placeGroupOptions = useMemo(
    () => buildPlaceCatalogPlaceGroupOptions(placesInArea),
    [placesInArea]
  );

  const trailsInGroup = useMemo(() => {
    if (!placeGroup) return [];
    return filterPlaceCatalogTrailRowsInGroup(placesInArea, placeGroup, catalog.places);
  }, [placesInArea, placeGroup]);

  const trailCopy = trailStepCopy(placeType);

  const hasSelection =
    Boolean(state) || Boolean(areaId) || Boolean(placeGroup) || Boolean(draftRegistryPlaceId);

  return (
    <div className="space-y-3">
      <label className="block">
        <span className={labelClass}>{HOSTING_DESTINATION_SELECT_COUNTRY}</span>
        <AppSelect
          className="mt-0.5 w-full"
          value={countryCode}
          disabled={!onCountryChange}
          options={SUPPORTED_COUNTRIES.map((row) => ({ value: row.code, label: row.label }))}
          onChange={(next) => onCountryChange?.(next as CountryCode)}
          inputClassName={fieldClass}
          aria-label={HOSTING_DESTINATION_SELECT_COUNTRY}
        />
        <p className="mt-1 text-xs text-neutral-600">Catalog scope for {stateColumnLabel.toLowerCase()}, area, and place lists.</p>
      </label>

      {showFind ? (
        <label className="block">
          <span className={labelClass}>Find place or trail</span>
          <div className="relative mt-0">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={HOSTING_DESTINATION_FIND_PLACEHOLDER}
              className={`${fieldClass} w-full pl-11`}
              autoComplete="off"
            />
          </div>
          {query.trim().length >= 2 ? (
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-1">
              {searchHits.length === 0 ? (
                <li className="px-3 py-2 text-sm text-neutral-600">No matches — use the fields below.</li>
              ) : (
                searchHits.map((hit) => {
                  const key =
                    hit.kind === 'trail'
                      ? `trail-${hit.placeId}`
                      : hit.kind === 'place'
                        ? `place-${hit.areaId}-${hit.placeGroupKey}`
                        : `area-${hit.areaId}`;
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => onSearchHit(hit)}
                        className="flex w-full flex-col rounded-xl px-3 py-2 text-left hover:bg-emerald-50/80"
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                          {searchGroupLabel(hit)}
                        </span>
                        <span className="text-sm font-semibold text-neutral-950">{hit.title}</span>
                        <span className="text-xs text-neutral-600">{hit.subtitle}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          ) : null}
        </label>
      ) : null}

      <div className="flex items-center justify-end">
        {hasSelection ? (
          <button
            type="button"
            onClick={onReset}
            className="text-sm font-semibold text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
          >
            {HOSTING_DESTINATION_RESET_LABEL}
          </button>
        ) : null}
      </div>

      <label className="block">
        <span className={labelClass}>{stateColumnLabel}</span>
        <AppSelect
          className="w-full"
          value={state}
          disabled={stateOptions.length === 0}
          placeholder="Select state…"
          options={stateOptions.map((row) => ({ value: row.value, label: row.label }))}
          onChange={(next) => onStateChange(next)}
          inputClassName={fieldClass}
          aria-label={stateColumnLabel}
        />
      </label>

      <label className="block">
        <span className={labelClass}>{HOSTING_DESTINATION_SELECT_AREA}</span>
        <AppSelect
          className="w-full"
          value={areaId}
          disabled={!state || areaOptions.length === 0}
          placeholder="Select area…"
          options={areaOptions.map((row) => ({ value: row.id, label: row.name }))}
          onChange={(next) => onAreaChange(next)}
          inputClassName={fieldClass}
          aria-label={HOSTING_DESTINATION_SELECT_AREA}
        />
      </label>

      <label className="block">
        <span className={labelClass}>{HOSTING_DESTINATION_SELECT_PLACE}</span>
        <AppSelect
          className="w-full"
          value={placeGroup}
          disabled={!areaId || placeGroupOptions.length === 0}
          placeholder="Select place…"
          options={placeGroupOptions.map((row) => ({ value: row.key, label: row.label }))}
          onChange={(next) => onPlaceGroupChange(next)}
          inputClassName={fieldClass}
          aria-label={HOSTING_DESTINATION_SELECT_PLACE}
        />
      </label>

      {hideTrailRow ? null : (
        <div className="block">
          <span className={labelClass}>{trailCopy.label}</span>
          {placeGroup ? (
            <p className="mt-0.5 text-xs text-neutral-600">{HOSTING_DESTINATION_LEAF_HINT}</p>
          ) : (
            <p className="mt-0.5 text-xs text-neutral-500">Choose a place to see trails here.</p>
          )}
          {placeGroup && trailsInGroup.length === 0 && onAddNewTrail ? (
            <div className="mt-1 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-3 py-3">
              <p className="text-sm text-emerald-950">{HOSTING_DESTINATION_EMPTY_ROUTES_PROMPT}</p>
              <button
                type="button"
                onClick={onAddNewTrail}
                className="mt-2 text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline"
              >
                {HOSTING_DESTINATION_ADD_TRAIL_NEW}
              </button>
            </div>
          ) : (
            <div className="mt-1 flex overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <div className="min-w-0 flex-1 border-r border-neutral-200">
                <AppSelect
                  className="w-full"
                  value={draftRegistryPlaceId ?? ''}
                  disabled={!placeGroup}
                  placeholder={trailCopy.placeholder}
                  options={trailsInGroup.map((row) => ({
                    value: row.id,
                    label: row.status === 'draft' ? `${row.name} (pending review)` : row.name,
                  }))}
                  onChange={(next) => onPickTrail(next)}
                  inputClassName={`${fieldClass} rounded-none border-0`}
                  aria-label={trailCopy.label}
                />
              </div>
              {onAddNewTrail ? (
                <button
                  type="button"
                  onClick={onAddNewTrail}
                  className="shrink-0 px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  {HOSTING_DESTINATION_ADD_TRAIL_NEW}
                </button>
              ) : null}
            </div>
          )}
          {placeGateMessage ? (
            <p className="mt-1.5 text-xs font-medium text-amber-800">{placeGateMessage}</p>
          ) : !placeGroup && onAddNewTrail ? (
            <p className="mt-1.5 text-xs text-neutral-500">{HOSTING_DESTINATION_PICK_PLACE_FIRST}</p>
          ) : null}
        </div>
      )}

      {draftRegistryPlaceId ? (
        <button
          type="button"
          onClick={onClearTrail}
          className="text-sm font-medium text-neutral-600 underline-offset-2 hover:underline"
        >
          Clear trail selection
        </button>
      ) : null}
    </div>
  );
};

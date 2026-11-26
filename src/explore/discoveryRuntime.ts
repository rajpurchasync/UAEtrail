/**
 * Discovery runtime — canonical FE surface for map catalog + card projections.
 *
 * **One engine:** `GET /explore/map` (+ overlay) via {@link fetchExploreMapItems} → card VMs in `src/discovery`.
 * **Projections:** `src/list/*`, `src/discovery/*`, map peek — import shared primitives from here,
 * not deep `explore/search/*` unless you own explore shell internals (`ListDiscoveryExperience`, map chrome).
 *
 * @see scripts/governance/bounded-context-manifest.json · context `discovery`
 * @see npm run discovery:import-audit
 */

export {
  EXPLORE_PLACE_TOPIC_OPTIONS,
  EXPLORE_PLACE_TYPES_PARAM,
  EXPLORE_TRIP_TYPES_PARAM,
  aliasListPlaceTopicToMap,
  aliasPlaceMapTopicToList,
  parsePlaceMapTopicsParam,
  parseTripMapTopicsParam,
  serializePlaceMapTopicsParam,
  serializeTripMapTopicsParam,
  type PlaceMapTopicKey,
  type TripMapTopicKey,
} from './exploreMapTopicUrlParams';

export {
  fetchExploreMapItems,
  fetchExploreMapOverlayIfSignedIn,
  type ConditionalCatalog,
} from '../hooks/exploreMapClientApi';

export {
  exploreMapQueryKey,
  exploreMapQueryKeyPrefix,
  reloadExploreMap,
} from '../hooks/useExploreMap';

export {
  parseExplorePanel,
  parseMapFilter,
  parseVenueRegionsParam,
  type MapFilterKey,
  type ExplorePanel,
} from './discoveryUrlParams';

export {
  parseExplorePinKindFilter,
  serializeExplorePinKindFilter,
  type ExplorePinKindFilter,
} from './explorePinKindFilter';

export {
  matchesActivityDateFilter,
  parseExploreActivityDatePreset,
  serializeExploreActivityDatePreset,
  type ExploreActivityDatePreset,
} from './exploreActivityDateFilter';

export {
  EXPLORE_PRICE_FILTER_OPTIONS,
  exploreItemMatchesFacilityKinds,
  exploreItemMatchesPriceFilter,
  explorePlaceHasHostedTrip,
  hostedOutingSummariesByPlaceId,
  hostedPlaceLocationIdsFromCatalog,
  EXPLORE_FACILITY_KINDS_PARAM,
  EXPLORE_HAS_TRIP_PARAM,
  EXPLORE_PRICE_PARAM,
  parseExploreFacilityKinds,
  parseExploreHasTrip,
  parseExplorePriceFilter,
  serializeExploreFacilityKinds,
  serializeExploreHasTrip,
  serializeExplorePriceFilter,
  type ExplorePriceFilter,
} from './exploreOptionalFilters';

export {
  EXPLORE_SEARCH_OPEN_PLACEHOLDER,
  EXPLORE_SEARCH_SCOPES_SHIPPED,
  parseExploreMapFilterPillsParam,
  serializeExploreMapFilterPillsParam,
  type ExploreMapFilterPillKey,
  type ExploreSearchScopeKey,
} from './exploreBrowseTaxonomy';

export { exploreItemMatchesQuery, countExploreSearchScopes } from './exploreSearchMatches';

export { resolveExploreCoverImage } from './exploreCoverImage';

export { matchesUnifiedTopicFilter } from './exploreMapTopicFilterMatch';
export { resolveExploreItemScheduleDate } from './exploreMapItemSchedule';
export { isPlacesMapItem, isShopListItem, mapItemMatchesShopsPill } from './exploreMapItemKind';

export { deriveVenueRegionSortOrder } from './exploreListSort';

export { finalizeDiscoveryCardLinkedRideshare } from './linkedRideshareExplore';

export {
  activityMapPeekActionLabel,
  type ActivityMapPeekActionLabelContext,
} from './exploreMapPeekActionCopy';

export { useExplorePublishedDestinationsQuery } from './useExplorePublishedDestinations';

/** Card projections: import from `src/discovery` / `src/discovery/index.ts` (not here — avoids list ↔ discovery cycles). */
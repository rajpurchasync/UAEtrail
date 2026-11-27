/** List browse URL state, draft query, and venue/geo read models for the discovery shell. */

import { useEffect, useMemo, useState } from 'react';
import { parseExploreDestinationSlug } from '../../discovery/discoveryPortExploreCatalogFilters';
import { useExplorePublishedDestinationsQuery } from '../../discovery/discoveryPortExploreBrowseHooks';
import { useListDiscoveryUrlState } from '../browse/useListDiscoveryUrlState';
import { resolveEffectiveBrowseVenueRegions } from '../browse/browseGeoPath';
import { useDiscoveryBrowseGeoScope } from '../../discovery/discoverySession';
import type { DiscoveryBrowseListSessionSnapshot } from '../../discovery/discoverySession';
import { countBrowseListFilters } from '../browse/browseListLayout';
import { parseBrowseListBucket, type BrowseListBucket } from '../browse/browseListBucket';
import {
  browseListSearchUsesScopeHints,
  resolveBrowseListSearchPlaceholder,
  type BrowseListCreateFabHints,
} from '../browse/browseListCopy';

export type ListDiscoveryBrowseUrlInput = {
  mapOverlay: boolean;
  searchResultsBrowse: boolean;
  searchParams: URLSearchParams;
  isSignedIn: boolean;
  exploreListBrowseSession?: DiscoveryBrowseListSessionSnapshot | null;
};

export const useListDiscoveryBrowseUrlModel = ({
  mapOverlay,
  searchResultsBrowse,
  searchParams,
  isSignedIn,
  exploreListBrowseSession = null,
}: ListDiscoveryBrowseUrlInput) => {
  const browseUrl = useListDiscoveryUrlState({
    mapOverlay,
    searchResultsBrowse,
  });
  const {
    filters,
    syncUrl,
    venueRegions,
    geoPath,
    listCat,
    layout,
    sort,
    crewsOpenLens,
    crewsAvailabilityGuideFilter,
  } = browseUrl;

  useDiscoveryBrowseGeoScope(exploreListBrowseSession?.geoPath ?? geoPath);

  const isPeopleCategory = listCat === 'people';
  const explorerBucket: BrowseListBucket = parseBrowseListBucket(listCat);

  const createFabContext = useMemo<BrowseListCreateFabHints>(
    () => ({
      isPeopleCategory,
      explorerBucket,
    }),
    [isPeopleCategory, explorerBucket]
  );

  const listSearchPlaceholder = useMemo(
    () => resolveBrowseListSearchPlaceholder(listCat, explorerBucket, isSignedIn),
    [listCat, explorerBucket, isSignedIn]
  );
  const listSearchScopeHints = useMemo(() => browseListSearchUsesScopeHints(listCat), [listCat]);

  const [draftQuery, setDraftQuery] = useState(filters.query);
  useEffect(() => {
    setDraftQuery(filters.query);
  }, [filters.query]);

  const destinationSlug = parseExploreDestinationSlug(searchParams);
  const { data: publishedDestinations = [] } = useExplorePublishedDestinationsQuery(!isPeopleCategory);
  const hubVenueRegions = useMemo(
    () => resolveEffectiveBrowseVenueRegions(venueRegions, geoPath, publishedDestinations),
    [venueRegions, geoPath, publishedDestinations]
  );

  const filterCount = isPeopleCategory
    ? filters.activityDatePreset !== 'anyday'
      ? 1
      : 0
    : countBrowseListFilters(filters, venueRegions, explorerBucket, geoPath.length);

  return {
    filters,
    syncUrl,
    venueRegions,
    geoPath,
    listCat,
    layout,
    sort,
    crewsOpenLens,
    crewsAvailabilityGuideFilter,
    isPeopleCategory,
    explorerBucket,
    createFabContext,
    listSearchPlaceholder,
    listSearchScopeHints,
    draftQuery,
    setDraftQuery,
    destinationSlug,
    publishedDestinations,
    hubVenueRegions,
    filterCount,
  };
};
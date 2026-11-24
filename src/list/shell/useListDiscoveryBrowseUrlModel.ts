/** List browse URL state, draft query, and venue/geo read models for the discovery shell. */

import { useEffect, useMemo, useState } from 'react';
import { parseExploreDestinationSlug } from '../../explore/exploreAreaFilter';
import { useExplorePublishedAreasQuery } from '../../explore/discoveryRuntime';
import { useListDiscoveryUrlState } from '../browse/useListDiscoveryUrlState';
import { resolveEffectiveBrowseVenueRegions } from '../browse/browseGeoPath';
import { useBrowseGeoScopeHydration } from '../browse/useBrowseGeoScopeHydration';
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
};

export const useListDiscoveryBrowseUrlModel = ({
  mapOverlay,
  searchResultsBrowse,
  searchParams,
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

  useBrowseGeoScopeHydration(geoPath);

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
    () => resolveBrowseListSearchPlaceholder(listCat, explorerBucket),
    [listCat, explorerBucket]
  );
  const listSearchScopeHints = useMemo(() => browseListSearchUsesScopeHints(listCat), [listCat]);

  const [draftQuery, setDraftQuery] = useState(filters.query);
  useEffect(() => {
    setDraftQuery(filters.query);
  }, [filters.query]);

  const destinationSlug = parseExploreDestinationSlug(searchParams);
  const { data: publishedAreas = [] } = useExplorePublishedAreasQuery(!isPeopleCategory);
  const hubVenueRegions = useMemo(
    () => resolveEffectiveBrowseVenueRegions(venueRegions, geoPath, publishedAreas),
    [venueRegions, geoPath, publishedAreas]
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
    publishedAreas,
    hubVenueRegions,
    filterCount,
  };
};
/** List browse URL mutations — search commit, filter reset, geo scope. */

import { useCallback } from 'react';
import { browseListFilterPatchForSearchScope } from '../browse/browseListSearchCommit';
import type { BrowseListFilterState } from '../browse/browseListFilters';
import type { BrowseListBucket } from '../browse/browseListBucket';
import type { BrowseMainCategoryKey } from '../browse/browseListTaxonomy';
import { browseListCatForBucket, scopeBrowseListStateForListCat } from '../browse/browseListMapHandoff';
import type { ExploreActivityDatePreset } from '../../discovery/discoveryPortExploreOptionalFilterWire';
import type { ExploreSearchScopeKey } from '../../discovery/discoveryPortExploreSearchRouting';

export type ListDiscoveryBrowseSyncUrl = (
  patch: Partial<BrowseListFilterState> & {
    regions?: string[];
    geoPath?: string[];
    listCat?: BrowseMainCategoryKey | null;
  }
) => void;

export type ListDiscoveryBrowseActionsInput = {
  draftQuery: string;
  setDraftQuery: (query: string) => void;
  filters: BrowseListFilterState;
  listCat: BrowseMainCategoryKey | null;
  explorerBucket: BrowseListBucket;
  geoPath: string[];
  syncUrl: ListDiscoveryBrowseSyncUrl;
};

export const useListDiscoveryBrowseActionsModel = ({
  draftQuery,
  setDraftQuery,
  filters,
  listCat,
  explorerBucket,
  geoPath,
  syncUrl,
}: ListDiscoveryBrowseActionsInput) => {
  const commitQuery = useCallback(() => {
    syncUrl({ query: draftQuery });
  }, [draftQuery, syncUrl]);

  const handleSearchCommit = useCallback(
    (scope?: ExploreSearchScopeKey | null) => {
      if (scope === 'facilities') return;
      if (scope === 'people') {
        syncUrl({
          query: draftQuery,
          listCat: 'people',
          categories: ['people'],
          tripAvailabilityOnly: false,
          tripTopics: [],
          placeTopics: [],
          activityDatePreset: 'anyday',
        });
        return;
      }
      if (scope === 'activities') {
        syncUrl({
          listCat: 'activities',
          ...scopeBrowseListStateForListCat(filters, 'activities'),
          query: draftQuery,
        });
        return;
      }
      if (scope === 'places' || scope === 'shops') {
        const patch = browseListFilterPatchForSearchScope(scope);
        syncUrl({
          listCat: 'venues',
          ...scopeBrowseListStateForListCat(
            { ...filters, placeTopics: patch?.placeTopics ?? [] },
            'venues'
          ),
          query: draftQuery,
        });
        return;
      }
      if (scope === 'agencies') {
        syncUrl({ query: draftQuery, listCat: 'agencies', categories: ['agencies'] });
        return;
      }
      const cat = listCat ?? browseListCatForBucket(explorerBucket);
      syncUrl({
        listCat: cat,
        ...scopeBrowseListStateForListCat(filters, cat === 'venues' ? 'venues' : 'activities'),
        query: draftQuery,
      });
    },
    [draftQuery, explorerBucket, filters, listCat, syncUrl]
  );

  const clearAllFilters = useCallback(() => {
    const cat = listCat ?? browseListCatForBucket(explorerBucket);
    const emptyBase: BrowseListFilterState = {
      query: '',
      categories: [],
      tripTopics: [],
      placeTopics: [],
      tripAvailabilityOnly: false,
      price: 'all',
      when: 'any',
      activityDatePreset: 'anyday',
      crewBrowseLane: filters.crewBrowseLane,
      crewPeopleFacet: filters.crewPeopleFacet,
      crewProfessionalKind: filters.crewProfessionalKind,
      crewPeopleSurface: filters.crewPeopleSurface,
      hasTrip: false,
      facilityKinds: [],
      audience: 'anyone',
    };
    const scoped =
      cat === 'venues' || cat === 'activities'
        ? scopeBrowseListStateForListCat(emptyBase, cat)
        : emptyBase;
    syncUrl({ ...scoped, listCat: cat, regions: [], geoPath: [] });
    setDraftQuery('');
  }, [explorerBucket, filters.crewBrowseLane, filters.crewPeopleFacet, listCat, setDraftQuery, syncUrl]);

  const handleActivityDatePresetChange = useCallback(
    (preset: ExploreActivityDatePreset) => syncUrl({ activityDatePreset: preset }),
    [syncUrl]
  );

  const handleClearGeoScope = useCallback(() => syncUrl({ geoPath: [] }), [syncUrl]);

  const handlePopGeoScope = useCallback(
    () => syncUrl({ geoPath: geoPath.slice(0, -1) }),
    [geoPath, syncUrl]
  );

  const handleVenueRegionsChange = useCallback(
    (regions: string[]) => syncUrl({ regions }),
    [syncUrl]
  );

  return {
    commitQuery,
    handleSearchCommit,
    clearAllFilters,
    handleActivityDatePresetChange,
    handleClearGeoScope,
    handlePopGeoScope,
    handleVenueRegionsChange,
  };
};
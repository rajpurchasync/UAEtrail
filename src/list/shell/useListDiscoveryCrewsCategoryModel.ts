/**
 * List browse `listCat=people` — member discovery only (bounded context `member_discovery`).
 *
 * Product "Find crew" covers members (buddies, guides-as-people, availability, directory).
 * It does **not** include tour agencies (`listCat=agencies`), shops/partners (map venues), or
 * future public community groups (`MIG-COMMUNITY-DISCOVER`) — those use explore catalog / tenant APIs.
 */

import { useCallback, useMemo } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { ExploreActivityDatePreset } from '../browse/discoveryListRuntime';
import {
  crewBrowseNeedsAvailability,
  crewBrowseNeedsRoster,
  crewBrowseOmitDirectory,
  crewsCategoryMapFeedEnabled,
  type CrewBrowseState,
} from '@/crew-discovery/crewBrowseState';
import { useCrewDiscoveryAvailabilityCatalog } from '@/crew-discovery/hooks/useCrewDiscoveryAvailabilityCatalog';
import { useCrewDiscoveryRoster } from '@/crew-discovery/hooks/useCrewDiscoveryRoster';
import { useCrewDiscoveryAvailability } from '@/crew-discovery/hooks/useCrewDiscoveryAvailability';
import type { CrewsAvailableOpenLens } from '../crews/crewsOpenSegment';
import { browseListEntityLinkState } from '../browse/browseListNavState';

export type ListDiscoveryCrewsCategoryModelInput = {
  enabled: boolean;
  user: { id: string } | null | undefined;
  draftQuery: string;
  crewBrowseLane: CrewBrowseState['lane'];
  crewPeopleFacet: CrewBrowseState['facet'];
  activityDatePreset: ExploreActivityDatePreset;
  areaSlug: string | null;
};

export const useListDiscoveryCrewsCategoryModel = ({
  enabled,
  user,
  draftQuery,
  crewBrowseLane,
  crewPeopleFacet,
  activityDatePreset,
  areaSlug,
}: ListDiscoveryCrewsCategoryModelInput) => {
  const signedIn = Boolean(user);
  const active = enabled && signedIn;
  const browseState: CrewBrowseState = { lane: crewBrowseLane, facet: crewPeopleFacet };

  const crewsNeedsRoster = crewBrowseNeedsRoster(browseState);
  const crewsNeedsAvailability = crewBrowseNeedsAvailability(browseState);

  const memberRoster = useCrewDiscoveryRoster({
    enabled: active && crewsNeedsRoster,
    search: draftQuery,
    activityDatePreset,
    omitDirectory: crewBrowseOmitDirectory(browseState),
  });

  const memberAvailability = useCrewDiscoveryAvailability({
    enabled: active && crewsNeedsAvailability,
    search: draftQuery,
    activityDatePreset,
    areaSlug,
    mapFilter: 'all',
  });

  return {
    memberRoster,
    memberAvailability,
    crewsNeedsAvailability,
  };
};

export type ListDiscoveryCrewsCategoryAugmentInput = {
  enabled: boolean;
  crewBrowseLane: CrewBrowseState['lane'];
  crewPeopleFacet: CrewBrowseState['facet'];
  crewsNeedsAvailability: boolean;
  draftQuery: string;
  exploreCatalogItems: ExploreMapItemDTO[];
  exploreCatalogLoading: boolean;
  memberRoster: ReturnType<typeof useCrewDiscoveryRoster>;
  memberAvailability: ReturnType<typeof useCrewDiscoveryAvailability>;
  navigate: NavigateFunction;
  locationPathname: string;
  locationSearch: string;
  crewsOpenLens: CrewsAvailableOpenLens;
};

export const useListDiscoveryCrewsCategoryAugment = ({
  enabled,
  crewBrowseLane,
  crewPeopleFacet,
  crewsNeedsAvailability,
  draftQuery,
  exploreCatalogItems,
  exploreCatalogLoading,
  memberRoster,
  memberAvailability,
  navigate,
  locationPathname,
  locationSearch,
  crewsOpenLens,
}: ListDiscoveryCrewsCategoryAugmentInput) => {
  const browseState: CrewBrowseState = { lane: crewBrowseLane, facet: crewPeopleFacet };

  const { availabilityCatalogItems } = useCrewDiscoveryAvailabilityCatalog({
    enabled:
      enabled &&
      crewsNeedsAvailability &&
      crewsCategoryMapFeedEnabled(browseState, crewsOpenLens),
    exploreCatalogFallback: exploreCatalogItems,
    filters: {
      mapFilter: 'all',
      buddySubtype: 'all',
      outingTopic: 'all',
      query: draftQuery,
    },
  });

  const handleOpenAvailabilityCatalogItem = useCallback(
    (item: { path: string }) => {
      const returnTo = `${locationPathname}${locationSearch}`;
      navigate(item.path, { state: browseListEntityLinkState(returnTo) });
    },
    [locationPathname, locationSearch, navigate]
  );

  const crewsStatCounts = useMemo(() => {
    const buddiesCount = memberRoster.loading ? null : memberRoster.friendsGoing.length;
    const markedCount = memberAvailability.loading ? 0 : memberAvailability.people.length;
    const mapSignalsCount = exploreCatalogLoading ? 0 : availabilityCatalogItems.length;
    const availableCount = markedCount + mapSignalsCount;
    const everyoneCount = memberRoster.loading ? null : memberRoster.directory.length;
    return {
      recommended: null,
      friends: buddiesCount,
      available:
        memberRoster.loading || memberAvailability.loading || exploreCatalogLoading ? null : availableCount,
      everyone: everyoneCount,
    };
  }, [
    memberRoster.loading,
    memberRoster.friendsGoing.length,
    memberRoster.directory.length,
    memberAvailability.loading,
    memberAvailability.people.length,
    exploreCatalogLoading,
    availabilityCatalogItems.length,
  ]);

  return {
    availabilityCatalogItems,
    handleOpenAvailabilityCatalogItem,
    crewsStatCounts,
  };
};
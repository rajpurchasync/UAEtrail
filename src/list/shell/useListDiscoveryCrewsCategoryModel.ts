/**
 * List browse `listCat=people` — member discovery only (bounded context `member_discovery`).
 *
 * Product "Find crew" covers members (buddies, guides-as-people, availability, directory).
 * It does **not** include tour agencies (`listCat=agencies`), shops/partners (map venues), or
 * future public community groups (`MIG-COMMUNITY-DISCOVER`) — those use explore catalog / tenant APIs.
 */

import { useCallback, useMemo } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { ExploreActivityDatePreset, ExploreMapItemDTO } from '@uaetrail/shared-types';
import type { PeopleBrowseTab } from '@/people-discovery/peopleBrowseTab';
import { usePeopleDiscoveryAvailabilityCatalog } from '@/people-discovery/hooks/usePeopleDiscoveryAvailabilityCatalog';
import { useMemberDiscoveryRoster } from '@/people-discovery/hooks/useMemberDiscoveryRoster';
import { useExplorePeopleAvailability } from '@/people-discovery/hooks/usePeopleAvailability';
import type { CrewsAvailableOpenLens } from '../crews/crewsOpenSegment';
import { browseListEntityLinkState } from '../browse/browseListNavState';

export type ListDiscoveryCrewsCategoryModelInput = {
  enabled: boolean;
  user: { id: string } | null | undefined;
  draftQuery: string;
  peopleBrowseTab: PeopleBrowseTab;
  activityDatePreset: ExploreActivityDatePreset;
  areaSlug: string | null;
};

export const crewsCategoryNeedsRoster = (peopleSegment: PeopleBrowseTab): boolean =>
  peopleSegment === 'hub' ||
  peopleSegment === 'going' ||
  peopleSegment === 'connect' ||
  peopleSegment === 'available' ||
  peopleSegment === 'looking';

export const crewsCategoryNeedsAvailability = (peopleSegment: PeopleBrowseTab): boolean =>
  peopleSegment === 'hub' || peopleSegment === 'available' || peopleSegment === 'looking';

/** When false, list map feed is skipped for crews (member-discovery APIs only). */
export const crewsCategoryMapFeedEnabled = (
  peopleSegment: PeopleBrowseTab,
  crewsOpenLens: CrewsAvailableOpenLens
): boolean =>
  peopleSegment === 'looking' ||
  ((peopleSegment === 'available' || peopleSegment === 'hub') &&
    (crewsOpenLens === 'all' || crewsOpenLens === 'looking'));

export const useListDiscoveryCrewsCategoryModel = ({
  enabled,
  user,
  draftQuery,
  peopleBrowseTab,
  activityDatePreset,
  areaSlug,
}: ListDiscoveryCrewsCategoryModelInput) => {
  const peopleSegment = peopleBrowseTab;
  const signedIn = Boolean(user);
  const active = enabled && signedIn;

  const crewsNeedsRoster = crewsCategoryNeedsRoster(peopleSegment);
  const crewsNeedsAvailability = crewsCategoryNeedsAvailability(peopleSegment);

  const memberRoster = useMemberDiscoveryRoster({
    enabled: active && crewsNeedsRoster,
    search: draftQuery,
    activityDatePreset,
    omitDirectory: !(peopleSegment === 'connect' || peopleSegment === 'hub'),
  });

  const memberAvailability = useExplorePeopleAvailability({
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
  peopleBrowseTab: PeopleBrowseTab;
  crewsNeedsAvailability: boolean;
  draftQuery: string;
  exploreCatalogItems: ExploreMapItemDTO[];
  exploreCatalogLoading: boolean;
  memberRoster: ReturnType<typeof useMemberDiscoveryRoster>;
  memberAvailability: ReturnType<typeof useExplorePeopleAvailability>;
  navigate: NavigateFunction;
  locationPathname: string;
  locationSearch: string;
};

/** After map feed — looking rows compose from explore catalog fallback. */
export const useListDiscoveryCrewsCategoryAugment = ({
  enabled,
  peopleBrowseTab: _peopleBrowseTab,
  crewsNeedsAvailability,
  draftQuery,
  exploreCatalogItems,
  exploreCatalogLoading,
  memberRoster,
  memberAvailability,
  navigate,
  locationPathname,
  locationSearch,
}: ListDiscoveryCrewsCategoryAugmentInput) => {
  const { availabilityCatalogItems } = usePeopleDiscoveryAvailabilityCatalog({
    enabled: enabled && crewsNeedsAvailability,
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
    const lookingCount = exploreCatalogLoading ? 0 : availabilityCatalogItems.length;
    const availableCount = markedCount + lookingCount;
    const everyoneCount = memberRoster.loading ? null : memberRoster.directory.length;
    return {
      buddies: buddiesCount,
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
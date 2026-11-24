import type { ReactNode } from 'react';
import type {
  ExploreAvailablePersonDTO,
  ExploreMapItemDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import {
  EXPLORE_CREWS_AVAILABILITY_EMPTY,
  EXPLORE_CREWS_CONNECT_EMPTY,
  EXPLORE_CREWS_FRIENDS_GOING_EMPTY,
  EXPLORE_CREWS_LOADING,
} from '../../../content/exploreCrewsCopy';
import type { ExploreActivityDatePreset } from '@/explore/exploreActivityDateFilter';
import type { CrewsAvailabilityShapeFilter } from '@/list/crews/crewsOpenSegment';
import {
  buildMemberBrowseRowFromAvailability,
  buildMemberBrowseRowFromGoing,
  buildMemberBrowseRowsFromDirectory,
  filterAvailabilityByCapacity,
  filterAvailabilityPeopleByShape,
  filterDirectoryBrowseCards,
  sortAvailabilityPeopleNetworkFirst,
  type MemberBrowseRowVm,
} from '../../memberBrowseRowModel';
import { FIND_CREW_PEOPLE_EMPTY } from '@/list/explorer/findCrewSearchCopy';
import type { CrewsAvailabilityGuideFilter } from '@/list/crews/crewsOpenSegment';
import { CREW_BROWSE_LIST_STACK } from './crewBrowseListTheme';
import { CrewBrowseListEmpty, CrewBrowseListError, CrewBrowseListLoading } from './CrewBrowseListStates';
import { CrewBrowseMemberRow } from './CrewBrowseMemberRow';
import { CrewBrowseAvailabilityMapList } from './CrewBrowseAvailabilityMapList';
import { ExploreGuestSignInCard } from '@/explore/ui/ExploreGuestSignInCard';
import { crewBrowseHrefForGuest } from '@/crew-discovery/crewGuestBrowse';
import { messagesToUserPath } from '@/config/routingCatalog';

export type CrewBrowseTabKey = 'available' | 'going' | 'connect';

const crewBrowseAuthError = (message: string): boolean =>
  /missing bearer token|session expired|authentication is required|sign in again/i.test(message);

export type CrewBrowseTabContentProps = {
  tab: CrewBrowseTabKey;
  isSignedIn: boolean;
  availabilityPeople: ExploreAvailablePersonDTO[];
  availabilityLoading: boolean;
  availabilityError: string | null;
  friendsGoing: SocialPersonRowDTO[];
  hostsGoing: SocialPersonRowDTO[];
  directory: MemberBrowseCardDTO[];
  discoveryQuota: MemberDiscoveryQuotaDTO | null;
  discoveryLoading: boolean;
  discoveryError: string | null;
  availabilityCatalogItems: ExploreMapItemDTO[];
  exploreCatalogItems: ExploreMapItemDTO[];
  exploreCatalogLoading: boolean;
  onOpenAvailabilityCatalogItem: (item: ExploreMapItemDTO) => void;
  onOfferRideshareForAvailabilityItem?: (item: ExploreMapItemDTO) => void;
  friendUserIds?: Set<string>;
  /** Flexible vs fixed intent — not map vs calendar chrome. */
  availabilityShape?: CrewsAvailabilityShapeFilter;
  availabilityGuideFilter?: CrewsAvailabilityGuideFilter;
  onOpenAvailability?: () => void;
  /** Find crew search — member rows only (no `FIXED` map catalog cards). */
  memberAvailabilityRowsOnly?: boolean;
  followedUserIds?: ReadonlySet<string>;
  activityDatePreset?: ExploreActivityDatePreset;
};

const MemberBrowseRowList = ({
  rows,
  isSignedIn,
}: {
  rows: MemberBrowseRowVm[];
  isSignedIn: boolean;
}) => (
  <ul className={CREW_BROWSE_LIST_STACK}>
    {rows.map((row) => {
      const { key, userId, profileHref, actionHref, proposePlanHref, ...props } = row;
      const profile = crewBrowseHrefForGuest(profileHref, isSignedIn);
      const messageHref = crewBrowseHrefForGuest(messagesToUserPath(userId), isSignedIn);
      const proposePlan = proposePlanHref
        ? crewBrowseHrefForGuest(proposePlanHref, isSignedIn)
        : undefined;
      return (
        <li key={key}>
          <CrewBrowseMemberRow
            {...props}
            userId={userId}
            profileHref={profile}
            proposePlanHref={proposePlan}
            messageHref={messageHref}
            isSignedIn={isSignedIn}
            actionHref={actionHref ? crewBrowseHrefForGuest(actionHref, isSignedIn) : undefined}
          />
        </li>
      );
    })}
  </ul>
);

export const CrewBrowseTabContent = ({
  tab,
  isSignedIn,
  availabilityPeople,
  availabilityLoading,
  availabilityError,
  friendsGoing,
  hostsGoing,
  directory,
  discoveryQuota,
  discoveryLoading,
  discoveryError,
  availabilityCatalogItems,
  exploreCatalogItems,
  exploreCatalogLoading,
  onOpenAvailabilityCatalogItem,
  onOfferRideshareForAvailabilityItem,
  friendUserIds,
  availabilityShape = 'all',
  availabilityGuideFilter = 'all',
  onOpenAvailability,
  memberAvailabilityRowsOnly = false,
  followedUserIds,
  activityDatePreset,
}: CrewBrowseTabContentProps) => {
  if (tab === 'going' && !isSignedIn) {
    return <ExploreGuestSignInCard intent="explore-people-browse" compact />;
  }

  if (tab === 'available') {
    const showFixedCatalog =
      !memberAvailabilityRowsOnly && (availabilityShape === 'all' || availabilityShape === 'fixed');
    const rosterSource = memberAvailabilityRowsOnly
      ? sortAvailabilityPeopleNetworkFirst(availabilityPeople, followedUserIds)
      : availabilityPeople;
    const byShape = filterAvailabilityPeopleByShape(rosterSource, availabilityShape);
    const markedPeople = filterAvailabilityByCapacity(byShape, availabilityGuideFilter);
    const buildOpts = memberAvailabilityRowsOnly
      ? { followedUserIds, findCrewDiscovery: true as const, activityDatePreset }
      : undefined;
    const markedRows = markedPeople.map((person) => buildMemberBrowseRowFromAvailability(person, buildOpts));
    const emptyCopy = memberAvailabilityRowsOnly ? FIND_CREW_PEOPLE_EMPTY : EXPLORE_CREWS_AVAILABILITY_EMPTY;

    const mapSignalsBlock =
      showFixedCatalog ? (
        <CrewBrowseAvailabilityMapList
          availabilityCatalogItems={availabilityCatalogItems}
          exploreCatalogItems={exploreCatalogItems}
          loading={exploreCatalogLoading}
          onOpenAvailabilityCatalogItem={onOpenAvailabilityCatalogItem}
          onOfferRideshareForAvailabilityItem={onOfferRideshareForAvailabilityItem}
          friendUserIds={friendUserIds}
        />
      ) : null;

    let peopleBlock: ReactNode = null;
    if (availabilityLoading) {
      peopleBlock = <CrewBrowseListLoading label={EXPLORE_CREWS_LOADING} />;
    } else if (availabilityError) {
      if (crewBrowseAuthError(availabilityError)) {
        peopleBlock = <ExploreGuestSignInCard intent="explore-people-browse" compact />;
      } else {
        peopleBlock = <CrewBrowseListError message={availabilityError} />;
      }
    } else if (markedRows.length === 0) {
      peopleBlock =
        showFixedCatalog && availabilityCatalogItems.length > 0 ? null : (
          <CrewBrowseListEmpty>
            <p>{emptyCopy}</p>
            {!memberAvailabilityRowsOnly && onOpenAvailability ? (
              <button
                type="button"
                className="mt-3 inline-block font-semibold text-emerald-700"
                onClick={onOpenAvailability}
              >
                Add or edit your dates
              </button>
            ) : null}
          </CrewBrowseListEmpty>
        );
    } else {
      peopleBlock = <MemberBrowseRowList rows={markedRows} isSignedIn={isSignedIn} />;
    }

    const hasMap = showFixedCatalog && availabilityCatalogItems.length > 0;
    const hasPeople =
      !availabilityLoading && !availabilityError && markedRows.length > 0;

    if (!hasMap && !hasPeople && !availabilityLoading && !availabilityError) {
      return (
        <CrewBrowseListEmpty>
          <p>{emptyCopy}</p>
          {!memberAvailabilityRowsOnly && onOpenAvailability ? (
            <button
              type="button"
              className="mt-3 inline-block font-semibold text-emerald-700"
              onClick={onOpenAvailability}
            >
              Add or edit your dates
            </button>
          ) : null}
        </CrewBrowseListEmpty>
      );
    }

    return (
      <div className={CREW_BROWSE_LIST_STACK}>
        {mapSignalsBlock}
        {peopleBlock}
      </div>
    );
  }

  if (discoveryLoading) {
    return <CrewBrowseListLoading label={EXPLORE_CREWS_LOADING} />;
  }
  if (discoveryError) {
    if (crewBrowseAuthError(discoveryError)) {
      return <ExploreGuestSignInCard intent="explore-people-browse" compact />;
    }
    return <CrewBrowseListError message={discoveryError} />;
  }

  if (tab === 'going') {
    if (friendsGoing.length === 0) {
      return <CrewBrowseListEmpty>{EXPLORE_CREWS_FRIENDS_GOING_EMPTY}</CrewBrowseListEmpty>;
    }
    return (
      <MemberBrowseRowList rows={friendsGoing.map(buildMemberBrowseRowFromGoing)} isSignedIn={isSignedIn} />
    );
  }

  const directoryOnly = filterDirectoryBrowseCards(directory, friendsGoing, hostsGoing);

  return (
    <>
      {directoryOnly.length === 0 ? (
        <CrewBrowseListEmpty>{EXPLORE_CREWS_CONNECT_EMPTY}</CrewBrowseListEmpty>
      ) : (
        <MemberBrowseRowList
          isSignedIn={isSignedIn}
          rows={buildMemberBrowseRowsFromDirectory({
            directory,
            friendsGoing,
            hostsGoing,
            quota: discoveryQuota,
          })}
        />
      )}
    </>
  );
};
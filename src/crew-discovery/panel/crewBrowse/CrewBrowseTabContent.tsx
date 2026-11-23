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
  EXPLORE_CREWS_MAP_SIGNALS_TITLE,
} from '../../../content/exploreCrewsCopy';
import type { CrewsAvailableOpenLens } from '@/list/crews/crewsOpenSegment';
import {
  buildMemberBrowseRowFromAvailability,
  buildMemberBrowseRowFromGoing,
  buildMemberBrowseRowsFromDirectory,
  filterAvailabilityByCapacity,
  filterDirectoryBrowseCards,
  type MemberBrowseRowVm,
} from '../../memberBrowseRowModel';
import type { CrewsAvailabilityGuideFilter } from '@/list/crews/crewsOpenSegment';
import { CREW_BROWSE_LIST_STACK } from './crewBrowseListTheme';
import { CrewBrowseListEmpty, CrewBrowseListError, CrewBrowseListLoading } from './CrewBrowseListStates';
import { CrewBrowseMemberRow } from './CrewBrowseMemberRow';
import { CrewBrowseAvailabilityMapList } from './CrewBrowseAvailabilityMapList';
import { ExploreGuestSignInCard } from '@/explore/ui/ExploreGuestSignInCard';

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
  /** Crews list — filter Available combined lanes. */
  crewsOpenLens?: CrewsAvailableOpenLens;
  /** Calendar availability rows — intent `guide` kind filter. */
  availabilityGuideFilter?: CrewsAvailabilityGuideFilter;
  onOpenAvailability?: () => void;
};

const MemberBrowseRowList = ({ rows }: { rows: MemberBrowseRowVm[] }) => (
  <ul className={CREW_BROWSE_LIST_STACK}>
    {rows.map((row) => {
      const { key, userId: _userId, ...props } = row;
      return (
        <li key={key}>
          <CrewBrowseMemberRow {...props} />
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
  crewsOpenLens = 'all',
  availabilityGuideFilter = 'all',
  onOpenAvailability,
}: CrewBrowseTabContentProps) => {
  if (tab !== 'available' && !isSignedIn) {
    return <ExploreGuestSignInCard intent="explore-people-browse" compact />;
  }

  if (tab === 'available') {
    const showMapSignals = crewsOpenLens === 'all' || crewsOpenLens === 'open';
    const showMarked = crewsOpenLens === 'all' || crewsOpenLens === 'marked';

    const mapSignalsBlock =
      showMapSignals ? (
        <CrewBrowseAvailabilityMapList
          availabilityCatalogItems={availabilityCatalogItems}
          exploreCatalogItems={exploreCatalogItems}
          loading={exploreCatalogLoading}
          onOpenAvailabilityCatalogItem={onOpenAvailabilityCatalogItem}
          onOfferRideshareForAvailabilityItem={onOfferRideshareForAvailabilityItem}
          friendUserIds={friendUserIds}
        />
      ) : null;

    const markedPeople = filterAvailabilityByCapacity(availabilityPeople, availabilityGuideFilter);
    const markedRows = markedPeople.map(buildMemberBrowseRowFromAvailability);
    let markedBlock: ReactNode = null;
    if (showMarked) {
      if (!isSignedIn) {
        markedBlock = <ExploreGuestSignInCard intent="explore-people-browse" compact />;
      } else if (availabilityLoading) {
        markedBlock = <CrewBrowseListLoading label={EXPLORE_CREWS_LOADING} />;
      } else if (availabilityError) {
        if (crewBrowseAuthError(availabilityError)) {
          markedBlock = <ExploreGuestSignInCard intent="explore-people-browse" compact />;
        } else {
          markedBlock = <CrewBrowseListError message={availabilityError} />;
        }
      } else if (markedRows.length === 0) {
        markedBlock = (
          <CrewBrowseListEmpty>
            <p>{EXPLORE_CREWS_AVAILABILITY_EMPTY}</p>
            {onOpenAvailability ? (
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
        markedBlock = <MemberBrowseRowList rows={markedRows} />;
      }
    }

    if (!showMapSignals) return <>{markedBlock}</>;
    if (!showMarked) return <>{mapSignalsBlock}</>;

    return (
      <div className="space-y-6">
        <section aria-labelledby="crews-map-signals-heading">
          <h3
            id="crews-map-signals-heading"
            className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500"
          >
            {EXPLORE_CREWS_MAP_SIGNALS_TITLE}
          </h3>
          {mapSignalsBlock}
        </section>
        <section aria-labelledby="crews-marked-heading">
          <h3 id="crews-marked-heading" className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">
            Marked available
          </h3>
          {markedBlock}
        </section>
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
    return <MemberBrowseRowList rows={friendsGoing.map(buildMemberBrowseRowFromGoing)} />;
  }

  const directoryOnly = filterDirectoryBrowseCards(directory, friendsGoing, hostsGoing);

  return (
    <>
      {directoryOnly.length === 0 ? (
        <CrewBrowseListEmpty>{EXPLORE_CREWS_CONNECT_EMPTY}</CrewBrowseListEmpty>
      ) : (
        <MemberBrowseRowList
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
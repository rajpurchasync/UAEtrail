import type { ReactNode } from 'react';
import type {
  ExploreAvailablePersonDTO,
  ExploreMapItemDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import {
  EXPLORE_PEOPLE_BROWSE_AVAILABILITY_EMPTY,
  EXPLORE_PEOPLE_BROWSE_CONNECT_EMPTY,
  EXPLORE_PEOPLE_BROWSE_FRIENDS_GOING_EMPTY,
  EXPLORE_PEOPLE_BROWSE_LOADING,
} from '../../../content/explorePeopleBrowseCopy';
import type { CrewsAvailableOpenLens } from '@/list/crews/crewsOpenSegment';
import {
  buildMemberBrowseRowFromAvailability,
  buildMemberBrowseRowFromGoing,
  buildMemberBrowseRowsFromDirectory,
  filterDirectoryBrowseCards,
  type MemberBrowseRowVm,
} from '../../memberBrowseRowModel';
import { PEOPLE_BROWSE_LIST_STACK } from './peopleBrowseListTheme';
import { PeopleBrowseListEmpty, PeopleBrowseListError, PeopleBrowseListLoading } from './PeopleBrowseListStates';
import { PeopleBrowseMemberRow } from './PeopleBrowseMemberRow';
import { PeopleBrowseLookingList } from './PeopleBrowseLookingList';
import { ExploreGuestSignInCard } from '@/explore/ui/ExploreGuestSignInCard';

export type PeopleBrowseTabKey = 'looking' | 'available' | 'going' | 'connect';

const peopleBrowseAuthError = (message: string): boolean =>
  /missing bearer token|session expired|authentication is required|sign in again/i.test(message);

export type PeopleBrowseTabContentProps = {
  tab: PeopleBrowseTabKey;
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
  onOpenSeekingActivity: (item: ExploreMapItemDTO) => void;
  buddyUserIds?: Set<string>;
  /** Crews list — filter Available combined lanes. */
  crewsOpenLens?: CrewsAvailableOpenLens;
  onOpenAvailability?: () => void;
};

const MemberBrowseRowList = ({ rows }: { rows: MemberBrowseRowVm[] }) => (
  <ul className={PEOPLE_BROWSE_LIST_STACK}>
    {rows.map((row) => {
      const { key, userId: _userId, ...props } = row;
      return (
        <li key={key}>
          <PeopleBrowseMemberRow {...props} />
        </li>
      );
    })}
  </ul>
);

export const PeopleBrowseTabContent = ({
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
  onOpenSeekingActivity,
  buddyUserIds,
  crewsOpenLens = 'all',
  onOpenAvailability,
}: PeopleBrowseTabContentProps) => {
  if (tab === 'looking') {
    return (
      <PeopleBrowseLookingList
        availabilityCatalogItems={availabilityCatalogItems}
        exploreCatalogItems={exploreCatalogItems}
        loading={exploreCatalogLoading}
        onOpenSeekingActivity={onOpenSeekingActivity}
        buddyUserIds={buddyUserIds}
      />
    );
  }

  if (!isSignedIn) {
    return <ExploreGuestSignInCard intent="explore-people-browse" compact />;
  }

  if (tab === 'available') {
  const showLooking = crewsOpenLens === 'all' || crewsOpenLens === 'looking';
    const showMarked = crewsOpenLens === 'all' || crewsOpenLens === 'marked';

    const lookingBlock =
      showLooking ? (
        <PeopleBrowseLookingList
          availabilityCatalogItems={availabilityCatalogItems}
          exploreCatalogItems={exploreCatalogItems}
          loading={exploreCatalogLoading}
          onOpenSeekingActivity={onOpenSeekingActivity}
          buddyUserIds={buddyUserIds}
        />
      ) : null;

    const markedRows = availabilityPeople.map(buildMemberBrowseRowFromAvailability);
    let markedBlock: ReactNode = null;
    if (showMarked) {
      if (availabilityLoading) {
        markedBlock = <PeopleBrowseListLoading label={EXPLORE_PEOPLE_BROWSE_LOADING} />;
      } else if (availabilityError) {
        if (peopleBrowseAuthError(availabilityError)) {
          markedBlock = <ExploreGuestSignInCard intent="explore-people-browse" compact />;
        } else {
          markedBlock = <PeopleBrowseListError message={availabilityError} />;
        }
      } else if (markedRows.length === 0) {
        markedBlock = (
          <PeopleBrowseListEmpty>
            <p>{EXPLORE_PEOPLE_BROWSE_AVAILABILITY_EMPTY}</p>
            {onOpenAvailability ? (
              <button
                type="button"
                className="mt-3 inline-block font-semibold text-emerald-700"
                onClick={onOpenAvailability}
              >
                Add or edit your dates
              </button>
            ) : null}
          </PeopleBrowseListEmpty>
        );
      } else {
        markedBlock = <MemberBrowseRowList rows={markedRows} />;
      }
    }

    if (!showLooking) return <>{markedBlock}</>;
    if (!showMarked) return <>{lookingBlock}</>;

    return (
      <div className="space-y-6">
        <section aria-labelledby="crews-looking-heading">
          <h3 id="crews-looking-heading" className="mb-2 text-sm font-bold uppercase tracking-wide text-neutral-500">
            Looking for crew
          </h3>
          {lookingBlock}
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
    return <PeopleBrowseListLoading label={EXPLORE_PEOPLE_BROWSE_LOADING} />;
  }
  if (discoveryError) {
    if (peopleBrowseAuthError(discoveryError)) {
      return <ExploreGuestSignInCard intent="explore-people-browse" compact />;
    }
    return <PeopleBrowseListError message={discoveryError} />;
  }

  if (tab === 'going') {
    if (friendsGoing.length === 0) {
      return <PeopleBrowseListEmpty>{EXPLORE_PEOPLE_BROWSE_FRIENDS_GOING_EMPTY}</PeopleBrowseListEmpty>;
    }
    return <MemberBrowseRowList rows={friendsGoing.map(buildMemberBrowseRowFromGoing)} />;
  }

  const directoryOnly = filterDirectoryBrowseCards(directory, friendsGoing, hostsGoing);

  return (
    <>
      {directoryOnly.length === 0 ? (
        <PeopleBrowseListEmpty>{EXPLORE_PEOPLE_BROWSE_CONNECT_EMPTY}</PeopleBrowseListEmpty>
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

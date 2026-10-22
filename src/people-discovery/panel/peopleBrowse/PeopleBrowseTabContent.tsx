import { Link } from 'react-router-dom';
import type {
  ExploreAvailablePersonDTO,
  ExploreMapItemDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import { EXPLORE_TYPE } from '../../../config/exploreTheme';
import {
  EXPLORE_PEOPLE_BROWSE_AVAILABILITY_EMPTY,
  EXPLORE_PEOPLE_BROWSE_CONNECT_EMPTY,
  EXPLORE_PEOPLE_BROWSE_FRIENDS_GOING_EMPTY,
  EXPLORE_PEOPLE_BROWSE_LOADING,
} from '../../../content/explorePeopleBrowseCopy';
import { planAvailabilityPath } from '../../../plan/planRouting';
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
  seekingActivities: ExploreMapItemDTO[];
  exploreCatalogItems: ExploreMapItemDTO[];
  exploreCatalogLoading: boolean;
  onOpenSeekingActivity: (item: ExploreMapItemDTO) => void;
  buddyUserIds?: Set<string>;
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
  seekingActivities,
  exploreCatalogItems,
  exploreCatalogLoading,
  onOpenSeekingActivity,
  buddyUserIds,
}: PeopleBrowseTabContentProps) => {
  if (tab === 'looking') {
    return (
      <PeopleBrowseLookingList
        seekingActivities={seekingActivities}
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
    if (availabilityLoading) {
      return <PeopleBrowseListLoading label={EXPLORE_PEOPLE_BROWSE_LOADING} />;
    }
    if (availabilityError) {
      if (peopleBrowseAuthError(availabilityError)) {
        return <ExploreGuestSignInCard intent="explore-people-browse" compact />;
      }
      return <PeopleBrowseListError message={availabilityError} />;
    }
    if (availabilityPeople.length === 0) {
      return (
        <PeopleBrowseListEmpty>
          <p>{EXPLORE_PEOPLE_BROWSE_AVAILABILITY_EMPTY}</p>
          <Link to={planAvailabilityPath()} className="mt-3 inline-block font-semibold text-emerald-700">
            Add yours on Plan
          </Link>
        </PeopleBrowseListEmpty>
      );
    }
    return (
      <MemberBrowseRowList rows={availabilityPeople.map(buildMemberBrowseRowFromAvailability)} />
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

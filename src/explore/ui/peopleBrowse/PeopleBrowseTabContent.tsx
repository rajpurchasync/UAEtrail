import { Link } from 'react-router-dom';
import type {
  ExploreAvailablePersonDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import { proMembershipPath } from '../../../config/routingCatalog';
import { EXPLORE_TYPE } from '../../../config/exploreTheme';
import {
  EXPLORE_PEOPLE_BROWSE_AVAILABILITY_EMPTY,
  EXPLORE_PEOPLE_BROWSE_CONNECT_EMPTY,
  EXPLORE_PEOPLE_BROWSE_EVERYONE_PRO_LOCK_LABEL,
  EXPLORE_PEOPLE_BROWSE_FRIENDS_GOING_EMPTY,
  EXPLORE_PEOPLE_BROWSE_LOADING,
  peopleBrowseAvailabilityDateLine,
  peopleBrowseAvailabilitySentence,
  peopleBrowseGoingSentence,
} from '../../../content/explorePeopleBrowseCopy';
import { memberProfileRoleBadgeLabel } from '../../../member/memberProfileRoleBadge';
import { memberProfileRoleLabel } from '../../../member/memberProfileRoleLabel';
import { planLensPath } from '../../../plan/planLens';
import { memberDiscoverProfilePath } from '../../memberDiscoveryExplore';
import { memberPersonRowFromBrowseCard } from '../../memberPeopleBrowseRows';
import { availabilityKindLabels } from './peopleBrowseAvailabilityKinds';
import { PEOPLE_BROWSE_LIST_STACK } from './peopleBrowseListTheme';
import { PeopleBrowseListEmpty, PeopleBrowseListError, PeopleBrowseListLoading } from './PeopleBrowseListStates';
import { PeopleBrowseMemberRow } from './PeopleBrowseMemberRow';
import { ExploreGuestSignInCard } from '../ExploreGuestSignInCard';

export type PeopleBrowseTabKey = 'available' | 'going' | 'connect';

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
};

const AvailabilityRows = ({ people }: { people: ExploreAvailablePersonDTO[] }) => (
  <ul className={PEOPLE_BROWSE_LIST_STACK}>
    {people.map((person) => {
      const labels = availabilityKindLabels(person.kinds);

      return (
        <li key={person.userId}>
          <PeopleBrowseMemberRow
            profileHref={memberDiscoverProfilePath(person.userId)}
            displayName={person.displayName}
            avatarUrl={person.avatarUrl}
            buddyHighlight={person.isBuddy}
            title={peopleBrowseAvailabilitySentence(person.displayName, labels, person.slots)}
            dateLine={peopleBrowseAvailabilityDateLine(person.slots)}
            titleClamp="wrap"
          />
        </li>
      );
    })}
  </ul>
);

const GoingRows = ({ friendsGoing }: { friendsGoing: SocialPersonRowDTO[] }) => (
  <ul className={PEOPLE_BROWSE_LIST_STACK}>
    {friendsGoing.map((person) => (
      <li key={person.userId}>
        <PeopleBrowseMemberRow
          profileHref={memberDiscoverProfilePath(person.userId)}
          displayName={person.displayName}
          avatarUrl={person.avatarUrl}
          buddyHighlight
          title={peopleBrowseGoingSentence(person.displayName, person.upcomingTrip)}
          location={person.cityLabel}
          titleClamp="line-clamp-2"
        />
      </li>
    ))}
  </ul>
);

const DirectoryRows = ({
  directory,
  friendsGoing,
  hostsGoing,
  quota,
}: {
  directory: MemberBrowseCardDTO[];
  friendsGoing: SocialPersonRowDTO[];
  hostsGoing: SocialPersonRowDTO[];
  quota: MemberDiscoveryQuotaDTO | null;
}) => {
  const friendUserIds = new Set(friendsGoing.map((person) => person.userId));
  const freePreviewLimit = quota?.limit ?? null;
  const capBrowseList = freePreviewLimit != null;

  const directoryOnly = directory.filter(
    (row) => !friendUserIds.has(row.id) && !hostsGoing.some((host) => host.userId === row.id)
  );

  return (
    <ul className={PEOPLE_BROWSE_LIST_STACK}>
      {directoryOnly.map((card, index) => {
        const person = memberPersonRowFromBrowseCard(card);
        const blocked = capBrowseList && index >= freePreviewLimit!;
        const location = person.cityLabel ?? card.city;
        const roleTitle = memberProfileRoleLabel(card.profileRoleLabel);
        const badgeLabel = memberProfileRoleBadgeLabel(card.profileRoleLabel);

        return (
          <li key={card.id}>
            <PeopleBrowseMemberRow
              profileHref={
                blocked ? proMembershipPath({ intent: 'discover-members' }) : memberDiscoverProfilePath(card.id)
              }
              displayName={person.displayName}
              avatarUrl={person.avatarUrl}
              title={person.displayName}
              location={location}
              roleTitle={roleTitle}
              badge={{ label: badgeLabel }}
              footnote={blocked ? EXPLORE_PEOPLE_BROWSE_EVERYONE_PRO_LOCK_LABEL : null}
            />
          </li>
        );
      })}
    </ul>
  );
};

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
}: PeopleBrowseTabContentProps) => {
  if (tab !== 'available' && !isSignedIn) {
    return <ExploreGuestSignInCard intent="explore-people-browse" compact />;
  }

  if (tab === 'available') {
    if (availabilityLoading) return <PeopleBrowseListLoading rows={5} />;
    if (availabilityError) return <PeopleBrowseListError message={availabilityError} />;
    if (availabilityPeople.length === 0) {
      return (
        <PeopleBrowseListEmpty>
          <p>{EXPLORE_PEOPLE_BROWSE_AVAILABILITY_EMPTY}</p>
          {isSignedIn ? (
            <Link to={planLensPath('availability')} className="mt-3 inline-block font-semibold text-emerald-700">
              Add yours on Plan
            </Link>
          ) : null}
        </PeopleBrowseListEmpty>
      );
    }
    return <AvailabilityRows people={availabilityPeople} />;
  }

  if (discoveryLoading) {
    return (
      <>
        <PeopleBrowseListLoading rows={5} />
        <p className={`mt-3 text-center text-sm ${EXPLORE_TYPE.caption}`}>{EXPLORE_PEOPLE_BROWSE_LOADING}</p>
      </>
    );
  }
  if (discoveryError) return <PeopleBrowseListError message={discoveryError} />;

  if (tab === 'going') {
    if (friendsGoing.length === 0) {
      return <PeopleBrowseListEmpty>{EXPLORE_PEOPLE_BROWSE_FRIENDS_GOING_EMPTY}</PeopleBrowseListEmpty>;
    }
    return <GoingRows friendsGoing={friendsGoing} />;
  }

  const friendUserIds = new Set(friendsGoing.map((person) => person.userId));
  const directoryOnly = directory.filter(
    (row) => !friendUserIds.has(row.id) && !hostsGoing.some((host) => host.userId === row.id)
  );

  return (
    <>
      {directoryOnly.length === 0 ? (
        <PeopleBrowseListEmpty>{EXPLORE_PEOPLE_BROWSE_CONNECT_EMPTY}</PeopleBrowseListEmpty>
      ) : (
        <DirectoryRows
          directory={directory}
          friendsGoing={friendsGoing}
          hostsGoing={hostsGoing}
          quota={discoveryQuota}
        />
      )}
    </>
  );
};

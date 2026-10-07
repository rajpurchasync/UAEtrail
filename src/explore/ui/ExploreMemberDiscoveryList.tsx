import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type {
  MemberBrowseCardDTO,
  MemberDiscoveryLookingRowDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import type { UserRole } from '@uaetrail/shared-types';
import { proMembershipPath } from '../../config/routingCatalog';
import type { BuddiesDiscoverySegment } from '../../list/buddiesDiscoverySegment';
import { LIST_SECTION_TITLE } from '../../list/listChromeTheme';
import { socialPersonRowFromBrowseCard } from '../memberDiscoverySocialRows';
import { memberDiscoverProfilePath } from '../memberDiscoveryExplore';
import { exploreMapItemSharePath } from '../routing';
import { ExploreGuestSignInCard } from './ExploreGuestSignInCard';
import { ListFeedPersonCard } from '../../list/ui/feed/ListFeedPersonCard';
import { LIST_FEED } from '../../list/listFeedTheme';
import { ExploreSocialPersonCard } from './ExploreSocialPersonCard';
import {
  BUDDIES_DISCOVERY_INTRO,
  EXPLORE_SOCIAL_DISCOVER_DIRECTORY_TITLE,
  EXPLORE_SOCIAL_DISCOVER_FRIENDS_GOING_TITLE,
  EXPLORE_SOCIAL_DISCOVER_HOSTS_GOING_TITLE,
  EXPLORE_SOCIAL_DISCOVER_LOOKING_TITLE,
  EXPLORE_SOCIAL_EMPTY_DISCOVER,
  EXPLORE_SOCIAL_EMPTY_DISCOVER_FOLLOWED,
  EXPLORE_SOCIAL_EMPTY_DISCOVER_LOOKING,
  EXPLORE_SOCIAL_FOLLOWED_SEGMENT_PEOPLE,
  EXPLORE_SOCIAL_LOADING,
  exploreSocialDiscoverQuotaLine,
} from '../../content/exploreSocialPanelCopy';
import {
  MEMBER_DISCOVERY_QUOTA_GATE_BODY,
  MEMBER_DISCOVERY_QUOTA_GATE_CTA,
  MEMBER_DISCOVERY_QUOTA_GATE_TITLE,
} from '../../content/exploreGoingPanelCopy';
import { api } from '../../api/index';

type ExploreMemberDiscoveryListProps = {
  variant?: 'panel' | 'list';
  segment?: BuddiesDiscoverySegment;
  friendsGoing: SocialPersonRowDTO[];
  hostsGoing: SocialPersonRowDTO[];
  lookingFor: MemberDiscoveryLookingRowDTO[];
  followed: MemberBrowseCardDTO[];
  directory: MemberBrowseCardDTO[];
  quota: MemberDiscoveryQuotaDTO | null;
  loading: boolean;
  error: string | null;
  isSignedIn: boolean;
  userRole?: UserRole;
  onOpenActivity: (activityId: string) => void;
  onRefresh?: () => void;
};

export const ExploreMemberDiscoveryList = ({
  variant = 'panel',
  segment = 'going',
  friendsGoing,
  hostsGoing,
  lookingFor,
  followed,
  directory,
  quota,
  loading,
  error,
  isSignedIn,
  userRole,
  onOpenActivity,
  onRefresh,
}: ExploreMemberDiscoveryListProps) => {
  const navigate = useNavigate();
  const listLayout = variant === 'list';
  const sectionTitleClass = `mb-2 ${LIST_SECTION_TITLE}`;
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isSignedIn) {
    return <ExploreGuestSignInCard intent="explore-social" compact />;
  }

  if (loading) {
    return (
      <div className={listLayout ? 'py-5' : 'space-y-3 py-4'} aria-busy>
        {[0, 1].map((key) => (
          <div
            key={key}
            className={`animate-pulse bg-neutral-200 ${listLayout ? 'aspect-[4/5] w-full rounded-none md:rounded-[22px]' : 'h-28 rounded-2xl'}`}
          />
        ))}
        <p className={`text-center text-sm text-gray-500 ${listLayout ? 'mt-4' : ''}`}>
          {EXPLORE_SOCIAL_LOADING}
        </p>
      </div>
    );
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">{error}</p>;
  }

  const quotaExhausted =
    quota != null && quota.limit != null && quota.remaining != null && quota.remaining <= 0;

  const showGoing = segment === 'going';
  const showLooking = segment === 'looking';
  const showFollowed = segment === 'followed';
  const showDirectory = variant === 'panel' && !listLayout;

  const directoryOnly = directory.filter(
    (row) =>
      !friendsGoing.some((p) => p.userId === row.id) &&
      !hostsGoing.some((p) => p.userId === row.id)
  );

  const hasRows =
    (showGoing && (friendsGoing.length > 0 || hostsGoing.length > 0)) ||
    (showLooking && lookingFor.length > 0) ||
    (showFollowed && followed.length > 0) ||
    (showDirectory && directoryOnly.length > 0);

  const emptyCopy =
    segment === 'looking'
      ? EXPLORE_SOCIAL_EMPTY_DISCOVER_LOOKING
      : segment === 'followed'
        ? EXPLORE_SOCIAL_EMPTY_DISCOVER_FOLLOWED
        : EXPLORE_SOCIAL_EMPTY_DISCOVER;

  const showQuota = segment !== 'followed';

  const sendBuddyRequest = async (userId: string) => {
    setBusyUserId(userId);
    setActionError(null);
    setNotice(null);
    try {
      await api.sendBuddyRequest({ targetUserId: userId });
      setNotice('Buddy request sent.');
      onRefresh?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not send request.');
    } finally {
      setBusyUserId(null);
    }
  };

  const openActivityFromTrip = (trip: { exploreItemId: string }) => {
    const activityId = trip.exploreItemId.replace(/^activity:/, '');
    onOpenActivity(activityId);
  };

  const profilePathFor = (userId: string) => memberDiscoverProfilePath(userId);

  const renderPerson = (person: SocialPersonRowDTO) =>
    listLayout ? (
      <ListFeedPersonCard
        person={person}
        userRole={userRole}
        profileTo={profilePathFor(person.userId)}
        profileDisabled={quotaExhausted && person.relationship !== 'friend'}
        onOpenActivity={openActivityFromTrip}
        busy={busyUserId === person.userId}
        onSendBuddyRequest={(userId) => void sendBuddyRequest(userId)}
      />
    ) : (
      <ExploreSocialPersonCard
        person={person}
        userRole={userRole}
        profileTo={profilePathFor(person.userId)}
        profileDisabled={quotaExhausted && person.relationship !== 'friend'}
        showPlanTrip={false}
        onOpenActivity={openActivityFromTrip}
        busy={busyUserId === person.userId}
        onSendBuddyRequest={(userId) => void sendBuddyRequest(userId)}
      />
    );

  const listFeedClass = listLayout ? LIST_FEED.categoryList : '';

  return (
    <div className={`flex flex-col ${listLayout ? '' : 'gap-4'}`}>
      {!listLayout ? (
        <p className="text-sm leading-relaxed text-neutral-600">{BUDDIES_DISCOVERY_INTRO}</p>
      ) : null}

      {notice ? (
        <p className={`text-xs font-medium text-emerald-700 ${listLayout ? 'px-4' : ''}`}>{notice}</p>
      ) : null}
      {actionError ? (
        <p className={`text-xs font-medium text-red-600 ${listLayout ? 'px-4' : ''}`}>{actionError}</p>
      ) : null}

      {quota && showQuota && !listLayout ? (
        <p className="text-xs font-medium tabular-nums text-neutral-500">
          {exploreSocialDiscoverQuotaLine(quota)}
        </p>
      ) : null}

      {quotaExhausted && showQuota ? (
        <div
          className={`rounded-2xl border border-amber-200/90 bg-amber-50/80 px-4 py-3 ${listLayout ? 'mx-4' : ''}`}
        >
          <p className="text-sm font-bold text-amber-950">{MEMBER_DISCOVERY_QUOTA_GATE_TITLE}</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/90">{MEMBER_DISCOVERY_QUOTA_GATE_BODY}</p>
          <Link
            to={proMembershipPath({ intent: 'discover-members' })}
            className="mt-2 inline-block text-sm font-semibold text-emerald-700 hover:underline"
          >
            {MEMBER_DISCOVERY_QUOTA_GATE_CTA}
          </Link>
        </div>
      ) : null}

      {!hasRows ? (
        <div
          className={`rounded-2xl border border-dashed border-emerald-200/80 bg-emerald-50/30 px-4 py-8 text-center ${listLayout ? 'mx-4' : ''}`}
        >
          <p className="text-sm text-neutral-600">{emptyCopy}</p>
        </div>
      ) : null}

      {showGoing && (friendsGoing.length > 0 || hostsGoing.length > 0) ? (
        <section>
          {!listLayout && friendsGoing.length > 0 ? (
            <>
              <h3 className={sectionTitleClass}>{EXPLORE_SOCIAL_DISCOVER_FRIENDS_GOING_TITLE}</h3>
              <ul className="flex flex-col gap-2">
                {friendsGoing.map((person) => (
                  <li key={person.userId}>{renderPerson(person)}</li>
                ))}
              </ul>
            </>
          ) : null}
          {!listLayout && hostsGoing.length > 0 ? (
            <>
              <h3 className={sectionTitleClass}>{EXPLORE_SOCIAL_DISCOVER_HOSTS_GOING_TITLE}</h3>
              <ul className="flex flex-col gap-2">
                {hostsGoing.map((person) => (
                  <li key={person.userId}>{renderPerson(person)}</li>
                ))}
              </ul>
            </>
          ) : null}
          {listLayout ? (
            <ul className={listFeedClass}>
              {friendsGoing.map((person) => (
                <li key={person.userId}>{renderPerson(person)}</li>
              ))}
              {hostsGoing.map((person) => (
                <li key={person.userId}>{renderPerson(person)}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {showLooking && lookingFor.length > 0 ? (
        <section>
          {!listLayout ? <h3 className={sectionTitleClass}>{EXPLORE_SOCIAL_DISCOVER_LOOKING_TITLE}</h3> : null}
          <ul className={listLayout ? listFeedClass : 'flex flex-col gap-2'}>
            {lookingFor.map((row) => {
              const enrich = directory.find((card) => card.id === row.userId);
              const person = enrich
                ? socialPersonRowFromBrowseCard(enrich)
                : socialPersonRowFromBrowseCard({
                    id: row.userId,
                    displayName: row.displayName,
                    avatarUrl: row.avatarUrl,
                    city: null,
                  });
              const outingHint = {
                line: `Looking for: ${row.demandTitle}`,
                onClick: () => navigate(exploreMapItemSharePath(row.exploreItemId)),
              };
              return (
                <li key={`${row.userId}-${row.participantIntentId}`}>
                  {listLayout ? (
                    <ListFeedPersonCard
                      person={person}
                      userRole={userRole}
                      profileTo={profilePathFor(row.userId)}
                      profileDisabled={quotaExhausted}
                      onOpenActivity={openActivityFromTrip}
                      outingHint={outingHint}
                      busy={busyUserId === row.userId}
                      onSendBuddyRequest={(userId) => void sendBuddyRequest(userId)}
                    />
                  ) : (
                    <ExploreSocialPersonCard
                      person={person}
                      userRole={userRole}
                      profileTo={profilePathFor(row.userId)}
                      profileDisabled={quotaExhausted}
                      showPlanTrip={false}
                      onOpenActivity={openActivityFromTrip}
                      outingHint={outingHint}
                      busy={busyUserId === row.userId}
                      onSendBuddyRequest={(userId) => void sendBuddyRequest(userId)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {showFollowed && followed.length > 0 ? (
        <section>
          {!listLayout ? <h3 className={sectionTitleClass}>{EXPLORE_SOCIAL_FOLLOWED_SEGMENT_PEOPLE}</h3> : null}
          <ul className={listLayout ? listFeedClass : 'flex flex-col gap-2'}>
            {followed.map((card) => (
              <li key={card.id}>
                {listLayout ? (
                  <ListFeedPersonCard
                    person={socialPersonRowFromBrowseCard(card)}
                    userRole={userRole}
                    profileTo={profilePathFor(card.id)}
                    profileDisabled={false}
                    onOpenActivity={openActivityFromTrip}
                    busy={busyUserId === card.id}
                    onSendBuddyRequest={(userId) => void sendBuddyRequest(userId)}
                  />
                ) : (
                  <ExploreSocialPersonCard
                    person={socialPersonRowFromBrowseCard(card)}
                    userRole={userRole}
                    profileTo={profilePathFor(card.id)}
                    profileDisabled={false}
                    showPlanTrip={false}
                    onOpenActivity={openActivityFromTrip}
                    busy={busyUserId === card.id}
                    onSendBuddyRequest={(userId) => void sendBuddyRequest(userId)}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showDirectory && directoryOnly.length > 0 ? (
        <section>
          <h3 className={sectionTitleClass}>{EXPLORE_SOCIAL_DISCOVER_DIRECTORY_TITLE}</h3>
          <ul className="flex flex-col gap-2">
            {directoryOnly.map((card) => (
              <li key={card.id}>
                <ExploreSocialPersonCard
                  person={socialPersonRowFromBrowseCard(card)}
                  userRole={userRole}
                  profileTo={profilePathFor(card.id)}
                  profileDisabled={quotaExhausted}
                  showPlanTrip={false}
                  onOpenActivity={openActivityFromTrip}
                  busy={busyUserId === card.id}
                  onSendBuddyRequest={(userId) => void sendBuddyRequest(userId)}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
};

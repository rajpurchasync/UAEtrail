import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type {
  FriendRequestDTO,
  MemberFollowSummaryDTO,
  MeCommunityDiscoverRowDTO,
} from '@uaetrail/shared-types';
import {
  isMemberGroupTeamRow,
  isOutingCrewGroupRow,
  memberGroupRowLabel,
} from '@uaetrail/shared-types';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, UsersRound } from 'lucide-react';
import { activityDetailPath, communityClubPath, messagesToUserPath } from '@/config/routingCatalog';
import { FEATURE_FLAGS } from '@/config/platform';
import {
  findCrewCommunityDiscoveryPath,
  findCrewDiscoveryListPath,
  tripsListHomePath,
} from '@/list/browse/browseListRouting';
import { CREW_BROWSE_LIST_STACK } from '@/crew-discovery/panel/crewBrowse/crewBrowseListTheme';
import { useMeCommunityDiscoverList } from '@/crew-discovery/hooks/useMeCommunityDiscoverList';
import { useLeaveDiscoverableCommunity } from '@/crew-discovery/hooks/useCommunityDiscoverDetail';
import { buildDiscoveryCardModelFromCommunityDiscover } from '@/discovery/buildCommunityDiscoverCardModel';
import { BrowseCompactRow } from '@/list/browse/BrowseCompactRow';
import { ExploreGuestSignInCard } from '@/explore/ui/ExploreGuestSignInCard';
import { Dialog } from '@/components/ui/Dialog';
import { useAuth } from '@/context/AuthContext';
import { useMeFriendsNetwork, useMeFollowingMembers } from '@/hooks/useMeFriendsNetwork';
import { useMeFriendActivityPresence } from '@/my-crew/useMeFriendActivityPresence';
import {
  acceptMemberFriendRequest,
  cancelMemberFriendRequest,
  declineMemberFriendRequest,
} from '@/hooks/memberPeopleClientApi';
import { setMemberFollow } from '@/hooks/memberFollowApi';
import { fetchMeGroups } from '@/hooks/groupClientApi';
import { memberProfileLink } from '@/member/memberProfileLink';
import { CREWS_ORIGIN_QUERY, groupsManagePath, groupsPath } from '@/config/surfacePaths';
import { navigateToGroupChatFromSocial } from '@/utils/activityGroupChatNav';
import { useNavigate } from 'react-router-dom';
import { MESSAGES_CHAT_RETURN_TO_KEY } from '@/utils/activityGroupChatNav';
import { mobileBackNavState } from '@/utils/mobileBackNav';
import { crewsHubHomePath } from '@/list/browse/browseListRouting';
import { PRODUCT_FRIENDS_SURFACE_LABEL } from '@/content/productNorthStar';
import { MyCrewMemberRow } from './MyCrewMemberRow';
import { formatFollowingSince, formatFriendSince, friendPresenceFootnote } from './friendPresenceCopy';
import { sortByLastActive } from './myCrewSort';
import {
  MY_CREW_GROUP_PILL_PARAM,
  MY_CREW_PEOPLE_PILL_PARAM,
  MY_CREW_PILL_PARAM,
  MY_CREW_TAB_PARAM,
  parseMyCrewGroupPill,
  parseMyCrewMainTab,
  parseMyCrewPeoplePill,
  serializeMyCrewGroupPill,
  serializeMyCrewMainTab,
  serializeMyCrewPeoplePill,
  type MyCrewGroupPill,
  type MyCrewMainTab,
  type MyCrewPeoplePill,
} from './myCrewHubWire';
import { EXPLORE_LIST_ROW } from '@/config/exploreTheme';

const compactBtn =
  'inline-flex min-h-9 flex-1 items-center justify-center rounded-xl px-3 text-xs font-semibold transition active:scale-[0.98]';
const primaryBtn = `${compactBtn} bg-emerald-600 text-white hover:bg-emerald-700`;
const neutralBtn = `${compactBtn} border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50`;

type MyCrewHubBodyProps = {
  mainTab: MyCrewMainTab;
  peoplePill: MyCrewPeoplePill;
  groupPill: MyCrewGroupPill;
};

const myCrewReturnPath = () => crewsHubHomePath();

export const MyCrewHubBody = ({ mainTab, peoplePill, groupPill }: MyCrewHubBodyProps) => {
  const { user } = useAuth();
  const signedIn = Boolean(user);

  const friendsReturnPath = myCrewReturnPath();
  const friendsReturn = {
    ...mobileBackNavState(friendsReturnPath, PRODUCT_FRIENDS_SURFACE_LABEL),
    [MESSAGES_CHAT_RETURN_TO_KEY]: friendsReturnPath,
  };

  const {
    friends,
    incomingRequests,
    outgoingRequests,
    loading: friendsLoading,
    refetch: refetchFriendsNetwork,
  } = useMeFriendsNetwork(signedIn);
  const onPeopleFriends = mainTab === 'people' && peoplePill === 'friends';
  const onPeopleFollowing = mainTab === 'people' && peoplePill === 'following';
  const onGroups = mainTab === 'groups';

  const { byUserId: friendPresence, loading: presenceLoading } = useMeFriendActivityPresence(
    signedIn && onPeopleFriends
  );
  const {
    following,
    loading: followingLoading,
    refetch: refetchFollowing,
  } = useMeFollowingMembers(signedIn && onPeopleFollowing);
  const communitiesQuery = useMeCommunityDiscoverList();
  const memberGroupsQuery = useQuery({
    queryKey: ['me', 'groups', user?.id ?? ''],
    queryFn: fetchMeGroups,
    enabled: signedIn && onGroups && (groupPill === 'group' || groupPill === 'team'),
    staleTime: 60_000,
  });

  const [error, setError] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [unfollowBusyId, setUnfollowBusyId] = useState<string | null>(null);
  const [leaveClub, setLeaveClub] = useState<{ slug: string; communityId: string } | null>(null);
  const leaveMutation = useLeaveDiscoverableCommunity(leaveClub?.slug);

  const sortedFriends = useMemo(
    () => sortByLastActive(friends, (f) => f.connectedAt),
    [friends]
  );

  const sortedFollowing = useMemo(
    () => sortByLastActive(following, (m) => m.followedAt),
    [following]
  );

  const clubRows = useMemo(() => {
    const joined = communitiesQuery.data?.joined ?? [];
    const created = communitiesQuery.data?.created ?? [];
    return [...joined, ...created].sort((a, b) => a.name.localeCompare(b.name));
  }, [communitiesQuery.data?.created, communitiesQuery.data?.joined]);

  const outingGroupRows = useMemo(
    () => (memberGroupsQuery.data ?? []).filter((g) => isOutingCrewGroupRow(g)),
    [memberGroupsQuery.data]
  );

  const teamRows = useMemo(
    () => (memberGroupsQuery.data ?? []).filter((g) => isMemberGroupTeamRow(g)),
    [memberGroupsQuery.data]
  );

  const handleAcceptRequest = async (request: FriendRequestDTO) => {
    setBusyRequestId(request.id);
    setError(null);
    try {
      await acceptMemberFriendRequest(request.id);
      await refetchFriendsNetwork();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept request');
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleDeclineRequest = async (request: FriendRequestDTO) => {
    setBusyRequestId(request.id);
    setError(null);
    try {
      await declineMemberFriendRequest(request.id);
      await refetchFriendsNetwork();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not decline request');
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleCancelRequest = async (request: FriendRequestDTO) => {
    setBusyRequestId(request.id);
    setError(null);
    try {
      await cancelMemberFriendRequest(request.id);
      await refetchFriendsNetwork();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel request');
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleUnfollow = async (member: MemberFollowSummaryDTO) => {
    setUnfollowBusyId(member.userId);
    setError(null);
    try {
      await setMemberFollow(member.userId, false);
      await refetchFollowing();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unfollow');
    } finally {
      setUnfollowBusyId(null);
    }
  };

  const confirmLeave = async () => {
    if (!leaveClub) return;
    try {
      await leaveMutation.mutateAsync(leaveClub.communityId);
      await communitiesQuery.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not leave community');
    } finally {
      setLeaveClub(null);
    }
  };

  if (!signedIn) {
    return (
      <ExploreGuestSignInCard
        intent="explore-people-browse"
        compact
        authReturnPath={myCrewReturnPath()}
      />
    );
  }

  const loading =
    (onPeopleFriends && (friendsLoading || presenceLoading)) ||
    (onPeopleFollowing && followingLoading) ||
    (onGroups && groupPill === 'community' && communitiesQuery.isPending) ||
    (onGroups && (groupPill === 'group' || groupPill === 'team') && memberGroupsQuery.isPending);

  return (
    <>
      {error ? (
        <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
          {error}
        </p>
      ) : null}
      {loading ? (
        <div className="flex flex-col items-center gap-2 py-12" role="status" aria-live="polite">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-neutral-600">Loading…</p>
        </div>
      ) : null}

      {!loading && onPeopleFriends ? (
        <div className={CREW_BROWSE_LIST_STACK}>
          {incomingRequests.map((request) => {
            const sender = request.fromUser;
            const displayName = sender?.displayName ?? 'Member';
            return (
              <MyCrewMemberRow
                key={`in-${request.id}`}
                displayName={displayName}
                avatarUrl={sender?.avatarUrl}
                locationLabel={sender?.cityLabel}
                href={memberProfileLink(request.fromUserId, 'friends')}
                linkState={friendsReturn}
                statusLabel="Friend requested you"
                primaryCta={{
                  kind: 'button',
                  label: 'Accept',
                  variant: 'primary',
                  disabled: busyRequestId === request.id,
                  onClick: () => void handleAcceptRequest(request),
                }}
                secondaryCta={{
                  kind: 'button',
                  label: 'Decline',
                  variant: 'neutral',
                  disabled: busyRequestId === request.id,
                  onClick: () => void handleDeclineRequest(request),
                }}
              />
            );
          })}
          {outgoingRequests.map((request) => {
            const recipient = request.toUser;
            const displayName = recipient?.displayName ?? 'Member';
            return (
              <MyCrewMemberRow
                key={`out-${request.id}`}
                displayName={displayName}
                avatarUrl={recipient?.avatarUrl}
                locationLabel={recipient?.cityLabel}
                href={memberProfileLink(request.toUserId, 'friends')}
                linkState={friendsReturn}
                statusLabel="Friend requested · waiting"
                primaryCta={{
                  kind: 'button',
                  label: 'Withdraw',
                  variant: 'primary',
                  disabled: busyRequestId === request.id,
                  onClick: () => void handleCancelRequest(request),
                }}
              />
            );
          })}
          {sortedFriends.length === 0 &&
          incomingRequests.length === 0 &&
          outgoingRequests.length === 0 ? (
            <EmptyRow
              title="No friends yet"
              body="Meet people on outings — or find crew on the map."
              cta={{ label: 'Find crew', to: findCrewDiscoveryListPath() }}
            />
          ) : (
            sortedFriends.map((friend) => {
              const presence = friendPresence.get(friend.userId);
              const { text: presenceText, activityId } = friendPresenceFootnote(
                presence?.hosting ?? null,
                presence?.joining ?? null
              );
              return (
                <MyCrewMemberRow
                  key={friend.userId}
                  displayName={friend.displayName}
                  avatarUrl={friend.avatarUrl}
                  locationLabel={friend.cityLabel}
                  href={memberProfileLink(friend.userId, 'friends')}
                  linkState={friendsReturn}
                  statusLabel={formatFriendSince(friend.connectedAt)}
                  presenceFootnote={
                    presenceText ? (
                      activityId ? (
                        <Link
                          to={activityDetailPath(activityId)}
                          className="font-medium text-emerald-700 underline decoration-emerald-200 underline-offset-2"
                        >
                          {presenceText}
                        </Link>
                      ) : (
                        presenceText
                      )
                    ) : null
                  }
                  primaryCta={{
                    kind: 'link',
                    label: 'Chat',
                    to: messagesToUserPath(friend.userId),
                    state: friendsReturn,
                    variant: 'primary',
                  }}
                />
              );
            })
          )}
        </div>
      ) : null}

      {!loading && onPeopleFollowing ? (
        <div className={CREW_BROWSE_LIST_STACK}>
          {sortedFollowing.length === 0 ? (
            <EmptyRow
              title="Not following anyone yet"
              body="Follow hosts from their profile to catch new outings."
            />
          ) : (
            sortedFollowing.map((member) => (
              <MyCrewMemberRow
                key={member.userId}
                displayName={member.displayName}
                avatarUrl={member.avatarUrl}
                locationLabel={member.cityLabel}
                href={memberProfileLink(member.userId, 'friends')}
                linkState={friendsReturn}
                statusLabel={formatFollowingSince(member.followedAt)}
                primaryCta={{
                  kind: 'button',
                  label: unfollowBusyId === member.userId ? '…' : 'Unfollow',
                  variant: 'primary',
                  disabled: unfollowBusyId === member.userId,
                  onClick: () => void handleUnfollow(member),
                }}
              />
            ))
          )}
        </div>
      ) : null}

      {!loading && onGroups && groupPill === 'community' ? (
        <CommunitiesList
          enabled={FEATURE_FLAGS.communityDiscover}
          rows={clubRows}
          onLeave={(row) => setLeaveClub({ slug: row.slug, communityId: row.id })}
        />
      ) : null}

      {!loading && onGroups && groupPill === 'group' ? (
        <MemberGroupsList
          rows={outingGroupRows}
          emptyTitle="No outing groups yet"
          emptyBody="Join a trip on the map — we spin up a crew chat for everyone going."
          emptyCtas={[{ label: 'Browse trips', to: tripsListHomePath() }]}
        />
      ) : null}

      {!loading && onGroups && groupPill === 'team' ? (
        <MemberGroupsList
          rows={teamRows}
          emptyTitle="No teams yet"
          emptyBody="Create a private team for family, colleagues, or close friends."
          emptyCtas={[
            {
              label: 'Add a team',
              to: groupsPath({ create: true, from: CREWS_ORIGIN_QUERY }),
            },
          ]}
        />
      ) : null}

      <Dialog open={Boolean(leaveClub)} onClose={() => setLeaveClub(null)} title="Leave community?">
        <p className="text-sm text-neutral-600">You can rejoin later if the club allows it.</p>
        <div className="mt-4 flex gap-2">
          <button type="button" className={neutralBtn} onClick={() => setLeaveClub(null)}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryBtn}
            disabled={leaveMutation.isPending}
            onClick={() => void confirmLeave()}
          >
            Leave
          </button>
        </div>
      </Dialog>
    </>
  );
};

const EmptyRow = ({
  title,
  body,
  cta,
  ctas,
}: {
  title: string;
  body: string;
  cta?: { label: string; to: string };
  ctas?: { label: string; to: string }[];
}) => {
  const actions = ctas ?? (cta ? [cta] : []);
  return (
    <div className={`${EXPLORE_LIST_ROW.shell} px-4 py-6 text-center`}>
      <p className={`${EXPLORE_LIST_ROW.title} text-base`}>{title}</p>
      <p className="mt-1 text-sm font-medium text-neutral-500">{body}</p>
      {actions.length > 0 ? (
        <div className="mx-auto mt-4 flex max-w-xs flex-col gap-2">
          {actions.map((action) => (
            <Link
              key={action.to + action.label}
              to={action.to}
              className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white"
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const MemberGroupsList = ({
  rows,
  emptyTitle,
  emptyBody,
  emptyCta,
  emptyCtas,
}: {
  rows: Awaited<ReturnType<typeof fetchMeGroups>>;
  emptyTitle: string;
  emptyBody: string;
  emptyCta?: { label: string; to: string };
  emptyCtas?: { label: string; to: string }[];
}) => {
  const navigate = useNavigate();
  if (rows.length === 0) {
    return <EmptyRow title={emptyTitle} body={emptyBody} cta={emptyCta} ctas={emptyCtas} />;
  }
  return (
    <div className={CREW_BROWSE_LIST_STACK}>
      {rows.map((group) => {
        const name = memberGroupRowLabel(group);
        return (
          <div key={group.id} className={EXPLORE_LIST_ROW.shell}>
            <Link to={groupsManagePath(group.id)} className={`${EXPLORE_LIST_ROW.main} rounded-2xl`}>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                <UsersRound className="h-6 w-6" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <p className={EXPLORE_LIST_ROW.title}>{group.name || name}</p>
                <p className={EXPLORE_LIST_ROW.meta}>{name}</p>
              </span>
              <button
                type="button"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200/80 bg-white text-emerald-700 shadow-sm"
                aria-label={`Open chat for ${name}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  navigateToGroupChatFromSocial(navigate, group.id, 'hub');
                }}
              >
                <MessageSquare className="h-[18px] w-[18px]" aria-hidden />
              </button>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

const CommunitiesList = ({
  enabled,
  rows,
  onLeave,
}: {
  enabled: boolean;
  rows: MeCommunityDiscoverRowDTO[];
  onLeave: (row: MeCommunityDiscoverRowDTO) => void;
}) => {
  if (!enabled) {
    return (
      <EmptyRow title="Communities are off" body="Browse Find crew when this feature is enabled." />
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyRow
        title="No communities yet"
        body="Join a discoverable club or start one when you are ready to host."
        ctas={[
          { label: 'Join community', to: findCrewCommunityDiscoveryPath() },
          { label: 'Find crew', to: findCrewDiscoveryListPath() },
        ]}
      />
    );
  }
  return (
    <ul className={CREW_BROWSE_LIST_STACK}>
      {rows.map((row) => {
        const card = buildDiscoveryCardModelFromCommunityDiscover(row);
        const badge =
          row.relation === 'host'
            ? 'Host'
            : row.relation === 'pending'
              ? 'Pending'
              : row.relation === 'member'
                ? 'Member'
                : undefined;
        return (
          <li key={row.id} className="space-y-1">
            <BrowseCompactRow card={card} />
            <div className="flex gap-2 px-1">
              <Link to={communityClubPath(row.slug)} className={`${primaryBtn} flex-1 text-center`}>
                View · engage
              </Link>
              {row.relation === 'member' ? (
                <button type="button" className={`${neutralBtn} flex-1`} onClick={() => onLeave(row)}>
                  Leave
                </button>
              ) : row.relation === 'host' ? (
                <Link
                  to={communityClubPath(row.slug) + '#community-host'}
                  className={`${neutralBtn} flex-1 text-center`}
                >
                  Manage
                </Link>
              ) : null}
              {badge ? (
                <span className="sr-only">{badge}</span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

/** Sync main tab + sub-pills into URL. */
export const useMyCrewHubUrlState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const fallbackPillParam = searchParams.get(MY_CREW_PILL_PARAM);
  const mainTab = parseMyCrewMainTab(searchParams.get(MY_CREW_TAB_PARAM), fallbackPillParam);
  const peoplePill = parseMyCrewPeoplePill(searchParams.get(MY_CREW_PEOPLE_PILL_PARAM), fallbackPillParam);
  const groupPill = parseMyCrewGroupPill(searchParams.get(MY_CREW_GROUP_PILL_PARAM), fallbackPillParam);

  const syncParams = useCallback(
    (patch: {
      mainTab?: MyCrewMainTab;
      peoplePill?: MyCrewPeoplePill;
      groupPill?: MyCrewGroupPill;
    }) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.delete(MY_CREW_PILL_PARAM);
          params.delete('myCrewClubScope');

          const tab = patch.mainTab ?? mainTab;
          const tabWire = serializeMyCrewMainTab(tab);
          if (tabWire) params.set(MY_CREW_TAB_PARAM, tabWire);
          else params.delete(MY_CREW_TAB_PARAM);

          if (tab === 'people') {
            const people = patch.peoplePill ?? peoplePill;
            const peopleWire = serializeMyCrewPeoplePill(people);
            if (peopleWire) params.set(MY_CREW_PEOPLE_PILL_PARAM, peopleWire);
            else params.delete(MY_CREW_PEOPLE_PILL_PARAM);
            params.delete(MY_CREW_GROUP_PILL_PARAM);
          } else {
            const group = patch.groupPill ?? groupPill;
            const groupWire = serializeMyCrewGroupPill(group);
            if (groupWire) params.set(MY_CREW_GROUP_PILL_PARAM, groupWire);
            else params.delete(MY_CREW_GROUP_PILL_PARAM);
            params.delete(MY_CREW_PEOPLE_PILL_PARAM);
          }
          return params;
        },
        { replace: true }
      );
    },
    [groupPill, mainTab, peoplePill, setSearchParams]
  );

  const setMainTab = useCallback((next: MyCrewMainTab) => syncParams({ mainTab: next }), [syncParams]);
  const setPeoplePill = useCallback(
    (next: MyCrewPeoplePill) => syncParams({ mainTab: 'people', peoplePill: next }),
    [syncParams]
  );
  const setGroupPill = useCallback(
    (next: MyCrewGroupPill) => syncParams({ mainTab: 'groups', groupPill: next }),
    [syncParams]
  );

  return { mainTab, peoplePill, groupPill, setMainTab, setPeoplePill, setGroupPill };
};
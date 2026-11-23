import { EXPLORE_MAP_PATH, messagesToUserPath } from '../config/routingCatalog';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle, UserMinus } from 'lucide-react';
import type { FriendRequestDTO, FriendSummaryDTO, MemberFollowSummaryDTO } from '@uaetrail/shared-types';
import { setMemberFollow } from '../hooks/memberFollowApi';
import { useMeFriendsNetwork, useMeFollowingMembers } from '../hooks/useMeFriendsNetwork';
import {
  acceptMemberFriendRequest,
  cancelMemberFriendRequest,
  declineMemberFriendRequest,
  searchMembersByQuery,
  unfriendMember,
} from '../hooks/memberPeopleClientApi';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { TabPageSearchRow } from '../components/mobile/TabPageSearchRow';
import { Dialog } from '../components/ui/Dialog';
import { SecureAvatar } from '../components/ui/SecureAvatar';
import { useAuth } from '../context/AuthContext';
import {
  useProfileHubBackChrome,
  useSocialHubBackChrome,
} from '../hooks/useProfileHubBackChrome';

import {
  PRODUCT_CREWS_TAB_LABEL,
  PRODUCT_EXPLORE_CTA,
  PRODUCT_MY_CREW_SURFACE_TITLE,
} from '../content/productNorthStar';
import { crewsHomePath } from '../config/mobileFiveTabNav';
import { isCrewsOriginQuery } from '../config/surfacePaths';
import { useMobileBackChrome } from '../hooks/useMobileBackChrome';
import { SocialHubIndex } from '../components/social/SocialHubIndex';
import { memberProfileLink } from '../member/memberProfileLink';
import { MESSAGES_CHAT_RETURN_TO_KEY } from '../utils/activityGroupChatNav';
import { mobileBackNavState } from '../utils/mobileBackNav';
type SocialSection = 'friends' | 'requests' | 'following';

const parseSocialSection = (section: string | null, legacyTab: string | null): SocialSection | null => {
  const raw = section ?? legacyTab;
  if (raw === 'friends' || raw === 'requests' || raw === 'following') return raw;
  return null;
};

const SECTION_TITLES: Record<SocialSection, string> = {
  friends: 'Friends',
  requests: 'Friend requests',
  following: 'Following',
};

const formatConnectedDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const FRIEND_ACTION_ROW =
  'inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition-colors touch-manipulation sm:px-3 sm:text-sm lg:min-h-8 lg:w-auto lg:px-2.5 lg:py-1.5 lg:text-xs';

const friendActionPrimary = `${FRIEND_ACTION_ROW} bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98]`;

const friendActionSecondary = `${FRIEND_ACTION_ROW} border border-emerald-200/90 bg-emerald-50/90 text-emerald-800 hover:bg-emerald-100 active:scale-[0.98]`;

const friendActionNeutral = `${FRIEND_ACTION_ROW} border border-neutral-200/90 bg-white text-neutral-700 hover:bg-neutral-50 active:scale-[0.98]`;

const FRIEND_CARD_PAD = '!p-3 lg:!p-2.5';
const FRIEND_ROW = 'flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4';
const FRIEND_ROW_MAIN = 'flex min-w-0 flex-1 items-center gap-3';
const FRIEND_ACTIONS_TWO = 'flex gap-2 lg:shrink-0 lg:gap-1.5';
const FRIEND_ACTIONS_ONE = 'flex lg:shrink-0';
const FRIEND_AVATAR = 'h-11 w-11 text-sm lg:h-10 lg:w-10';
const FRIEND_LIST = 'space-y-2 lg:space-y-1.5';
const FRIEND_SECTION_LABEL = 'mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400 lg:mb-1';

export const MyCrewsPage = () => {
  const { user } = useAuth();
  const profileBackChrome = useProfileHubBackChrome();
  const socialBackChrome = useSocialHubBackChrome();
  const crewsBackChrome = useMobileBackChrome({
    fallbackTo: crewsHomePath(),
    label: PRODUCT_CREWS_TAB_LABEL,
    backBehavior: 'fallback',
  });
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeSection = parseSocialSection(searchParams.get('section'), searchParams.get('tab'));
  const isHub = activeSection === null;
  const crewsOrigin = isCrewsOriginQuery(searchParams.get('from'));
  const backChrome = isHub ? (crewsOrigin ? crewsBackChrome : profileBackChrome) : socialBackChrome;
  const shellTitle = isHub ? PRODUCT_MY_CREW_SURFACE_TITLE : SECTION_TITLES[activeSection];

  const {
    friends,
    incomingRequests,
    outgoingRequests,
    loading,
    error: networkError,
    refetch: refetchFriendsNetwork,
  } = useMeFriendsNetwork(Boolean(user));
  const {
    following,
    loading: followingLoading,
    error: followingError,
    refetch: refetchFollowing,
  } = useMeFollowingMembers(Boolean(user) && activeSection === 'following');
  const [error, setError] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [unfriendingFriend, setUnfriendingFriend] = useState<FriendSummaryDTO | null>(null);
  const [unfriendBusy, setUnfriendBusy] = useState(false);
  const [unfollowBusyId, setUnfollowBusyId] = useState<string | null>(null);
  const [findQuery, setFindQuery] = useState('');
  const [findResults, setFindResults] = useState<
    { id: string; displayName: string | null; avatarUrl: string | null }[]
  >([]);
  const [findSearching, setFindSearching] = useState(false);

  const displayError =
    error ?? networkError ?? (activeSection === 'following' ? followingError : null);

  const loadCore = useCallback(async () => {
    setError(null);
    await refetchFriendsNetwork();
  }, [refetchFriendsNetwork]);

  useEffect(() => {
    const q = findQuery.trim();
    if (q.length < 2) {
      setFindResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setFindSearching(true);
      try {
        const hits = await searchMembersByQuery(q);
        setFindResults(hits.filter((row) => row.id !== user?.id));
      } catch {
        setFindResults([]);
      } finally {
        setFindSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [findQuery, user?.id]);

  const requestCount = incomingRequests.length + outgoingRequests.length;

  const handleAcceptRequest = async (request: FriendRequestDTO) => {
    setBusyRequestId(request.id);
    setError(null);
    try {
      await acceptMemberFriendRequest(request.id);
      await loadCore();
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

  const handleUnfriend = async () => {
    if (!unfriendingFriend) return;
    setUnfriendBusy(true);
    setError(null);
    try {
      await unfriendMember(unfriendingFriend.userId);
      await refetchFriendsNetwork();
      setUnfriendingFriend(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unfriend this member');
    } finally {
      setUnfriendBusy(false);
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

  const filteredFriends = useMemo(() => {
    const q = findQuery.trim().toLowerCase();
    if (!q || activeSection !== 'friends') return friends;
    return friends.filter((friend) => friend.displayName.toLowerCase().includes(q));
  }, [activeSection, friends, findQuery]);

  const showFindRow = activeSection === 'friends' || activeSection === 'following';
  const friendsReturnPath = location.search
    ? `${location.pathname}${location.search}`
    : location.pathname;
  const friendsReturn = {
    ...mobileBackNavState(friendsReturnPath, 'Friends'),
    [MESSAGES_CHAT_RETURN_TO_KEY]: friendsReturnPath,
  };

  return (
    <ConsumerShell
      layout="stack"
      title={shellTitle}
      maxWidth="7xl"
      showJourney={false}
      back={backChrome}
    >
      <div className="min-w-0 max-w-full space-y-3 pb-nav-safe animate-fade-up lg:space-y-2">
        {isHub ? (
          <SocialHubIndex requestCount={requestCount} />
        ) : (
          <>
            {showFindRow && (
              <TabPageSearchRow
                value={findQuery}
                onChange={setFindQuery}
                placeholder={activeSection === 'friends' ? 'Search friends' : 'Search following'}
              />
            )}

            {displayError && (
              <GlassCard padding className="border-red-200/50 bg-red-50/50">
                <p className="text-sm text-red-600">{displayError}</p>
                <button
                  type="button"
                  onClick={() => void loadCore()}
                  className="mt-2 text-sm font-semibold text-emerald-600"
                >
                  Retry
                </button>
              </GlassCard>
            )}

            {loading ? (
              <div className="flex flex-col items-center gap-3 py-12" role="status" aria-live="polite">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                <p className="text-sm font-medium text-neutral-600">Loading friends</p>
              </div>
            ) : null}

            {!loading && activeSection === 'friends' ? (
              <>
                {findQuery.trim().length >= 2 ? (
                  <section>
                    <p className={FRIEND_SECTION_LABEL}>Find people</p>
                    {findSearching ? (
                      <p className="px-1 text-sm text-neutral-500">Searching…</p>
                    ) : findResults.length === 0 ? (
                      <p className="px-1 text-sm text-neutral-500">No members match that name.</p>
                    ) : (
                      <div className={FRIEND_LIST}>
                        {findResults.map((row) => {
                          const name = row.displayName ?? 'Member';
                          return (
                            <GlassCard key={row.id} padding className={FRIEND_CARD_PAD}>
                              <div className={FRIEND_ROW}>
                                <div className={FRIEND_ROW_MAIN}>
                                  <SecureAvatar src={row.avatarUrl} name={name} className={FRIEND_AVATAR} />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-neutral-900 lg:text-sm">{name}</p>
                                  </div>
                                </div>
                                <Link
                                  to={memberProfileLink(row.id, 'friends')}
                                  state={friendsReturn}
                                  className={`shrink-0 ${friendActionPrimary}`}
                                >
                                  View
                                </Link>
                              </div>
                            </GlassCard>
                          );
                        })}
                      </div>
                    )}
                  </section>
                ) : null}

                <section>
                  <p className={FRIEND_SECTION_LABEL}>Your friends</p>
                  {filteredFriends.length === 0 ? (
                    <GlassCard padding className="text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-2xl">
                        <span aria-hidden>👥</span>
                      </div>
                      <p className="font-semibold text-neutral-900">No friends yet</p>
                      <p className="mt-1 text-sm text-neutral-500">
                        Meet people on outings — add them as friends to stay connected.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate(EXPLORE_MAP_PATH)}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white md:w-auto md:rounded-lg md:px-5 md:py-2"
                      >
                        {PRODUCT_EXPLORE_CTA}
                      </button>
                    </GlassCard>
                  ) : (
                    <div className={FRIEND_LIST}>
                      {filteredFriends.map((friend) => (
                        <GlassCard key={friend.userId} padding className={FRIEND_CARD_PAD}>
                          <div className={FRIEND_ROW}>
                            <Link
                              to={memberProfileLink(friend.userId, 'friends')}
                              state={friendsReturn}
                              className={`${FRIEND_ROW_MAIN} rounded-xl outline-offset-2 transition hover:bg-neutral-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600`}
                              aria-label={`View ${friend.displayName} profile`}
                            >
                              <SecureAvatar
                                src={friend.avatarUrl}
                                name={friend.displayName}
                                className={FRIEND_AVATAR}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-neutral-900 lg:text-sm">
                                  {friend.displayName}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  Friends since {formatConnectedDate(friend.connectedAt)}
                                </p>
                              </div>
                            </Link>
                            <div className={FRIEND_ACTIONS_TWO}>
                              <Link
                                to={messagesToUserPath(friend.userId)}
                                state={friendsReturn}
                                className={`flex-1 lg:flex-none ${friendActionPrimary}`}
                              >
                                <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                Message
                              </Link>
                              <button
                                type="button"
                                onClick={() => setUnfriendingFriend(friend)}
                                className={`flex-1 lg:flex-none ${friendActionNeutral}`}
                              >
                                <UserMinus className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                Unfriend
                              </button>
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  )}
                </section>
              </>
            ) : null}

            {!loading && activeSection === 'requests' ? (
              incomingRequests.length === 0 && outgoingRequests.length === 0 ? (
                <GlassCard padding className="text-center">
                  <p className="font-semibold text-neutral-900">No pending requests</p>
                  <p className="mt-1 text-sm text-neutral-500">
                    When someone wants to connect, you will see it here.
                  </p>
                </GlassCard>
              ) : (
                <>
                  {incomingRequests.length > 0 ? (
                    <section>
                      <p className={FRIEND_SECTION_LABEL}>Incoming</p>
                      <div className={FRIEND_LIST}>
                        {incomingRequests.map((request) => {
                          const sender = request.fromUser;
                          const displayName = sender?.displayName ?? 'Member';
                          return (
                            <GlassCard key={request.id} padding className={FRIEND_CARD_PAD}>
                              <div className={FRIEND_ROW}>
                                <div className={FRIEND_ROW_MAIN}>
                                  <SecureAvatar
                                    src={sender?.avatarUrl}
                                    name={displayName}
                                    className={FRIEND_AVATAR}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-neutral-900 lg:text-sm">
                                      {displayName}
                                    </p>
                                    <p className="text-xs text-neutral-500">Wants to be friends</p>
                                  </div>
                                </div>
                                <div className={FRIEND_ACTIONS_TWO}>
                                  <button
                                    type="button"
                                    disabled={busyRequestId === request.id}
                                    onClick={() => void handleAcceptRequest(request)}
                                    className={`flex-1 lg:flex-none ${friendActionPrimary} disabled:opacity-60 disabled:active:scale-100`}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busyRequestId === request.id}
                                    onClick={() => void handleDeclineRequest(request)}
                                    className={`flex-1 lg:flex-none ${friendActionNeutral} disabled:opacity-60 disabled:active:scale-100`}
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            </GlassCard>
                          );
                        })}
                      </div>
                    </section>
                  ) : null}

                  {outgoingRequests.length > 0 ? (
                    <section>
                      <p className={FRIEND_SECTION_LABEL}>Sent</p>
                      <div className={FRIEND_LIST}>
                        {outgoingRequests.map((request) => {
                          const recipient = request.toUser;
                          const displayName = recipient?.displayName ?? 'Member';
                          return (
                            <GlassCard key={request.id} padding className={FRIEND_CARD_PAD}>
                              <div className={FRIEND_ROW}>
                                <div className={FRIEND_ROW_MAIN}>
                                  <SecureAvatar
                                    src={recipient?.avatarUrl}
                                    name={displayName}
                                    className={FRIEND_AVATAR}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-neutral-900 lg:text-sm">
                                      {displayName}
                                    </p>
                                    <p className="text-xs text-neutral-500">Waiting for a response</p>
                                  </div>
                                </div>
                                <div className={FRIEND_ACTIONS_TWO}>
                                  <Link
                                    to={memberProfileLink(request.toUserId, 'friends')}
                                    state={friendsReturn}
                                    className={`flex-1 lg:flex-none ${friendActionSecondary}`}
                                  >
                                    View profile
                                  </Link>
                                  <button
                                    type="button"
                                    disabled={busyRequestId === request.id}
                                    onClick={() => void handleCancelRequest(request)}
                                    className={`flex-1 lg:flex-none ${friendActionNeutral} disabled:opacity-60 disabled:active:scale-100`}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </GlassCard>
                          );
                        })}
                      </div>
                    </section>
                  ) : null}
                </>
              )
            ) : null}

            {!loading && activeSection === 'following' ? (
              <section>
                <p className={FRIEND_SECTION_LABEL}>People you follow</p>
                {followingLoading ? (
                  <div className="flex flex-col items-center gap-2 py-8" role="status" aria-live="polite">
                    <div
                      className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"
                      aria-hidden
                    />
                    <p className="text-sm font-medium text-neutral-600">Loading people</p>
                  </div>
                ) : following.length === 0 ? (
                  <GlassCard padding className="text-center">
                    <p className="font-semibold text-neutral-900">Not following anyone yet</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      Follow hosts from their profile to get notified when they publish an outing.
                    </p>
                  </GlassCard>
                ) : (
                  <div className={FRIEND_LIST}>
                    {following
                      .filter((row) => {
                        const q = findQuery.trim().toLowerCase();
                        if (!q) return true;
                        return row.displayName.toLowerCase().includes(q);
                      })
                      .map((member) => (
                        <GlassCard key={member.userId} padding className={FRIEND_CARD_PAD}>
                          <div className={FRIEND_ROW}>
                            <Link
                              to={memberProfileLink(member.userId, 'friends')}
                              state={friendsReturn}
                              className={`${FRIEND_ROW_MAIN} rounded-xl outline-offset-2 transition hover:bg-neutral-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600`}
                              aria-label={`View ${member.displayName} profile`}
                            >
                              <SecureAvatar
                                src={member.avatarUrl}
                                name={member.displayName}
                                className={FRIEND_AVATAR}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-neutral-900 lg:text-sm">
                                  {member.displayName}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  Following since {formatConnectedDate(member.followedAt)}
                                </p>
                              </div>
                            </Link>
                            <div className={FRIEND_ACTIONS_ONE}>
                              <button
                                type="button"
                                disabled={unfollowBusyId === member.userId}
                                onClick={() => void handleUnfollow(member)}
                                className={`flex-1 lg:flex-none ${friendActionNeutral} disabled:opacity-60 disabled:active:scale-100`}
                              >
                                <UserMinus className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                {unfollowBusyId === member.userId ? 'Unfollowing…' : 'Unfollow'}
                              </button>
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                  </div>
                )}
              </section>
            ) : null}
          </>
        )}
      </div>

      <Dialog
        open={Boolean(unfriendingFriend)}
        onClose={() => {
          if (!unfriendBusy) setUnfriendingFriend(null);
        }}
        title="Unfriend?"
      >
        <p className="text-sm text-neutral-600 leading-relaxed">
          {unfriendingFriend
            ? `${unfriendingFriend.displayName} will not be notified. They will no longer be able to view your private profile or message you unless you connect again or share an activity.`
            : ''}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={unfriendBusy}
            onClick={() => setUnfriendingFriend(null)}
            className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={unfriendBusy}
            onClick={() => void handleUnfriend()}
            className="flex-1 rounded-xl bg-neutral-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {unfriendBusy ? 'Unfriending…' : 'Unfriend'}
          </button>
        </div>
      </Dialog>
    </ConsumerShell>
  );
};

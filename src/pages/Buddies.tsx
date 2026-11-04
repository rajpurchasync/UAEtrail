import { EXPLORE_MAP_PATH, MESSAGES_PATH } from '../config/routingCatalog';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle, UserMinus, UserRound } from 'lucide-react';
import type { BuddyRequestDTO, BuddySummaryDTO, MemberFollowSummaryDTO } from '@uaetrail/shared-types';
import { setMemberFollow } from '../hooks/memberFollowApi';
import { useMeBuddiesNetwork, useMeFollowingMembers } from '../hooks/useMeBuddiesNetwork';
import {
  acceptMemberBuddyRequest,
  cancelMemberBuddyRequest,
  declineMemberBuddyRequest,
  searchMembersByQuery,
  unfriendMemberBuddy,
} from '../hooks/memberPeopleClientApi';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { TabPageSearchRow } from '../components/mobile/TabPageSearchRow';
import { FormTabBar } from '../components/ui/FormTabBar';
import { Dialog } from '../components/ui/Dialog';
import { SecureAvatar } from '../components/ui/SecureAvatar';
import { useAuth } from '../context/AuthContext';
import { useProfileHubBackChrome } from '../hooks/useProfileHubBackChrome';

import { PRODUCT_EXPLORE_CTA } from '../content/productNorthStar';
import { memberProfileLink } from '../member/memberProfileLink';
import { mobileBackNavState } from '../utils/mobileBackNav';
type FriendsTab = 'friends' | 'requests' | 'following';

const parseFriendsTab = (raw: string | null): FriendsTab => {
  if (raw === 'requests' || raw === 'following') return raw;
  return 'friends';
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
const FRIEND_ACTIONS_THREE =
  'grid grid-cols-3 gap-2 lg:flex lg:w-auto lg:shrink-0 lg:grid-cols-none lg:gap-1.5';
const FRIEND_ACTIONS_TWO = 'flex gap-2 lg:shrink-0 lg:gap-1.5';
const FRIEND_AVATAR = 'h-11 w-11 text-sm lg:h-10 lg:w-10';
const FRIEND_LIST = 'space-y-2 lg:space-y-1.5';
const FRIEND_SECTION_LABEL = 'mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400 lg:mb-1';

export const Buddies = () => {
  const { user } = useAuth();
  const backChrome = useProfileHubBackChrome();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseFriendsTab(searchParams.get('tab'));

  const {
    buddies,
    incomingRequests,
    outgoingRequests,
    loading,
    error: networkError,
    refetch: refetchBuddiesNetwork,
  } = useMeBuddiesNetwork(Boolean(user));
  const {
    following,
    loading: followingLoading,
    error: followingError,
    refetch: refetchFollowing,
  } = useMeFollowingMembers(Boolean(user) && activeTab === 'following');
  const [error, setError] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [unfriendingBuddy, setUnfriendingBuddy] = useState<BuddySummaryDTO | null>(null);
  const [unfriendBusy, setUnfriendBusy] = useState(false);
  const [unfollowBusyId, setUnfollowBusyId] = useState<string | null>(null);
  const [findQuery, setFindQuery] = useState('');
  const [findResults, setFindResults] = useState<
    { id: string; displayName: string | null; avatarUrl: string | null }[]
  >([]);
  const [findSearching, setFindSearching] = useState(false);

  const messagesPath = MESSAGES_PATH;

  const displayError = error ?? networkError ?? (activeTab === 'following' ? followingError : null);

  const loadCore = useCallback(async () => {
    setError(null);
    await refetchBuddiesNetwork();
  }, [refetchBuddiesNetwork]);

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

  const setTab = useCallback(
    (tab: FriendsTab) => {
      const next = new URLSearchParams(searchParams);
      if (tab === 'friends') next.delete('tab');
      else next.set('tab', tab);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const requestCount = incomingRequests.length + outgoingRequests.length;

  const tabDefs = useMemo(
    () => [
      { id: 'friends', label: 'Friends' },
      {
        id: 'requests',
        label: requestCount > 0 ? `Requests (${requestCount})` : 'Requests',
      },
      { id: 'following', label: 'Following' },
    ],
    [requestCount]
  );

  const handleAcceptRequest = async (request: BuddyRequestDTO) => {
    setBusyRequestId(request.id);
    setError(null);
    try {
      await acceptMemberBuddyRequest(request.id);
      await loadCore();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept request');
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleDeclineRequest = async (request: BuddyRequestDTO) => {
    setBusyRequestId(request.id);
    setError(null);
    try {
      await declineMemberBuddyRequest(request.id);
      await refetchBuddiesNetwork();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not decline request');
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleCancelRequest = async (request: BuddyRequestDTO) => {
    setBusyRequestId(request.id);
    setError(null);
    try {
      await cancelMemberBuddyRequest(request.id);
      await refetchBuddiesNetwork();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel request');
    } finally {
      setBusyRequestId(null);
    }
  };

  const handleUnfriend = async () => {
    if (!unfriendingBuddy) return;
    setUnfriendBusy(true);
    setError(null);
    try {
      await unfriendMemberBuddy(unfriendingBuddy.userId);
      await refetchBuddiesNetwork();
      setUnfriendingBuddy(null);
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

  const filteredBuddies = useMemo(() => {
    const q = findQuery.trim().toLowerCase();
    if (!q || activeTab !== 'friends') return buddies;
    return buddies.filter((buddy) => buddy.displayName.toLowerCase().includes(q));
  }, [activeTab, buddies, findQuery]);

  const showFindRow = activeTab === 'friends' || activeTab === 'following';
  const friendsReturn = mobileBackNavState(
    location.search ? `${location.pathname}${location.search}` : location.pathname,
    'Friends'
  );

  return (
    <ConsumerShell
      layout="stack"
      title="Friends"
      maxWidth="7xl"
      showJourney={false}
      back={backChrome}
    >
      <div className="min-w-0 max-w-full space-y-3 pb-nav-safe animate-fade-up lg:space-y-2">
        <FormTabBar tabs={tabDefs} activeId={activeTab} onChange={(id) => setTab(parseFriendsTab(id))} />

        {showFindRow && (
          <TabPageSearchRow
            value={findQuery}
            onChange={setFindQuery}
            placeholder={activeTab === 'friends' ? 'Search friends' : 'Search following'}
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
        ) : (
          <>
            {activeTab === 'friends' && (
              <>
                {findQuery.trim().length >= 2 && (
                  <section>
                    <p className={FRIEND_SECTION_LABEL}>
                      Find people
                    </p>
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
                                <SecureAvatar
                                  src={row.avatarUrl}
                                  name={name}
                                  className={FRIEND_AVATAR}
                                />
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
                )}

                <section>
                  <p className={FRIEND_SECTION_LABEL}>
                    Your friends
                  </p>
                  {filteredBuddies.length === 0 ? (
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
                        className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
                      >
                        {PRODUCT_EXPLORE_CTA}
                      </button>
                    </GlassCard>
                  ) : (
                    <div className={FRIEND_LIST}>
                      {filteredBuddies.map((buddy) => (
                        <GlassCard key={buddy.userId} padding className={FRIEND_CARD_PAD}>
                          <div className={FRIEND_ROW}>
                            <div className={FRIEND_ROW_MAIN}>
                            <SecureAvatar
                              src={buddy.avatarUrl}
                              name={buddy.displayName}
                              className={FRIEND_AVATAR}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-neutral-900 lg:text-sm">{buddy.displayName}</p>
                              <p className="text-xs text-neutral-500">
                                Friends since {formatConnectedDate(buddy.connectedAt)}
                              </p>
                            </div>
                            </div>
                            <div className={FRIEND_ACTIONS_THREE}>
                              <Link
                                to={memberProfileLink(buddy.userId, 'friends')}
                                state={friendsReturn}
                                className={friendActionSecondary}
                              >
                                <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                View
                              </Link>
                              <Link
                                to={`${messagesPath}?to=${buddy.userId}`}
                                state={friendsReturn}
                                className={friendActionPrimary}
                              >
                                <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                Message
                              </Link>
                              <button
                                type="button"
                                onClick={() => setUnfriendingBuddy(buddy)}
                                className={friendActionNeutral}
                              >
                                <UserMinus className="h-3.5 w-3.5" />
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
            )}

            {activeTab === 'requests' && (
              <>
                {incomingRequests.length === 0 && outgoingRequests.length === 0 ? (
                  <GlassCard padding className="text-center">
                    <p className="font-semibold text-neutral-900">No pending requests</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      When someone wants to connect, you will see it here.
                    </p>
                  </GlassCard>
                ) : (
                  <>
                    {incomingRequests.length > 0 && (
                      <section>
                        <p className={FRIEND_SECTION_LABEL}>
                          Incoming
                        </p>
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
                                    <p className="truncate font-semibold text-neutral-900 lg:text-sm">{displayName}</p>
                                    <p className="text-xs text-neutral-500">Wants to be friends</p>
                                  </div>
                                  </div>
                                  <div className={`mt-0 ${FRIEND_ACTIONS_TWO}`}>
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
                    )}

                    {outgoingRequests.length > 0 && (
                      <section>
                        <p className={FRIEND_SECTION_LABEL}>
                          Sent
                        </p>
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
                                    <p className="truncate font-semibold text-neutral-900 lg:text-sm">{displayName}</p>
                                    <p className="text-xs text-neutral-500">Waiting for a response</p>
                                  </div>
                                  </div>
                                  <div className={`mt-0 ${FRIEND_ACTIONS_TWO}`}>
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
                    )}
                  </>
                )}
              </>
            )}

            {activeTab === 'following' && (
              <section>
                <p className={FRIEND_SECTION_LABEL}>
                  People you follow
                </p>
                {followingLoading ? (
                  <div className="flex flex-col items-center gap-2 py-8" role="status" aria-live="polite">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" aria-hidden />
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
                            <div className={FRIEND_ROW_MAIN}>
                            <SecureAvatar
                              src={member.avatarUrl}
                              name={member.displayName}
                              className={FRIEND_AVATAR}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-neutral-900 lg:text-sm">{member.displayName}</p>
                              <p className="text-xs text-neutral-500">
                                Following since {formatConnectedDate(member.followedAt)}
                              </p>
                            </div>
                            </div>
                            <div className={`mt-0 ${FRIEND_ACTIONS_TWO}`}>
                            <Link
                              to={memberProfileLink(member.userId, 'friends')}
                              state={friendsReturn}
                              className={`flex-1 lg:flex-none ${friendActionSecondary}`}
                            >
                              View profile
                            </Link>
                            <button
                              type="button"
                              disabled={unfollowBusyId === member.userId}
                              onClick={() => void handleUnfollow(member)}
                              className={`flex-1 lg:flex-none ${friendActionNeutral} disabled:opacity-60 disabled:active:scale-100`}
                            >
                              Unfollow
                            </button>
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <Dialog
        open={Boolean(unfriendingBuddy)}
        onClose={() => {
          if (!unfriendBusy) setUnfriendingBuddy(null);
        }}
        title="Unfriend?"
      >
        <p className="text-sm text-neutral-600 leading-relaxed">
          {unfriendingBuddy
            ? `${unfriendingBuddy.displayName} will not be notified. They will no longer be able to view your private profile or message you unless you connect again or share an activity.`
            : ''}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={unfriendBusy}
            onClick={() => setUnfriendingBuddy(null)}
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

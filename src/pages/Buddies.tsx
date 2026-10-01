import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle, UserMinus, UserRound } from 'lucide-react';
import type { BuddyRequestDTO, BuddySummaryDTO, MemberFollowSummaryDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { TabPageSearchRow } from '../components/mobile/TabPageSearchRow';
import { FormTabBar } from '../components/ui/FormTabBar';
import { Dialog } from '../components/ui/Dialog';
import { SecureAvatar } from '../components/ui/SecureAvatar';
import { useAuth } from '../context/AuthContext';
import { EXPLORE_MAP_PATH } from '../config/platform';
import { isHostRole } from '../utils/roles';

type FriendsTab = 'friends' | 'requests' | 'following';

const parseFriendsTab = (raw: string | null): FriendsTab => {
  if (raw === 'requests' || raw === 'following') return raw;
  return 'friends';
};

const formatConnectedDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export const Buddies = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseFriendsTab(searchParams.get('tab'));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buddies, setBuddies] = useState<BuddySummaryDTO[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<BuddyRequestDTO[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<BuddyRequestDTO[]>([]);
  const [following, setFollowing] = useState<MemberFollowSummaryDTO[]>([]);
  const [followingLoaded, setFollowingLoaded] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [unfriendingBuddy, setUnfriendingBuddy] = useState<BuddySummaryDTO | null>(null);
  const [unfriendBusy, setUnfriendBusy] = useState(false);
  const [unfollowBusyId, setUnfollowBusyId] = useState<string | null>(null);
  const [findQuery, setFindQuery] = useState('');
  const [findResults, setFindResults] = useState<
    { id: string; displayName: string | null; avatarUrl: string | null }[]
  >([]);
  const [findSearching, setFindSearching] = useState(false);

  const messagesPath = isHostRole(user?.role) ? '/host/messages' : '/messages';

  const loadCore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [buddiesRes, incomingRes, outgoingRes] = await Promise.all([
        api.getMeBuddies(),
        api.getMeBuddyRequests('incoming'),
        api.getMeBuddyRequests('outgoing'),
      ]);
      setBuddies(buddiesRes.data);
      setIncomingRequests(incomingRes.data.filter((request) => request.status === 'pending'));
      setOutgoingRequests(outgoingRes.data.filter((request) => request.status === 'pending'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFollowing = useCallback(async () => {
    try {
      const res = await api.getMeFollowing();
      setFollowing(res.data);
      setFollowingLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load following');
    }
  }, []);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

  useEffect(() => {
    if (activeTab !== 'following' || followingLoaded) return;
    void loadFollowing();
  }, [activeTab, followingLoaded, loadFollowing]);

  useEffect(() => {
    const q = findQuery.trim();
    if (q.length < 2) {
      setFindResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setFindSearching(true);
      try {
        const res = await api.searchUsers(q);
        setFindResults(res.data.filter((row) => row.id !== user?.id));
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
      await api.acceptBuddyRequest(request.id);
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
      await api.declineBuddyRequest(request.id);
      setIncomingRequests((prev) => prev.filter((item) => item.id !== request.id));
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
      await api.cancelBuddyRequest(request.id);
      setOutgoingRequests((prev) => prev.filter((item) => item.id !== request.id));
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
      await api.unfriendBuddy(unfriendingBuddy.userId);
      setBuddies((prev) => prev.filter((buddy) => buddy.userId !== unfriendingBuddy.userId));
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
      await api.unfollowMember(member.userId);
      setFollowing((prev) => prev.filter((row) => row.userId !== member.userId));
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

  return (
    <ConsumerShell
      layout="stack"
      title="Friends"
      maxWidth="4xl"
      showJourney={false}
      back={{ fallbackTo: '/profile', label: 'Profile' }}
    >
      <div className="space-y-3 pb-nav-safe animate-fade-up">
        <FormTabBar tabs={tabDefs} activeId={activeTab} onChange={(id) => setTab(parseFriendsTab(id))} />

        {showFindRow && (
          <TabPageSearchRow
            value={findQuery}
            onChange={setFindQuery}
            placeholder={activeTab === 'friends' ? 'Search friends' : 'Search following'}
          />
        )}

        {error && (
          <GlassCard padding className="border-red-200/50 bg-red-50/50">
            <p className="text-sm text-red-600">{error}</p>
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
          <div className="flex justify-center py-12">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          </div>
        ) : (
          <>
            {activeTab === 'friends' && (
              <>
                {findQuery.trim().length >= 2 && (
                  <section>
                    <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Find people
                    </p>
                    {findSearching ? (
                      <p className="px-1 text-sm text-neutral-500">Searching…</p>
                    ) : findResults.length === 0 ? (
                      <p className="px-1 text-sm text-neutral-500">No members match that name.</p>
                    ) : (
                      <div className="space-y-2">
                        {findResults.map((row) => {
                          const name = row.displayName ?? 'Member';
                          return (
                            <GlassCard key={row.id} padding className="!p-3">
                              <div className="flex items-center gap-3">
                                <SecureAvatar
                                  src={row.avatarUrl}
                                  name={name}
                                  className="h-11 w-11 text-sm"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-semibold text-neutral-900">{name}</p>
                                </div>
                                <Link
                                  to={`/member/${row.id}`}
                                  className="shrink-0 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
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
                  <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
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
                        Explore the map
                      </button>
                    </GlassCard>
                  ) : (
                    <div className="space-y-2">
                      {filteredBuddies.map((buddy) => (
                        <GlassCard key={buddy.userId} padding className="!p-3">
                          <div className="flex items-center gap-3">
                            <SecureAvatar
                              src={buddy.avatarUrl}
                              name={buddy.displayName}
                              className="h-11 w-11 text-sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-neutral-900">{buddy.displayName}</p>
                              <p className="text-xs text-neutral-500">
                                Friends since {formatConnectedDate(buddy.connectedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            <Link
                              to={`/member/${buddy.userId}`}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 px-2 py-2 text-xs font-semibold text-neutral-700"
                            >
                              <UserRound className="h-3.5 w-3.5" />
                              View
                            </Link>
                            <Link
                              to={`${messagesPath}?to=${buddy.userId}`}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 px-2 py-2 text-xs font-semibold text-neutral-700"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              Message
                            </Link>
                            <button
                              type="button"
                              onClick={() => setUnfriendingBuddy(buddy)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 px-2 py-2 text-xs font-semibold text-neutral-700"
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                              Unfriend
                            </button>
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
                        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                          Incoming
                        </p>
                        <div className="space-y-2">
                          {incomingRequests.map((request) => {
                            const sender = request.fromUser;
                            const displayName = sender?.displayName ?? 'Member';
                            return (
                              <GlassCard key={request.id} padding className="!p-3">
                                <div className="flex items-center gap-3">
                                  <SecureAvatar
                                    src={sender?.avatarUrl}
                                    name={displayName}
                                    className="h-11 w-11 text-sm"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-neutral-900">{displayName}</p>
                                    <p className="text-xs text-neutral-500">Wants to be friends</p>
                                  </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                  <button
                                    type="button"
                                    disabled={busyRequestId === request.id}
                                    onClick={() => void handleAcceptRequest(request)}
                                    className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busyRequestId === request.id}
                                    onClick={() => void handleDeclineRequest(request)}
                                    className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 disabled:opacity-60"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </GlassCard>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {outgoingRequests.length > 0 && (
                      <section>
                        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                          Sent
                        </p>
                        <div className="space-y-2">
                          {outgoingRequests.map((request) => {
                            const recipient = request.toUser;
                            const displayName = recipient?.displayName ?? 'Member';
                            return (
                              <GlassCard key={request.id} padding className="!p-3">
                                <div className="flex items-center gap-3">
                                  <SecureAvatar
                                    src={recipient?.avatarUrl}
                                    name={displayName}
                                    className="h-11 w-11 text-sm"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-neutral-900">{displayName}</p>
                                    <p className="text-xs text-neutral-500">Waiting for a response</p>
                                  </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                  <Link
                                    to={`/member/${request.toUserId}`}
                                    className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-center text-sm font-semibold text-neutral-700"
                                  >
                                    View profile
                                  </Link>
                                  <button
                                    type="button"
                                    disabled={busyRequestId === request.id}
                                    onClick={() => void handleCancelRequest(request)}
                                    className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 disabled:opacity-60"
                                  >
                                    Cancel
                                  </button>
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
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  People you follow
                </p>
                {!followingLoaded ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                  </div>
                ) : following.length === 0 ? (
                  <GlassCard padding className="text-center">
                    <p className="font-semibold text-neutral-900">Not following anyone yet</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      Follow hosts from their profile to get notified when they publish an outing.
                    </p>
                  </GlassCard>
                ) : (
                  <div className="space-y-2">
                    {following
                      .filter((row) => {
                        const q = findQuery.trim().toLowerCase();
                        if (!q) return true;
                        return row.displayName.toLowerCase().includes(q);
                      })
                      .map((member) => (
                        <GlassCard key={member.userId} padding className="!p-3">
                          <div className="flex items-center gap-3">
                            <SecureAvatar
                              src={member.avatarUrl}
                              name={member.displayName}
                              className="h-11 w-11 text-sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-neutral-900">{member.displayName}</p>
                              <p className="text-xs text-neutral-500">
                                Following since {formatConnectedDate(member.followedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Link
                              to={`/member/${member.userId}`}
                              className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-center text-sm font-semibold text-neutral-700"
                            >
                              View profile
                            </Link>
                            <button
                              type="button"
                              disabled={unfollowBusyId === member.userId}
                              onClick={() => void handleUnfollow(member)}
                              className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700 disabled:opacity-60"
                            >
                              Unfollow
                            </button>
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

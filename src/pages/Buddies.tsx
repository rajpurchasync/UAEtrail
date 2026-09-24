import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, UserMinus, UserRound } from 'lucide-react';
import type { BuddyRequestDTO, BuddySummaryDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';
import { ConsumerShell } from '../components/mobile/ConsumerShell';
import { GlassCard } from '../components/mobile/GlassCard';
import { Dialog } from '../components/ui/Dialog';
import { SecureAvatar } from '../components/ui/SecureAvatar';
import { useAuth } from '../context/AuthContext';
import { EXPLORE_MAP_PATH } from '../config/platform';
import { isHostRole } from '../utils/roles';

const formatConnectedDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export const Buddies = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buddies, setBuddies] = useState<BuddySummaryDTO[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<BuddyRequestDTO[]>([]);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [unfriendingBuddy, setUnfriendingBuddy] = useState<BuddySummaryDTO | null>(null);
  const [unfriendBusy, setUnfriendBusy] = useState(false);

  const messagesPath = isHostRole(user?.role) ? '/host/messages' : '/messages';

  const loadBuddies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [buddiesRes, requestsRes] = await Promise.all([
        api.getMeBuddies(),
        api.getMeBuddyRequests('incoming'),
      ]);
      setBuddies(buddiesRes.data);
      setIncomingRequests(requestsRes.data.filter((request) => request.status === 'pending'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load buddies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBuddies();
  }, [loadBuddies]);

  const handleAcceptRequest = async (request: BuddyRequestDTO) => {
    setBusyRequestId(request.id);
    setError(null);
    try {
      await api.acceptBuddyRequest(request.id);
      await loadBuddies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept buddy request');
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
      setError(err instanceof Error ? err.message : 'Could not decline buddy request');
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

  const emptyState = useMemo(
    () => !loading && buddies.length === 0 && incomingRequests.length === 0,
    [buddies.length, incomingRequests.length, loading]
  );

  return (
    <ConsumerShell
      layout="stack"
      title="Buddies"
      showJourney={false}
      back={{ fallbackTo: '/profile', label: 'Profile' }}
    >
      <div className="space-y-3 pb-nav-safe animate-fade-up">
        {error && (
          <GlassCard padding className="border-red-200/50 bg-red-50/50">
            <p className="text-sm text-red-600">{error}</p>
            <button type="button" onClick={() => void loadBuddies()} className="mt-2 text-sm font-semibold text-emerald-600">
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
            {incomingRequests.length > 0 && (
              <section>
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Requests
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
                            <p className="text-xs text-neutral-500">Wants to connect with you</p>
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

            <section>
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Connected
              </p>
              {buddies.length === 0 ? (
                <GlassCard padding className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-2xl">
                    <span aria-hidden>👥</span>
                  </div>
                  <p className="font-semibold text-neutral-900">No buddies yet</p>
                  <p className="mt-1 text-sm text-neutral-500">
                    Meet people on outings — add them as buddies to stay connected.
                  </p>
                </GlassCard>
              ) : (
                <div className="space-y-2">
                  {buddies.map((buddy) => (
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
                            Connected {formatConnectedDate(buddy.connectedAt)}
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

            {emptyState && (
              <button
                type="button"
                onClick={() => navigate(EXPLORE_MAP_PATH)}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Explore members
              </button>
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

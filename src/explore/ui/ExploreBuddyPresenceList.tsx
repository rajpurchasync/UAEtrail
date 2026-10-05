import { useMemo, useState } from 'react';
import { useSentActivityJoinInvites } from '../useSentActivityJoinInvites';
import { Link } from 'react-router-dom';
import { BUDDIES_PATH } from '../../config/routingCatalog';
import { MessageCircle, UserPlus } from 'lucide-react';
import type { ExploreActivityRefDTO } from '@uaetrail/shared-types';
import { SecureAvatar } from '../../components/ui';
import { ExploreGuestSignInCard } from './ExploreGuestSignInCard';
import type { BuddyActivityPresenceRow } from '../buddyActivityPresence';
import { messagesRouteForRole } from '../../utils/authRouting';
import type { UserRole } from '@uaetrail/shared-types';
import {
  EXPLORE_BUDDY_JOIN_ME_INVITE,
  EXPLORE_BUDDY_JOIN_ME_INVITE_SENT_LABEL,
  JOIN_ME_INVITE_FINE_PRINT,
  exploreBuddyJoinMeInviteSent,
} from '../../content/exploreGoingPanelCopy';
import { api } from '../../api/index';

type ExploreBuddyPresenceListProps = {
  rows: BuddyActivityPresenceRow[];
  loading: boolean;
  error: string | null;
  isSignedIn: boolean;
  userRole: UserRole | undefined;
  onOpenActivity: (activity: ExploreActivityRefDTO) => void;
  listJoinInviteActivities?: (row: BuddyActivityPresenceRow) => ExploreActivityRefDTO[];
};

const activityHint = (row: BuddyActivityPresenceRow): string | null => {
  if (row.hosting) return `Hosting · ${row.hosting.title}`;
  if (row.joining) return `Joining · ${row.joining.title}`;
  return null;
};

const linkedActivity = (row: BuddyActivityPresenceRow): ExploreActivityRefDTO | null =>
  row.hosting ?? row.joining;

export const ExploreBuddyPresenceList = ({
  rows,
  loading,
  error,
  isSignedIn,
  userRole,
  onOpenActivity,
  listJoinInviteActivities,
}: ExploreBuddyPresenceListProps) => {
  const [busyBuddyId, setBusyBuddyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteActivityByBuddy, setInviteActivityByBuddy] = useState<Record<string, string>>({});

  const invitableActivityIds = useMemo(() => {
    if (!listJoinInviteActivities) return [];
    const ids = new Set<string>();
    for (const row of rows) {
      for (const target of listJoinInviteActivities(row)) {
        ids.add(target.activityId);
      }
    }
    return [...ids];
  }, [rows, listJoinInviteActivities]);

  const { sentInviteeIdsByActivity, refreshActivity } = useSentActivityJoinInvites(
    invitableActivityIds,
    isSignedIn && invitableActivityIds.length > 0
  );

  const defaultInviteSelection = useMemo(() => {
    const next: Record<string, string> = {};
    for (const row of rows) {
      const targets = listJoinInviteActivities?.(row) ?? [];
      if (targets[0]) next[row.buddy.userId] = targets[0].activityId;
    }
    return next;
  }, [rows, listJoinInviteActivities]);

  const resolveInviteActivityId = (row: BuddyActivityPresenceRow, targets: ExploreActivityRefDTO[]) => {
    const picked = inviteActivityByBuddy[row.buddy.userId] ?? defaultInviteSelection[row.buddy.userId];
    if (picked && targets.some((t) => t.activityId === picked)) return picked;
    return targets[0]?.activityId ?? null;
  };

  const sendJoinInvite = async (row: BuddyActivityPresenceRow, activityId: string) => {
    setBusyBuddyId(row.buddy.userId);
    setInviteError(null);
    setNotice(null);
    try {
      await api.sendActivityJoinInvite(activityId, row.buddy.userId);
      await refreshActivity(activityId);
      setNotice(exploreBuddyJoinMeInviteSent(row.buddy.displayName));
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Could not send invite.');
    } finally {
      setBusyBuddyId(null);
    }
  };

  if (!isSignedIn) {
    return <ExploreGuestSignInCard intent="explore-going" compact />;
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">Loading buddies…</p>;
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">{error}</p>;
  }

  if (rows.length === 0) {
    return (
      <div className={`rounded-2xl border border-dashed border-emerald-200/80 bg-emerald-50/30 px-4 py-8 text-center`}>
        <p className="text-sm font-semibold text-neutral-900">No buddies yet</p>
        <p className="mt-1 text-sm text-neutral-600">
          Connect on trips you like — then you&apos;ll see who&apos;s going here.
        </p>
        <Link to={BUDDIES_PATH} className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline">
          Manage buddies
        </Link>
      </div>
    );
  }

  const showJoinMeFinePrint = invitableActivityIds.length > 0;

  return (
    <div className="space-y-2">
      {showJoinMeFinePrint ? (
        <p className="text-[11px] leading-relaxed text-neutral-500 px-0.5">{JOIN_ME_INVITE_FINE_PRINT}</p>
      ) : null}
      {notice ? (
        <p className="rounded-xl border border-emerald-100 bg-emerald-50/90 px-3 py-2 text-xs font-medium text-emerald-900">
          {notice}
        </p>
      ) : null}
      {inviteError ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{inviteError}</p>
      ) : null}
      <ul className="space-y-2">
        {rows.map((row) => {
          const inviteTargets = listJoinInviteActivities?.(row) ?? [];
          const inviteActivityId = resolveInviteActivityId(row, inviteTargets);
          const alreadyInvited =
            Boolean(inviteActivityId) &&
            sentInviteeIdsByActivity[inviteActivityId]?.has(row.buddy.userId);
          const hint = activityHint(row);
          const activity = linkedActivity(row);
          return (
            <li
              key={row.buddy.userId}
              className="flex items-center gap-3 rounded-2xl border border-neutral-200/75 bg-white p-3 shadow-[0_1px_8px_rgba(15,23,42,.06)] ring-1 ring-emerald-500/[0.04]"
            >
              <Link to={`/member/${row.buddy.userId}`} className="shrink-0">
                <SecureAvatar
                  src={row.buddy.avatarUrl}
                  name={row.buddy.displayName}
                  className="h-11 w-11 ring-2 ring-white"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/member/${row.buddy.userId}`}
                  className="block truncate text-sm font-semibold text-neutral-900 hover:text-emerald-700 hover:underline"
                >
                  {row.buddy.displayName}
                </Link>
                {hint ? (
                  <button
                    type="button"
                    onClick={() => activity && onOpenActivity(activity)}
                    className="mt-0.5 block max-w-full truncate text-left text-xs font-medium text-emerald-700 hover:underline"
                  >
                    {hint}
                  </button>
                ) : (
                  <p className="mt-0.5 text-xs text-neutral-500">No upcoming trips on the map</p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {inviteTargets.length > 0 && inviteActivityId ? (
                  <div className="flex flex-col items-stretch gap-1">
                    {inviteTargets.length > 1 ? (
                      <label className="sr-only" htmlFor={`invite-activity-${row.buddy.userId}`}>
                        Choose outing for {row.buddy.displayName}
                      </label>
                    ) : null}
                    {inviteTargets.length > 1 ? (
                      <select
                        id={`invite-activity-${row.buddy.userId}`}
                        value={inviteActivityId}
                        onChange={(event) =>
                          setInviteActivityByBuddy((prev) => ({
                            ...prev,
                            [row.buddy.userId]: event.target.value,
                          }))
                        }
                        className="max-w-[9.5rem] truncate rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700"
                      >
                        {inviteTargets.map((target) => (
                          <option key={target.activityId} value={target.activityId}>
                            {target.title}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <button
                      type="button"
                      disabled={busyBuddyId === row.buddy.userId || alreadyInvited}
                      onClick={() => void sendJoinInvite(row, inviteActivityId)}
                      className={`inline-flex h-9 items-center justify-center gap-1 rounded-full px-2.5 text-xs font-semibold disabled:opacity-60 ${
                        alreadyInvited
                          ? 'bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      <UserPlus className="h-3.5 w-3.5" aria-hidden />
                      {alreadyInvited
                        ? EXPLORE_BUDDY_JOIN_ME_INVITE_SENT_LABEL
                        : EXPLORE_BUDDY_JOIN_ME_INVITE}
                    </button>
                  </div>
                ) : null}
                <Link
                  to={messagesRouteForRole(userRole ?? 'participant', row.buddy.userId)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100"
                  aria-label={`Message ${row.buddy.displayName}`}
                >
                  <MessageCircle className="h-4 w-4" />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

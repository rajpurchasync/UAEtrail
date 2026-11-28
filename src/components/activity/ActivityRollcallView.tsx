import { useMemo, useState } from 'react';
import { Check, Search, Undo2 } from 'lucide-react';
import type { ParticipantDTO } from '@uaetrail/shared-types';
import type { ActivityRequestView } from '../../hooks/operatorWorkspaceJoinQueueClientApi';
import { SecureAvatar } from '../ui';
import { useActivityParticipantsRoster } from './useActivityParticipantsRoster';
import {
  ACTIVITY_ROLLCALL_STATUS_LABEL,
  activityRollcallStatusBadgeClass,
  activityRollcallStatusFromParticipant,
  type ActivityRollcallStatus,
} from './activityRollcallStatus';
import {
  ACTIVITY_ROLLCALL_EMPTY,
  ACTIVITY_ROLLCALL_MARK_PRESENT,
  ACTIVITY_ROLLCALL_NO_ROSTER,
  ACTIVITY_ROLLCALL_SEARCH_PLACEHOLDER,
  ACTIVITY_ROLLCALL_UNDO_ATTENDANCE,
} from '../../content/activityRollcallCopy';

type RollcallFilter = 'all' | ActivityRollcallStatus;

type RollcallRow =
  | {
      key: string;
      kind: 'pending';
      name: string;
      searchText: string;
      request: ActivityRequestView;
    }
  | {
      key: string;
      kind: 'roster';
      name: string;
      searchText: string;
      rollcallStatus: Exclude<ActivityRollcallStatus, 'pending'>;
      participant: ParticipantDTO;
    };

const normalizeSearch = (value: string): string => value.trim().toLowerCase();

const matchesSearch = (haystack: string, needle: string): boolean =>
  !needle || haystack.includes(needle);

export type ActivityRollcallViewProps = {
  tenantId: string;
  activityId: string;
  pendingRequests?: ActivityRequestView[];
  busyRequestId?: string | null;
  onParticipantsError?: (message: string) => void;
  onApproveJoinRequest?: (requestId: string) => void;
  onRejectJoinRequest?: (request: ActivityRequestView) => void;
  className?: string;
};

export const ActivityRollcallView = ({
  tenantId,
  activityId,
  pendingRequests = [],
  busyRequestId = null,
  onParticipantsError,
  onApproveJoinRequest,
  onRejectJoinRequest,
  className = '',
}: ActivityRollcallViewProps) => {
  const {
    participants,
    loading,
    busyParticipantId,
    attendedCount,
    toggleAttendance,
  } = useActivityParticipantsRoster(tenantId, activityId, onParticipantsError);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<RollcallFilter>('all');

  const pendingOnly = useMemo(
    () => pendingRequests.filter((r) => r.status === 'pending'),
    [pendingRequests]
  );

  const rows = useMemo((): RollcallRow[] => {
    const pendingRows: RollcallRow[] = pendingOnly.map((request) => {
      const name =
        request.user?.displayName?.trim() || request.user?.email?.trim() || 'Request';
      const searchText = normalizeSearch(
        [name, request.user?.email].filter(Boolean).join(' ')
      );
      return {
        key: `pending-${request.id}`,
        kind: 'pending',
        name,
        searchText,
        request,
      };
    });

    const rosterRows: RollcallRow[] = participants.map((participant) => {
      const name = participant.displayName?.trim() || participant.email?.trim() || 'Participant';
      const searchText = normalizeSearch(
        [name, participant.email, participant.phone].filter(Boolean).join(' ')
      );
      const rollcallStatus = activityRollcallStatusFromParticipant(participant);
      return {
        key: `roster-${participant.id}`,
        kind: 'roster',
        name,
        searchText,
        rollcallStatus,
        participant,
      };
    });

    return [...pendingRows, ...rosterRows];
  }, [participants, pendingOnly]);

  const needle = normalizeSearch(query);

  const counts = useMemo(() => {
    const joined = participants.filter((p) => p.status === 'going').length;
    return {
      pending: pendingOnly.length,
      joined,
      attending: attendedCount,
    };
  }, [attendedCount, participants, pendingOnly.length]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!matchesSearch(row.searchText, needle)) return false;
      if (filter === 'all') return true;
      if (row.kind === 'pending') return filter === 'pending';
      return row.rollcallStatus === filter;
    });
  }, [filter, needle, rows]);

  const filterChips: { id: RollcallFilter; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: rows.length },
    { id: 'pending', label: ACTIVITY_ROLLCALL_STATUS_LABEL.pending, count: counts.pending },
    { id: 'joined', label: ACTIVITY_ROLLCALL_STATUS_LABEL.joined, count: counts.joined },
    { id: 'attending', label: ACTIVITY_ROLLCALL_STATUS_LABEL.attending, count: counts.attending },
  ];

  const progress =
    participants.length > 0 ? Math.round((attendedCount / participants.length) * 100) : 0;

  return (
    <div className={`flex min-h-0 flex-col gap-3 ${className}`}>
      <div className="space-y-2">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ACTIVITY_ROLLCALL_SEARCH_PLACEHOLDER}
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            autoComplete="off"
          />
        </label>

        <div
          className="flex gap-1.5 overflow-x-auto pb-0.5 scroll-touch [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Filter roll call"
        >
          {filterChips.map((chip) => {
            const active = filter === chip.id;
            const dimmed = chip.id !== 'all' && (chip.count ?? 0) === 0;
            return (
              <button
                key={chip.id}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={dimmed && !active}
                onClick={() => setFilter(chip.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-neutral-900 text-white'
                    : dimmed
                      ? 'bg-neutral-100 text-neutral-400'
                      : 'bg-neutral-100 text-neutral-700 active:bg-neutral-200'
                }`}
              >
                {chip.label}
                {chip.count != null && chip.id !== 'all' ? ` · ${chip.count}` : ''}
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-neutral-200/80 bg-white px-3 py-2.5">
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-neutral-600">
            <span>Checked in</span>
            <span>
              {attendedCount} / {participants.length}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-200">
            <div
              className="h-2 rounded-full bg-emerald-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-500">{ACTIVITY_ROLLCALL_NO_ROSTER}</p>
      ) : filteredRows.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-500">{ACTIVITY_ROLLCALL_EMPTY}</p>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-neutral-100 overflow-y-auto rounded-xl border border-neutral-200/80 bg-white">
          {filteredRows.map((row) => {
            if (row.kind === 'pending') {
              const busy = busyRequestId === row.request.id;
              return (
                <li key={row.key} className="flex flex-wrap items-center gap-2 px-3 py-3">
                  <SecureAvatar name={row.name} className="h-10 w-10 shrink-0 text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">{row.name}</p>
                    <span
                      className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${activityRollcallStatusBadgeClass('pending')}`}
                    >
                      {ACTIVITY_ROLLCALL_STATUS_LABEL.pending}
                    </span>
                  </div>
                  {onApproveJoinRequest && onRejectJoinRequest ? (
                    <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onApproveJoinRequest(row.request.id)}
                        className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white active:bg-emerald-700 disabled:opacity-50 sm:flex-none"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onRejectJoinRequest(row.request)}
                        className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 active:bg-neutral-50 disabled:opacity-50 sm:flex-none"
                      >
                        Decline
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            }

            const { participant, rollcallStatus } = row;
            const busy = busyParticipantId === participant.id;
            const attended = rollcallStatus === 'attending';
            const canToggle =
              participant.canConfirmAttendance || Boolean(participant.checkedInAt);

            return (
              <li
                key={row.key}
                className={`flex items-center gap-2 px-3 py-3 ${attended ? 'bg-emerald-50/50' : ''}`}
              >
                <SecureAvatar
                  src={participant.avatarUrl}
                  name={row.name}
                  className="h-10 w-10 shrink-0 text-xs"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900">{row.name}</p>
                  <span
                    className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${activityRollcallStatusBadgeClass(rollcallStatus)}`}
                  >
                    {ACTIVITY_ROLLCALL_STATUS_LABEL[rollcallStatus]}
                  </span>
                </div>
                {canToggle ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void toggleAttendance(participant)}
                    aria-pressed={attended}
                    aria-label={
                      attended
                        ? `${ACTIVITY_ROLLCALL_UNDO_ATTENDANCE}: ${row.name}`
                        : `${ACTIVITY_ROLLCALL_MARK_PRESENT}: ${row.name}`
                    }
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                      attended
                        ? 'border-emerald-200 bg-emerald-100 text-emerald-900'
                        : 'border-neutral-200 bg-white text-neutral-800 active:bg-neutral-50'
                    }`}
                  >
                    {attended ? (
                      <>
                        <Undo2 className="h-4 w-4" aria-hidden />
                        <span className="hidden sm:inline">{ACTIVITY_ROLLCALL_UNDO_ATTENDANCE}</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" aria-hidden />
                        <span className="hidden sm:inline">{ACTIVITY_ROLLCALL_MARK_PRESENT}</span>
                      </>
                    )}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

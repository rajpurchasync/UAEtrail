import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ParticipantDTO } from '@uaetrail/shared-types';
import { MoreVertical } from 'lucide-react';
import {
  checkInHostActivityParticipant,
  fetchHostActivityParticipants,
  rateHostActivityParticipant,
  revokeHostActivityParticipant,
  undoHostActivityParticipantCheckIn,
} from '../../hooks/hostActivityClientApi';
import { HOST_MESSAGES_PATH } from '../../config/surfacePaths';
import { hostActivitiesCheckInPath } from '../../config/routingCatalog';
import { SecureAvatar } from '../ui';
import { ActivityParticipantRevokeDialog } from './ActivityParticipantRevokeDialog';
import { ActivityParticipantRateDialog } from './ActivityParticipantRateDialog';

interface ActivityParticipantsPanelProps {
  tenantId: string;
  activityId: string;
  activityTitle: string;
  onError?: (message: string) => void;
}

const statusLabel = (participant: ParticipantDTO): string => {
  if (participant.status === 'attended') return 'Attended';
  return 'Going';
};

const formatJoined = (joinedAt: string): string =>
  new Date(joinedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const ActivityParticipantsPanel = ({
  tenantId,
  activityId,
  activityTitle,
  onError,
}: ActivityParticipantsPanelProps) => {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<ParticipantDTO[]>([]);
  const [activityEnded, setActivityEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyParticipantId, setBusyParticipantId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ParticipantDTO | null>(null);
  const [rateTarget, setRateTarget] = useState<ParticipantDTO | null>(null);
  const [revokeSubmitting, setRevokeSubmitting] = useState(false);
  const [rateSubmitting, setRateSubmitting] = useState(false);

  const loadParticipants = useCallback(async () => {
    if (!tenantId || !activityId) return;
    setLoading(true);
    try {
      const snapshot = await fetchHostActivityParticipants(tenantId, activityId);
      setParticipants(snapshot.participants);
      setActivityEnded(snapshot.activityEnded);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to load participants');
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  }, [activityId, onError, tenantId]);

  useEffect(() => {
    void loadParticipants();
  }, [loadParticipants]);

  const confirmAttendance = async (participant: ParticipantDTO) => {
    if (!tenantId) return;
    setBusyParticipantId(participant.id);
    setMenuOpenId(null);
    try {
      if (participant.checkedInAt) {
        await undoHostActivityParticipantCheckIn(tenantId, activityId, participant.id);
      } else {
        await checkInHostActivityParticipant(tenantId, activityId, participant.id);
      }
      await loadParticipants();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to update attendance');
    } finally {
      setBusyParticipantId(null);
    }
  };

  const openChat = (participant: ParticipantDTO) => {
    setMenuOpenId(null);
    navigate(`${HOST_MESSAGES_PATH}?to=${participant.userId}`);
  };

  const handleRevokeConfirm = async (organizerNote: string) => {
    if (!tenantId || !revokeTarget) return;
    setRevokeSubmitting(true);
    try {
      await revokeHostActivityParticipant(
        tenantId,
        activityId,
        revokeTarget.id,
        organizerNote
      );
      setRevokeTarget(null);
      await loadParticipants();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to revoke participant');
    } finally {
      setRevokeSubmitting(false);
    }
  };

  const handleRateConfirm = async (payload: { score: number; comment?: string }) => {
    if (!tenantId || !rateTarget) return;
    setRateSubmitting(true);
    try {
      await rateHostActivityParticipant(tenantId, activityId, rateTarget.id, payload);
      setRateTarget(null);
      await loadParticipants();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to save rating');
    } finally {
      setRateSubmitting(false);
    }
  };

  const attendedCount = participants.filter((p) => p.status === 'attended').length;
  const progress = participants.length > 0 ? (attendedCount / participants.length) * 100 : 0;
  const rateableCount = participants.filter((p) => p.canRate).length;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Confirmed joiners</p>
        <h3 className="mt-0.5 text-lg font-semibold text-neutral-900">{activityTitle}</h3>
        <p className="mt-1 text-sm leading-relaxed text-neutral-600">
          Name, joined date, and status for everyone on the roster. Use the menu to confirm attendance, chat, or
          revoke before the outing.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200/80 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-700">Attendance</p>
          <p className="text-sm text-neutral-600">
            {attendedCount} / {participants.length} confirmed
          </p>
        </div>
        <div className="h-2.5 w-full rounded-full bg-neutral-200">
          <div
            className="h-2.5 rounded-full bg-emerald-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {activityEnded && rateableCount > 0 ? (
          <p className="mt-2 text-xs text-neutral-500">
            {rateableCount} participant{rateableCount === 1 ? '' : 's'} ready to rate after attendance.
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : participants.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-500">No confirmed participants yet.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-2 border-b border-neutral-100 bg-neutral-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            <span>Name</span>
            <span className="hidden sm:inline">Joined</span>
            <span>Status</span>
            <span className="w-8 text-center" aria-hidden>⋮</span>
          </div>
          <ul className="divide-y divide-neutral-100">
            {participants.map((participant) => {
              const busy = busyParticipantId === participant.id;
              const menuOpen = menuOpenId === participant.id;
              const attended = participant.status === 'attended';

              return (
                <li
                  key={participant.id}
                  className={`relative px-3 py-3 ${attended ? 'bg-emerald-50/40' : ''}`}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <SecureAvatar
                        src={participant.avatarUrl}
                        name={participant.displayName || participant.email || 'Participant'}
                        className="h-9 w-9 shrink-0 text-xs"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-900">
                          {participant.displayName}
                        </p>
                        <p className="truncate text-xs text-neutral-500 sm:hidden">
                          Joined {formatJoined(participant.joinedAt)}
                        </p>
                        {participant.hostRating ? (
                          <p className="text-xs text-amber-700">
                            Rated {participant.hostRating.score}/5
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <span className="hidden text-xs text-neutral-600 sm:inline">
                      {formatJoined(participant.joinedAt)}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        attended ? 'text-emerald-700' : 'text-neutral-600'
                      }`}
                    >
                      {statusLabel(participant)}
                    </span>
                    <div className="relative flex justify-center">
                      <button
                        type="button"
                        aria-label={`Actions for ${participant.displayName}`}
                        disabled={busy}
                        onClick={() => setMenuOpenId(menuOpen ? null : participant.id)}
                        className="rounded-lg p-1.5 text-neutral-600 active:bg-neutral-100 disabled:opacity-50"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {menuOpen ? (
                        <>
                          <button
                            type="button"
                            className="fixed inset-0 z-[10] cursor-default"
                            aria-label="Close menu"
                            onClick={() => setMenuOpenId(null)}
                          />
                          <div
                            className="absolute right-0 top-full z-[20] mt-1 min-w-[11rem] rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
                            role="menu"
                          >
                            {participant.canConfirmAttendance ? (
                              <button
                                type="button"
                                role="menuitem"
                                className="block w-full px-3 py-2.5 text-left text-sm font-medium text-neutral-800 active:bg-neutral-50"
                                onClick={() => void confirmAttendance(participant)}
                              >
                                Confirm attendance
                              </button>
                            ) : (
                              <button
                                type="button"
                                role="menuitem"
                                className="block w-full px-3 py-2.5 text-left text-sm font-medium text-neutral-800 active:bg-neutral-50"
                                onClick={() => void confirmAttendance(participant)}
                              >
                                Undo attendance
                              </button>
                            )}
                            <button
                              type="button"
                              role="menuitem"
                              className="block w-full px-3 py-2.5 text-left text-sm font-medium text-neutral-800 active:bg-neutral-50"
                              onClick={() => openChat(participant)}
                            >
                              Chat
                            </button>
                            {participant.canRate ? (
                              <button
                                type="button"
                                role="menuitem"
                                className="block w-full px-3 py-2.5 text-left text-sm font-medium text-neutral-800 active:bg-neutral-50"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  setRateTarget(participant);
                                }}
                              >
                                Rate participant
                              </button>
                            ) : null}
                            {participant.canRevoke ? (
                              <button
                                type="button"
                                role="menuitem"
                                className="block w-full px-3 py-2.5 text-left text-sm font-medium text-red-700 active:bg-red-50"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  setRevokeTarget(participant);
                                }}
                              >
                                Revoke
                              </button>
                            ) : null}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <ActivityParticipantRevokeDialog
        open={Boolean(revokeTarget)}
        participant={revokeTarget}
        activityTitle={activityTitle}
        submitting={revokeSubmitting}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevokeConfirm}
      />

      <ActivityParticipantRateDialog
        open={Boolean(rateTarget)}
        participant={rateTarget}
        submitting={rateSubmitting}
        onClose={() => setRateTarget(null)}
        onConfirm={handleRateConfirm}
      />
    </div>
  );
};

export const activityCheckInPath = (activityId: string): string =>
  hostActivitiesCheckInPath(activityId);

/** @deprecated Use ActivityParticipantsPanel */
export const ActivityCheckInPanel = ActivityParticipantsPanel;

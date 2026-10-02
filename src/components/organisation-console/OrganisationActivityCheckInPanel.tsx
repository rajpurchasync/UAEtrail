import { useCallback, useEffect, useState } from 'react';
import type { ParticipantDTO } from '@uaetrail/shared-types';
import { api } from '../../api/index';
import { hostActivitiesCheckInPath } from '../../config/routingCatalog';
import { SecureAvatar } from '../ui';

interface OrganisationActivityCheckInPanelProps {
  tenantId: string;
  activityId: string;
  activityTitle: string;
  onError?: (message: string) => void;
}

export const OrganisationActivityCheckInPanel = ({
  tenantId,
  activityId,
  activityTitle,
  onError,
}: OrganisationActivityCheckInPanelProps) => {
  const [participants, setParticipants] = useState<ParticipantDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyParticipantId, setBusyParticipantId] = useState<string | null>(null);

  const loadParticipants = useCallback(async () => {
    if (!tenantId || !activityId) return;
    setLoading(true);
    try {
      const res = await api.getActivityParticipants(tenantId, activityId);
      setParticipants(res.data.participants ?? []);
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

  const toggleCheckin = async (participant: ParticipantDTO) => {
    if (!tenantId) return;
    setBusyParticipantId(participant.id);
    try {
      if (participant.checkedInAt) {
        await api.undoCheckin(tenantId, activityId, participant.id);
      } else {
        await api.checkinParticipant(tenantId, activityId, participant.id);
      }
      await loadParticipants();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to update check-in');
    } finally {
      setBusyParticipantId(null);
    }
  };

  const checkedInCount = participants.filter((p) => p.checkedInAt).length;
  const progress = participants.length > 0 ? (checkedInCount / participants.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Confirmed joiners</p>
        <h3 className="mt-0.5 text-lg font-semibold text-neutral-900">{activityTitle}</h3>
        <p className="mt-1 text-sm leading-relaxed text-neutral-600">
          Tap each person who attended. Check-in verifies attendance so they can review the trip and place, and
          hosts get a fair record of who went.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200/80 bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-neutral-700">Progress</p>
          <p className="text-sm text-neutral-600">
            {checkedInCount} / {participants.length} checked in
          </p>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2.5">
          <div
            className="bg-emerald-600 h-2.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : participants.length === 0 ? (
        <p className="text-sm text-center text-neutral-500 py-8">No confirmed participants yet.</p>
      ) : (
        <ul className="space-y-2">
          {participants.map((participant) => {
            const checkedIn = Boolean(participant.checkedInAt);
            const busy = busyParticipantId === participant.id;

            return (
              <li
                key={participant.id}
                className={`rounded-2xl border p-3 ${
                  checkedIn ? 'border-emerald-200 bg-emerald-50/60' : 'border-neutral-200/80 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <SecureAvatar
                    src={participant.avatarUrl}
                    name={participant.displayName || participant.email || 'Participant'}
                    className="w-10 h-10 text-sm shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900 truncate">
                      {participant.displayName}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{participant.email}</p>
                    {participant.phone && (
                      <p className="text-xs text-neutral-500 truncate">{participant.phone}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void toggleCheckin(participant)}
                    className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-60 ${
                      checkedIn
                        ? 'bg-white border border-neutral-200 text-neutral-700'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {busy ? '…' : checkedIn ? 'Undo' : 'Check in'}
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Joined {new Date(participant.joinedAt).toLocaleDateString()}</span>
                  <span className={checkedIn ? 'font-semibold text-emerald-700' : ''}>
                    {checkedIn ? 'Checked in' : 'Not yet'}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export const organisationActivityCheckInPath = (activityId: string): string =>
  hostActivitiesCheckInPath(activityId);

/** @deprecated Use organisationActivityCheckInPath */
export const hostActivityCheckInPath = organisationActivityCheckInPath;

/** @deprecated Use OrganisationActivityCheckInPanel */
export const HostActivityCheckInPanel = OrganisationActivityCheckInPanel;

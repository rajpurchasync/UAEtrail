import { useCallback, useEffect, useState } from 'react';
import type { ParticipantDTO } from '@uaetrail/shared-types';
import {
  checkInActivityParticipant,
  getActivityParticipants,
  undoActivityParticipantCheckIn,
} from '../../hooks/tenantActivityClientApi';

export const useActivityParticipantsRoster = (
  tenantId: string,
  activityId: string,
  onError?: (message: string) => void
) => {
  const [participants, setParticipants] = useState<ParticipantDTO[]>([]);
  const [activityEnded, setActivityEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyParticipantId, setBusyParticipantId] = useState<string | null>(null);

  const loadParticipants = useCallback(async () => {
    if (!tenantId || !activityId) return;
    setLoading(true);
    try {
      const snapshot = await getActivityParticipants(tenantId, activityId);
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

  const toggleAttendance = useCallback(
    async (participant: ParticipantDTO) => {
      if (!tenantId) return;
      setBusyParticipantId(participant.id);
      try {
        if (participant.checkedInAt) {
          await undoActivityParticipantCheckIn(tenantId, activityId, participant.id);
        } else {
          await checkInActivityParticipant(tenantId, activityId, participant.id);
        }
        await loadParticipants();
      } catch (err) {
        onError?.(err instanceof Error ? err.message : 'Failed to update attendance');
      } finally {
        setBusyParticipantId(null);
      }
    },
    [activityId, loadParticipants, onError, tenantId]
  );

  const attendedCount = participants.filter((p) => p.status === 'attended').length;

  return {
    participants,
    activityEnded,
    loading,
    busyParticipantId,
    attendedCount,
    loadParticipants,
    toggleAttendance,
  };
};

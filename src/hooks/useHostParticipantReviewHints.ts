import { useCallback, useEffect, useState } from 'react';
import type { ParticipantDTO } from '@uaetrail/shared-types';
import { fetchHostActivityParticipants } from './hostActivityClientApi';

export type HostParticipantReviewHints = {
  rateableCount: number;
  activityEnded: boolean;
  loading: boolean;
};

/** Host activity detail — roster hints for post check-in rating CTAs. */
export const useHostParticipantReviewHints = (
  tenantId: string | null | undefined,
  activityId: string | null | undefined,
  enabled: boolean
): HostParticipantReviewHints => {
  const [participants, setParticipants] = useState<ParticipantDTO[]>([]);
  const [activityEnded, setActivityEnded] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled || !tenantId || !activityId) {
      setParticipants([]);
      setActivityEnded(false);
      return;
    }
    setLoading(true);
    try {
      const snapshot = await fetchHostActivityParticipants(tenantId, activityId);
      setParticipants(snapshot.participants);
      setActivityEnded(snapshot.activityEnded);
    } catch {
      setParticipants([]);
      setActivityEnded(false);
    } finally {
      setLoading(false);
    }
  }, [activityId, enabled, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const rateableCount = participants.filter((row) => row.canRate).length;

  return { rateableCount, activityEnded, loading };
};

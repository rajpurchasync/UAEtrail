import { useCallback, useEffect, useState } from 'react';
import { fetchActivityJoinInvitesSentInviteeIds } from '../hooks/activityInviteClientApi';

/** Pending Join me invitee ids per activity (caller must be host or going on each activity). */
export const useSentActivityJoinInvites = (
  activityIds: string[],
  enabled: boolean
): {
  sentInviteeIdsByActivity: Record<string, Set<string>>;
  refreshActivity: (activityId: string) => Promise<void>;
} => {
  const [sentInviteeIdsByActivity, setSentInviteeIdsByActivity] = useState<
    Record<string, Set<string>>
  >({});

  const loadActivity = useCallback(async (activityId: string) => {
    const inviteeUserIds = await fetchActivityJoinInvitesSentInviteeIds(activityId);
    setSentInviteeIdsByActivity((prev) => ({
      ...prev,
      [activityId]: new Set(inviteeUserIds),
    }));
  }, []);

  useEffect(() => {
    if (!enabled || activityIds.length === 0) {
      setSentInviteeIdsByActivity({});
      return;
    }

    let cancelled = false;
    void Promise.all(
      activityIds.map(async (activityId) => {
        const inviteeUserIds = await fetchActivityJoinInvitesSentInviteeIds(activityId);
        return [activityId, inviteeUserIds] as const;
      })
    )
      .then((pairs) => {
        if (cancelled) return;
        const next: Record<string, Set<string>> = {};
        for (const [activityId, inviteeUserIds] of pairs) {
          next[activityId] = new Set(inviteeUserIds);
        }
        setSentInviteeIdsByActivity(next);
      })
      .catch(() => {
        if (!cancelled) setSentInviteeIdsByActivity({});
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, activityIds.join('|')]);

  const refreshActivity = useCallback(
    async (activityId: string) => {
      await loadActivity(activityId);
    },
    [loadActivity]
  );

  return { sentInviteeIdsByActivity, refreshActivity };
};

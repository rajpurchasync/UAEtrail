import { useEffect, useState } from 'react';
import { api } from '../api/index';

/** Explore “my outings” map filter — joined/hosted activities + wishlist place pins (not Trips tab UI). */
export const useMemberJourneyMapPinIds = (userId: string | undefined) => {
  const [ids, setIds] = useState<Set<string> | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIds(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const [activitiesRes, requestsRes] = await Promise.all([
          api.getMeActivities(),
          api.getMeRequests(),
        ]);
        if (cancelled) return;
        const pinIds = new Set<string>();
        for (const activity of activitiesRes.data) {
          pinIds.add(`activity:${activity.id}`);
        }
        for (const request of requestsRes.data) {
          if (request.activity?.id) pinIds.add(`activity:${request.activity.id}`);
        }
        setIds(pinIds);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load your map pins');
          setIds(new Set());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { ids, loading, error };
};

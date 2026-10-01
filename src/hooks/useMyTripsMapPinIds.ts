import { useEffect, useState } from 'react';
import { api } from '../api/index';

/** Map item ids (`activity:…`, `venue:…`) for joined/hosted outings + personal wishlist places/plans — not demand posts. */
export const useMyTripsMapPinIds = (userId: string | undefined) => {
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
        const [favoritesRes, activitiesRes, requestsRes] = await Promise.all([
          api.getMeFavorites(),
          api.getMeActivities(),
          api.getMeRequests(),
        ]);
        if (cancelled) return;
        const pinIds = new Set<string>();
        for (const fav of favoritesRes.data) {
          if (fav.participantIntentId) continue;
          if (fav.locationId) pinIds.add(`venue:${fav.locationId}`);
          const plan = fav.activity ?? fav.event;
          if (fav.activityId) pinIds.add(`activity:${fav.activityId}`);
          else if (plan?.id) pinIds.add(`activity:${plan.id}`);
        }
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

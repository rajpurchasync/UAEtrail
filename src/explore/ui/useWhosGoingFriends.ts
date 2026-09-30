import { useEffect, useMemo, useState } from 'react';
import type { BuddySummaryDTO, ExploreMapItemDTO } from '@uaetrail/shared-types';
import { api } from '../../api/index';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import { buddyIdSet, buildWhosGoingFriendRows } from '../whosGoingFriends';

type UseWhosGoingFriendsArgs = {
  enabled: boolean;
  userId: string | undefined;
  mapItems: ExploreMapItemDTO[];
  activityDatePreset: ExploreActivityDatePreset;
};

export const useWhosGoingFriends = ({
  enabled,
  userId,
  mapItems,
  activityDatePreset,
}: UseWhosGoingFriendsArgs) => {
  const [buddies, setBuddies] = useState<BuddySummaryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !userId) {
      setBuddies([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void api
      .getMeBuddies()
      .then((res) => {
        if (!cancelled) setBuddies(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setBuddies([]);
          setError(err instanceof Error ? err.message : 'Could not load friends');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, userId]);

  const friendRows = useMemo(
    () => buildWhosGoingFriendRows(buddies, mapItems, activityDatePreset),
    [buddies, mapItems, activityDatePreset]
  );

  const friendsOnTrips = useMemo(
    () => friendRows.filter((row) => row.hosting || row.joining),
    [friendRows]
  );

  return {
    buddies,
    friendRows,
    friendsOnTrips,
    friendIds: buddyIdSet(buddies),
    loading,
    error,
  };
};

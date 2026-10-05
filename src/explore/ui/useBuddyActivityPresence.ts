import { useEffect, useMemo, useState } from 'react';
import type { BuddyActivityPresenceRowDTO } from '@uaetrail/shared-types';
import { api } from '../../api/index';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import { serializeExploreActivityDatePreset } from '../exploreActivityDateFilter';
import { buddyUserIdsFromPresenceRows } from '../buddyActivityPresence';

type UseBuddyActivityPresenceArgs = {
  enabled: boolean;
  activityDatePreset: ExploreActivityDatePreset;
};

export const useBuddyActivityPresence = ({
  enabled,
  activityDatePreset,
}: UseBuddyActivityPresenceArgs) => {
  const [rows, setRows] = useState<BuddyActivityPresenceRowDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void api
      .getMeBuddyActivityPresence({
        date: serializeExploreActivityDatePreset(activityDatePreset),
      })
      .then((res) => {
        if (!cancelled) setRows(res.data.rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setRows([]);
          setError(err instanceof Error ? err.message : 'Could not load buddies');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, activityDatePreset]);

  const buddiesOnActivities = useMemo(
    () => rows.filter((row) => row.hosting || row.joining),
    [rows]
  );

  return {
    rows,
    buddiesOnActivities,
    buddyUserIds: buddyUserIdsFromPresenceRows(rows),
    loading,
    error,
  };
};

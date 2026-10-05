import { useEffect, useState } from 'react';
import type { MemberBrowseCardDTO, MemberDiscoveryOnTripRowDTO, MemberDiscoveryQuotaDTO } from '@uaetrail/shared-types';
import { api } from '../../api/index';
import type { ExploreActivityDatePreset } from '../exploreActivityDateFilter';
import { serializeExploreActivityDatePreset } from '../exploreActivityDateFilter';

type UseMemberDiscoveryRosterArgs = {
  enabled: boolean;
  search: string;
  activityDatePreset: ExploreActivityDatePreset;
};

export const useMemberDiscoveryRoster = ({
  enabled,
  search,
  activityDatePreset,
}: UseMemberDiscoveryRosterArgs) => {
  const [onTrips, setOnTrips] = useState<MemberDiscoveryOnTripRowDTO[]>([]);
  const [directory, setDirectory] = useState<MemberBrowseCardDTO[]>([]);
  const [quota, setQuota] = useState<MemberDiscoveryQuotaDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setOnTrips([]);
      setDirectory([]);
      setQuota(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void api
      .getMeMemberDiscoveryRoster({
        page: 1,
        pageSize: 30,
        q: search.trim() || undefined,
        date: serializeExploreActivityDatePreset(activityDatePreset),
      })
      .then((res) => {
        if (cancelled) return;
        setOnTrips(res.data.onTrips);
        setDirectory(res.data.directory);
        setQuota(res.meta.quota);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not load discover');
        setOnTrips([]);
        setDirectory([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, search, activityDatePreset]);

  return {
    onTrips,
    directory,
    quota,
    loading,
    error,
    refreshQuota: () =>
      api.getMeMemberDiscoveryQuota().then((r) => {
        setQuota(r.data);
      }),
  };
};

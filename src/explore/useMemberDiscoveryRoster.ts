import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import type {
  MemberBrowseCardDTO,
  MemberDiscoveryOnTripRowDTO,
  MemberDiscoveryQuotaDTO,
} from '@uaetrail/shared-types';
import { api } from '../api/index';
import {
  serializeExploreActivityDatePreset,
  type ExploreActivityDatePreset,
} from './routing';

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
  const deferredSearch = useDeferredValue(search.trim());
  const [onTrips, setOnTrips] = useState<MemberDiscoveryOnTripRowDTO[]>([]);
  const [directory, setDirectory] = useState<MemberBrowseCardDTO[]>([]);
  const [quota, setQuota] = useState<MemberDiscoveryQuotaDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setOnTrips([]);
      setDirectory([]);
      setQuota(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const date = serializeExploreActivityDatePreset(activityDatePreset);
      const response = await api.getMeMemberDiscoveryRoster({
        q: deferredSearch || undefined,
        date: date || undefined,
      });
      setOnTrips(response.data.onTrips);
      setDirectory(response.data.directory);
      setQuota(response.meta.quota);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load discover roster.');
      setOnTrips([]);
      setDirectory([]);
      setQuota(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, deferredSearch, activityDatePreset]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    onTrips,
    directory,
    quota,
    loading,
    error,
    refresh,
  };
};

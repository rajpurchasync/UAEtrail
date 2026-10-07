import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import type {
  MemberBrowseCardDTO,
  MemberDiscoveryLookingRowDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonRowDTO,
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
  const [friendsGoing, setFriendsGoing] = useState<SocialPersonRowDTO[]>([]);
  const [hostsGoing, setHostsGoing] = useState<SocialPersonRowDTO[]>([]);
  const [lookingFor, setLookingFor] = useState<MemberDiscoveryLookingRowDTO[]>([]);
  const [followed, setFollowed] = useState<MemberBrowseCardDTO[]>([]);
  const [directory, setDirectory] = useState<MemberBrowseCardDTO[]>([]);
  const [quota, setQuota] = useState<MemberDiscoveryQuotaDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setFriendsGoing([]);
      setHostsGoing([]);
      setLookingFor([]);
      setFollowed([]);
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
      setFriendsGoing(response.data.friendsGoing ?? []);
      setHostsGoing(response.data.hostsGoing ?? []);
      setLookingFor(response.data.lookingFor ?? []);
      setFollowed(response.data.followed ?? []);
      setDirectory(response.data.directory);
      setQuota(response.meta.quota);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load discover roster.');
      setFriendsGoing([]);
      setHostsGoing([]);
      setLookingFor([]);
      setFollowed([]);
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
    friendsGoing,
    hostsGoing,
    lookingFor,
    followed,
    directory,
    quota,
    loading,
    error,
    refresh,
  };
};

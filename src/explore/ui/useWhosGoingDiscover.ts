import { useEffect, useState } from 'react';
import type { MemberBrowseCardDTO, MemberDiscoveryQuotaDTO } from '@uaetrail/shared-types';
import { api } from '../../api/index';

type UseWhosGoingDiscoverArgs = {
  enabled: boolean;
  search: string;
};

export const useWhosGoingDiscover = ({ enabled, search }: UseWhosGoingDiscoverArgs) => {
  const [directory, setDirectory] = useState<MemberBrowseCardDTO[]>([]);
  const [quota, setQuota] = useState<MemberDiscoveryQuotaDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setDirectory([]);
      setQuota(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void Promise.all([
      api.browsePublicMembers(1, 30, search.trim() || undefined),
      api.getMeMemberDiscoveryQuota(),
    ])
      .then(([browseRes, quotaRes]) => {
        if (cancelled) return;
        setDirectory(browseRes.data);
        setQuota(quotaRes.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not load discover');
        setDirectory([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, search]);

  return { directory, quota, loading, error, refreshQuota: () => api.getMeMemberDiscoveryQuota().then((r) => setQuota(r.data)) };
};

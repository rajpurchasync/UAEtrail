import { useEffect, useState } from 'react';
import type { MemberCoordinationAttentionDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

export const useMemberCoordinationAttention = (
  enabled: boolean,
  refreshKey = 0
): MemberCoordinationAttentionDTO & { loading: boolean } => {
  const [data, setData] = useState<MemberCoordinationAttentionDTO>({ items: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    api
      .getMeCoordinationAttention()
      .then((res) => setData(res.data))
      .catch(() => setData({ items: [] }))
      .finally(() => setLoading(false));
  }, [enabled, refreshKey]);

  return { ...data, loading };
};

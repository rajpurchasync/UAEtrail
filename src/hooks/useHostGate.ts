import { useCallback, useEffect, useState } from 'react';
import type { HostStatusDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { setActiveTenantId } from '../api/tenant';
import { useAuth } from '../context/AuthContext';

interface UseHostGateOptions {
  enabled?: boolean;
}

export const useHostGate = ({ enabled = true }: UseHostGateOptions = {}) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<HostStatusDTO | null>(null);
  const [loading, setLoading] = useState(Boolean(enabled && user));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.getMyHostStatus();
      setStatus(res.data);
      if (res.data.tenantId) {
        setActiveTenantId(res.data.tenantId);
      }
      return res.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load host status');
      setStatus(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!enabled || !user) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [enabled, user, refresh]);

  return {
    status,
    loading,
    error,
    canPublish: status?.canPublish ?? false,
    canHostPaidActivities: status?.canHostPaidActivities ?? false,
    applicationStatus: status?.applicationStatus ?? 'none',
    tenantId: status?.tenantId ?? null,
    tenantType: status?.tenantType ?? null,
    businessMode: status?.businessMode ?? null,
    refresh,
  };
};

import { useCallback, useEffect, useState } from 'react';
import type { HostStatusDTO } from '@uaetrail/shared-types';
import { fetchMemberHostStatus } from './memberHostStatusApi';
import { setActiveTenantId } from '../api/tenant';
import { useAuth } from '../context/AuthContext';

interface UseHostStatusOptions {
  enabled?: boolean;
}

/** Thin client for `GET /me/host-status` — tier logic lives in `member-host-status` (API). */
export const useHostStatus = ({ enabled = true }: UseHostStatusOptions = {}) => {
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
      const hostStatus = await fetchMemberHostStatus();
      setStatus(hostStatus);
      if (hostStatus.tenantId) {
        setActiveTenantId(hostStatus.tenantId);
      }
      return hostStatus;
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
    signupProfileComplete: status?.signupProfileComplete ?? false,
    isCommunityHost: status?.isCommunityHost ?? false,
    hostTiers: status?.hostTiers ?? { community: false, professional: false, business: false },
    profileRoleLabel: status?.profileRoleLabel ?? 'community_member',
    canAccessHostConsole: status?.canAccessHostConsole ?? false,
    canPublish: status?.canPublish ?? false,
    canHostPaidActivities: status?.canHostPaidActivities ?? false,
    applicationStatus: status?.applicationStatus ?? 'none',
    tenantId: status?.tenantId ?? null,
    tenantType: status?.tenantType ?? null,
    businessMode: status?.businessMode ?? null,
    hasGuideProfile: status?.hasGuideProfile ?? false,
    hasAgencyProfile: status?.hasAgencyProfile ?? false,
    hasShopProfile: status?.hasShopProfile ?? false,
    ownedProfiles: status?.ownedProfiles ?? [],
    refresh,
  };
};

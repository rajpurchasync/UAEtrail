import { useCallback, useState } from 'react';
import type { HostStatusDTO } from '@uaetrail/shared-types';
import { fetchMemberHostStatus } from './memberHostStatusApi';
import { setActiveTenantId } from '../api/tenant';
import { useAuth } from '../context/AuthContext';
import { useSafeAsyncEffect, type IsActiveGuard } from './useSafeAsyncEffect';

interface UseHostStatusOptions {
  enabled?: boolean;
}

/** Thin client for `GET /me/host-status` — tier logic lives in `member-host-status` (API). */
export const useHostStatus = ({ enabled = true }: UseHostStatusOptions = {}) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<HostStatusDTO | null>(null);
  const [loading, setLoading] = useState(Boolean(enabled && user));
  const [error, setError] = useState<string | null>(null);

  const loadHostStatus = useCallback(
    async (isActive: IsActiveGuard = () => true) => {
      if (!user) {
        if (isActive()) {
          setStatus(null);
          setLoading(false);
        }
        return null;
      }

      if (isActive()) {
        setLoading(true);
        setError(null);
      }
      try {
        const hostStatus = await fetchMemberHostStatus();
        if (isActive()) {
          setStatus(hostStatus);
          if (hostStatus.tenantId) {
            setActiveTenantId(hostStatus.tenantId);
          }
        }
        return hostStatus;
      } catch (err) {
        if (isActive()) {
          setError(err instanceof Error ? err.message : 'Could not load host status');
          setStatus(null);
        }
        return null;
      } finally {
        if (isActive()) {
          setLoading(false);
        }
      }
    },
    [user]
  );

  const refresh = useCallback(() => loadHostStatus(), [loadHostStatus]);

  useSafeAsyncEffect(
    async (isActive) => {
      if (!enabled || !user) {
        setLoading(false);
        return;
      }
      await loadHostStatus(isActive);
    },
    [enabled, user, loadHostStatus]
  );

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

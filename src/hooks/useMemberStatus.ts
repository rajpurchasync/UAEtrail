import { useCallback, useState } from 'react';
import type { MemberStatusDTO } from '@uaetrail/shared-types';
import { fetchMemberStatus } from './memberStatusApi';
import { setActiveTenantId } from '../api/tenant';
import { useAuth } from '../context/AuthContext';
import { useSafeAsyncEffect, type IsActiveGuard } from './useSafeAsyncEffect';

export interface UseMemberStatusOptions {
  enabled?: boolean;
}

/** Member capabilities (`GET /me/status`) — publish gates live under `status.publish`. */
export const useMemberStatus = ({ enabled = true }: UseMemberStatusOptions = {}) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<MemberStatusDTO | null>(null);
  const [loading, setLoading] = useState(Boolean(enabled && user));
  const [error, setError] = useState<string | null>(null);

  const loadMemberStatus = useCallback(
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
        const memberStatus = await fetchMemberStatus();
        if (isActive()) {
          setStatus(memberStatus);
          const tenantId = memberStatus.publish.tenantId ?? memberStatus.tenantId;
          if (tenantId) {
            setActiveTenantId(tenantId);
          }
        }
        return memberStatus;
      } catch (err) {
        if (isActive()) {
          setError(err instanceof Error ? err.message : 'Could not load member status');
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

  const refresh = useCallback(() => loadMemberStatus(), [loadMemberStatus]);

  useSafeAsyncEffect(
    async (isActive) => {
      if (!enabled || !user) {
        setLoading(false);
        return;
      }
      await loadMemberStatus(isActive);
    },
    [enabled, user, loadMemberStatus]
  );

  const publish = status?.publish;
  const canAccessPublishingWorkspace =
    publish?.canAccessPublishingWorkspace ?? status?.canAccessHostConsole ?? false;

  return {
    status,
    publish,
    loading,
    error,
    profileComplete: status?.profileComplete ?? status?.signupProfileComplete ?? false,
    isCommunityHost: publish?.isCommunityHost ?? status?.isCommunityHost ?? false,
    hostTiers: publish?.hostTiers ?? status?.hostTiers ?? { community: false, professional: false, business: false },
    profileRoleLabel: status?.profileRoleLabel ?? 'community_member',
    canAccessPublishingWorkspace,
    /** @deprecated Use {@link canAccessPublishingWorkspace}. */
    canAccessHostConsole: status?.canAccessHostConsole ?? false,
    /** @deprecated Use {@link canAccessPublishingWorkspace}. */
    canAccessOperatorConsole: canAccessPublishingWorkspace,
    canPublish: publish?.canPublish ?? status?.canPublish ?? false,
    canHostPaidActivities: publish?.canHostPaidActivities ?? status?.canHostPaidActivities ?? false,
    applicationStatus: publish?.applicationStatus ?? status?.applicationStatus ?? 'none',
    tenantId: publish?.tenantId ?? status?.tenantId ?? null,
    tenantType: publish?.tenantType ?? status?.tenantType ?? null,
    businessMode: publish?.businessMode ?? status?.businessMode ?? null,
    hasGuideProfile: publish?.hasGuideProfile ?? status?.hasGuideProfile ?? false,
    hasAgencyProfile: publish?.hasAgencyProfile ?? status?.hasAgencyProfile ?? false,
    hasShopProfile: publish?.hasShopProfile ?? status?.hasShopProfile ?? false,
    ownedProfiles: publish?.ownedProfiles ?? status?.ownedProfiles ?? [],
    refresh,
  };
};

import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MemberStatusDTO } from '@uaetrail/shared-types';
import { fetchMemberStatus } from './memberStatusApi';
import { setActiveTenantId } from '../api/tenant';
import { useAuth } from '../context/AuthContext';
import { memberStatusQueryKey } from './clientQueryKeys';

export interface UseMemberStatusOptions {
  enabled?: boolean;
}

/** Member capabilities (`GET /me/status`) — publish gates live under `status.publish`. */
export const useMemberStatus = ({ enabled = true }: UseMemberStatusOptions = {}) => {
  const { user } = useAuth();
  const active = enabled && Boolean(user);

  const query = useQuery({
    queryKey: user ? memberStatusQueryKey(user.id) : ['me', 'status', ''],
    queryFn: fetchMemberStatus,
    enabled: active,
    staleTime: 30_000,
  });

  const status = query.data ?? null;

  useEffect(() => {
    if (!status) return;
    const tenantId = status.publish.tenantId ?? status.tenantId;
    if (tenantId) {
      setActiveTenantId(tenantId);
    }
  }, [status]);

  const refresh = useCallback(async (): Promise<MemberStatusDTO | null> => {
    if (!user) return null;
    const result = await query.refetch();
    return result.data ?? null;
  }, [query, user]);

  const publish = status?.publish;
  const canAccessPublishingWorkspace =
    publish?.canAccessPublishingWorkspace ?? status?.canAccessHostConsole ?? false;

  return {
    status,
    publish,
    loading: active && query.isLoading,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.isError
          ? 'Could not load member status'
          : null,
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

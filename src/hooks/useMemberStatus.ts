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

const emptyHostTiers = { community: false, professional: false, business: false };

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
    const tenantId = status?.publish.tenantId;
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
    profileComplete: status?.profileComplete ?? false,
    medicalSafetyProfileComplete: status?.medicalSafetyProfileComplete ?? false,
    profileRoleLabel: status?.profileRoleLabel ?? 'community_member',
    isCommunityHost: publish?.isCommunityHost ?? false,
    hostTiers: publish?.hostTiers ?? emptyHostTiers,
    canAccessPublishingWorkspace: publish?.canAccessPublishingWorkspace ?? false,
    canPublish: publish?.canPublish ?? false,
    canHostPaidActivities: publish?.canHostPaidActivities ?? false,
    applicationStatus: publish?.applicationStatus ?? 'none',
    tenantId: publish?.tenantId ?? null,
    tenantType: publish?.tenantType ?? null,
    businessMode: publish?.businessMode ?? null,
    hasGuideProfile: publish?.hasGuideProfile ?? false,
    hasAgencyProfile: publish?.hasAgencyProfile ?? false,
    hasShopProfile: publish?.hasShopProfile ?? false,
    ownedProfiles: publish?.ownedProfiles ?? [],
    refresh,
  };
};

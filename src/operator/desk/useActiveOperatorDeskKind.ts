import { useMemo } from 'react';
import type { PublishingProfileKind } from '@uaetrail/shared-types';
import { getActiveTenantId } from '../../api/tenant';
import { resolveHostingPublishingProfileKind } from '@/discovery/discoveryPortExploreHosting';
import { useMemberStatus } from '../../hooks/useMemberStatus';
import { useAuth } from '../../context/AuthContext';

/** Active tenant's publishing profile kind for desk chrome (nav filter + titles). */
export const useActiveOperatorDeskKind = (): PublishingProfileKind => {
  const { user } = useAuth();
  const { ownedProfiles } = useMemberStatus({ enabled: Boolean(user) });
  const tenantId = getActiveTenantId();

  return useMemo(() => {
    if (!ownedProfiles.length) return 'community';
    const match =
      ownedProfiles.find((profile) => profile.tenantId === tenantId) ?? ownedProfiles[0];
    return resolveHostingPublishingProfileKind(match);
  }, [ownedProfiles, tenantId]);
};
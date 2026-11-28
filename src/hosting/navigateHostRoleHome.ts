import type { NavigateFunction } from 'react-router-dom';
import type { OwnedHostProfileDTO, UserRole } from '@uaetrail/shared-types';
import { setActiveTenantId } from '../api/tenant';
import { MEMBER_HOME_PATH } from '../config/surfacePaths';
import { fetchMemberStatus } from '../hooks/memberStatusApi';
import { defaultRouteByRole } from '../utils/authRouting';
import { resolveHostingHubPath, isHostConsoleRole } from './hostingHubRouting';

/** After Switch to Host / privileged sign-in — hosting hub, not Explore or Profile. */
export const resolveHostModeHomePath = async (role: UserRole | string): Promise<string> => {
  if (!isHostConsoleRole(role) && role !== 'platform_admin') {
    return defaultRouteByRole(role as UserRole);
  }
  if (role === 'platform_admin') return defaultRouteByRole('platform_admin');

  const status = await fetchMemberStatus().catch(() => null);
  const ownedProfiles = (status?.publish.ownedProfiles ?? []) as OwnedHostProfileDTO[];
  const tenantId = status?.publish.tenantId;
  if (tenantId) setActiveTenantId(tenantId);
  return resolveHostingHubPath({
    ownedProfiles,
    hostTiers: status?.publish.hostTiers ?? null,
  });
};

export const navigateToHostModeHome = async (
  navigate: NavigateFunction,
  role: UserRole | string
): Promise<void> => {
  const path = await resolveHostModeHomePath(role);
  navigate(path, { replace: true });
};

export const navigateToVisitorHome = (navigate: NavigateFunction): void => {
  navigate(MEMBER_HOME_PATH, { replace: true });
};

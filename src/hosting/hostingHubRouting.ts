import type { HostTierFlags, OwnedHostProfileDTO, UserRole } from '@uaetrail/shared-types';
import { OPERATOR_OVERVIEW_PATH } from '../config/routingCatalog';
import {
  listHostingPublishProfiles,
  resolveHostingPublishingProfileKind,
} from '../discovery/discoveryPortExploreHosting';
import {
  normalizeWorkspaceBrandKind,
  type WorkspaceBrandKind,
} from '../content/workspaceVocabulary';

export type HostingModeAvailability = {
  hasCommunity: boolean;
  hasWorkspace: boolean;
  both: boolean;
  workspaceBrand: WorkspaceBrandKind | null;
  communityTenantId: string | null;
  workspaceTenantId: string | null;
};

const isCommunityProfile = (profile: OwnedHostProfileDTO): boolean =>
  resolveHostingPublishingProfileKind(profile) === 'community';

const isWorkspaceProfile = (profile: OwnedHostProfileDTO): boolean =>
  resolveHostingPublishingProfileKind(profile) !== 'community';

const brandFromProfile = (profile: OwnedHostProfileDTO | undefined): WorkspaceBrandKind | null => {
  if (!profile) return null;
  const kind = resolveHostingPublishingProfileKind(profile);
  if (kind === 'pro_guide') return 'guide';
  if (kind === 'community') return 'host';
  return normalizeWorkspaceBrandKind(kind);
};

export const resolveHostingModeAvailability = (
  ownedProfiles: readonly OwnedHostProfileDTO[],
  hostTiers?: HostTierFlags | null
): HostingModeAvailability => {
  const activityProfiles = listHostingPublishProfiles([...ownedProfiles]);
  const communityProfiles = activityProfiles.filter(isCommunityProfile);
  const workspaceProfiles = activityProfiles.filter(isWorkspaceProfile);

  const hasCommunity =
    communityProfiles.length > 0 || Boolean(hostTiers?.community);
  const hasWorkspace =
    workspaceProfiles.length > 0 ||
    Boolean(hostTiers?.professional) ||
    Boolean(hostTiers?.business);

  return {
    hasCommunity,
    hasWorkspace,
    both: hasCommunity && hasWorkspace,
    workspaceBrand: brandFromProfile(workspaceProfiles[0]),
    communityTenantId: communityProfiles[0]?.tenantId ?? null,
    workspaceTenantId: workspaceProfiles[0]?.tenantId ?? null,
  };
};

/** Default operator home for hosts (community + workspace share one console). */
export const resolveHostingHubPath = (_input?: {
  ownedProfiles?: readonly OwnedHostProfileDTO[] | null;
  hostTiers?: HostTierFlags | null;
  preferredMode?: unknown;
}): string => OPERATOR_OVERVIEW_PATH;

/** Visitor → host control copy (role restore). */
export const switchToHostLabel = (switchedFromRole?: string | null): string => {
  if (switchedFromRole === 'platform_admin') return 'Switch to admin';
  return 'Switch to Host';
};

export const isHostConsoleRole = (role: UserRole | string | null | undefined): boolean =>
  role === 'tenant_owner' ||
  role === 'tenant_admin' ||
  role === 'tenant_guide' ||
  role === 'merchant_admin';

/**
 * True when the session is acting as Pro/agency/guide host (not Switch-to-Visitor).
 * Visitor mode uses `participant` + `switchedFromRole` — consumer Explore nav stays.
 */
export const isHostModeSession = (role: UserRole | string | null | undefined): boolean =>
  isHostConsoleRole(role);
import type { HostTierFlags, OwnedHostProfileDTO, UserRole } from '@uaetrail/shared-types';
import { HOSTING_HUB_PATH, PUBLISHING_OVERVIEW_PATH } from '../config/routingCatalog';
import {
  listHostingPublishProfiles,
  resolveHostingPublishingProfileKind,
} from '../explore/hostingPublishTenants';
import {
  normalizeWorkspaceBrandKind,
  workspaceConsoleLabel,
  type WorkspaceBrandKind,
} from '../content/workspaceVocabulary';
import {
  readStoredHostingMode,
  writeStoredHostingMode,
  type HostingSurfaceMode,
} from './hostingModeStorage';

export type { HostingSurfaceMode } from './hostingModeStorage';
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
  return normalizeWorkspaceBrandKind(kind === 'pro_guide' ? 'guide' : kind);
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

export const hostingHubPathForMode = (mode: HostingSurfaceMode): string =>
  mode === 'community' ? HOSTING_HUB_PATH : PUBLISHING_OVERVIEW_PATH;

export const resolveHostingSurfaceMode = (input: {
  ownedProfiles: readonly OwnedHostProfileDTO[];
  hostTiers?: HostTierFlags | null;
  preferredMode?: HostingSurfaceMode | null;
}): HostingSurfaceMode => {
  const availability = resolveHostingModeAvailability(input.ownedProfiles, input.hostTiers);
  if (availability.both) {
    return input.preferredMode ?? readStoredHostingMode() ?? 'workspace';
  }
  if (availability.hasWorkspace) return 'workspace';
  return 'community';
};

/** Default home when acting as a host (not visitor Explore). */
export const resolveHostingHubPath = (input: {
  ownedProfiles?: readonly OwnedHostProfileDTO[] | null;
  hostTiers?: HostTierFlags | null;
  preferredMode?: HostingSurfaceMode | null;
}): string => {
  const mode = resolveHostingSurfaceMode({
    ownedProfiles: input.ownedProfiles ?? [],
    hostTiers: input.hostTiers,
    preferredMode: input.preferredMode,
  });
  return hostingHubPathForMode(mode);
};

export const persistHostingSurfaceMode = (mode: HostingSurfaceMode): void => {
  writeStoredHostingMode(mode);
};

export const hostingModeSwitcherLabel = (
  mode: HostingSurfaceMode,
  workspaceBrand?: WorkspaceBrandKind | null
): string => {
  if (mode === 'community') return 'Community';
  return workspaceConsoleLabel(workspaceBrand);
};

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

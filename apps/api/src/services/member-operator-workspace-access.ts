import type { HostTierFlags } from '@uaetrail/shared-types';

/**
 * Sole resolver for publishing workspace shell access (DMCP Phase 1).
 * Does not broaden via `UserRole` / tenant job roles — use `GET /me/status` publish slice only.
 */
export const resolveOperatorWorkspaceAccess = (input: {
  isPlatformAdmin: boolean;
  canPublish: boolean;
  hostTiers: HostTierFlags;
}): boolean =>
  input.isPlatformAdmin || input.canPublish || input.hostTiers.business;
import type { HostTierFlags } from './host-publishing-tier.js';

export const MEMBER_DISCOVERY_QUOTA_LIMIT = 5;
export const MEMBER_DISCOVERY_WINDOW_DAYS = 30;

export type MemberDiscoveryQuotaDTO = {
  windowDays: number;
  /** `null` = unlimited (Pro / business host tiers until consumer SKU). */
  limit: number | null;
  used: number;
  remaining: number | null;
};

export const memberHasUnlimitedDiscovery = (
  hostStatus: { hostTiers: HostTierFlags } | null | undefined
): boolean => Boolean(hostStatus?.hostTiers.professional || hostStatus?.hostTiers.business);

export const buildMemberDiscoveryQuota = (
  used: number,
  unlimited: boolean
): MemberDiscoveryQuotaDTO => {
  if (unlimited) {
    return {
      windowDays: MEMBER_DISCOVERY_WINDOW_DAYS,
      limit: null,
      used,
      remaining: null,
    };
  }
  const limit = MEMBER_DISCOVERY_QUOTA_LIMIT;
  return {
    windowDays: MEMBER_DISCOVERY_WINDOW_DAYS,
    limit,
    used,
    remaining: Math.max(0, limit - used),
  };
};

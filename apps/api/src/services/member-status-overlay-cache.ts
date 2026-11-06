import type { HostStatusDTO } from '@uaetrail/shared-types';
import { resolveMemberStatus } from './member-status.js';

const MEMBER_STATUS_OVERLAY_CACHE_MS = 8_000;

type CacheEntry = { expiresAt: number; status: HostStatusDTO };

const overlayCache = new Map<string, CacheEntry>();

/** Short TTL for map overlay enrich — avoids repeated tenant/membership work per pan. */
export const resolveMemberStatusForExploreOverlay = async (
  userId: string
): Promise<HostStatusDTO> => {
  const now = Date.now();
  const hit = overlayCache.get(userId);
  if (hit && hit.expiresAt > now) return hit.status;
  const status = await resolveMemberStatus(userId);
  overlayCache.set(userId, { expiresAt: now + MEMBER_STATUS_OVERLAY_CACHE_MS, status });
  return status;
};

export const invalidateMemberStatusOverlayCache = (userId?: string): void => {
  if (userId) {
    overlayCache.delete(userId);
    return;
  }
  overlayCache.clear();
};

import type { EntityFollowKind } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { findEntityFollow, listEntityFollowsWithDetails } from '../lib/entity-follow-store.js';

export const listMeEntityFollows = (userId: string) => listEntityFollowsWithDetails(userId);

export const checkMeEntityFollowTarget = async (input: {
  followerId: string;
  locationId?: string;
  tenantId?: string;
  shopId?: string;
  merchantId?: string;
}) => {
  const shopId = input.shopId?.trim() || input.merchantId?.trim();
  const targets = [
    input.locationId ? { kind: 'location' as const, targetId: input.locationId } : null,
    input.tenantId ? { kind: 'tenant' as const, targetId: input.tenantId } : null,
    shopId ? { kind: 'shop' as const, targetId: shopId } : null,
  ].filter((row): row is { kind: EntityFollowKind; targetId: string } => row !== null);
  if (targets.length !== 1) {
    throw new ApiError(400, 'invalid_follow', 'Specify exactly one of locationId, tenantId, shopId.');
  }
  const row = await findEntityFollow({ followerId: input.followerId, ...targets[0] });
  return { following: Boolean(row), followId: row?.id ?? null };
};

import type { EntityFollowKind } from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';
import { followEntity, unfollowEntityById } from '../lib/entity-follow-store.js';

export type EntityFollowCreateInput = {
  locationId?: string;
  tenantId?: string;
  shopId?: string;
  /** Inbound compat — same as {@link shopId}. */
  merchantId?: string;
};

const resolveCreateTarget = (
  body: EntityFollowCreateInput
): { kind: EntityFollowKind; targetId: string } => {
  if (body.locationId) return { kind: 'location', targetId: body.locationId };
  if (body.tenantId) return { kind: 'tenant', targetId: body.tenantId };
  const shopId = body.shopId?.trim() || body.merchantId?.trim();
  if (shopId) return { kind: 'shop', targetId: shopId };
  throw new ApiError(400, 'invalid_follow', 'Specify exactly one follow target.');
};

export const followEntityForUser = async (userId: string, body: EntityFollowCreateInput) => {
  const { kind, targetId } = resolveCreateTarget(body);
  return followEntity(userId, kind, targetId);
};

export const unfollowEntityForUser = async (userId: string, followId: string) => {
  await unfollowEntityById(userId, followId);
};

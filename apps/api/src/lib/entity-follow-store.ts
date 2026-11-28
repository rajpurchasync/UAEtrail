import type { Collection } from 'mongodb';
import {
  inferPublishingProfileKindFromTenantWire,
  type EntityFollowDTO,
  normalizeEntityFollowKind,
  type EntityFollowKind,
  type EntityFollowKindStored,
  type PublishingProfileKind,
} from '@uaetrail/shared-types';
import { LocationStatus } from '../domain/enums.js';
import { ApiError } from './api-error.js';
import { COLLECTIONS } from './collections.js';
import { newEntityId } from './entity-builders.js';
import { findLocationInMongo } from './entity-sync.js';
import { getMongoClient } from './mongo.js';
import { findMerchantPublicById } from './shop-store.js';
import { findTenantById, findTenantsByIds } from './tenant-store.js';

type MongoEntityFollow = {
  _id: string;
  followerId: string;
  kind: EntityFollowKindStored;
  targetId: string;
  createdAt: Date;
};

const collection = (): Collection<MongoEntityFollow> =>
  getMongoClient()!.db().collection<MongoEntityFollow>(COLLECTIONS.ENTITY_FOLLOWS);

const assertFollowTarget = async (kind: EntityFollowKind, targetId: string): Promise<void> => {
  if (kind === 'location') {
    const location = await findLocationInMongo(targetId);
    if (!location || location.status !== LocationStatus.ACTIVE) {
      throw new ApiError(404, 'place_not_found', 'Place not found.');
    }
    return;
  }
  if (kind === 'tenant') {
    const tenant = await findTenantById(targetId);
    if (!tenant) {
      throw new ApiError(404, 'team_not_found', 'Host profile not found.');
    }
    return;
  }
  if (kind === 'shop') {
    const shop = await findMerchantPublicById(targetId);
    if (!shop) {
      throw new ApiError(404, 'shop_not_found', 'Shop not found.');
    }
    return;
  }
  throw new ApiError(400, 'invalid_follow', 'Invalid follow target kind.');
};

export const followEntity = async (
  followerId: string,
  kind: EntityFollowKind,
  targetId: string
): Promise<EntityFollowDTO> => {
  await assertFollowTarget(kind, targetId);
  const existing = await collection().findOne({ followerId, kind, targetId });
  if (existing) {
    const [row] = await listEntityFollowsWithDetails(followerId, existing._id);
    if (row) return row;
  }

  const now = new Date();
  const doc: MongoEntityFollow = {
    _id: newEntityId(),
    followerId,
    kind,
    targetId,
    createdAt: now,
  };
  await collection().insertOne(doc);
  const [row] = await listEntityFollowsWithDetails(followerId, doc._id);
  if (!row) {
    throw new Error('Failed to create follow.');
  }
  return row;
};

export const unfollowEntityById = async (followerId: string, followId: string): Promise<void> => {
  await collection().deleteOne({ _id: followId, followerId });
};

const storedKindsForShopFollow = (): EntityFollowKindStored[] => ['shop', 'merchant'];

export const findEntityFollow = async (input: {
  followerId: string;
  kind: EntityFollowKind;
  targetId: string;
}): Promise<{ id: string } | null> => {
  const kinds =
    input.kind === 'shop' ? storedKindsForShopFollow() : [input.kind];
  const row = await collection().findOne({
    followerId: input.followerId,
    kind: { $in: kinds },
    targetId: input.targetId,
  });
  return row ? { id: row._id } : null;
};

export const listEntityFollowerIds = async (kind: EntityFollowKind, targetId: string): Promise<string[]> => {
  const kinds = kind === 'shop' ? storedKindsForShopFollow() : [kind];
  const docs = await collection()
    .find({ kind: { $in: kinds }, targetId }, { projection: { followerId: 1 } })
    .limit(500)
    .toArray();
  return docs.map((doc) => doc.followerId);
};

export const listEntityFollowsWithDetails = async (
  followerId: string,
  onlyId?: string
): Promise<EntityFollowDTO[]> => {
  const filter = onlyId ? { followerId, _id: onlyId } : { followerId };
  const docs = await collection().find(filter).sort({ createdAt: -1 }).limit(200).toArray();
  if (docs.length === 0) return [];

  const locationIds = docs.filter((d) => d.kind === 'location').map((d) => d.targetId);
  const tenantIds = docs.filter((d) => d.kind === 'tenant').map((d) => d.targetId);
  const shopIds = docs
    .filter((d) => d.kind === 'shop' || d.kind === 'merchant')
    .map((d) => d.targetId);

  const locationMap = new Map<string, { id: string; name: string; images: string[] }>();
  if (locationIds.length > 0) {
    type LocationRow = { _id: string; name: string; images?: string[] };
    const locations = await getMongoClient()!
      .db()
      .collection<LocationRow>('locations')
      .find({ _id: { $in: locationIds } })
      .project({ name: 1, images: 1 })
      .toArray();
    for (const loc of locations) {
      locationMap.set(loc._id, {
        id: loc._id,
        name: loc.name,
        images: Array.isArray(loc.images) ? loc.images : [],
      });
    }
  }

  const tenantMap = new Map<
    string,
    {
      id: string;
      name: string;
      slug: string;
      ownerUserId: string;
      logoUrl: string | null;
      brandProfileKind: PublishingProfileKind;
    }
  >();
  const tenantsById = await findTenantsByIds(tenantIds);
  for (const [tenantId, tenant] of tenantsById) {
    tenantMap.set(tenantId, {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      ownerUserId: tenant.ownerId,
      logoUrl: tenant.logoUrl ?? null,
      brandProfileKind: inferPublishingProfileKindFromTenantWire({
        type: tenant.type,
        businessMode: tenant.businessMode,
        publishingPurpose: tenant.publishingPurpose,
      }),
    });
  }

  const shopMap = new Map<string, { id: string; shopName: string; logo: string | null }>();
  if (shopIds.length > 0) {
    type ShopProfileRow = { _id: string; shopName: string; logo?: string | null };
    const shops = await getMongoClient()!
      .db()
      .collection<ShopProfileRow>(COLLECTIONS.MERCHANT_PROFILES)
      .find({ _id: { $in: shopIds } })
      .project({ shopName: 1, logo: 1 })
      .toArray();
    for (const shop of shops) {
      shopMap.set(shop._id, {
        id: shop._id,
        shopName: shop.shopName,
        logo: shop.logo ?? null,
      });
    }
  }

  return docs.map((doc) => {
    const kind = normalizeEntityFollowKind(doc.kind);
    const isShop = doc.kind === 'shop' || doc.kind === 'merchant';
    return {
      id: doc._id,
      kind,
      targetId: doc.targetId,
      createdAt: doc.createdAt.toISOString(),
      location: doc.kind === 'location' ? locationMap.get(doc.targetId) ?? null : null,
      tenant: doc.kind === 'tenant' ? tenantMap.get(doc.targetId) ?? null : null,
      shop: isShop ? shopMap.get(doc.targetId) ?? null : null,
    };
  });
};

export const deleteEntityFollowsByUser = async (userId: string): Promise<void> => {
  await collection().deleteMany({ followerId: userId });
};

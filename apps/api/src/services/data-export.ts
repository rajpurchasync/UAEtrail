import { findAuthUserById } from '../lib/auth-users.js';
import { listUserActivityParticipantsBasic, listUserActivityRequestsBasic } from '../lib/activity-engagement-store.js';
import { listEntityFollowsWithDetails } from '../lib/entity-follow-store.js';
import { countPushSubscriptions } from '../lib/push-subscriptions.js';
import { listUserShopOrdersBasic } from '../lib/shop-store.js';
import { listUserWishlistItems } from '../lib/wishlist-store.js';

export interface UserDataExport {
  exportedAt: string;
  account: {
    id: string;
    email: string;
    role: string;
    authProvider: string;
    createdAt: Date;
    emailVerifiedAt: Date | null;
  };
  profile: {
    displayName: string | null;
    phone: string | null;
    bio: string | null;
    avatarUrl: string | null;
  } | null;
  activityRequests: Array<{ id: string; activityId: string; status: string; createdAt: Date }>;
  participations: Array<{ id: string; activityId: string; checkedInAt: Date | null; createdAt: Date }>;
  shopOrders: Array<{ id: string; status: string; totalAed: number; createdAt: Date }>;
  wishlist: Array<{
    id: string;
    locationId: string | null;
    activityId: string | null;
    alertOnMatch: boolean;
    watchOutingCategory: string | null;
    watchLatitude: number | null;
    watchLongitude: number | null;
    createdAt: Date;
  }>;
  entityFollows: Array<{
    id: string;
    kind: string;
    targetId: string;
    createdAt: string;
    locationName: string | null;
    tenantName: string | null;
    merchantName: string | null;
  }>;
  pushSubscriptionCount: number;
}

export async function buildUserDataExport(userId: string): Promise<UserDataExport> {
  const user = await findAuthUserById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const [requests, participants, shopOrders, pushSubscriptionCount, wishlistRows, entityFollowRows] =
    await Promise.all([
      listUserActivityRequestsBasic(userId, 200),
      listUserActivityParticipantsBasic(userId, 200),
      listUserShopOrdersBasic(userId, 100),
      countPushSubscriptions(userId),
      listUserWishlistItems(userId),
      listEntityFollowsWithDetails(userId),
    ]);

  const wishlist = wishlistRows
    .filter((row) => row.locationId || row.activityId)
    .map((row) => ({
      id: row.id,
      locationId: row.locationId,
      activityId: row.activityId,
      alertOnMatch: row.alertOnMatch,
      watchOutingCategory: row.watchOutingCategory,
      watchLatitude: row.watchLatitude,
      watchLongitude: row.watchLongitude,
      createdAt: row.createdAt,
    }));

  const entityFollows = entityFollowRows.map((row) => ({
    id: row.id,
    kind: row.kind,
    targetId: row.targetId,
    createdAt: row.createdAt,
    locationName: row.location?.name ?? null,
    tenantName: row.tenant?.name ?? null,
    merchantName: row.merchant?.shopName ?? null,
  }));

  return {
    exportedAt: new Date().toISOString(),
    account: {
      id: user._id,
      email: user.email,
      role: user.role,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
      emailVerifiedAt: user.emailVerifiedAt,
    },
    profile: user.profile
      ? {
          displayName: user.profile.displayName,
          phone: user.profile.phone,
          bio: user.profile.bio,
          avatarUrl: user.profile.avatarUrl,
        }
      : null,
    activityRequests: requests.map((r: (typeof requests)[number]) => ({
      id: r.id,
      activityId: r.activityId,
      status: r.status,
      createdAt: r.createdAt,
    })),
    participations: participants.map((p: (typeof participants)[number]) => ({
      id: p.id,
      activityId: p.activityId,
      checkedInAt: p.checkedInAt,
      createdAt: p.createdAt,
    })),
    shopOrders,
    wishlist,
    entityFollows,
    pushSubscriptionCount,
  };
}

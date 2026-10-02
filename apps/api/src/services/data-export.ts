import { findAuthUserById } from '../lib/auth-users.js';
import { listUserActivityParticipantsBasic, listUserActivityRequestsBasic } from '../lib/activity-engagement-store.js';
import { listUserFavorites } from '../lib/favorites-store.js';
import { countPushSubscriptions } from '../lib/push-subscriptions.js';
import { listUserShopOrdersBasic } from '../lib/shop-store.js';

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
  favorites: Array<{
    id: string;
    locationId: string | null;
    activityId: string | null;
    productId: string | null;
    merchantId: string | null;
    tenantId: string | null;
    profileUserId: string | null;
    createdAt: Date;
  }>;
  activityRequests: Array<{ id: string; activityId: string; status: string; createdAt: Date }>;
  participations: Array<{ id: string; activityId: string; checkedInAt: Date | null; createdAt: Date }>;
  shopOrders: Array<{ id: string; status: string; totalAed: number; createdAt: Date }>;
  pushSubscriptionCount: number;
}

export async function buildUserDataExport(userId: string): Promise<UserDataExport> {
  const user = await findAuthUserById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const [favorites, requests, participants, shopOrders, pushSubscriptionCount] = await Promise.all([
    listUserFavorites(userId),
    listUserActivityRequestsBasic(userId, 200),
    listUserActivityParticipantsBasic(userId, 200),
    listUserShopOrdersBasic(userId, 100),
    countPushSubscriptions(userId),
  ]);

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
    favorites,
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
    pushSubscriptionCount,
  };
}

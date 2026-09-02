import { TenantStatus, UserRole, UserStatus } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { deleteAuthTokensByUser } from '../lib/auth-tokens.js';
import { findAuthUserById, updateAuthUserCore } from '../lib/auth-users.js';
import { purgeUserChatMessages } from '../lib/chat-data.js';
import { deleteUserFavoritesByUser } from '../lib/favorites-store.js';
import { purgeUserActivityEngagement } from '../lib/activity-engagement-store.js';
import { deleteNotificationsByUser } from '../lib/notifications-store.js';
import { verifyPassword } from '../lib/password.js';
import { deletePushSubscriptionsByUser } from '../lib/push-subscriptions.js';
import { deleteMerchantProfileByUser } from '../lib/shop-store.js';
import { purgeUserSocialContent } from '../lib/social-data.js';
import { deleteTenantMembershipsByUser } from '../lib/tenant-access.js';
import { getMongoClient } from '../lib/mongo.js';
import { deleteLocationUnlocksByUser } from './location-premium.js';

export interface AccountDeletionInfo {
  canDelete: boolean;
  blockers: string[];
  requiresPassword: boolean;
}

export const getAccountDeletionInfo = async (userId: string): Promise<AccountDeletionInfo> => {
  const user = await findAuthUserById(userId);

  const ownedTenants = await getMongoClient()!
    .db()
    .collection('tenants')
    .find({
      ownerId: userId,
      status: { $in: [TenantStatus.ACTIVE, TenantStatus.PENDING] }
    })
    .project({ name: 1 })
    .toArray();

  if (!user) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }

  const blockers: string[] = [];

  if (user.role === UserRole.PLATFORM_ADMIN) {
    blockers.push('Platform admin accounts cannot be deleted in-app. Contact support.');
  }

  if (ownedTenants.length > 0) {
    const names = ownedTenants.map((t) => t.name as string).join(', ');
    blockers.push(
      `You manage an active organization (${names}). Transfer or close it before deleting your account.`
    );
  }

  return {
    canDelete: blockers.length === 0,
    blockers,
    requiresPassword: Boolean(user.passwordHash)
  };
};

export const deleteUserAccount = async (
  userId: string,
  confirmation: { password?: string; confirmPhrase?: string }
): Promise<void> => {
  const info = await getAccountDeletionInfo(userId);
  if (!info.canDelete) {
    throw new ApiError(409, 'deletion_blocked', info.blockers[0] ?? 'Account cannot be deleted.');
  }

  const user = await findAuthUserById(userId);

  if (!user) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }

  if (user.passwordHash) {
    if (!confirmation.password) {
      throw new ApiError(400, 'password_required', 'Enter your password to confirm account deletion.');
    }
    const valid = await verifyPassword(confirmation.password, user.passwordHash);
    if (!valid) {
      throw new ApiError(401, 'invalid_password', 'Password is incorrect.');
    }
  } else if (confirmation.confirmPhrase !== 'DELETE') {
    throw new ApiError(400, 'confirm_required', 'Type DELETE to confirm account deletion.');
  }

  const anonymizedEmail = `deleted+${userId}@deleted.uaetrail.internal`;

  await deleteAuthTokensByUser(userId);
  await deleteUserFavoritesByUser(userId);
  await deleteLocationUnlocksByUser(userId);
  await deletePushSubscriptionsByUser(userId);
  await deleteNotificationsByUser(userId);
  await purgeUserChatMessages(userId);
  await purgeUserSocialContent(userId);
  await purgeUserActivityEngagement(userId);
  await deleteTenantMembershipsByUser(userId);
  await deleteMerchantProfileByUser(userId);
  await updateAuthUserCore({
    userId,
    email: anonymizedEmail,
    passwordHash: null,
    googleId: null,
    status: UserStatus.SUSPENDED,
    profile: {
      displayName: 'Deleted user',
      phone: null,
      bio: null,
      avatarUrl: null
    }
  });
};

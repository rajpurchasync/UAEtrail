import { TenantStatus, UserRole, UserStatus } from '@prisma/client';
import { ApiError } from '../lib/api-error.js';
import { verifyPassword } from '../lib/password.js';
import { prisma } from '../lib/prisma.js';

export interface AccountDeletionInfo {
  canDelete: boolean;
  blockers: string[];
  requiresPassword: boolean;
}

export const getAccountDeletionInfo = async (userId: string): Promise<AccountDeletionInfo> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      passwordHash: true,
      authProvider: true,
      ownedTenants: {
        where: { status: { in: [TenantStatus.ACTIVE, TenantStatus.PENDING] } },
        select: { name: true }
      }
    }
  });

  if (!user) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }

  const blockers: string[] = [];

  if (user.role === UserRole.PLATFORM_ADMIN) {
    blockers.push('Platform admin accounts cannot be deleted in-app. Contact support.');
  }

  if (user.ownedTenants.length > 0) {
    const names = user.ownedTenants.map((t) => t.name).join(', ');
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true }
  });

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

  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.deleteMany({ where: { userId } });
    await tx.pushSubscription.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.emailVerificationToken.deleteMany({ where: { userId } });
    await tx.passwordResetToken.deleteMany({ where: { userId } });

    await tx.profile.upsert({
      where: { userId },
      update: {
        displayName: 'Deleted user',
        phone: null,
        bio: null,
        avatarUrl: null
      },
      create: {
        userId,
        displayName: 'Deleted user'
      }
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        email: anonymizedEmail,
        passwordHash: null,
        googleId: null,
        status: UserStatus.SUSPENDED
      }
    });
  });
};

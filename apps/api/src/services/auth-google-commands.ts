import type { UserRole } from '../domain/enums.js';
import { AuthProvider, UserStatus } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { verifyGoogleIdToken } from '../lib/google-auth.js';
import { createUniqueReferralCode } from '../lib/referral-code.js';
import { scheduleSideEffect } from '../lib/schedule-side-effect.js';
import { createMemberSession, restoreRoleIfSwitched } from './auth-session-flow.js';
import { createAuthUser, updateAuthUserGoogleLink } from './member-identity-commands.js';
import {
  findAuthUserByEmail,
  findAuthUserByGoogleId,
} from './member-identity-read.js';
import { notifyAdminsMemberRegistered } from './platform-admin-events.js';
import { processSignupRewards } from './rewards.js';
import {
  acceptGroupInvitesForNewUser,
} from './auth-registration-commands.js';

export type GoogleAuthResult = {
  httpStatus: 200 | 201;
  user: { id: string; email: string; role: UserRole };
  tokens: { accessToken: string; refreshToken: string };
  isNewUser: boolean;
};

export const authenticateWithGoogleIdToken = async (input: {
  idToken: string;
  referralCode?: string;
  groupInviteToken?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<GoogleAuthResult> => {
  const profile = await verifyGoogleIdToken(input.idToken);

  const existingByGoogle = await findAuthUserByGoogleId(profile.googleId);
  const existing = existingByGoogle ?? (await findAuthUserByEmail(profile.email));

  let user: { id: string; email: string; role: UserRole };
  let isNewUser = false;

  if (existing) {
    if (existing.status !== UserStatus.ACTIVE) {
      throw new ApiError(403, 'account_suspended', 'Account is suspended.');
    }

    if (
      !existing.googleId &&
      existing.authProvider === AuthProvider.EMAIL &&
      existing.passwordHash
    ) {
      throw new ApiError(
        409,
        'account_exists_use_password',
        'An account with this email already exists. Sign in with your password first.'
      );
    }

    const restoredRole = await restoreRoleIfSwitched(existing);
    user = { id: existing._id, email: existing.email, role: restoredRole };

    await updateAuthUserGoogleLink({
      userId: existing._id,
      googleId: profile.googleId,
      emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
      lastActiveAt: new Date(),
      profile: {
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl ?? undefined,
        phone: null,
        bio: null,
      },
    });
  } else {
    isNewUser = true;
    const userReferralCode = await createUniqueReferralCode();
    const created = await createAuthUser({
      email: profile.email,
      passwordHash: null,
      googleId: profile.googleId,
      authProvider: 'GOOGLE',
      role: 'PARTICIPANT',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      lastActiveAt: new Date(),
      referralCode: userReferralCode,
      profile: {
        displayName: profile.displayName,
        phone: null,
        bio: null,
        avatarUrl: profile.avatarUrl ?? null,
      },
    });

    user = { id: created._id, email: created.email, role: created.role };

    notifyAdminsMemberRegistered({
      userId: created._id,
      email: created.email,
      displayName: profile.displayName,
    });
    scheduleSideEffect(processSignupRewards(created._id, input.referralCode), 'auth.google_signup_rewards');
    scheduleSideEffect(
      acceptGroupInvitesForNewUser({
        userId: created._id,
        email: created.email,
        groupInviteToken: input.groupInviteToken,
      }),
      input.groupInviteToken
        ? 'auth.google_signup_group_invite_token'
        : 'auth.google_signup_pending_group_invites'
    );
  }

  const tokens = await createMemberSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return {
    httpStatus: isNewUser ? 201 : 200,
    user,
    tokens,
    isNewUser,
  };
};

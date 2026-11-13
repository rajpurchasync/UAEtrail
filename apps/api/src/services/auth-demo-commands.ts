import type { UserRole } from '../domain/enums.js';
import { UserStatus } from '../domain/enums.js';
import { ApiError } from '../lib/api-error.js';
import { DEMO_LOGIN_EMAILS, getDemoAccount, resolveDemoAccountPassword } from '../lib/demo-accounts.js';
import { hashPassword } from '../lib/password.js';
import { createUniqueReferralCode } from '../lib/referral-code.js';
import { createMemberSession } from './auth-session-flow.js';
import {
  createAuthUser,
  updateAuthUserCore,
  updateAuthUserLastActive,
  updateAuthUserProfile,
} from './member-identity-commands.js';
import { stripAccountRoleDisplaySuffix } from '@uaetrail/shared-types';
import { findAuthUserByEmail } from './member-identity-read.js';

export type DemoLoginResult = {
  user: { id: string; email: string; role: UserRole };
  tokens: { accessToken: string; refreshToken: string };
  emailVerified: boolean;
  authProvider: string;
};

export const loginWithDemoAccount = async (input: {
  email: string;
  demoLoginAllowed: boolean;
  ipAddress?: string;
  userAgent?: string;
}): Promise<DemoLoginResult> => {
  const normalizedEmail = input.email.trim().toLowerCase();

  if (!DEMO_LOGIN_EMAILS.has(normalizedEmail)) {
    throw new ApiError(404, 'demo_account_not_found', 'Demo account is not available.');
  }

  if (!input.demoLoginAllowed) {
    throw new ApiError(
      403,
      'demo_account_restricted',
      'Demo accounts are available only on localhost or test environments.'
    );
  }

  let user = await findAuthUserByEmail(normalizedEmail);
  if (!user) {
    const defaults = getDemoAccount(normalizedEmail);
    if (!defaults) {
      throw new ApiError(404, 'demo_account_not_found', 'Demo account is not available.');
    }

    const passwordHash = await hashPassword(resolveDemoAccountPassword(normalizedEmail));
    const referralCode = await createUniqueReferralCode();
    const displayName = stripAccountRoleDisplaySuffix(defaults.displayName);
    user = await createAuthUser({
      email: normalizedEmail,
      passwordHash,
      googleId: null,
      authProvider: 'EMAIL',
      role: defaults.role,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      lastActiveAt: new Date(),
      referralCode,
      profile: {
        displayName,
        phone: null,
        bio: null,
        avatarUrl: null,
      },
    });
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new ApiError(403, 'account_suspended', 'Account is suspended.');
  }

  const defaults = getDemoAccount(normalizedEmail);
  const canonicalRole = defaults?.role ?? user.role;
  if (user.role !== canonicalRole || user.profile?.switchedFromRole) {
    await updateAuthUserCore({
      userId: user._id,
      role: canonicalRole,
      profile: { switchedFromRole: null },
    });
  }
  const canonicalDisplayName = defaults?.displayName
    ? stripAccountRoleDisplaySuffix(defaults.displayName)
    : user.profile?.displayName
      ? stripAccountRoleDisplaySuffix(user.profile.displayName)
      : null;
  if (canonicalDisplayName && user.profile?.displayName !== canonicalDisplayName) {
    await updateAuthUserProfile(user._id, { displayName: canonicalDisplayName });
  }

  const tokens = await createMemberSession({
    userId: user._id,
    email: user.email,
    role: canonicalRole,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  await updateAuthUserLastActive(user._id);

  return {
    user: { id: user._id, email: user.email, role: canonicalRole },
    tokens,
    emailVerified: Boolean(user.emailVerifiedAt),
    authProvider: user.authProvider.toLowerCase(),
  };
};

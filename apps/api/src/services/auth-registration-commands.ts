import { ApiError } from '../lib/api-error.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { createUniqueReferralCode } from '../lib/referral-code.js';
import { scheduleSideEffect } from '../lib/schedule-side-effect.js';
import { createHostApplicationRecord } from '../lib/host-applications-store.js';
import {
  acceptGroupInviteByToken,
  acceptPendingGroupInvitesForEmail,
} from '../lib/social-groups-store.js';
import { slugify } from '../lib/slug.js';
import { issueEmailVerificationOtp } from './auth-session-flow.js';
import { createAuthUser, updateAuthUserProfile } from './member-identity-commands.js';
import { findAuthUserByEmail } from './member-identity-read.js';
import { notifyAdminsMemberRegistered } from './platform-admin-events.js';
import { processSignupRewards } from './rewards.js';

export const createHostApplicationOnSignup = async (input: {
  applicantId: string;
  accountType: 'company' | 'guide';
  displayName: string;
  organizationName?: string;
}) => {
  const requestedName = input.organizationName ?? `${input.displayName} Adventures`;
  await createHostApplicationRecord({
    applicantId: input.applicantId,
    requestedName,
    requestedSlug: slugify(input.organizationName ?? `${input.displayName}-adventures`),
    requestedType: input.accountType === 'company' ? 'COMPANY' : 'GUIDE_OWNED',
  });
};

export type RegisterEmailPasswordResult = {
  httpStatus: 200 | 201;
  email: string;
  expiresAt: Date;
  expiresInSeconds: number;
  message: string;
};

export const registerWithEmailPassword = async (input: {
  email: string;
  password: string;
  displayName: string;
  givenName: string;
  surname: string;
  accountType: 'participant' | 'company' | 'guide';
  organizationName?: string;
  referralCode?: string;
  groupInviteToken?: string;
}): Promise<RegisterEmailPasswordResult> => {
  const existing = await findAuthUserByEmail(input.email);

  if (existing?.emailVerifiedAt) {
    throw new ApiError(409, 'email_taken', 'Email is already registered.');
  }

  if (existing && !existing.emailVerifiedAt) {
    if (!existing.passwordHash || !(await verifyPassword(input.password, existing.passwordHash))) {
      throw new ApiError(
        409,
        'email_pending_verification',
        'This email has a pending account. Sign in with your password to finish verification.'
      );
    }

    await updateAuthUserProfile(existing._id, {
      displayName: input.displayName,
      givenName: input.givenName,
      surname: input.surname,
    });
    const verification = await issueEmailVerificationOtp({
      userId: existing._id,
      email: existing.email,
      displayName: input.displayName,
    });

    return {
      httpStatus: 200,
      email: existing.email,
      expiresAt: verification.expiresAt,
      expiresInSeconds: verification.expiresInSeconds,
      message: 'Verification code resent. Enter the code to finish creating your account.',
    };
  }

  const passwordHash = await hashPassword(input.password);
  const userReferralCode = await createUniqueReferralCode();

  const created = await createAuthUser({
    email: input.email,
    passwordHash,
    googleId: null,
    authProvider: 'EMAIL',
    role: 'PARTICIPANT',
    status: 'ACTIVE',
    emailVerifiedAt: null,
    lastActiveAt: null,
    referralCode: userReferralCode,
    profile: {
      displayName: input.displayName,
      givenName: input.givenName,
      surname: input.surname,
      phone: null,
      bio: null,
      avatarUrl: null,
    },
  });

  if (input.accountType !== 'participant') {
    await createHostApplicationOnSignup({
      applicantId: created._id,
      accountType: input.accountType,
      displayName: input.displayName,
      organizationName: input.organizationName,
    });
  }

  const verification = await issueEmailVerificationOtp({
    userId: created._id,
    email: created.email,
    displayName: input.displayName,
  });

  notifyAdminsMemberRegistered({
    userId: created._id,
    email: created.email,
    displayName: input.displayName,
  });
  scheduleSideEffect(processSignupRewards(created._id, input.referralCode), 'auth.signup_rewards');
  scheduleSideEffect(
    acceptGroupInvitesForNewUser({
      userId: created._id,
      email: created.email,
      groupInviteToken: input.groupInviteToken,
    }),
    input.groupInviteToken ? 'auth.signup_group_invite_token' : 'auth.signup_pending_group_invites'
  );

  return {
    httpStatus: 201,
    email: created.email,
    expiresAt: verification.expiresAt,
    expiresInSeconds: verification.expiresInSeconds,
    message: 'Account created. Verify your email to finish registration.',
  };
};

export const acceptGroupInvitesForNewUser = (input: {
  userId: string;
  email: string;
  groupInviteToken?: string;
}) => {
  if (input.groupInviteToken) {
    return acceptGroupInviteByToken({
      token: input.groupInviteToken,
      userId: input.userId,
      email: input.email,
    });
  }
  return acceptPendingGroupInvitesForEmail({ userId: input.userId, email: input.email });
};

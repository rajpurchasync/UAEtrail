import type { z } from 'zod';
import { UserRole } from '../domain/enums.js';
import { formatDisplayNameFromParts } from '../domain/person-name.js';
import {
  assertSignupProfileAge,
  completeSignupProfileSchema,
  isSignupProfileComplete,
} from '../domain/user-profile.js';
import { ApiError } from '../lib/api-error.js';
import {
  EMAIL_VERIFICATION_OTP_TTL_MS,
  EMAIL_VERIFICATION_OTP_TTL_SECONDS,
} from '../lib/auth-constants.js';
import {
  createEmailChangeToken,
  useEmailChangeToken,
} from './auth-session-commands.js';
import { findEmailChangeTokenForUser } from './auth-session-read.js';
import { generateEmailOtp } from '../lib/hash.js';
import { sendVerificationEmail } from '../lib/email.js';
import { isValidE164Phone } from '../lib/phone.js';
import { signAccessToken } from '../lib/jwt.js';
import { toSharedRole } from '../lib/mappers.js';
import {
  confirmEmailChangeSchema,
  requestEmailChangeSchema,
  roleSwitchSchema,
  SWITCHABLE_PRIVILEGED_ROLES,
  updateProfileSchema,
} from '../routes/user/schemas.js';
import {
  findAuthUserByEmail,
  findAuthUserById,
} from './member-identity-read.js';
import { updateAuthUserCore, updateAuthUserProfile } from './member-identity-commands.js';

export const patchAuthenticatedMemberProfile = async (
  userId: string,
  data: z.infer<typeof updateProfileSchema>
) => {
  if (data.phone && !isValidE164Phone(data.phone)) {
    throw new ApiError(400, 'invalid_phone', 'Enter a valid phone number.');
  }
  if (data.dateOfBirth) {
    assertSignupProfileAge(data.dateOfBirth);
  }
  const namePatch =
    data.givenName !== undefined && data.surname !== undefined
      ? {
          givenName: data.givenName,
          surname: data.surname,
          displayName: formatDisplayNameFromParts(data.givenName, data.surname),
        }
      : {};
  await updateAuthUserProfile(userId, {
    ...data,
    ...namePatch,
    phone: data.phone ?? null,
    bio: data.bio ?? null,
    dateOfBirth: data.dateOfBirth ?? undefined,
    gender: data.gender ?? undefined,
    city: data.city ?? undefined,
    countryCode: data.countryCode ?? undefined,
    languages: data.languages ?? undefined,
  });
  const user = await findAuthUserById(userId);
  return {
    displayName: user?.profile?.displayName ?? namePatch.displayName ?? null,
    givenName: user?.profile?.givenName ?? data.givenName ?? null,
    surname: user?.profile?.surname ?? data.surname ?? null,
    phone: user?.profile?.phone ?? data.phone ?? null,
    bio: user?.profile?.bio ?? data.bio ?? null,
    avatarUrl: user?.profile?.avatarUrl ?? data.avatarUrl ?? null,
    profileVisibility: user?.profile?.profileVisibility ?? data.profileVisibility ?? null,
    dateOfBirth: user?.profile?.dateOfBirth ?? data.dateOfBirth ?? null,
    gender: user?.profile?.gender ?? data.gender ?? null,
    city: user?.profile?.city ?? data.city ?? null,
    countryCode: user?.profile?.countryCode ?? data.countryCode ?? null,
    languages: user?.profile?.languages ?? data.languages ?? null,
    signupProfileComplete: isSignupProfileComplete(user?.profile),
  };
};

export const completeAuthenticatedSignupProfile = async (
  userId: string,
  data: z.infer<typeof completeSignupProfileSchema>
) => {
  assertSignupProfileAge(data.dateOfBirth);
  await updateAuthUserProfile(userId, data);
  const user = await findAuthUserById(userId);
  return {
    dateOfBirth: user?.profile?.dateOfBirth ?? data.dateOfBirth,
    gender: user?.profile?.gender ?? data.gender,
    countryCode: user?.profile?.countryCode ?? data.countryCode,
    languages: user?.profile?.languages ?? null,
    signupProfileComplete: isSignupProfileComplete(user?.profile),
  };
};

export const requestAuthenticatedEmailChange = async (
  userId: string,
  body: z.infer<typeof requestEmailChangeSchema>
) => {
  const normalizedEmail = body.newEmail.trim().toLowerCase();
  const user = await findAuthUserById(userId);
  if (!user) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }
  if (normalizedEmail === user.email.toLowerCase()) {
    throw new ApiError(400, 'same_email', 'That is already your email address.');
  }
  const existing = await findAuthUserByEmail(normalizedEmail);
  if (existing && existing._id !== user._id) {
    throw new ApiError(409, 'email_in_use', 'That email address is already registered.');
  }

  const otp = generateEmailOtp();
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_OTP_TTL_MS);
  await createEmailChangeToken({
    userId: user._id,
    newEmail: normalizedEmail,
    token: otp,
    expiresAt,
  });

  const sent = await sendVerificationEmail({
    to: normalizedEmail,
    name: user.profile.displayName ?? user.email,
    otp,
  });
  if (!sent) {
    throw new ApiError(503, 'email_delivery_failed', 'Could not send verification email. Please try again.');
  }

  return {
    message: 'Verification code sent to your new email address.',
    email: normalizedEmail,
    expiresAt: expiresAt.toISOString(),
    expiresInSeconds: EMAIL_VERIFICATION_OTP_TTL_SECONDS,
  };
};

export const confirmAuthenticatedEmailChange = async (
  userId: string,
  body: z.infer<typeof confirmEmailChangeSchema>
) => {
  const normalizedEmail = body.newEmail.trim().toLowerCase();
  const user = await findAuthUserById(userId);
  if (!user) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }

  const record = await findEmailChangeTokenForUser(user._id, normalizedEmail, body.otp);
  if (!record) {
    throw new ApiError(400, 'invalid_otp', 'Invalid or expired verification code.');
  }

  const existing = await findAuthUserByEmail(normalizedEmail);
  if (existing && existing._id !== user._id) {
    throw new ApiError(409, 'email_in_use', 'That email address is already registered.');
  }

  await updateAuthUserCore({
    userId: user._id,
    email: normalizedEmail,
    emailVerifiedAt: new Date(),
  });
  await useEmailChangeToken(record.id);

  return {
    message: 'Email address updated.',
    data: { email: normalizedEmail },
  };
};

export const switchAuthenticatedMemberRole = async (
  userId: string,
  body: z.infer<typeof roleSwitchSchema>
) => {
  const user = await findAuthUserById(userId);
  if (!user) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }

  let nextRole = user.role;
  let switchedFromRole = user.profile?.switchedFromRole ?? null;

  if (body.target === 'participant') {
    if (user.role !== UserRole.PARTICIPANT) {
      if (!SWITCHABLE_PRIVILEGED_ROLES.includes(user.role)) {
        throw new ApiError(403, 'forbidden', 'Your role cannot switch to participant mode.');
      }
      switchedFromRole = user.role;
      nextRole = UserRole.PARTICIPANT;
      await updateAuthUserCore({
        userId: user._id,
        role: UserRole.PARTICIPANT,
        profile: { switchedFromRole },
      });
    }
  } else {
    if (user.role !== UserRole.PARTICIPANT) {
      throw new ApiError(400, 'invalid_role_switch', 'You are already using your original role.');
    }
    if (!switchedFromRole || !SWITCHABLE_PRIVILEGED_ROLES.includes(switchedFromRole)) {
      throw new ApiError(400, 'invalid_role_switch', 'No original role is available to restore.');
    }
    nextRole = switchedFromRole;
    switchedFromRole = null;
    await updateAuthUserCore({
      userId: user._id,
      role: nextRole,
      profile: { switchedFromRole: null },
    });
  }

  const accessToken = signAccessToken({
    sub: user._id,
    email: user.email,
    role: toSharedRole(nextRole),
  });

  return {
    data: {
      role: nextRole.toLowerCase(),
      switchedFromRole: switchedFromRole ? switchedFromRole.toLowerCase() : null,
    },
    tokens: { accessToken },
  };
};

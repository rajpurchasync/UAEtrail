import { z } from 'zod';
import { UserRole } from '../../domain/enums.js';
import { ApiError } from '../../lib/api-error.js';
import { validate } from '../../middleware/validate.js';
import { findAuthUserByEmail, findAuthUserById, updateAuthUserCore, updateAuthUserProfile } from '../../lib/auth-users.js';
import { isPlatformMasterAdmin } from '../../lib/platform-master-admin.js';
import { EMAIL_VERIFICATION_OTP_TTL_MS, EMAIL_VERIFICATION_OTP_TTL_SECONDS } from '../../lib/auth-constants.js';
import { createEmailChangeToken, findEmailChangeTokenForUser, useEmailChangeToken } from '../../lib/auth-tokens.js';
import { generateEmailOtp } from '../../lib/hash.js';
import { sendVerificationEmail } from '../../lib/email.js';
import { isValidE164Phone } from '../../lib/phone.js';
import { signAccessToken } from '../../lib/jwt.js';
import { toSharedRole } from '../../lib/mappers.js';
import { formatDisplayNameFromParts, resolveProfilePersonNames } from '../../domain/person-name.js';
import { assertSignupProfileAge, completeSignupProfileSchema, isSignupProfileComplete } from '../../domain/user-profile.js';
import { confirmEmailChangeSchema, requestEmailChangeSchema, roleSwitchSchema, SWITCHABLE_PRIVILEGED_ROLES, updateProfileSchema } from './schemas.js';
import type { Router } from 'express';
import { buildPublicMemberProfile } from '../../services/public-member-profile.js';

export const registerProfileRoutes = (router: Router): void => {
router.get('/me/profile-public-preview', async (req, res, next) => {
  try {
    const userId = req.auth!.userId;
    const profile = await buildPublicMemberProfile(userId, {
      viewerUserId: userId,
      previewAsPublic: true,
    });
    if (!profile) {
      throw new ApiError(404, 'user_not_found', 'User not found.');
    }
    res.json({ data: profile.data, viewerAccess: profile.viewerAccess });
  } catch (error) {
    next(error);
  }
});

router.get('/me/profile', async (req, res, next) => {
  try {
    const user = await findAuthUserById(req.auth!.userId);
    if (!user) {
      throw new ApiError(404, 'user_not_found', 'User not found.');
    }
    const personNames = resolveProfilePersonNames(user.profile ?? {});
    res.json({
      data: {
        id: user._id,
        email: user.email,
        role: user.role.toLowerCase(),
        switchedFromRole: user.profile?.switchedFromRole?.toLowerCase() ?? null,
        displayName: user.profile?.displayName,
        givenName: personNames.givenName || null,
        surname: personNames.surname || null,
        phone: user.profile?.phone,
        bio: user.profile?.bio,
        avatarUrl: user.profile?.avatarUrl,
        profileVisibility: user.profile?.profileVisibility ?? 'public',
        dateOfBirth: user.profile?.dateOfBirth ?? null,
        gender: user.profile?.gender ?? null,
        city: user.profile?.city ?? null,
        countryCode: user.profile?.countryCode ?? null,
        languages: user.profile?.languages ?? null,
        signupProfileComplete: isSignupProfileComplete(user.profile),
        memberSince: user.createdAt.toISOString(),
        platformMasterAdmin:
          user.role === UserRole.PLATFORM_ADMIN ? isPlatformMasterAdmin(user) : false,
      }
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/me/profile', validate({ body: updateProfileSchema }), async (req, res, next) => {
  try {
    const data = req.body as z.infer<typeof updateProfileSchema>;
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
    await updateAuthUserProfile(req.auth!.userId, {
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
    const user = await findAuthUserById(req.auth!.userId);
    res.json({
      data: {
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
      }
    });
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/me/profile/signup-details',
  validate({ body: completeSignupProfileSchema }),
  async (req, res, next) => {
    try {
      const data = req.body as z.infer<typeof completeSignupProfileSchema>;
      assertSignupProfileAge(data.dateOfBirth);
      await updateAuthUserProfile(req.auth!.userId, data);
      const user = await findAuthUserById(req.auth!.userId);
      res.json({
        data: {
          dateOfBirth: user?.profile?.dateOfBirth ?? data.dateOfBirth,
          gender: user?.profile?.gender ?? data.gender,
          countryCode: user?.profile?.countryCode ?? data.countryCode,
          languages: user?.profile?.languages ?? null,
          signupProfileComplete: isSignupProfileComplete(user?.profile),
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/me/email/change/request', validate({ body: requestEmailChangeSchema }), async (req, res, next) => {
  try {
    const { newEmail } = req.body as z.infer<typeof requestEmailChangeSchema>;
    const normalizedEmail = newEmail.trim().toLowerCase();
    const user = await findAuthUserById(req.auth!.userId);
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
      expiresAt
    });

    const sent = await sendVerificationEmail({
      to: normalizedEmail,
      name: user.profile.displayName ?? user.email,
      otp
    });
    if (!sent) {
      throw new ApiError(503, 'email_delivery_failed', 'Could not send verification email. Please try again.');
    }

    res.json({
      message: 'Verification code sent to your new email address.',
      email: normalizedEmail,
      expiresAt: expiresAt.toISOString(),
      expiresInSeconds: EMAIL_VERIFICATION_OTP_TTL_SECONDS
    });
  } catch (error) {
    next(error);
  }
});

router.post('/me/email/change/confirm', validate({ body: confirmEmailChangeSchema }), async (req, res, next) => {
  try {
    const { newEmail, otp } = req.body as z.infer<typeof confirmEmailChangeSchema>;
    const normalizedEmail = newEmail.trim().toLowerCase();
    const user = await findAuthUserById(req.auth!.userId);
    if (!user) {
      throw new ApiError(404, 'user_not_found', 'User not found.');
    }

    const record = await findEmailChangeTokenForUser(user._id, normalizedEmail, otp);
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
      emailVerifiedAt: new Date()
    });
    await useEmailChangeToken(record.id);

    res.json({
      message: 'Email address updated.',
      data: { email: normalizedEmail }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/me/role/switch', validate({ body: roleSwitchSchema }), async (req, res, next) => {
  try {
    const { target } = req.body as z.infer<typeof roleSwitchSchema>;
    const user = await findAuthUserById(req.auth!.userId);
    if (!user) {
      throw new ApiError(404, 'user_not_found', 'User not found.');
    }

    let nextRole = user.role;
    let switchedFromRole = user.profile?.switchedFromRole ?? null;

    if (target === 'participant') {
      if (user.role !== UserRole.PARTICIPANT) {
        if (!SWITCHABLE_PRIVILEGED_ROLES.includes(user.role)) {
          throw new ApiError(403, 'forbidden', 'Your role cannot switch to participant mode.');
        }
        switchedFromRole = user.role;
        nextRole = UserRole.PARTICIPANT;
        await updateAuthUserCore({
          userId: user._id,
          role: UserRole.PARTICIPANT,
          profile: { switchedFromRole }
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
        profile: { switchedFromRole: null }
      });
    }

    const accessToken = signAccessToken({
      sub: user._id,
      email: user.email,
      role: toSharedRole(nextRole)
    });

    res.json({
      data: {
        role: nextRole.toLowerCase(),
        switchedFromRole: switchedFromRole ? switchedFromRole.toLowerCase() : null
      },
      tokens: { accessToken }
    });
  } catch (error) {
    next(error);
  }
});
};

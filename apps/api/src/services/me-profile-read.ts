import { UserRole } from '../domain/enums.js';
import { resolveProfilePersonNames, wireMemberDisplayName } from '../domain/person-name.js';
import { isSignupProfileComplete } from '../domain/user-profile.js';
import { isMedicalSafetyProfileComplete } from '@uaetrail/shared-types';
import { medicalSafetyFieldsFromAuthProfile } from '../lib/member-medical-safety-profile.js';
import { ApiError } from '../lib/api-error.js';
import { isPlatformMasterAdmin } from '../lib/platform-master-admin.js';
import {
  mergeFindCrewVisibility,
  mergeProfileDateOfBirthShare,
  mergeProfileFieldPrivacy,
  mergeProfileFriendsListShare,
} from '@uaetrail/shared-types';
import { findAuthUserById } from './member-identity-read.js';

export const getAuthenticatedMemberProfile = async (userId: string) => {
  const user = await findAuthUserById(userId);
  if (!user) {
    throw new ApiError(404, 'user_not_found', 'User not found.');
  }
  const personNames = resolveProfilePersonNames(user.profile ?? {});
  return {
    id: user._id,
    email: user.email,
    role: user.role.toLowerCase(),
    switchedFromRole: user.profile?.switchedFromRole?.toLowerCase() ?? null,
    displayName: wireMemberDisplayName({
      displayName: user.profile?.displayName,
      givenName: personNames.givenName,
      surname: personNames.surname,
      email: user.email,
    }),
    givenName: personNames.givenName || null,
    surname: personNames.surname || null,
    phone: user.profile?.phone,
    bio: user.profile?.bio,
    avatarUrl: user.profile?.avatarUrl,
    profileVisibility: user.profile?.profileVisibility ?? 'public',
    fieldPrivacy: mergeProfileFieldPrivacy(user.profile?.fieldPrivacy),
    dateOfBirthShare: mergeProfileDateOfBirthShare(
      user.profile?.dateOfBirthShare,
      (user.profile?.fieldPrivacy as { age?: 'hidden' | 'friends' | 'public' } | undefined)?.age ?? null
    ),
    friendsListShare: mergeProfileFriendsListShare(
      user.profile?.friendsListShare,
      user.profile?.profileVisibility ?? null
    ),
    findCrewVisibility: mergeFindCrewVisibility(user.profile?.findCrewVisibility),
    dateOfBirth: user.profile?.dateOfBirth ?? null,
    gender: user.profile?.gender ?? null,
    city: user.profile?.city ?? null,
    countryCode: user.profile?.countryCode ?? null,
    languages: user.profile?.languages ?? null,
    signupProfileComplete: isSignupProfileComplete(user.profile),
    bloodGroup: user.profile?.bloodGroup ?? null,
    medicalConditions: user.profile?.medicalConditions ?? null,
    emergencyContactName: user.profile?.emergencyContactName ?? null,
    emergencyContactPhone: user.profile?.emergencyContactPhone ?? null,
    emergencyContactRelation: user.profile?.emergencyContactRelation ?? null,
    medicalSafetyProfileComplete: isMedicalSafetyProfileComplete(
      medicalSafetyFieldsFromAuthProfile(user.profile)
    ),
    memberSince: user.createdAt.toISOString(),
    platformMasterAdmin:
      user.role === UserRole.PLATFORM_ADMIN ? isPlatformMasterAdmin(user) : false,
  };
};

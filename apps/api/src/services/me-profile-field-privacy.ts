import type {
  ProfileDateOfBirthShare,
  ProfileFieldPrivacySettings,
  ProfileFriendsListShare,
} from '@uaetrail/shared-types';
import {
  mergeProfileDateOfBirthShare,
  mergeProfileFieldPrivacy,
  mergeProfileFriendsListShare,
  PROFILE_FIELD_PRIVACY_KEYS,
} from '@uaetrail/shared-types';
import { updateAuthUserProfile } from '../lib/auth-users-store.js';
import { findAuthUserById } from './member-identity-read.js';

export type MemberProfilePrivacySettingsDTO = ProfileFieldPrivacySettings & {
  dateOfBirthShare: ProfileDateOfBirthShare;
  friendsListShare: ProfileFriendsListShare;
};

const readPrivacySettings = (profile: {
  fieldPrivacy?: Partial<ProfileFieldPrivacySettings> | null;
  dateOfBirthShare?: ProfileDateOfBirthShare | null;
  friendsListShare?: ProfileFriendsListShare | null;
  profileVisibility?: 'public' | 'group_members' | 'private' | null;
} | null | undefined): MemberProfilePrivacySettingsDTO => {
  const fieldPrivacy = mergeProfileFieldPrivacy(profile?.fieldPrivacy);
  const storedAgeAudience = (
    profile?.fieldPrivacy as { age?: 'hidden' | 'friends' | 'public' } | null | undefined
  )?.age;
  const dateOfBirthShare = mergeProfileDateOfBirthShare(
    profile?.dateOfBirthShare,
    storedAgeAudience ?? null
  );
  const friendsListShare = mergeProfileFriendsListShare(
    profile?.friendsListShare,
    profile?.profileVisibility ?? null
  );
  return { ...fieldPrivacy, dateOfBirthShare, friendsListShare };
};

export const getMemberFieldPrivacySettings = async (
  userId: string
): Promise<MemberProfilePrivacySettingsDTO> => {
  const user = await findAuthUserById(userId);
  return readPrivacySettings(user?.profile);
};

export const patchMemberFieldPrivacy = async (
  userId: string,
  patch: {
    fieldPrivacy?: Partial<ProfileFieldPrivacySettings>;
    dateOfBirthShare?: ProfileDateOfBirthShare;
    friendsListShare?: ProfileFriendsListShare;
  }
): Promise<MemberProfilePrivacySettingsDTO> => {
  const user = await findAuthUserById(userId);
  const current = readPrivacySettings(user?.profile);
  const nextFieldPrivacy: ProfileFieldPrivacySettings = { ...current };
  if (patch.fieldPrivacy) {
    for (const key of PROFILE_FIELD_PRIVACY_KEYS) {
      if (patch.fieldPrivacy[key] !== undefined) {
        nextFieldPrivacy[key] = patch.fieldPrivacy[key]!;
      }
    }
  }
  const dateOfBirthShare =
    patch.dateOfBirthShare !== undefined ? patch.dateOfBirthShare : current.dateOfBirthShare;
  const friendsListShare =
    patch.friendsListShare !== undefined ? patch.friendsListShare : current.friendsListShare;
  await updateAuthUserProfile(userId, {
    fieldPrivacy: nextFieldPrivacy,
    dateOfBirthShare,
    friendsListShare,
  });
  return { ...nextFieldPrivacy, dateOfBirthShare, friendsListShare };
};

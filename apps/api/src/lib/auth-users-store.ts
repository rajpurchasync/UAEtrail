import { ObjectId, type Collection } from 'mongodb';
import { MembershipTier } from '../domain/enums.js';
import type { BloodGroup } from '@uaetrail/shared-types';
import type { UserCity, UserCountryCode, UserGender } from '../domain/user-profile.js';
import { getMongoClient } from './mongo.js';
import { scheduleExploreMapCacheInvalidation } from './explore-map-cache-schedule.js';
import { normalizeSearchRegexInput } from './regex-search.js';
import {
  invalidateAuthUserReadCache,
  readCachedAuthUserById,
  writeCachedAuthUserById,
} from './auth-user-read-cache.js';

/** Default batch load for public/assembled relations — excludes secrets and medical fields. */
const AUTH_USER_RELATION_PROJECTION = {
  passwordHash: 0,
  'profile.medicalConditions': 0,
  'profile.bloodGroup': 0,
  'profile.emergencyContactName': 0,
  'profile.emergencyContactPhone': 0,
} as const;

export type AuthUserRecord = {
  _id: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  authProvider: 'EMAIL' | 'GOOGLE';
  role: 'PLATFORM_ADMIN' | 'MERCHANT_ADMIN' | 'TENANT_OWNER' | 'TENANT_ADMIN' | 'TENANT_GUIDE' | 'PARTICIPANT';
  status: 'ACTIVE' | 'SUSPENDED';
  emailVerifiedAt: Date | null;
  lastActiveAt: Date | null;
  referralCode: string;
  profile: {
    displayName: string | null;
    givenName?: string | null;
    surname?: string | null;
    phone: string | null;
    bio: string | null;
    avatarUrl: string | null;
    dateOfBirth?: string | null;
    gender?: UserGender | null;
    city?: UserCity | null;
    countryCode?: UserCountryCode | null;
    languages?: string | null;
    profileVisibility?: 'public' | 'group_members' | 'private';
    fieldPrivacy?: Partial<import('@uaetrail/shared-types').ProfileFieldPrivacySettings>;
    dateOfBirthShare?: import('@uaetrail/shared-types').ProfileDateOfBirthShare;
    friendsListShare?: import('@uaetrail/shared-types').ProfileFriendsListShare;
    notificationPreferences?: Partial<
      import('@uaetrail/shared-types').NotificationPreferenceSettings
    >;
    switchedFromRole?: 'PLATFORM_ADMIN' | 'MERCHANT_ADMIN' | 'TENANT_OWNER' | 'TENANT_ADMIN' | 'TENANT_GUIDE' | null;
    /** When true, may grant/revoke other `PLATFORM_ADMIN` accounts. */
    platformMasterAdmin?: boolean;
    rewardPoints?: number;
    membershipTier?: MembershipTier;
    bloodGroup?: BloodGroup | null;
    medicalConditions?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
};

type AuthUserMongoDoc = Omit<AuthUserRecord, 'googleId'> & { googleId?: string | null };

const usersCollection = (): Collection<AuthUserMongoDoc> =>
  getMongoClient()!.db().collection<AuthUserMongoDoc>('auth_users');

const normalizeAuthUser = (doc: AuthUserMongoDoc): AuthUserRecord => ({
  ...doc,
  googleId: doc.googleId ?? null
});

const buildUserQuery = (input: {
  role?: AuthUserRecord['role'] | AuthUserRecord['role'][];
  status?: AuthUserRecord['status'];
  search?: string;
  userIds?: string[];
  profileVisibility?: 'public';
}): Record<string, unknown> => {
  const query: Record<string, unknown> = {};
  if (input.role) query.role = Array.isArray(input.role) ? { $in: input.role } : input.role;
  if (input.status) query.status = input.status;
  const andClauses: Record<string, unknown>[] = [];
  if (input.profileVisibility === 'public') {
    andClauses.push({
      $or: [
        { 'profile.profileVisibility': 'public' },
        { 'profile.profileVisibility': { $exists: false } },
        { 'profile.profileVisibility': null },
      ],
    });
  }
  if (input.userIds !== undefined) {
    query._id = input.userIds.length > 0 ? { $in: input.userIds } : { $in: ['__none__'] };
  }
  const searchRegex = normalizeSearchRegexInput(input.search);
  if (searchRegex) {
    andClauses.push({
      $or: [
        { email: { $regex: searchRegex, $options: 'i' } },
        { 'profile.displayName': { $regex: searchRegex, $options: 'i' } },
        { 'profile.phone': { $regex: searchRegex, $options: 'i' } },
      ],
    });
  }
  if (andClauses.length === 1) {
    Object.assign(query, andClauses[0]);
  } else if (andClauses.length > 1) {
    query.$and = andClauses;
  }
  return query;
};

export const findAuthUserByEmail = async (email: string): Promise<AuthUserRecord | null> => {
  const row = await usersCollection().findOne({ email });
  return row ? normalizeAuthUser(row) : null;
};

export const findAuthUserById = async (id: string): Promise<AuthUserRecord | null> => {
  const cached = readCachedAuthUserById(id);
  if (cached !== undefined) return cached;
  const row = await usersCollection().findOne({ _id: id });
  const user = row ? normalizeAuthUser(row) : null;
  writeCachedAuthUserById(id, user);
  return user;
};

export const findAuthUserByGoogleId = async (googleId: string): Promise<AuthUserRecord | null> => {
  const row = await usersCollection().findOne({ googleId });
  return row ? normalizeAuthUser(row) : null;
};

export const findAuthUserByReferralCode = async (referralCode: string): Promise<AuthUserRecord | null> => {
  const row = await usersCollection().findOne({ referralCode });
  return row ? normalizeAuthUser(row) : null;
};

export const listAuthUsers = async (input: {
  role?: AuthUserRecord['role'] | AuthUserRecord['role'][];
  status?: AuthUserRecord['status'];
  search?: string;
  userIds?: string[];
  profileVisibility?: 'public';
  skip?: number;
  take?: number;
}): Promise<AuthUserRecord[]> => {
  const rows = await usersCollection()
    .find(buildUserQuery(input))
    .sort({ createdAt: -1 })
    .skip(input.skip ?? 0)
    .limit(input.take ?? 50)
    .toArray();
  return rows.map(normalizeAuthUser);
};

export const countAuthUsers = async (input: {
  role?: AuthUserRecord['role'] | AuthUserRecord['role'][];
  status?: AuthUserRecord['status'];
  search?: string;
  userIds?: string[];
  profileVisibility?: 'public';
}): Promise<number> => usersCollection().countDocuments(buildUserQuery(input));

export const findAuthUsersByIds = async (ids: string[]): Promise<AuthUserRecord[]> => {
  if (ids.length === 0) return [];
  const rows = await usersCollection()
    .find({ _id: { $in: ids } }, { projection: AUTH_USER_RELATION_PROJECTION })
    .toArray();
  return rows.map((row) =>
    normalizeAuthUser({ ...row, passwordHash: row.passwordHash ?? null })
  );
};

/** Case-insensitive match on id, email, display name, or phone. */
export const findAuthUserIdsMatchingActorSearch = async (search: string): Promise<string[]> => {
  const trimmed = search.trim();
  if (!trimmed) return [];
  const byId = await findAuthUserById(trimmed);
  if (byId) return [byId._id];
  const rows = await listAuthUsers({ search: trimmed, take: 80 });
  return rows.map((row) => row._id);
};

export const getAuthUserMembershipTier = async (userId: string): Promise<MembershipTier> => {
  const tiers = await getAuthUserMembershipTiers([userId]);
  return tiers.get(userId) ?? MembershipTier.FREE;
};

export const getAuthUserMembershipTiers = async (
  userIds: string[]
): Promise<Map<string, MembershipTier>> => {
  const unique = [...new Set(userIds.filter(Boolean))];
  const map = new Map<string, MembershipTier>();
  if (unique.length === 0) return map;

  const rows = await usersCollection()
    .find({ _id: { $in: unique } }, { projection: { profile: 1 } })
    .toArray();

  for (const id of unique) {
    map.set(id, MembershipTier.FREE);
  }
  for (const row of rows) {
    map.set(row._id, row.profile?.membershipTier ?? MembershipTier.FREE);
  }
  return map;
};

export const createAuthUser = async (input: {
  id?: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  authProvider: 'EMAIL' | 'GOOGLE';
  role: AuthUserRecord['role'];
  status: AuthUserRecord['status'];
  emailVerifiedAt?: Date | null;
  lastActiveAt?: Date | null;
  referralCode: string;
  profile: AuthUserRecord['profile'];
}): Promise<AuthUserRecord> => {
  const userId = input.id ?? new ObjectId().toHexString();
  const now = new Date();

  const doc: AuthUserRecord = {
    _id: userId,
    email: input.email,
    passwordHash: input.passwordHash,
    googleId: input.googleId,
    authProvider: input.authProvider,
    role: input.role,
    status: input.status,
    emailVerifiedAt: input.emailVerifiedAt ?? null,
    lastActiveAt: input.lastActiveAt ?? null,
    referralCode: input.referralCode,
    profile: input.profile,
    createdAt: now,
    updatedAt: now
  };

  if (input.googleId == null) {
    const { googleId: _omit, ...withoutGoogleId } = doc;
    await usersCollection().insertOne(withoutGoogleId);
  } else {
    await usersCollection().insertOne(doc);
  }

  const created = await findAuthUserByEmail(input.email);
  if (!created) {
    throw new Error('Failed to persist auth user record.');
  }
  return created;
};

export const updateAuthUserProfile = async (
  userId: string,
  patch: Partial<AuthUserRecord['profile']>
): Promise<void> => {
  const setFields: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.displayName !== undefined) setFields['profile.displayName'] = patch.displayName ?? null;
  if (patch.givenName !== undefined) setFields['profile.givenName'] = patch.givenName ?? null;
  if (patch.surname !== undefined) setFields['profile.surname'] = patch.surname ?? null;
  if (patch.phone !== undefined) setFields['profile.phone'] = patch.phone ?? null;
  if (patch.bio !== undefined) setFields['profile.bio'] = patch.bio ?? null;
  if (patch.avatarUrl !== undefined) setFields['profile.avatarUrl'] = patch.avatarUrl ?? null;
  if (patch.dateOfBirth !== undefined) setFields['profile.dateOfBirth'] = patch.dateOfBirth ?? null;
  if (patch.gender !== undefined) setFields['profile.gender'] = patch.gender ?? null;
  if (patch.city !== undefined) setFields['profile.city'] = patch.city ?? null;
  if (patch.countryCode !== undefined) setFields['profile.countryCode'] = patch.countryCode ?? null;
  if (patch.languages !== undefined) setFields['profile.languages'] = patch.languages ?? null;
  if (patch.profileVisibility !== undefined) {
    setFields['profile.profileVisibility'] = patch.profileVisibility;
  }
  if (patch.fieldPrivacy !== undefined) {
    setFields['profile.fieldPrivacy'] = patch.fieldPrivacy;
  }
  if (patch.dateOfBirthShare !== undefined) {
    setFields['profile.dateOfBirthShare'] = patch.dateOfBirthShare;
  }
  if (patch.friendsListShare !== undefined) {
    setFields['profile.friendsListShare'] = patch.friendsListShare;
  }
  if (patch.notificationPreferences !== undefined) {
    setFields['profile.notificationPreferences'] = patch.notificationPreferences;
  }
  if (patch.platformMasterAdmin !== undefined) {
    setFields['profile.platformMasterAdmin'] = patch.platformMasterAdmin;
  }
  if (patch.bloodGroup !== undefined) setFields['profile.bloodGroup'] = patch.bloodGroup ?? null;
  if (patch.medicalConditions !== undefined) {
    setFields['profile.medicalConditions'] = patch.medicalConditions ?? null;
  }
  if (patch.emergencyContactName !== undefined) {
    setFields['profile.emergencyContactName'] = patch.emergencyContactName ?? null;
  }
  if (patch.emergencyContactPhone !== undefined) {
    setFields['profile.emergencyContactPhone'] = patch.emergencyContactPhone ?? null;
  }
  await usersCollection().updateOne({ _id: userId }, { $set: setFields });
  invalidateAuthUserReadCache(userId);
  if (patch.displayName !== undefined || patch.givenName !== undefined || patch.surname !== undefined) {
    scheduleExploreMapCacheInvalidation('auth-users.profile_map_cache');
  }
};

export const updateAuthUserLastActive = async (userId: string): Promise<void> => {
  await usersCollection().updateOne(
    { _id: userId },
    { $set: { lastActiveAt: new Date(), updatedAt: new Date() } }
  );
};

export const updateAuthUserPassword = async (userId: string, passwordHash: string): Promise<void> => {
  invalidateAuthUserReadCache(userId);
  await usersCollection().updateOne({ _id: userId }, { $set: { passwordHash, updatedAt: new Date() } });
};

export const updateAuthUserEmailVerifiedAt = async (userId: string, verifiedAt: Date): Promise<void> => {
  await usersCollection().updateOne(
    { _id: userId },
    { $set: { emailVerifiedAt: verifiedAt, updatedAt: new Date() } }
  );
  invalidateAuthUserReadCache(userId);
};

export const updateAuthUserStatus = async (userId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<void> => {
  invalidateAuthUserReadCache(userId);
  await usersCollection().updateOne({ _id: userId }, { $set: { status, updatedAt: new Date() } });
};

export const updateAuthUserGoogleLink = async (input: {
  userId: string;
  googleId: string;
  emailVerifiedAt?: Date | null;
  lastActiveAt?: Date | null;
  profile?: Partial<AuthUserRecord['profile']>;
}): Promise<void> => {
  const setFields: Record<string, unknown> = {
    googleId: input.googleId,
    authProvider: 'GOOGLE',
    updatedAt: new Date()
  };
  if (input.emailVerifiedAt) setFields.emailVerifiedAt = input.emailVerifiedAt;
  if (input.lastActiveAt) setFields.lastActiveAt = input.lastActiveAt;
  if (input.profile) {
    if (input.profile.displayName !== undefined) setFields['profile.displayName'] = input.profile.displayName;
    if (input.profile.phone !== undefined) setFields['profile.phone'] = input.profile.phone;
    if (input.profile.bio !== undefined) setFields['profile.bio'] = input.profile.bio;
    if (input.profile.avatarUrl !== undefined) setFields['profile.avatarUrl'] = input.profile.avatarUrl;
    if (input.profile.profileVisibility !== undefined) {
      setFields['profile.profileVisibility'] = input.profile.profileVisibility;
    }
    if (input.profile.switchedFromRole !== undefined) {
      setFields['profile.switchedFromRole'] = input.profile.switchedFromRole;
    }
    if (input.profile.rewardPoints !== undefined) setFields['profile.rewardPoints'] = input.profile.rewardPoints;
    if (input.profile.membershipTier !== undefined) {
      setFields['profile.membershipTier'] = input.profile.membershipTier;
    }
  }
  await usersCollection().updateOne({ _id: input.userId }, { $set: setFields });
  invalidateAuthUserReadCache(input.userId);
};

export const updateAuthUserCore = async (input: {
  userId: string;
  email?: string;
  passwordHash?: string | null;
  googleId?: string | null;
  authProvider?: AuthUserRecord['authProvider'];
  role?: AuthUserRecord['role'];
  status?: AuthUserRecord['status'];
  emailVerifiedAt?: Date | null;
  lastActiveAt?: Date | null;
  referralCode?: string;
  profile?: Partial<AuthUserRecord['profile']>;
}): Promise<void> => {
  const setFields: Record<string, unknown> = { updatedAt: new Date() };
  const unsetFields: Record<string, 1> = {};
  if (input.email !== undefined) setFields.email = input.email;
  if (input.passwordHash !== undefined) setFields.passwordHash = input.passwordHash;
  if (input.googleId === null) unsetFields.googleId = 1;
  else if (input.googleId !== undefined) setFields.googleId = input.googleId;
  if (input.authProvider !== undefined) setFields.authProvider = input.authProvider;
  if (input.role !== undefined) setFields.role = input.role;
  if (input.status !== undefined) setFields.status = input.status;
  if (input.emailVerifiedAt !== undefined) setFields.emailVerifiedAt = input.emailVerifiedAt;
  if (input.lastActiveAt !== undefined) setFields.lastActiveAt = input.lastActiveAt;
  if (input.referralCode !== undefined) setFields.referralCode = input.referralCode;
  if (input.profile) {
    if (input.profile.displayName !== undefined) setFields['profile.displayName'] = input.profile.displayName;
    if (input.profile.phone !== undefined) setFields['profile.phone'] = input.profile.phone;
    if (input.profile.bio !== undefined) setFields['profile.bio'] = input.profile.bio;
    if (input.profile.avatarUrl !== undefined) setFields['profile.avatarUrl'] = input.profile.avatarUrl;
    if (input.profile.profileVisibility !== undefined) {
      setFields['profile.profileVisibility'] = input.profile.profileVisibility;
    }
    if (input.profile.switchedFromRole !== undefined) setFields['profile.switchedFromRole'] = input.profile.switchedFromRole;
    if (input.profile.rewardPoints !== undefined) setFields['profile.rewardPoints'] = input.profile.rewardPoints;
    if (input.profile.membershipTier !== undefined) {
      setFields['profile.membershipTier'] = input.profile.membershipTier;
    }
  }

  await usersCollection().updateOne(
    { _id: input.userId },
    {
      $set: setFields,
      ...(Object.keys(unsetFields).length > 0 ? { $unset: unsetFields } : {})
    }
  );
  invalidateAuthUserReadCache(input.userId);
  if (
    input.profile?.displayName !== undefined ||
    input.profile?.givenName !== undefined ||
    input.profile?.surname !== undefined
  ) {
    scheduleExploreMapCacheInvalidation('auth-users.core_profile_map_cache');
  }
};

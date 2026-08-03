import { ObjectId, type Collection } from 'mongodb';
import { MembershipTier } from '../domain/enums.js';
import { getMongoClient } from './mongo.js';

export type AuthUserRecord = {
  _id: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  authProvider: 'EMAIL' | 'GOOGLE';
  role: 'PLATFORM_ADMIN' | 'TENANT_OWNER' | 'TENANT_ADMIN' | 'TENANT_GUIDE' | 'VISITOR';
  status: 'ACTIVE' | 'SUSPENDED';
  emailVerifiedAt: Date | null;
  lastActiveAt: Date | null;
  referralCode: string;
  profile: {
    displayName: string | null;
    phone: string | null;
    bio: string | null;
    avatarUrl: string | null;
    rewardPoints?: number;
    membershipTier?: MembershipTier;
  };
  createdAt: Date;
  updatedAt: Date;
};

const usersCollection = (): Collection<AuthUserRecord> =>
  getMongoClient()!.db().collection<AuthUserRecord>('auth_users');

const buildUserQuery = (input: {
  role?: AuthUserRecord['role'] | AuthUserRecord['role'][];
  status?: AuthUserRecord['status'];
  search?: string;
}): Record<string, unknown> => {
  const query: Record<string, unknown> = {};
  if (input.role) query.role = Array.isArray(input.role) ? { $in: input.role } : input.role;
  if (input.status) query.status = input.status;
  if (input.search) {
    query.$or = [
      { email: { $regex: input.search, $options: 'i' } },
      { 'profile.displayName': { $regex: input.search, $options: 'i' } }
    ];
  }
  return query;
};

export const findAuthUserByEmail = async (email: string): Promise<AuthUserRecord | null> =>
  usersCollection().findOne({ email });

export const findAuthUserById = async (id: string): Promise<AuthUserRecord | null> =>
  usersCollection().findOne({ _id: id });

export const findAuthUserByGoogleId = async (googleId: string): Promise<AuthUserRecord | null> =>
  usersCollection().findOne({ googleId });

export const findAuthUserByReferralCode = async (referralCode: string): Promise<AuthUserRecord | null> =>
  usersCollection().findOne({ referralCode });

export const listAuthUsers = async (input: {
  role?: AuthUserRecord['role'] | AuthUserRecord['role'][];
  status?: AuthUserRecord['status'];
  search?: string;
  skip?: number;
  take?: number;
}): Promise<AuthUserRecord[]> =>
  usersCollection()
    .find(buildUserQuery(input))
    .sort({ createdAt: -1 })
    .skip(input.skip ?? 0)
    .limit(input.take ?? 50)
    .toArray();

export const countAuthUsers = async (input: {
  role?: AuthUserRecord['role'] | AuthUserRecord['role'][];
  status?: AuthUserRecord['status'];
  search?: string;
}): Promise<number> => usersCollection().countDocuments(buildUserQuery(input));

export const findAuthUsersByIds = async (ids: string[]): Promise<AuthUserRecord[]> => {
  if (ids.length === 0) return [];
  return usersCollection().find({ _id: { $in: ids } }).toArray();
};

export const getAuthUserMembershipTier = async (userId: string): Promise<MembershipTier> => {
  const user = await usersCollection().findOne({ _id: userId }, { projection: { profile: 1 } });
  return user?.profile?.membershipTier ?? MembershipTier.FREE;
};

export const findAuthUserForLogin = async (email: string) => findAuthUserByEmail(email);

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

  await usersCollection().insertOne({
    _id: userId,
    email: input.email,
    passwordHash: input.passwordHash,
    ...(input.googleId != null ? { googleId: input.googleId } : {}),
    authProvider: input.authProvider,
    role: input.role,
    status: input.status,
    emailVerifiedAt: input.emailVerifiedAt ?? null,
    lastActiveAt: input.lastActiveAt ?? null,
    referralCode: input.referralCode,
    profile: input.profile,
    createdAt: now,
    updatedAt: now
  });

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
  await usersCollection().updateOne(
    { _id: userId },
    {
      $set: {
        'profile.displayName': patch.displayName ?? null,
        'profile.phone': patch.phone ?? null,
        'profile.bio': patch.bio ?? null,
        'profile.avatarUrl': patch.avatarUrl ?? null,
        updatedAt: new Date()
      }
    }
  );
};

export const updateAuthUserLastActive = async (userId: string): Promise<void> => {
  await usersCollection().updateOne(
    { _id: userId },
    { $set: { lastActiveAt: new Date(), updatedAt: new Date() } }
  );
};

export const updateAuthUserPassword = async (userId: string, passwordHash: string): Promise<void> => {
  await usersCollection().updateOne({ _id: userId }, { $set: { passwordHash, updatedAt: new Date() } });
};

export const updateAuthUserEmailVerifiedAt = async (userId: string, verifiedAt: Date): Promise<void> => {
  await usersCollection().updateOne(
    { _id: userId },
    { $set: { emailVerifiedAt: verifiedAt, updatedAt: new Date() } }
  );
};

export const updateAuthUserStatus = async (userId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<void> => {
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
    setFields.profile = {
      displayName: input.profile.displayName ?? null,
      phone: input.profile.phone ?? null,
      bio: input.profile.bio ?? null,
      avatarUrl: input.profile.avatarUrl ?? null
    };
  }
  await usersCollection().updateOne({ _id: input.userId }, { $set: setFields });
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
  if (input.email !== undefined) setFields.email = input.email;
  if (input.passwordHash !== undefined) setFields.passwordHash = input.passwordHash;
  if (input.googleId !== undefined) setFields.googleId = input.googleId;
  if (input.authProvider !== undefined) setFields.authProvider = input.authProvider;
  if (input.role !== undefined) setFields.role = input.role;
  if (input.status !== undefined) setFields.status = input.status;
  if (input.emailVerifiedAt !== undefined) setFields.emailVerifiedAt = input.emailVerifiedAt;
  if (input.lastActiveAt !== undefined) setFields.lastActiveAt = input.lastActiveAt;
  if (input.referralCode !== undefined) setFields.referralCode = input.referralCode;
  if (input.profile) {
    setFields.profile = {
      displayName: input.profile.displayName ?? null,
      phone: input.profile.phone ?? null,
      bio: input.profile.bio ?? null,
      avatarUrl: input.profile.avatarUrl ?? null
    };
  }

  await usersCollection().updateOne({ _id: input.userId }, { $set: setFields });
};

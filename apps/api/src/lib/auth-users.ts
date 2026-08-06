import { ObjectId, type Collection } from 'mongodb';
import { MembershipTier } from '../domain/enums.js';
import { getMongoClient } from './mongo.js';

export type AuthUserRecord = {
  _id: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  authProvider: 'EMAIL' | 'GOOGLE';
  role: 'PLATFORM_ADMIN' | 'MERCHANT_ADMIN' | 'TENANT_OWNER' | 'TENANT_ADMIN' | 'TENANT_GUIDE' | 'VISITOR';
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

export const findAuthUserByEmail = async (email: string): Promise<AuthUserRecord | null> => {
  const row = await usersCollection().findOne({ email });
  return row ? normalizeAuthUser(row) : null;
};

export const findAuthUserById = async (id: string): Promise<AuthUserRecord | null> => {
  const row = await usersCollection().findOne({ _id: id });
  return row ? normalizeAuthUser(row) : null;
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
}): Promise<number> => usersCollection().countDocuments(buildUserQuery(input));

export const findAuthUsersByIds = async (ids: string[]): Promise<AuthUserRecord[]> => {
  if (ids.length === 0) return [];
  const rows = await usersCollection().find({ _id: { $in: ids } }).toArray();
  return rows.map(normalizeAuthUser);
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
    if (input.profile.displayName !== undefined) setFields['profile.displayName'] = input.profile.displayName;
    if (input.profile.phone !== undefined) setFields['profile.phone'] = input.profile.phone;
    if (input.profile.bio !== undefined) setFields['profile.bio'] = input.profile.bio;
    if (input.profile.avatarUrl !== undefined) setFields['profile.avatarUrl'] = input.profile.avatarUrl;
    if (input.profile.rewardPoints !== undefined) setFields['profile.rewardPoints'] = input.profile.rewardPoints;
    if (input.profile.membershipTier !== undefined) {
      setFields['profile.membershipTier'] = input.profile.membershipTier;
    }
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
};

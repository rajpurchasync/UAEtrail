import { randomUUID } from 'crypto';
import type { Collection } from 'mongodb';
import { hashToken } from './hash.js';
import { getMongoClient } from './mongo.js';

type MongoRefreshToken = {
  _id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
};

type MongoVerificationToken = {
  _id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

type MongoResetToken = {
  _id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

const refreshTokensCollection = (): Collection<MongoRefreshToken> =>
  getMongoClient()!.db().collection<MongoRefreshToken>('auth_refresh_tokens');

const verificationTokensCollection = (): Collection<MongoVerificationToken> =>
  getMongoClient()!.db().collection<MongoVerificationToken>('auth_email_verification_tokens');

const resetTokensCollection = (): Collection<MongoResetToken> =>
  getMongoClient()!.db().collection<MongoResetToken>('auth_password_reset_tokens');

export const createRefreshToken = async (input: {
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> => {
  const tokenHash = hashToken(input.token);
  await refreshTokensCollection().insertOne({
    _id: randomUUID(),
    userId: input.userId,
    tokenHash,
    expiresAt: input.expiresAt,
    revokedAt: null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    createdAt: new Date()
  });
};

export const findActiveRefreshToken = async (input: {
  userId: string;
  token: string;
}): Promise<{ id: string; userId: string; tokenHash: string } | null> => {
  const tokenHash = hashToken(input.token);
  const record = await refreshTokensCollection().findOne({
    tokenHash,
    userId: input.userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  });
  return record ? { id: record._id, userId: record.userId, tokenHash: record.tokenHash } : null;
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  const tokenHash = hashToken(token);
  await refreshTokensCollection().updateOne({ tokenHash, revokedAt: null }, { $set: { revokedAt: new Date() } });
};

export const revokeRefreshTokensByUser = async (userId: string): Promise<void> => {
  await refreshTokensCollection().updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
};

export const createEmailVerificationToken = async (input: {
  userId: string;
  token: string;
  expiresAt: Date;
}): Promise<void> => {
  const token = hashToken(input.token);
  await verificationTokensCollection().updateMany(
    { userId: input.userId, usedAt: null },
    { $set: { usedAt: new Date() } }
  );
  await verificationTokensCollection().insertOne({
    _id: randomUUID(),
    userId: input.userId,
    token,
    expiresAt: input.expiresAt,
    usedAt: null,
    createdAt: new Date()
  });
};

export const findEmailVerificationTokenForUser = async (
  userId: string,
  token: string
): Promise<{
  id: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
} | null> => {
  const tokenHash = hashToken(token);
  const record = await verificationTokensCollection().findOne({
    userId,
    token: tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() }
  });
  return record
    ? { id: record._id, userId: record.userId, expiresAt: record.expiresAt, usedAt: record.usedAt }
    : null;
};

export const useEmailVerificationToken = async (id: string): Promise<void> => {
  await verificationTokensCollection().updateOne({ _id: id }, { $set: { usedAt: new Date() } });
};

type MongoEmailChangeToken = {
  _id: string;
  userId: string;
  newEmail: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

const emailChangeTokensCollection = (): Collection<MongoEmailChangeToken> =>
  getMongoClient()!.db().collection<MongoEmailChangeToken>('auth_email_change_tokens');

export const createEmailChangeToken = async (input: {
  userId: string;
  newEmail: string;
  token: string;
  expiresAt: Date;
}): Promise<void> => {
  const token = hashToken(input.token);
  await emailChangeTokensCollection().updateMany(
    { userId: input.userId, usedAt: null },
    { $set: { usedAt: new Date() } }
  );
  await emailChangeTokensCollection().insertOne({
    _id: randomUUID(),
    userId: input.userId,
    newEmail: input.newEmail.trim().toLowerCase(),
    token,
    expiresAt: input.expiresAt,
    usedAt: null,
    createdAt: new Date()
  });
};

export const findEmailChangeTokenForUser = async (
  userId: string,
  newEmail: string,
  token: string
): Promise<{
  id: string;
  userId: string;
  newEmail: string;
  expiresAt: Date;
  usedAt: Date | null;
} | null> => {
  const tokenHash = hashToken(token);
  const record = await emailChangeTokensCollection().findOne({
    userId,
    newEmail: newEmail.trim().toLowerCase(),
    token: tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() }
  });
  return record
    ? {
        id: record._id,
        userId: record.userId,
        newEmail: record.newEmail,
        expiresAt: record.expiresAt,
        usedAt: record.usedAt
      }
    : null;
};

export const useEmailChangeToken = async (id: string): Promise<void> => {
  await emailChangeTokensCollection().updateOne({ _id: id }, { $set: { usedAt: new Date() } });
};

export const createPasswordResetToken = async (input: {
  userId: string;
  token: string;
  expiresAt: Date;
}): Promise<void> => {
  const tokenHash = hashToken(input.token);
  await resetTokensCollection().insertOne({
    _id: randomUUID(),
    userId: input.userId,
    token: tokenHash,
    expiresAt: input.expiresAt,
    usedAt: null,
    createdAt: new Date()
  });
};

export const findPasswordResetToken = async (token: string): Promise<{
  id: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
} | null> => {
  const tokenHash = hashToken(token);
  const record = await resetTokensCollection().findOne({ token: tokenHash });
  return record
    ? { id: record._id, userId: record.userId, expiresAt: record.expiresAt, usedAt: record.usedAt }
    : null;
};

export const usePasswordResetToken = async (id: string): Promise<void> => {
  await resetTokensCollection().updateOne({ _id: id }, { $set: { usedAt: new Date() } });
};

export const deleteAuthTokensByUser = async (userId: string): Promise<void> => {
  await Promise.all([
    refreshTokensCollection().deleteMany({ userId }),
    verificationTokensCollection().deleteMany({ userId }),
    emailChangeTokensCollection().deleteMany({ userId }),
    resetTokensCollection().deleteMany({ userId })
  ]);
};

import crypto from 'crypto';

export const sha256 = (value: string): string => crypto.createHash('sha256').update(value).digest('hex');

export const randomToken = (size = 32): string => crypto.randomBytes(size).toString('hex');

/** Six-digit email verification code (100000–999999). */
export const generateEmailOtp = (): string =>
  String(crypto.randomInt(100_000, 1_000_000));

/** Store only the hash of email/reset tokens in the database. */
export const hashToken = (token: string): string => sha256(token);

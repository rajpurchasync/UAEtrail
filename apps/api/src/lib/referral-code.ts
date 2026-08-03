import crypto from 'crypto';
import { findAuthUserByReferralCode } from './auth-users.js';

export const generateReferralCode = (): string =>
  crypto.randomBytes(4).toString('hex').toUpperCase();

export const createUniqueReferralCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateReferralCode();
    const existing = await findAuthUserByReferralCode(code);
    if (!existing) return code;
  }
  return crypto.randomBytes(6).toString('hex').toUpperCase();
};

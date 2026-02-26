import crypto from 'crypto';

export const sha256 = (value: string): string => crypto.createHash('sha256').update(value).digest('hex');

export const randomToken = (size = 32): string => crypto.randomBytes(size).toString('hex');

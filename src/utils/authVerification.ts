export type PendingEmailVerification = {
  requiresEmailVerification: true;
  email: string;
  expiresAt?: string;
  expiresInSeconds?: number;
  message?: string;
};

export type RegisterPendingVerification = {
  email: string;
  expiresAt?: string;
  expiresInSeconds?: number;
  message?: string;
};

export const isPendingEmailVerification = (
  value: unknown
): value is PendingEmailVerification =>
  typeof value === 'object' &&
  value !== null &&
  'requiresEmailVerification' in value &&
  (value as PendingEmailVerification).requiresEmailVerification === true;

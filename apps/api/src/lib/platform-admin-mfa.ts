import { authenticator } from '@otplib/preset-default';
import { UserRole } from '../domain/enums.js';
import { ApiError } from './api-error.js';

const readPlatformAdminMfaSecret = (): string | null => {
  const secret = process.env.PLATFORM_ADMIN_MFA_SECRET?.trim();
  return secret || null;
};

export const isPlatformAdminMfaRequired = (): boolean => readPlatformAdminMfaSecret() != null;

/** When `PLATFORM_ADMIN_MFA_SECRET` is set, platform-admin login must pass a valid TOTP. */
export const assertPlatformAdminMfaIfRequired = (input: {
  role: UserRole;
  totp?: string | null;
}): void => {
  if (input.role !== UserRole.PLATFORM_ADMIN) return;
  const secret = readPlatformAdminMfaSecret();
  if (!secret) return;
  const code = input.totp?.trim();
  if (!code) {
    throw new ApiError(401, 'admin_mfa_required', 'Enter the 6-digit authenticator code for platform admin.');
  }
  const ok = authenticator.check(code, secret);
  if (!ok) {
    throw new ApiError(401, 'admin_mfa_invalid', 'Invalid authenticator code.');
  }
};

import type { AuthResponse } from '@uaetrail/shared-types';
import { apiRequest } from '../api/client';

export type AuthOtpResendResponse = {
  expiresAt?: string;
  expiresInSeconds?: number;
  resetToken?: string;
};

export type MeProfileAuthDTO = {
  id: string;
  email: string;
  role: string;
  displayName?: string;
  avatarUrl?: string;
  switchedFromRole?: string | null;
  platformMasterAdmin?: boolean;
};

export type LoginPasswordResponse = {
  emailVerified?: boolean;
  requiresEmailVerification?: boolean;
  email?: string;
  expiresAt?: string;
  expiresInSeconds?: number;
  message?: string;
} & Partial<AuthResponse>;

export type RegisterAccountResponse = {
  email: string;
  expiresAt?: string;
  expiresInSeconds?: number;
  message?: string;
};

export const resendEmailVerification = async (email: string): Promise<AuthOtpResendResponse> => {
  return apiRequest<AuthOtpResendResponse>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const fetchMeProfileAuth = async (): Promise<MeProfileAuthDTO> => {
  const res = await apiRequest<{ data: MeProfileAuthDTO }>('/me/profile', { auth: true });
  return res.data;
};

export const loginWithPassword = async (
  email: string,
  password: string
): Promise<LoginPasswordResponse> => {
  return apiRequest<LoginPasswordResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const loginDemo = async (email: string): Promise<AuthResponse & { demoLogin?: boolean }> => {
  return apiRequest<AuthResponse & { emailVerified?: boolean; demoLogin?: boolean }>(
    '/auth/demo-login',
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    }
  );
};

export type DemoLoginCatalogAccount = {
  email: string;
  displayName: string;
  role: string;
  roleLabel: string;
};

export const fetchDemoLoginCatalog = async (): Promise<DemoLoginCatalogAccount[]> => {
  try {
    const res = await apiRequest<{ accounts: DemoLoginCatalogAccount[] }>('/auth/demo-login-catalog');
    return res.accounts ?? [];
  } catch {
    return [];
  }
};

export const verifyEmailOtp = async (
  email: string,
  otp: string
): Promise<AuthResponse & { message?: string; emailVerified?: boolean }> => {
  return apiRequest<AuthResponse & { message?: string; emailVerified?: boolean }>(
    '/auth/verify-email',
    {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }
  );
};

export const registerAccount = async (payload: {
  email: string;
  password: string;
  givenName: string;
  surname: string;
  accountType: 'participant' | 'company' | 'guide';
  organizationName?: string;
  referralCode?: string;
  groupInviteToken?: string;
}): Promise<RegisterAccountResponse> => {
  return apiRequest<RegisterAccountResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const loginWithGoogle = async (
  idToken: string,
  referralCode?: string,
  groupInviteToken?: string
): Promise<AuthResponse & { isNewUser?: boolean; emailVerified?: boolean }> => {
  return apiRequest<AuthResponse & { isNewUser?: boolean; emailVerified?: boolean }>(
    '/auth/google',
    {
      method: 'POST',
      body: JSON.stringify({ idToken, referralCode, groupInviteToken }),
    }
  );
};

export const logoutAuth = async (): Promise<void> => {
  await apiRequest('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
};

import { AuthResponse, AuthUser } from '@uaetrail/shared-types';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, getStoredSession, setStoredSession, setSessionInvalidatedHandler, USER_STORAGE_KEY } from '../api/client';
import {
  PendingEmailVerification,
  RegisterPendingVerification
} from '../utils/authVerification';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser | PendingEmailVerification>;
  signInDemo: (email: string) => Promise<AuthUser>;
  signInWithGoogle: (idToken: string, referralCode?: string, groupInviteToken?: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    displayName: string;
    accountType: 'visitor' | 'company' | 'guide';
    organizationName?: string;
    referralCode?: string;
    groupInviteToken?: string;
  }) => Promise<RegisterPendingVerification>;
  verifyEmail: (email: string, otp: string) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getStoredUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

const setStoredUser = (user: AuthUser | null): void => {
  if (!user) {
    localStorage.removeItem(USER_STORAGE_KEY);
    return;
  }
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(() => !!getStoredSession());

  // Revalidate stored session on mount; clear stale user if session is missing
  useEffect(() => {
    setSessionInvalidatedHandler(() => {
      setStoredUser(null);
      setUser(null);
      const path = window.location.pathname;
      if (!path.startsWith('/signin') && !path.startsWith('/signup') && !path.startsWith('/verify')) {
        window.location.assign('/signin?session=expired');
      }
    });

    const session = getStoredSession();
    if (!session?.accessToken) {
      if (getStoredUser()) {
        setStoredUser(null);
        setUser(null);
      }
      setInitializing(false);
      return () => setSessionInvalidatedHandler(null);
    }

    apiRequest<{ data: { id: string; email: string; role: string; displayName?: string; avatarUrl?: string; switchedFromRole?: string | null } }>('/me/profile', { auth: true })
      .then((res) => {
        const profile = res.data;
        const revalidatedUser: AuthUser = {
          id: profile.id,
          email: profile.email,
          role: profile.role as AuthUser['role'],
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          switchedFromRole: profile.switchedFromRole ?? null,
        };
        setStoredUser(revalidatedUser);
        setUser(revalidatedUser);
      })
      .catch(() => {
        // Token invalid — clear everything
        setStoredSession(null);
        setStoredUser(null);
        setUser(null);
      })
      .finally(() => {
        setInitializing(false);
      });

    return () => setSessionInvalidatedHandler(null);
  }, []);

  const hydrateUserFromProfile = async (fallback: AuthUser): Promise<AuthUser> => {
    try {
      const res = await apiRequest<{ data: { displayName?: string; avatarUrl?: string; switchedFromRole?: string | null } }>('/me/profile', { auth: true });
      const profile = res.data;
      // Role comes from the login response (token), not the profile endpoint — avoids stale DB reads
      return {
        ...fallback,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        switchedFromRole: profile.switchedFromRole ?? null,
      };
    } catch {
      return fallback;
    }
  };

  const applyAuthResponse = async (response: AuthResponse): Promise<AuthUser> => {
    setStoredSession(response.tokens);
    const hydrated = await hydrateUserFromProfile(response.user);
    setStoredUser(hydrated);
    setUser(hydrated);
    return hydrated;
  };

  const signIn = async (email: string, password: string): Promise<AuthUser | PendingEmailVerification> => {
    setLoading(true);
    try {
      const response = await apiRequest<{
          emailVerified?: boolean;
          requiresEmailVerification?: boolean;
          email?: string;
          expiresAt?: string;
          expiresInSeconds?: number;
          message?: string;
        } & Partial<AuthResponse>
      >('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.requiresEmailVerification) {
        return {
          requiresEmailVerification: true,
          email: response.email ?? email,
          expiresAt: response.expiresAt,
          expiresInSeconds: response.expiresInSeconds,
          message: response.message
        };
      }

      if (!response.user || !response.tokens) {
        throw new Error('Sign in failed. Please try again.');
      }

      return await applyAuthResponse(response as AuthResponse);
    } finally {
      setLoading(false);
    }
  };

  const signInDemo = async (email: string): Promise<AuthUser> => {
    setLoading(true);
    try {
      const response = await apiRequest<AuthResponse & { emailVerified?: boolean; demoLogin?: boolean }>('/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      return await applyAuthResponse(response);
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (email: string, otp: string): Promise<AuthUser> => {
    setLoading(true);
    try {
      const response = await apiRequest<AuthResponse & { message?: string; emailVerified?: boolean }>(
        '/auth/verify-email',
        {
          method: 'POST',
          body: JSON.stringify({ email, otp })
        }
      );
      return await applyAuthResponse(response);
    } finally {
      setLoading(false);
    }
  };

  const register = async ({
    email,
    password,
    displayName,
    accountType,
    organizationName,
    referralCode,
    groupInviteToken
  }: {
    email: string;
    password: string;
    displayName: string;
    accountType: 'visitor' | 'company' | 'guide';
    organizationName?: string;
    referralCode?: string;
    groupInviteToken?: string;
  }): Promise<RegisterPendingVerification> => {
    setLoading(true);
    try {
      const response = await apiRequest<{
        email: string;
        expiresAt?: string;
        expiresInSeconds?: number;
        message?: string;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          displayName,
          accountType,
          organizationName,
          referralCode,
          groupInviteToken
        })
      });

      return {
        email: response.email,
        expiresAt: response.expiresAt,
        expiresInSeconds: response.expiresInSeconds,
        message: response.message
      };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (idToken: string, referralCode?: string, groupInviteToken?: string): Promise<AuthUser> => {
    setLoading(true);
    try {
      const response = await apiRequest<AuthResponse & { isNewUser?: boolean; emailVerified?: boolean }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken, referralCode, groupInviteToken })
      });
      setStoredSession(response.tokens);
      const hydrated = await hydrateUserFromProfile(response.user);
      setStoredUser(hydrated);
      setUser(hydrated);
      return hydrated;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    await apiRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({})
    }).catch(() => undefined);
    setStoredSession(null);
    setStoredUser(null);
    setUser(null);
    if (window.location.pathname !== '/') {
      window.location.replace('/');
    }
  };

  const refreshUser = async (): Promise<void> => {
    const session = getStoredSession();
    if (!session?.accessToken) return;
    const res = await apiRequest<{
      data: { id: string; email: string; role: string; displayName?: string; avatarUrl?: string };
    }>('/me/profile', { auth: true });
    const profile = res.data;
    const next: AuthUser = {
      id: profile.id,
      email: profile.email,
      role: profile.role as AuthUser['role'],
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      switchedFromRole: (profile as { switchedFromRole?: string | null }).switchedFromRole ?? null,
    };
    setStoredUser(next);
    setUser(next);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      initializing,
      signIn,
      signInDemo,
      signInWithGoogle,
      signOut,
      refreshUser,
      register,
      verifyEmail,
    }),
    [user, loading, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};

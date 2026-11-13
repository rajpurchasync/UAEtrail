import { AuthResponse, AuthUser } from '@uaetrail/shared-types';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { bootstrapSessionFromRefresh, getStoredSession, setStoredSession, setSessionInvalidatedHandler, USER_STORAGE_KEY } from '../api/client';
import {
  fetchMeProfileAuth,
  loginDemo,
  loginWithGoogle,
  loginWithPassword,
  logoutAuth,
  registerAccount,
  verifyEmailOtp,
} from '../hooks/accountAuthClientApi';
import { sessionExpiredLandingPath, signedOutLandingPath } from '../utils/authSessionLanding';
import {
  applyDisplayPreferences,
  applySignedOutTheme,
  clearGuestDisplayPreferences,
} from '../preferences/displayPreferences';
import { resolveMemberDisplayName } from '@uaetrail/shared-types';
import {
  PendingEmailVerification,
  RegisterPendingVerification
} from '../utils/authVerification';

const withCleanMemberDisplayName = (user: AuthUser): AuthUser => ({
  ...user,
  displayName: resolveMemberDisplayName({
    displayName: user.displayName,
    email: user.email,
  }),
});

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
    givenName: string;
    surname: string;
    accountType: 'participant' | 'company' | 'guide';
    hostName?: string;
    referralCode?: string;
    groupInviteToken?: string;
  }) => Promise<RegisterPendingVerification>;
  verifyEmail: (email: string, otp: string) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const parseStoredUser = (raw: string): AuthUser | null => {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.id !== 'string' || typeof parsed.email !== 'string' || typeof parsed.role !== 'string') {
      return null;
    }

    const base: AuthUser = {
      id: parsed.id,
      email: parsed.email,
      role: parsed.role as AuthUser['role'],
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName : undefined,
      avatarUrl: typeof parsed.avatarUrl === 'string' ? parsed.avatarUrl : undefined,
      switchedFromRole: typeof parsed.switchedFromRole === 'string' ? parsed.switchedFromRole : null,
      platformMasterAdmin: parsed.platformMasterAdmin === true,
    };
    return withCleanMemberDisplayName(base);
  } catch {
    return null;
  }
};

const getStoredUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  return parseStoredUser(raw);
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
  const [initializing, setInitializing] = useState(() => !!getStoredUser());

  // Revalidate stored profile on mount; access token lives in memory + refresh cookie only
  useEffect(() => {
    setSessionInvalidatedHandler(() => {
      setStoredUser(null);
      setUser(null);
      const path = window.location.pathname;
      if (!path.startsWith('/signin') && !path.startsWith('/signup') && !path.startsWith('/verify')) {
        const next = sessionExpiredLandingPath();
        if (`${path}${window.location.search}` !== next) {
          window.location.assign(next);
        }
      }
    });

    const storedUser = getStoredUser();
    if (!storedUser) {
      setInitializing(false);
      return () => setSessionInvalidatedHandler(null);
    }

    void bootstrapSessionFromRefresh()
      .then((session) => {
        if (!session?.accessToken) {
          // No access token yet (API blip) — keep cached user; do not sign out.
          // Next authenticated call will retry refresh. Only wipe when refresh returns unauthorized.
          return null;
        }
        return fetchMeProfileAuth();
      })
      .then((profile) => {
        if (!profile) return;
        const revalidatedUser = withCleanMemberDisplayName({
          id: profile.id,
          email: profile.email,
          role: profile.role as AuthUser['role'],
          displayName: typeof profile.displayName === 'string' ? profile.displayName : undefined,
          avatarUrl: typeof profile.avatarUrl === 'string' ? profile.avatarUrl : undefined,
          switchedFromRole: profile.switchedFromRole ?? null,
          platformMasterAdmin: profile.platformMasterAdmin === true,
        });
        setStoredUser(revalidatedUser);
        setUser(revalidatedUser);
        clearGuestDisplayPreferences();
        applyDisplayPreferences();
      })
      .catch(() => {
        // Profile fetch failed after a successful refresh — keep cached user; avoid forced logout.
      })
      .finally(() => {
        setInitializing(false);
      });

    return () => setSessionInvalidatedHandler(null);
  }, []);

  const hydrateUserFromProfile = useCallback(async (fallback: AuthUser): Promise<AuthUser> => {
    try {
      const profile = await fetchMeProfileAuth();
      // Role comes from the login response (token), not the profile endpoint — avoids stale DB reads
      return withCleanMemberDisplayName({
        ...fallback,
        displayName: typeof profile.displayName === 'string' ? profile.displayName : fallback.displayName,
        avatarUrl: typeof profile.avatarUrl === 'string' ? profile.avatarUrl : undefined,
        switchedFromRole: profile.switchedFromRole ?? null,
        platformMasterAdmin: profile.platformMasterAdmin === true,
      });
    } catch {
      return withCleanMemberDisplayName(fallback);
    }
  }, []);

  const applyAuthResponse = useCallback(async (response: AuthResponse): Promise<AuthUser> => {
    setStoredSession(response.tokens);
    const hydrated = await hydrateUserFromProfile(response.user);
    setStoredUser(hydrated);
    setUser(hydrated);
    clearGuestDisplayPreferences();
    applyDisplayPreferences();
    return hydrated;
  }, [hydrateUserFromProfile]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthUser | PendingEmailVerification> => {
    setLoading(true);
    try {
      const response = await loginWithPassword(email, password);

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
  }, [applyAuthResponse]);

  const signInDemo = useCallback(async (email: string): Promise<AuthUser> => {
    setLoading(true);
    try {
      const response = await loginDemo(email);
      return await applyAuthResponse(response);
    } finally {
      setLoading(false);
    }
  }, [applyAuthResponse]);

  const verifyEmail = useCallback(async (email: string, otp: string): Promise<AuthUser> => {
    setLoading(true);
    try {
      const response = await verifyEmailOtp(email, otp);
      return await applyAuthResponse(response);
    } finally {
      setLoading(false);
    }
  }, [applyAuthResponse]);

  const register = async ({
    email,
    password,
    givenName,
    surname,
    accountType,
    hostName,
    referralCode,
    groupInviteToken
  }: {
    email: string;
    password: string;
    givenName: string;
    surname: string;
    accountType: 'participant' | 'company' | 'guide';
    /** Display name for agency/shop host profile at signup. Wire: `organizationName`. */
    hostName?: string;
    referralCode?: string;
    groupInviteToken?: string;
  }): Promise<RegisterPendingVerification> => {
    setLoading(true);
    try {
      const response = await registerAccount({
        email,
        password,
        givenName,
        surname,
        accountType,
        organizationName: hostName,
        referralCode,
        groupInviteToken,
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

  const signInWithGoogle = useCallback(
    async (idToken: string, referralCode?: string, groupInviteToken?: string): Promise<AuthUser> => {
      setLoading(true);
      try {
        const response = await loginWithGoogle(idToken, referralCode, groupInviteToken);
        setStoredSession(response.tokens);
        const hydrated = await hydrateUserFromProfile(response.user);
        setStoredUser(hydrated);
        setUser(hydrated);
        return hydrated;
      } finally {
        setLoading(false);
      }
    },
    [hydrateUserFromProfile]
  );

  const signOut = async (): Promise<void> => {
    await logoutAuth().catch(() => undefined);
    setStoredSession(null);
    setStoredUser(null);
    setUser(null);
    applySignedOutTheme();
    const next = signedOutLandingPath();
    if (`${window.location.pathname}${window.location.search}` !== next) {
      window.location.replace(next);
    }
  };

  const refreshUser = async (): Promise<void> => {
    const session = getStoredSession();
    if (!session?.accessToken) return;
    const profile = await fetchMeProfileAuth();
    const next = withCleanMemberDisplayName({
      id: profile.id,
      email: profile.email,
      role: profile.role as AuthUser['role'],
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      switchedFromRole: profile.switchedFromRole ?? null,
      platformMasterAdmin: profile.platformMasterAdmin === true,
    });
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
    [user, loading, initializing, signIn, signInDemo, signInWithGoogle, verifyEmail]
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

import { AuthResponse, AuthUser } from '@uaetrail/shared-types';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, getStoredSession, setStoredSession, setSessionInvalidatedHandler, USER_STORAGE_KEY } from '../api/client';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signInWithGoogle: (idToken: string, referralCode?: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    displayName: string;
    accountType: 'visitor' | 'company' | 'guide';
    organizationName?: string;
    referralCode?: string;
  }) => Promise<{ verificationToken?: string }>;
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

    apiRequest<{ data: { id: string; email: string; role: string; displayName?: string; avatarUrl?: string } }>('/me/profile', { auth: true })
      .then((res) => {
        const profile = res.data;
        const revalidatedUser: AuthUser = {
          id: profile.id,
          email: profile.email,
          role: profile.role as AuthUser['role'],
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl
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

  const signIn = async (email: string, password: string): Promise<AuthUser> => {
    setLoading(true);
    try {
      const response = await apiRequest<AuthResponse & { emailVerified?: boolean }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setStoredSession(response.tokens);
      setStoredUser(response.user);
      setUser(response.user);
      return response.user;
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
    referralCode
  }: {
    email: string;
    password: string;
    displayName: string;
    accountType: 'visitor' | 'company' | 'guide';
    organizationName?: string;
    referralCode?: string;
  }): Promise<{ verificationToken?: string }> => {
    setLoading(true);
    try {
      const response = await apiRequest<AuthResponse & { verificationToken?: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          displayName,
          accountType,
          organizationName,
          referralCode
        })
      });
      setStoredSession(response.tokens);
      setStoredUser(response.user);
      setUser(response.user);
      return { verificationToken: response.verificationToken };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (idToken: string, referralCode?: string): Promise<AuthUser> => {
    setLoading(true);
    try {
      const response = await apiRequest<AuthResponse & { isNewUser?: boolean; emailVerified?: boolean }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken, referralCode })
      });
      setStoredSession(response.tokens);
      setStoredUser(response.user);
      setUser(response.user);
      return response.user;
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
      signInWithGoogle,
      signOut,
      refreshUser,
      register,
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

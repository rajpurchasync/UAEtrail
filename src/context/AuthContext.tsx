import { AuthResponse, AuthUser } from '@uaetrail/shared-types';
import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { apiRequest, getStoredSession, setStoredSession, USER_STORAGE_KEY } from '../api/client';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    displayName: string;
    accountType: 'visitor' | 'company' | 'guide';
    organizationName?: string;
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
    organizationName
  }: {
    email: string;
    password: string;
    displayName: string;
    accountType: 'visitor' | 'company' | 'guide';
    organizationName?: string;
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
          organizationName
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

  const signOut = async (): Promise<void> => {
    const session = getStoredSession();
    if (session?.refreshToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: session.refreshToken })
      }).catch(() => undefined);
    }
    setStoredSession(null);
    setStoredUser(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signOut,
      register
    }),
    [user, loading]
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

import { ApiError } from '@uaetrail/shared-types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
}

export const SESSION_STORAGE_KEY = 'uaetrail_session';
export const USER_STORAGE_KEY = 'uaetrail_user';

export const getStoredSession = (): AuthSession | null => {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

export const setStoredSession = (session: AuthSession | null): void => {
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

// ─── Token Refresh Logic ─────────────────────────────────────────────────────

let refreshPromise: Promise<AuthSession | null> | null = null;

const attemptTokenRefresh = async (): Promise<AuthSession | null> => {
  const session = getStoredSession();
  if (!session?.refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken })
    });

    if (!response.ok) {
      // Refresh failed — clear session
      setStoredSession(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }

    const data = await response.json() as { tokens: AuthSession };
    setStoredSession(data.tokens);
    return data.tokens;
  } catch {
    return null;
  }
};

/**
 * Ensures only one refresh request runs at a time.
 * Concurrent 401s queue behind the same promise.
 */
const refreshToken = (): Promise<AuthSession | null> => {
  if (!refreshPromise) {
    refreshPromise = attemptTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

// ─── API Request ──────────────────────────────────────────────────────────────

export const apiRequest = async <T>(path: string, init?: RequestInit & { auth?: boolean }): Promise<T> => {
  const makeRequest = async (token?: string): Promise<Response> => {
    const headers = new Headers(init?.headers);
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    } else if (init?.auth) {
      const session = getStoredSession();
      if (session?.accessToken) {
        headers.set('Authorization', `Bearer ${session.accessToken}`);
      }
    }

    return fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers
    });
  };

  let response: Response;
  try {
    response = await makeRequest();
  } catch {
    throw new Error(
      `Failed to reach API at ${API_BASE_URL}. Start backend on port 4000 and allow your frontend origin in CORS.`
    );
  }

  // If 401 and we have auth, attempt token refresh and retry once
  if (response.status === 401 && init?.auth) {
    const newSession = await refreshToken();
    if (newSession) {
      try {
        response = await makeRequest(newSession.accessToken);
      } catch {
        throw new Error(`Failed to reach API at ${API_BASE_URL}.`);
      }
    }
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: ApiError } | null;
    const message = body?.error?.message ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

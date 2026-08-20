import { ApiError } from '@uaetrail/shared-types';
import { formatEnvironmentUrl, rewriteEnvironmentUrls } from '../utils/formatEnvironmentUrl';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export { API_BASE_URL };

export interface AuthSession {
  accessToken: string;
}

export const SESSION_STORAGE_KEY = 'uaetrail_session';
export const USER_STORAGE_KEY = 'uaetrail_user';

let onSessionInvalidated: (() => void) | null = null;

/** Register a handler when refresh fails and stored session is cleared. */
export const setSessionInvalidatedHandler = (handler: (() => void) | null): void => {
  onSessionInvalidated = handler;
};

const notifySessionInvalidated = (): void => {
  onSessionInvalidated?.();
};

export const getStoredSession = (): AuthSession | null => {
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY) ?? localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { accessToken?: string; refreshToken?: string };
    if (!parsed.accessToken) return null;
    return { accessToken: parsed.accessToken };
  } catch {
    return null;
  }
};

export const setStoredSession = (session: AuthSession | null): void => {
  // Persist auth on web until explicit sign-out; keep cleanup for legacy sessionStorage.
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

// ─── Token Refresh Logic ─────────────────────────────────────────────────────

let refreshPromise: Promise<AuthSession | null> | null = null;

const attemptTokenRefresh = async (): Promise<AuthSession | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) {
      setStoredSession(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      notifySessionInvalidated();
      return null;
    }

    const data = (await response.json()) as { tokens: AuthSession };
    setStoredSession(data.tokens);
    return data.tokens;
  } catch {
    setStoredSession(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    notifySessionInvalidated();
    return null;
  }
};

/**
 * Ensures only one refresh request runs at a time.
 * Concurrent 401s queue behind the same promise.
 */
const refreshAccessToken = (): Promise<AuthSession | null> => {
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

    return fetch(formatEnvironmentUrl(`${API_BASE_URL}${path}`), {
      ...init,
      credentials: 'include',
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

  if (response.status === 401 && init?.auth) {
    const newSession = await refreshAccessToken();
    if (!newSession) {
      throw new Error('Session expired. Please sign in again.');
    }
    try {
      response = await makeRequest(newSession.accessToken);
    } catch {
      throw new Error(`Failed to reach API at ${API_BASE_URL}.`);
    }
    if (response.status === 401) {
      setStoredSession(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      notifySessionInvalidated();
      throw new Error('Session expired. Please sign in again.');
    }
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: ApiError } | null;
    const message = body?.error?.message ?? `Request failed with status ${response.status}`;
    const error = new Error(message) as Error & { status: number; code?: string };
    error.status = response.status;
    error.code = body?.error?.code;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return rewriteEnvironmentUrls(await response.json()) as T;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

/** Download a file with auth (GPX, PDF, etc.). Retries once after token refresh on 401. */
export const downloadAuthenticatedFile = async (path: string): Promise<{ blob: Blob; filename: string }> => {
  const makeRequest = async (token?: string): Promise<Response> => {
    const headers: Record<string, string> = {};
    const accessToken = token ?? getStoredSession()?.accessToken;
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    return fetch(formatEnvironmentUrl(`${API_BASE}${path}`), { credentials: 'include', headers });
  };

  let response = await makeRequest();

  if (response.status === 401) {
    const newSession = await refreshAccessToken();
    if (!newSession) {
      throw new Error('Session expired. Please sign in again.');
    }
    response = await makeRequest(newSession.accessToken);
    if (response.status === 401) {
      setStoredSession(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      notifySessionInvalidated();
      throw new Error('Session expired. Please sign in again.');
    }
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: ApiError } | null;
    throw new Error(body?.error?.message ?? `Download failed (${response.status})`);
  }

  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? 'download';
  const blob = await response.blob();
  return { blob, filename };
};

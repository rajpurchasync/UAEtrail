import { ApiError } from '@uaetrail/shared-types';
import { formatEnvironmentUrl, rewriteEnvironmentUrls } from '../utils/formatEnvironmentUrl';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export { API_BASE_URL };

interface AuthSession {
  accessToken: string;
}

const SESSION_STORAGE_KEY = 'uaetrail_session';
export const USER_STORAGE_KEY = 'uaetrail_user';

/** In-memory access token only — refresh cookie rehydrates on load (see bootstrapSessionFromRefresh). */
let memoryAccessToken: string | null = null;

if (typeof localStorage !== 'undefined') {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
if (typeof sessionStorage !== 'undefined') {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

let onSessionInvalidated: (() => void) | null = null;

/** Register a handler when refresh fails and stored session is cleared. */
export const setSessionInvalidatedHandler = (handler: (() => void) | null): void => {
  onSessionInvalidated = handler;
};

const notifySessionInvalidated = (): void => {
  onSessionInvalidated?.();
};

export const getStoredSession = (): AuthSession | null => {
  if (!memoryAccessToken) return null;
  return { accessToken: memoryAccessToken };
};

export const setStoredSession = (session: AuthSession | null): void => {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(SESSION_STORAGE_KEY);
  memoryAccessToken = session?.accessToken ?? null;
};

/** Restore session after full page load using the httpOnly refresh cookie. */
export const bootstrapSessionFromRefresh = (): Promise<AuthSession | null> => refreshAccessToken();

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
    const body = (await response.json().catch(() => null)) as {
      error?: ApiError & { details?: { issues?: Array<{ path: (string | number)[]; message: string }> } };
    } | null;
    let message = body?.error?.message ?? `Request failed with status ${response.status}`;
    if (body?.error?.code === 'validation_error' && body.error.details?.issues?.length) {
      const first = body.error.details.issues[0];
      const field = first.path?.length ? first.path.join('.') : 'field';
      message = `${message} (${field}: ${first.message})`;
    }
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

export type ConditionalBody<T> =
  | { notModified: true; etag: string | null }
  | { notModified: false; etag: string | null; body: T };

/** GET that can return 304 when `If-None-Match` still matches. Does not use the HTTP cache. */
export const apiRequestConditional = async <T>(
  path: string,
  init?: { auth?: boolean; etag?: string | null }
): Promise<ConditionalBody<T>> => {
  const send = async (token?: string): Promise<Response> => {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    if (init?.etag) headers.set('If-None-Match', init.etag);
    const accessToken = token ?? (init?.auth ? getStoredSession()?.accessToken : undefined);
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    return fetch(formatEnvironmentUrl(`${API_BASE_URL}${path}`), {
      credentials: 'include',
      cache: 'no-store',
      headers,
    });
  };

  let response: Response;
  try {
    response = await send();
  } catch {
    throw new Error(
      `Failed to reach API at ${API_BASE_URL}. Start backend on port 4000 and allow your frontend origin in CORS.`
    );
  }

  if (response.status === 401 && init?.auth) {
    const newSession = await refreshAccessToken();
    if (!newSession) throw new Error('Session expired. Please sign in again.');
    try {
      response = await send(newSession.accessToken);
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

  if (response.status === 304) {
    return { notModified: true, etag: response.headers.get('ETag') ?? init?.etag ?? null };
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: ApiError } | null;
    const error = new Error(body?.error?.message ?? `Request failed with status ${response.status}`) as Error & {
      status: number;
      code?: string;
    };
    error.status = response.status;
    error.code = body?.error?.code;
    throw error;
  }

  return {
    notModified: false,
    etag: response.headers.get('ETag'),
    body: rewriteEnvironmentUrls(await response.json()) as T,
  };
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

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

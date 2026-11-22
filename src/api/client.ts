import { ApiError } from '@uaetrail/shared-types';
import { formatEnvironmentUrl, rewriteEnvironmentUrls } from '../utils/formatEnvironmentUrl';
import {
  refreshFailureShouldInvalidateSession,
  runTokenRefreshWithRetry,
  type AuthSessionTokens,
  type TokenRefreshOutcome,
} from './authSessionRefresh';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export { API_BASE_URL };

interface AuthSession {
  accessToken: string;
}

const SESSION_STORAGE_KEY = 'uaetrail_session';
export const USER_STORAGE_KEY = 'uaetrail_user';

/** Thrown when refresh cannot reach a healthy API — session cookie is preserved. */
export class ApiTransientUnavailableError extends Error {
  constructor(message = 'API temporarily unavailable. Please try again.') {
    super(message);
    this.name = 'ApiTransientUnavailableError';
  }
}

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

const clearLocalSession = (): void => {
  setStoredSession(null);
  localStorage.removeItem(USER_STORAGE_KEY);
  notifySessionInvalidated();
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

const fetchRefreshOutcome = async (): Promise<TokenRefreshOutcome> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (response.ok) {
      const data = (await response.json()) as { tokens: AuthSessionTokens };
      setStoredSession(data.tokens);
      return { status: 'ok', session: data.tokens };
    }

    if (refreshFailureShouldInvalidateSession(response.status)) {
      return { status: 'unauthorized' };
    }
    return { status: 'transient' };
  } catch {
    return { status: 'transient' };
  }
};

let refreshPromise: Promise<AuthSession | null> | null = null;

/**
 * Ensures only one refresh request runs at a time.
 * Concurrent 401s queue behind the same promise.
 * Network / 5xx during API restart → throws {@link ApiTransientUnavailableError} (keeps cookie).
 * Real 401/403 from refresh → clears session and returns null.
 */
const refreshAccessToken = (): Promise<AuthSession | null> => {
  if (!refreshPromise) {
    refreshPromise = runTokenRefreshWithRetry(fetchRefreshOutcome)
      .then((outcome) => {
        if (outcome.status === 'ok') return outcome.session;
        if (outcome.status === 'unauthorized') {
          clearLocalSession();
          return null;
        }
        throw new ApiTransientUnavailableError();
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

/**
 * Restore session after full page load using the httpOnly refresh cookie.
 * Transient API downtime does not wipe the stored user / refresh cookie.
 */
export const bootstrapSessionFromRefresh = async (): Promise<AuthSession | null> => {
  try {
    return await refreshAccessToken();
  } catch (err) {
    if (err instanceof ApiTransientUnavailableError) {
      return getStoredSession();
    }
    throw err;
  }
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
      clearLocalSession();
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
      clearLocalSession();
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
      clearLocalSession();
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

/** POST raw body (e.g. image bytes). Optional auth attaches Bearer + refresh on 401. */
export const postAuthenticatedBlob = async (
  path: string,
  body: Blob,
  init?: { contentType?: string; auth?: boolean; signal?: AbortSignal }
): Promise<Blob> => {
  const makeRequest = async (token?: string): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (init?.contentType) headers['Content-Type'] = init.contentType;
    const accessToken = token ?? (init?.auth ? getStoredSession()?.accessToken : undefined);
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return fetch(formatEnvironmentUrl(`${API_BASE}${path}`), {
      method: 'POST',
      credentials: 'include',
      headers,
      body,
      signal: init?.signal,
    });
  };

  let response = await makeRequest();

  if (response.status === 401 && init?.auth) {
    const newSession = await refreshAccessToken();
    if (!newSession) {
      throw new Error('Session expired. Please sign in again.');
    }
    response = await makeRequest(newSession.accessToken);
    if (response.status === 401) {
      clearLocalSession();
      throw new Error('Session expired. Please sign in again.');
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = (await response.json()) as { error?: { message?: string } };
      if (payload.error?.message) message = payload.error.message;
    } catch {
      /* non-JSON error body */
    }
    if (response.status === 401 || response.status === 403) {
      message = 'Sign in to upload photos, then try again.';
    }
    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error('Empty response body');
  }
  return blob;
};

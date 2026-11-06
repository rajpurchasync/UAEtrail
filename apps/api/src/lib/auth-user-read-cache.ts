import type { AuthUserRecord } from './auth-users-store.js';

const AUTH_USER_CACHE_MS = 8_000;

type CacheEntry = { expiresAt: number; user: AuthUserRecord | null };

const byId = new Map<string, CacheEntry>();

export const readCachedAuthUserById = (id: string, now = Date.now()): AuthUserRecord | null | undefined => {
  const hit = byId.get(id);
  if (!hit || hit.expiresAt <= now) return undefined;
  return hit.user;
};

export const writeCachedAuthUserById = (id: string, user: AuthUserRecord | null, now = Date.now()): void => {
  byId.set(id, { expiresAt: now + AUTH_USER_CACHE_MS, user });
};

export const invalidateAuthUserReadCache = (id?: string): void => {
  if (id) {
    byId.delete(id);
    return;
  }
  byId.clear();
};

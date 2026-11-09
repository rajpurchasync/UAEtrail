import {
  JOINED_TRIP_CACHE,
  JOINED_TRIP_MAX_BYTES,
  JOINED_TRIP_SW_PATH,
  JOINED_TRIP_SW_SCOPE,
  joinedTripCacheUrls,
} from './joinedTripCache';

const isLoopback = (hostname: string): boolean =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';

export const unregisterJoinedTripServiceWorker = async (): Promise<void> => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((reg) => {
        const src = reg.active?.scriptURL ?? reg.installing?.scriptURL ?? reg.waiting?.scriptURL ?? '';
        return src.endsWith(JOINED_TRIP_SW_PATH) || reg.scope.includes('/plan/');
      })
      .map((reg) => reg.unregister())
  );
};

export const registerJoinedTripServiceWorker = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (isLoopback(window.location.hostname) || !window.isSecureContext) return;
  await navigator.serviceWorker.register(JOINED_TRIP_SW_PATH, {
    scope: JOINED_TRIP_SW_SCOPE,
    updateViaCache: 'none',
  });
};

export const precacheJoinedTrip = async (activityId: string): Promise<void> => {
  if (typeof window === 'undefined' || !activityId || typeof caches === 'undefined') return;
  const urls = joinedTripCacheUrls(activityId);
  const cache = await caches.open(JOINED_TRIP_CACHE);
  let used = 0;
  for (const url of urls) {
    try {
      const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
      if (!res.ok) continue;
      const clone = res.clone();
      const buf = await clone.arrayBuffer();
      used += buf.byteLength;
      if (used > JOINED_TRIP_MAX_BYTES) break;
      await cache.put(url, res);
    } catch {
      /* ignore single URL */
    }
  }
  const reg = await navigator.serviceWorker.getRegistration(JOINED_TRIP_SW_SCOPE);
  reg?.active?.postMessage({ type: 'JOINED_TRIP_URLS', urls });
};

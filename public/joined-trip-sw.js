/**
 * Scoped joined-trip SW. Precaches only allowlisted activity shell + private JSON.
 * Must not cache all of /api. Unregister-safe (activate deletes unknown caches).
 */
const CACHE = 'uaetrail-joined-trip-v1';
const MAX_BYTES = 2 * 1024 * 1024;
let allow = new Set();

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'JOINED_TRIP_URLS' || !Array.isArray(data.urls)) return;
  allow = new Set(data.urls);
});

const pathAllowed = (url) => {
  try {
    const u = new URL(url);
    if (u.origin !== self.location.origin) return false;
    if (allow.has(u.pathname) || allow.has(`${u.pathname}${u.search}`)) return true;
    for (const item of allow) {
      if (u.pathname === item || url.endsWith(item)) return true;
    }
    return false;
  } catch {
    return false;
  }
};

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;
  if (!pathAllowed(url)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(event.request);
      if (hit) return hit;
      const res = await fetch(event.request);
      if (res.ok) {
        const clone = res.clone();
        const buf = await clone.arrayBuffer();
        if (buf.byteLength <= MAX_BYTES) {
          await cache.put(event.request, res.clone());
        }
      }
      return res;
    })()
  );
});

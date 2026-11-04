/* eslint-disable no-restricted-globals */
/**
 * PWA service worker — push + installability.
 * Chromium requires a fetch handler for “Install app” / Add to Home screen (Chrome, Samsung Internet).
 */

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return;
  }

  // Chromium (Chrome and Edge) only treats the worker as installable when a fetch
  // handler exists. Same-origin navigations and assets pass through to the network.
  if (url.origin !== self.location.origin) return;
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return;

  event.respondWith(fetch(event.request));
});

self.addEventListener('push', (event) => {
  let payload = { title: 'UAE Trail', body: 'You have a new notification', data: {} };
  try {
    if (event.data) payload = { ...payload, ...JSON.parse(event.data.text()) };
  } catch {
    /* use defaults */
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      data: payload.data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data;
  const target = data && data.reviewPath ? data.reviewPath : '/';
  event.waitUntil(clients.openWindow(target));
});

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

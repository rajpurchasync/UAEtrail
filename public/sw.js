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
      icon: '/vite.svg',
      data: payload.data
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data;
  const target = data && data.reviewPath ? data.reviewPath : '/';
  event.waitUntil(clients.openWindow(target));
});

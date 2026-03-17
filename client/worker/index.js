self.addEventListener('push', event => {
  const data = event.data?.json?.() || {};
  const title = data.title || 'Emergency Alert';
  const options = {
    body: data.body || 'Ambulance dispatched to your location.',
    icon: data.icon || '/icon/192.png',
    badge: data.badge || '/icon/192.png',
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const targetUrl = event.notification.data?.url || '/';
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

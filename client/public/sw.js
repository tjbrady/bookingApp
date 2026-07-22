/* global clients */
// service-worker.js for Web Push Notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Booking App', body: 'You have a new update!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Booking App', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/palm-tree.png',
    badge: '/palm-tree.svg',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const targetUrl = event.notification.data.url;
      // If we find an active tab that contains the targeted path, focus it
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        // Match path context, e.g. /bookings
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

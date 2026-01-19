/* eslint-env serviceworker */
/* eslint-disable no-restricted-globals */

// Service Worker for handling notifications in the background

// Kuuntele viestejä pääsovellukselta
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options)
      .then(() => console.log('Notification shown from message'))
      .catch(err => console.error('Failed to show notification:', err));
  }
});

// Kuuntele push-viestejä taustalla
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (!event.data) {
    console.log('No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Push data:', data);

    const options = {
      body: data.body || 'Uusi notifikaatio',
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: data.tag || 'notification',
      requireInteraction: false,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'Avaa'
        },
        {
          action: 'close',
          title: 'Sulje'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Notifikaatio', options)
    );
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

// Kuuntele notification click:ejä
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Avaa appin
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Etsi jo avoin ikkuna
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Jos ei ole avoinna, avaa uusi
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Kuuntele notification close:ia
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

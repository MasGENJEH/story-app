import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { BASE_URL } from './config';

// Do precaching
const manifest = self.__WB_MANIFEST;
precacheAndRoute(manifest);

// Runtime caching
registerRoute(
  ({ url }) => {
    return (
      url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com'
    );
  },
  new CacheFirst({
    cacheName: 'google-fonts',
  }),
);
registerRoute(
  ({ url }) => {
    return url.origin === 'https://cdnjs.cloudflare.com' || url.origin.includes('fontawesome');
  },
  new CacheFirst({
    cacheName: 'fontawesome',
  }),
);
registerRoute(
  ({ url }) => {
    return url.origin === 'https://ui-avatars.com';
  },
  new CacheFirst({
    cacheName: 'avatars-api',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
);
registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(BASE_URL);
    return baseUrl.origin === url.origin && request.destination !== 'image';
  },
  new NetworkFirst({
    cacheName: 'story-api',
  }),
);
registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(BASE_URL);
    return baseUrl.origin === url.origin && request.destination === 'image';
  },
  new StaleWhileRevalidate({
    cacheName: 'story-api-images',
  }),
);
registerRoute(
  ({ url }) => {
    return url.origin.includes('maptiler');
  },
  new CacheFirst({
    cacheName: 'maptiler-api',
  }),
);

self.addEventListener('push', (event) => {
  console.log('[SW] Push event received.');

  async function showDynamicNotification() {
    let notificationTitle = 'Notifikasi Baru';
    let notificationOptions = {
      body: 'Anda mendapatkan pesan baru.',
    };

    if (event.data) {
      console.log('[SW] Push event has data.');
      try {
        const data = await event.data.json();
        console.log('[SW] Push data (JSON):', data);

        notificationTitle = data.title || notificationTitle;

        if (data.options && typeof data.options === 'object') {
          notificationOptions = { ...notificationOptions, ...data.options };
        } else if (data.body) {
          notificationOptions.body = data.body;
        }
        if (data.url) {
          notificationOptions.data = { url: data.url };
        }
      } catch (e) {
        console.warn('[SW] Push data is not valid JSON, treating as plain text.');
        const plainText = await event.data.text();
        notificationOptions.body = plainText;
      }
    } else {
      console.log('[SW] Push event has no data.');
    }

    console.log(
      `[SW] Showing notification: Title='${notificationTitle}', Options=`,
      notificationOptions,
    );
    await self.registration.showNotification(notificationTitle, notificationOptions);
  }

  event.waitUntil(showDynamicNotification());
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click Received.');
  event.notification.close();

  const urlToOpen =
    event.notification.data && event.notification.data.url ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});

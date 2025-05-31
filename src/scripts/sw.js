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
    cacheName: 'citycare-api',
  }),
);
registerRoute(
  ({ request, url }) => {
    const baseUrl = new URL(BASE_URL);
    return baseUrl.origin === url.origin && request.destination === 'image';
  },
  new StaleWhileRevalidate({
    cacheName: 'citycare-api-images',
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

// self.addEventListener('push', (event) => {
//   console.log('Service worker pushing...');

//   async function chainPromise() {
//     await self.registration.showNotification('Ada laporan baru untuk Anda!', {
//       body: 'Terjadi kerusakan lampu jalan di Jl. Melati',
//     });
//   }

//   event.waitUntil(chainPromise());
// });

self.addEventListener('push', (event) => {
  console.log('[SW] Push event received.');

  async function showDynamicNotification() {
    let notificationTitle = 'Notifikasi Baru';
    let notificationOptions = {
      body: 'Anda mendapatkan pesan baru.',
      // icon: '/images/logo.png', // Ganti dengan path ikon aplikasi Anda
      // badge: '/images/badge.png',
      // data: { url: '/' } // Default jika tidak ada data di payload
    };

    if (event.data) {
      console.log('[SW] Push event has data.');
      try {
        // Coba parse sebagai JSON
        const data = await event.data.json();
        console.log('[SW] Push data (JSON):', data);

        notificationTitle = data.title || notificationTitle;

        if (data.options && typeof data.options === 'object') {
          notificationOptions = { ...notificationOptions, ...data.options };
        } else if (data.body) {
          notificationOptions.body = data.body;
        }
        // Jika ada data spesifik di payload untuk diklik
        if (data.url) {
          notificationOptions.data = { url: data.url };
        }
      } catch (e) {
        // Jika parsing JSON gagal, anggap sebagai teks biasa
        console.warn('[SW] Push data is not valid JSON, treating as plain text.');
        const plainText = await event.data.text();
        notificationOptions.body = plainText;
        // Anda bisa set judul berdasarkan sebagian teks jika mau
        // notificationTitle = plainText.substring(0, 20) + "...";
        // notificationOptions.data = { url: '/' }; // Default URL jika hanya teks
      }
    } else {
      console.log('[SW] Push event has no data.');
    }

    console.log(
      `[SW] Showing notification: Title='${notificationTitle}', Options=`,
      notificationOptions,
    );
    // Menampilkan notifikasi
    await self.registration.showNotification(notificationTitle, notificationOptions);
  }

  event.waitUntil(showDynamicNotification());
});

// Opsional: Tambahkan listener untuk 'notificationclick'
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click Received.');
  event.notification.close(); // Tutup notifikasi

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

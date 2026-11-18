// Service Worker — mentoriax PWA
const CACHE = 'mentoriax-v11';
const ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/logo.png',
  '/logo.svg',
  '/logo-horizontal.svg',
  '/logo-192.png',
  '/logo-512.png',
  '/favicon.png',
  '/netorax_avatar.png',
  '/netorax_cyber.svg',
  '/netorax_owl.svg',
  '/netorax_brain.svg',
  '/original_logo.jpg'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE) {
          console.log('Eliminando caché antigua:', k);
          return caches.delete(k);
        }
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) return;

  const url = new URL(e.request.url);
  const path = url.pathname;
  
  // Siempre ir a la red primero para la página principal, HTML, CSS y JS
  const networkFirst = path === '/' || path.endsWith('.html') || path.endsWith('.css') || path.endsWith('.js') || path.endsWith('sw.js');

  if (networkFirst) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then(c => c || caches.match('/index.html')))
    );
    return;
  }

  // Para imágenes y recursos estáticos: caché primero
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }))
  );
});

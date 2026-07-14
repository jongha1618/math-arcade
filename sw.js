/* Math Arcade service worker — offline app shell + games */
const CACHE = 'math-arcade-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './games/fishing.html',
  './games/snake.html',
  './games/shooting.html',
  './games/maze.html',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isPage = e.request.mode === 'navigate' ||
                 url.pathname.endsWith('/') || url.pathname.endsWith('.html');

  if (isPage) {
    // Network-first for the app + game pages: online users always get the
    // newest version; fall back to cache when offline.
    e.respondWith(
      fetch(e.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return resp;
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
    );
  } else {
    // Cache-first for static assets (icons, manifest).
    e.respondWith(
      caches.match(e.request).then((cached) =>
        cached ||
        fetch(e.request).then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return resp;
        })
      )
    );
  }
});

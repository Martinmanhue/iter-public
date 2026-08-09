const SHELL_CACHE = 'grafito-shell-v4';
const RUNTIME_CACHE = 'grafito-runtime-v4';

const SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js?v=4',
  './cpu-language.js?v=4',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith('grafito-') && ![SHELL_CACHE, RUNTIME_CACHE].includes(name))
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response && (response.ok || response.type === 'opaque')) {
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch (err) {
        if (request.mode === 'navigate') {
          return (await caches.match('./index.html')) || (await caches.match('./'));
        }
        throw err;
      }
    })());
    return;
  }

  // Cache the Transformers.js module once it has been fetched online.
  // Model weights and ONNX/WASM assets are cached by Transformers.js itself.
  if (url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
  }
});

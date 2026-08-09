const SHELL_CACHE = 'grafito-shell-v5';
const RUNTIME_CACHE = 'grafito-runtime-v5';
const SHELL = ['./','./index.html','./style.css','./app.js?v=5','./cpu-language.js?v=5','./manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.startsWith('grafito-') && ![SHELL_CACHE,RUNTIME_CACHE].includes(n)).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

async function put(cacheName, request, response) {
  if (response && (response.ok || response.type === 'opaque')) {
    const c = await caches.open(cacheName);
    c.put(request, response.clone()).catch(() => {});
  }
  return response;
}

async function networkFirst(request) {
  try {
    return await put(RUNTIME_CACHE, request, await fetch(request, { cache: 'no-cache' }));
  } catch (_) {
    const hit = await caches.match(request, { ignoreSearch: false });
    if (hit) return hit;
    if (request.mode === 'navigate') return (await caches.match('./index.html')) || (await caches.match('./'));
    throw _;
  }
}

async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  return put(RUNTIME_CACHE, request, await fetch(request));
}

self.addEventListener('fetch', event => {
  const r = event.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === self.location.origin) {
    // While online prefer fresh Grafito code; when offline use the materialized shell.
    event.respondWith(networkFirst(r));
    return;
  }
  if (u.hostname === 'cdn.jsdelivr.net') event.respondWith(cacheFirst(r));
});

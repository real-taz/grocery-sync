self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open('grocery-sync-v1').then((cache) => cache.addAll(['/', '/index.html', '/icon.svg', '/manifest.json']))
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET' || e.request.url.includes('/api/')) return;
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
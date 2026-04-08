// sw.js - Service Worker para funcionamiento offline
const CACHE_NAME = 'calma-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/main.css',
    '/js/engine/app.js',
    '/js/engine/router.js',
    '/js/engine/anxietyState.js',
    '/js/engine/soundManager.js',
    '/js/engine/speechManager.js',
    '/js/engine/pwaManager.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Archivos cacheados');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});
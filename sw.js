// sw.js - Service Worker para funcionamiento offline
const CACHE_NAME = 'calma-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
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

// 🆕 CORRECCIÓN: Manejar la raíz correctamente
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                
                // Si no está en caché, intentar obtener de la red
                return fetch(event.request).catch(() => {
                    // Si falla la red y es una navegación, devolver index.html
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});
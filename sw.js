// sw.js - Service Worker para GitHub Pages
const CACHE_NAME = 'calma-v3';
const BASE = '/calmar-la-ansiedad';

const urlsToCache = [
    BASE + '/',
    BASE + '/index.html',
    BASE + '/manifest.json',
    BASE + '/css/main.css',
    BASE + '/js/engine/app.js',
    BASE + '/js/engine/router.js',
    BASE + '/js/engine/anxietyState.js',
    BASE + '/js/engine/soundManager.js',
    BASE + '/js/engine/speechManager.js',
    BASE + '/js/engine/pwaManager.js'
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
    // Si la URL no incluye el BASE, lo agregamos
    let requestUrl = event.request.url;
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                
                return fetch(event.request).catch(() => {
                    // Si falla la red y es una navegación, devolver index.html
                    if (event.request.mode === 'navigate') {
                        return caches.match(BASE + '/index.html');
                    }
                });
            })
    );
});
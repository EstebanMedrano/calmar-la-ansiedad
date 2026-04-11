// sw.js - Service Worker Optimizado (Cacheo Completo)
const CACHE_NAME = 'calma-v4';
const BASE = '/calmar-la-ansiedad';

// Archivos a cachear (TODOS los necesarios)
const urlsToCache = [
    // Raíz y HTML
    BASE + '/',
    BASE + '/index.html',
    BASE + '/manifest.json',
    
    // CSS
    BASE + '/css/main.css',
    
    // JS Engine
    BASE + '/js/engine/app.js',
    BASE + '/js/engine/router.js',
    BASE + '/js/engine/anxietyState.js',
    BASE + '/js/engine/soundManager.js',
    BASE + '/js/engine/speechManager.js',
    BASE + '/js/engine/pwaManager.js',
    
    // JS Games
    BASE + '/js/games/breathing.js',
    BASE + '/js/games/ground54321.js',
    BASE + '/js/games/memoryGame.js',
    BASE + '/js/games/waterCalm.js',
    BASE + '/js/games/hurricane.js',
    BASE + '/js/games/ritualFire.js',
    BASE + '/js/games/reverseText.js',
    BASE + '/js/games/rompecabezasDeLu.js',
    BASE + '/js/games/cartaParaLu.js',
    
    // Imágenes esenciales
    BASE + '/assets/img/perros/tito.png',
    BASE + '/assets/img/perros/lia.png',
    
    // Iconos
    BASE + '/assets/icons/icon-192.png',
    BASE + '/assets/icons/icon-512.png'
];

// Instalación: cachear todo
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Cacheando archivos esenciales...');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activación: limpiar cachés viejas
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('🗑️ Eliminando caché vieja:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch: Estrategia "Cache First, luego Red"
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si está en caché, devolverlo
                if (response) {
                    return response;
                }
                
                // Si no está en caché, ir a la red
                return fetch(event.request)
                    .then(networkResponse => {
                        // Cachear dinámicamente para la próxima
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                        return networkResponse;
                    })
                    .catch(() => {
                        // Si falla la red y es navegación, devolver index.html
                        if (event.request.mode === 'navigate') {
                            return caches.match(BASE + '/index.html');
                        }
                    });
            })
    );
});
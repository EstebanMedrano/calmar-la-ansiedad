/*
 * Service worker del Refugio de Lu.
 *
 * Dos trabajos:
 *   1. Que la app funcione sin conexión una vez cargada.
 *   2. Mostrar las notificaciones y abrir la app al tocarlas.
 *
 * Decisión importante: NO se precachea nada por adelantado. Los modelos 3D y
 * los sonidos suman varios megas, y descargarlos todos en la primera visita
 * con datos móviles sería una falta de respeto. Cada cosa se guarda la primera
 * vez que se usa de verdad.
 */

const VERSION = 'v1';
const SHELL_CACHE = `lu-shell-${VERSION}`;
const ASSET_CACHE = `lu-assets-${VERSION}`;
const MEDIA_CACHE = `lu-media-${VERSION}`;

// Lo mínimo para que arranque estando sin conexión.
const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // addAll falla entero si un solo recurso falla; se añaden de uno en uno
      // para que un 404 suelto no impida instalar el service worker.
      .then((cache) => Promise.allSettled(SHELL_URLS.map((u) => cache.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.endsWith(VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Guarda una copia sin bloquear la respuesta que ya va de camino. */
function putInCache(cacheName, request, response) {
  const copy = response.clone();
  caches.open(cacheName).then((cache) => cache.put(request, copy));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Peticiones a otros dominios (fuentes de Google) se dejan pasar tal cual
  if (url.origin !== self.location.origin) return;

  // ── Navegación: red primero, caché si no hay conexión ──────────────────
  // Así siempre ve la versión más reciente cuando hay red, pero la app abre
  // igual en el metro. El fallback a index.html es lo que hace que funcionen
  // rutas como /game/birthday al recargar.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          putInCache(SHELL_CACHE, '/index.html', res);
          return res;
        })
        .catch(() => caches.match('/index.html').then((r) => r ?? Response.error())),
    );
    return;
  }

  // ── Modelos, sonidos e imágenes: caché primero ─────────────────────────
  // Son inmutables y pesados; una vez descargados no hace falta volver a
  // pedirlos nunca. Es lo que hace que la segunda visita sea instantánea.
  if (/\/assets\/(3D|sounds|img|icons)\//.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) putInCache(MEDIA_CACHE, request, res);
          return res;
        });
      }),
    );
    return;
  }

  // ── JS y CSS: se sirve lo cacheado y se refresca por detrás ────────────
  // Los nombres llevan hash, así que un archivo cacheado nunca está obsoleto:
  // si cambia el contenido, cambia la URL.
  if (/\.(js|css|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            if (res.ok) putInCache(ASSET_CACHE, request, res);
            return res;
          })
          .catch(() => cached ?? Response.error());
        return cached ?? network;
      }),
    );
  }
});

// ── Notificaciones ────────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si la app ya está abierta en alguna pestaña, se trae al frente
        // en vez de abrir otra.
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
        return self.clients.openWindow(target);
      }),
  );
});

/** Permite a la página pedir al service worker que muestre un aviso. */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(event.data.title, event.data.options);
  }
});

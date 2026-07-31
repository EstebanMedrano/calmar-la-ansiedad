/*
 * Service worker del Refugio de Lu.
 *
 * Tres trabajos:
 *   1. Que la app funcione sin conexión una vez cargada.
 *   2. Que lo pesado (modelos 3D, sonidos, imágenes) se descargue UNA vez y no
 *      vuelva a bajarse nunca, ni al abrir la app ni al cambiar de juego.
 *   3. Mostrar las notificaciones y abrir la app al tocarlas.
 *
 * Todas las rutas se calculan a partir de dónde vive este archivo. La app se
 * sirve desde /calmar-la-ansiedad/ en GitHub Pages y desde / en desarrollo;
 * con rutas absolutas escritas a mano, media caché apuntaba a URLs que daban
 * 404 y el modo sin conexión no llegaba a funcionar.
 */

const VERSION = 'v3';
const SHELL_CACHE = `lu-shell-${VERSION}`;
const ASSET_CACHE = `lu-assets-${VERSION}`;
const MEDIA_CACHE = `lu-media-${VERSION}`;

// '/calmar-la-ansiedad/sw.js' -> '/calmar-la-ansiedad/'
const BASE = self.location.pathname.replace(/sw\.js$/, '');
const url = (p) => BASE + p.replace(/^\//, '');
const INDEX = url('index.html');

// Lo mínimo para que arranque estando sin conexión.
const SHELL_URLS = [BASE, INDEX, url('manifest.webmanifest'), url('favicon.svg')];

/*
 * Todo el material pesado. Ya optimizado son unos 3 MB en total (los modelos
 * pesaban 42 MB antes de comprimirlos), así que se puede bajar entero de una
 * vez sin abusar de los datos de nadie.
 *
 * Se descarga DESPUÉS de activar, en segundo plano: la primera pantalla no
 * espera a esto, pero para cuando el usuario entra a un juego ya está listo.
 */
const MEDIA_URLS = [
  'assets/3D/tito.glb',
  'assets/3D/lia.glb',
  'assets/3D/arms.glb',
  'assets/sounds/ambient-432hz.mp3',
  'assets/sounds/fire-crackling.mp3',
  'assets/sounds/lia-bark.mp3',
  'assets/sounds/water-drop.mp3',
  'assets/sounds/Tornado.mp3',
  'assets/sounds/Artificiales.mp3',
  'assets/img/objetos/tulipan2.png',
  ...Array.from({ length: 12 }, (_, i) => `assets/img/memorama/${i + 1}.webp`),
  ...[
    'exterior-casa', 'jardin-tulipanes', 'noche-estrellas',
    'patio-piscina', 'fuente-colores', 'interior-sala',
  ].map((n) => `assets/img/refugio-webp/${n}.webp`),
  ...[72, 96, 128, 144, 152, 192, 384, 512].map((s) => `assets/icons/icon-${s}.png`),
].map(url);

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
          keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim())
      .then(() => warmMediaCache()),
  );
});

/**
 * Baja el material pesado que aún no esté guardado.
 *
 * No va dentro de waitUntil del install a propósito: si lo estuviera, el
 * service worker no se activaría hasta terminar los 3 MB y la app arrancaría
 * sin caché ninguna en la primera visita.
 */
async function warmMediaCache() {
  const cache = await caches.open(MEDIA_CACHE);
  for (const u of MEDIA_URLS) {
    try {
      if (await cache.match(u)) continue;
      const res = await fetch(u, { cache: 'no-cache' });
      if (res.ok) await cache.put(u, res);
    } catch {
      // Sin conexión o recurso movido: se reintentará en la próxima visita.
    }
  }
}

/** Guarda una copia sin bloquear la respuesta que ya va de camino. */
function putInCache(cacheName, request, response) {
  const copy = response.clone();
  caches.open(cacheName).then((cache) => cache.put(request, copy));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const reqUrl = new URL(request.url);
  // Peticiones a otros dominios (fuentes de Google, Apps Script) se dejan pasar
  if (reqUrl.origin !== self.location.origin) return;

  // ── Navegación: red primero, caché si no hay conexión ──────────────────
  // Así siempre ve la versión más reciente cuando hay red, pero la app abre
  // igual en el metro. El fallback a index.html es lo que hace que funcionen
  // rutas como /game/birthday al recargar.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          putInCache(SHELL_CACHE, INDEX, res);
          return res;
        })
        .catch(() => caches.match(INDEX).then((r) => r ?? Response.error())),
    );
    return;
  }

  // ── Modelos, sonidos e imágenes: caché primero ─────────────────────────
  // Son inmutables y pesados; una vez descargados no hace falta volver a
  // pedirlos nunca. Es lo que hace que la segunda visita sea instantánea.
  if (/\/assets\/(3D|sounds|img|icons)\//.test(reqUrl.pathname)) {
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
  if (/\.(js|css|woff2?)$/.test(reqUrl.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            if (res.ok) putInCache(ASSET_CACHE, request, res);
            return res;
          })
          .catch(() => cached ?? Response.error());
        // Si ya hay copia se devuelve al instante; la de red actualiza la caché
        // por detrás. El catch evita que su rechazo quede sin gestionar.
        if (cached) network.catch(() => {});
        return cached ?? network;
      }),
    );
  }
});

// ── Notificaciones ────────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? BASE;

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

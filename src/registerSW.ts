/**
 * Registro del service worker.
 *
 * Solo en producción: en desarrollo un service worker sirviendo respuestas
 * cacheadas pelea con el recarga-en-caliente de Vite y acabas depurando
 * código que ya no existe.
 *
 * También hace falta contexto seguro (https, o localhost). En http:// plano
 * `navigator.serviceWorker` ni siquiera está definido, así que la app
 * seguirá funcionando pero sin instalación ni notificaciones.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    // La ruta debe llevar la base: en GitHub Pages la app vive en
    // /calmar-la-ansiedad/ y '/sw.js' daba 404, así que el registro fallaba
    // en silencio y no había ni modo sin conexión ni caché de los modelos.
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;

    navigator.serviceWorker
      .register(swUrl, { scope: import.meta.env.BASE_URL })
      .catch((err) => {
        console.warn('[sw] no se pudo registrar:', err);
      });
  });
}

/**
 * Limpia service workers de versiones anteriores.
 *
 * La v1 registró uno en la raíz del dominio ('/sw.js', ámbito '/'), que
 * seguiría interceptando las peticiones de la v2 y sirviendo archivos viejos.
 * Solo se desregistran los que NO son el nuestro: la versión anterior de esta
 * función los borraba todos en cada carga, incluido el que se acababa de
 * registrar, así que la caché nunca sobrevivía a una recarga y todo se volvía
 * a descargar cada vez.
 */
export function cleanupLegacyServiceWorkers(): void {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      const scope = new URL(reg.scope).pathname;
      if (scope !== import.meta.env.BASE_URL) reg.unregister();
    }
  }).catch(() => { /* navegador sin permisos: no pasa nada */ });
}

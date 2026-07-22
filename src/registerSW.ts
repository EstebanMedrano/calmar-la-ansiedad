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
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[sw] no se pudo registrar:', err);
    });
  });
}

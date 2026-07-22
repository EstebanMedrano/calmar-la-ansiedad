import { useCallback, useEffect, useRef, useState } from 'react';
import type { NotifPayload } from './messages';
import { dueMilestones, markFired, msUntilBirthday } from './scheduler';
import { BIRTHDAY_NOTIFICATION } from './messages';

const ASKED_KEY = 'lu_notif_asked';

export type NotifPermission = NotificationPermission | 'unsupported';

interface UseNotificationsResult {
  permission: NotifPermission;
  isSupported: boolean;
  /**
   * true en iOS cuando la app no está instalada en la pantalla de inicio.
   * Ahí las notificaciones son imposibles hasta que la añade, así que en vez
   * de pedir un permiso que va a fallar hay que explicarle cómo instalarla.
   */
  needsInstall: boolean;
  /** Ya se le preguntó alguna vez (aunque dijera que no). */
  alreadyAsked: boolean;
  /** Debe llamarse desde un gesto del usuario. */
  request: () => Promise<NotifPermission>;
  notifyNow: (payload: NotifPayload) => Promise<void>;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari en iOS usa esta propiedad propia
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function useNotifications(): UseNotificationsResult {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState<NotifPermission>(
    isSupported ? Notification.permission : 'unsupported',
  );
  const birthdayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notifyNow = useCallback(async (payload: NotifPayload) => {
    if (!isSupported || Notification.permission !== 'granted') return;

    const options: NotificationOptions = {
      body: payload.body,
      icon: '/assets/icons/icon-192.png',
      badge: '/assets/icons/icon-96.png',
      // Con la misma etiqueta, un aviso nuevo reemplaza al anterior en vez
      // de apilarse: nadie quiere ver cinco recordatorios seguidos.
      tag: payload.id,
      data: { url: '/games' },
    };

    try {
      // A través del service worker, que es lo único que funciona cuando la
      // página está en segundo plano en Android. new Notification() ahí falla.
      const reg = await navigator.serviceWorker?.ready;
      if (reg) {
        await reg.showNotification(payload.title, options);
      } else {
        new Notification(payload.title, options);
      }
      markFired(payload.id);
    } catch {
      // Un aviso que no sale no debe romper nada de la app
    }
  }, [isSupported]);

  const request = useCallback(async (): Promise<NotifPermission> => {
    if (!isSupported) return 'unsupported';
    const result = await Notification.requestPermission();
    setPermission(result);
    localStorage.setItem(ASKED_KEY, result);
    return result;
  }, [isSupported]);

  // Ponerse al día: al abrir la app y cada vez que vuelve a primer plano.
  useEffect(() => {
    if (permission !== 'granted') return;

    const catchUp = () => {
      if (document.visibilityState !== 'visible') return;
      for (const payload of dueMilestones()) void notifyNow(payload);
    };

    catchUp();
    document.addEventListener('visibilitychange', catchUp);
    return () => document.removeEventListener('visibilitychange', catchUp);
  }, [permission, notifyNow]);

  // Si la app está abierta cuando llega la medianoche del cumpleaños,
  // el aviso salta en vivo.
  useEffect(() => {
    if (permission !== 'granted') return;
    const ms = msUntilBirthday();
    if (ms === null) return;

    birthdayTimer.current = setTimeout(() => {
      void notifyNow(BIRTHDAY_NOTIFICATION);
    }, ms);

    return () => {
      if (birthdayTimer.current) clearTimeout(birthdayTimer.current);
    };
  }, [permission, notifyNow]);

  return {
    permission,
    isSupported,
    needsInstall: isSupported && isIOS() && !isStandalone(),
    alreadyAsked: localStorage.getItem(ASKED_KEY) !== null,
    request,
    notifyNow,
  };
}

export default useNotifications;

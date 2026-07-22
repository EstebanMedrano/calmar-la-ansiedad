import { useCallback, useEffect, useRef, useState } from 'react';

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Milisegundos que faltan. 0 cuando ya pasó. */
  total: number;
  /** true cuando la fecha objetivo ya llegó. */
  isPast: boolean;
}

function compute(target: Date): Countdown {
  const total = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(total / 86_400_000),
    hours: Math.floor(total / 3_600_000) % 24,
    minutes: Math.floor(total / 60_000) % 60,
    seconds: Math.floor(total / 1000) % 60,
    total,
    isPast: total <= 0,
  };
}

/**
 * Cuenta regresiva hasta una fecha.
 *
 * Dos detalles que son la diferencia entre que funcione y que no:
 *
 * 1. Cada tick recalcula desde `target - Date.now()`, nunca resta 1 a un valor
 *    guardado. Los navegadores móviles ralentizan o congelan los timers de las
 *    pestañas en segundo plano, así que un contador acumulativo se retrasaría
 *    minutos u horas mientras el teléfono está bloqueado.
 *
 * 2. Al volver a la pestaña (visibilitychange) y al restaurarla desde la caché
 *    de iOS (pageshow) recalcula al instante, sin esperar al siguiente segundo.
 */
export function useCountdown(target: Date): Countdown {
  const [countdown, setCountdown] = useState<Countdown>(() => compute(target));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetTime = target.getTime();

  const sync = useCallback(() => {
    const next = compute(new Date(targetTime));
    setCountdown(next);
    return next;
  }, [targetTime]);

  useEffect(() => {
    // Si ya pasó no hace falta ningún timer.
    if (sync().isPast) return;

    intervalRef.current = setInterval(() => {
      // Al llegar a cero se emite el último estado y se para el intervalo:
      // así el desbloqueo ocurre en vivo, sin necesidad de recargar.
      if (sync().isPast && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 1000);

    const onWake = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('pageshow', onWake);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('pageshow', onWake);
    };
  }, [sync]);

  return countdown;
}

export default useCountdown;

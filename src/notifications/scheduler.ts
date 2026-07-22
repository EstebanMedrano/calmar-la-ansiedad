import { getBirthdayTarget } from '../config/birthday';
import { BIRTHDAY_NOTIFICATION, MILESTONE_DAYS, dayMessage } from './messages';
import type { NotifPayload } from './messages';

const FIRED_KEY = 'lu_notif_fired';
const LAST_NUDGE_KEY = 'lu_notif_last_nudge';

/** Registro de qué avisos ya se enviaron, para no repetirlos nunca. */
type FiredLog = Record<string, number>;

function readFired(): FiredLog {
  try {
    return JSON.parse(localStorage.getItem(FIRED_KEY) ?? '{}') as FiredLog;
  } catch {
    return {};
  }
}

export function markFired(id: string): void {
  const log = readFired();
  log[id] = Date.now();
  localStorage.setItem(FIRED_KEY, JSON.stringify(log));
}

export function hasFired(id: string): boolean {
  return readFired()[id] !== undefined;
}

/** Días completos que faltan hasta el cumpleaños. */
function daysUntil(target: Date, now: number): number {
  return Math.ceil((target.getTime() - now) / 86_400_000);
}

/**
 * Qué avisos tocaría enviar ahora mismo.
 *
 * Se llama al abrir la app y cada vez que vuelve a primer plano. Este
 * "ponerse al día al abrir" es el mecanismo de verdad fiable sin servidor:
 * un aviso programado en segundo plano no está garantizado en ningún
 * navegador móvil, y en iOS directamente no existe.
 */
export function dueMilestones(now: number = Date.now()): NotifPayload[] {
  const target = getBirthdayTarget();
  const due: NotifPayload[] = [];

  // Ya llegó el día
  if (now >= target.getTime()) {
    if (!hasFired(BIRTHDAY_NOTIFICATION.id)) due.push(BIRTHDAY_NOTIFICATION);
    return due;
  }

  const remaining = daysUntil(target, now);
  for (const d of MILESTONE_DAYS) {
    // Se envía en cuanto quedan d días o menos, por si ese día no abrió la app
    if (remaining <= d) {
      const payload = dayMessage(d);
      if (!hasFired(payload.id)) {
        due.push(payload);
        break; // solo el hito más cercano, no los tres de golpe
      }
    }
  }

  return due;
}

/**
 * Milisegundos hasta la medianoche del cumpleaños, si cabe en un setTimeout.
 *
 * setTimeout desborda pasados unos 24.8 días (2^31 ms) y dispara de
 * inmediato, así que por encima de 24 horas devuelve null y ya se reintenta
 * la próxima vez que abra la app.
 */
export function msUntilBirthday(now: number = Date.now()): number | null {
  const delta = getBirthdayTarget().getTime() - now;
  if (delta <= 0 || delta > 86_400_000) return null;
  return delta;
}

/** Como mucho un mensaje de ánimo cada 48 horas, y solo al abrir la app. */
export function shouldSendNudge(now: number = Date.now()): boolean {
  const last = Number(localStorage.getItem(LAST_NUDGE_KEY) ?? 0);
  return now - last > 48 * 3_600_000;
}

export function markNudgeSent(now: number = Date.now()): void {
  localStorage.setItem(LAST_NUDGE_KEY, String(now));
}

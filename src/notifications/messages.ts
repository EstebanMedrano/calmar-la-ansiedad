/**
 * Textos de las notificaciones.
 *
 * Se mantienen aparte de content/messages.ts porque estos los lee el sistema
 * operativo, no la app: tienen que ser cortos y entenderse de un vistazo en
 * la pantalla de bloqueo.
 */

export interface NotifPayload {
  id: string;
  title: string;
  body: string;
}

/** A cuántos días del cumpleaños se avisa. */
export const MILESTONE_DAYS = [7, 3, 1] as const;

export function dayMessage(days: number): NotifPayload {
  return {
    id: `d${days}`,
    title: 'Refugio de Lu',
    body:
      days === 1
        ? 'Falta 1 día para abrir tu regalo especial 💛'
        : `Faltan ${days} días para abrir tu regalo especial 💛`,
  };
}

export const BIRTHDAY_NOTIFICATION: NotifPayload = {
  id: 'birthday',
  title: '¡Feliz cumpleaños, Lu! 🎂',
  body: 'Tu regalo ya está esperándote. Ábrelo cuando quieras.',
};

/** Mensajes de apoyo generales, sin relación con el cumpleaños. */
export const NUDGES: string[] = [
  'Respira. Estoy aquí aunque no me veas 💛',
  'Si hoy pesa, los perritos te esperan en el refugio.',
  '¿Cinco minutos de calma? Tito y Lia dicen que sí.',
  'No tienes que poder con todo hoy.',
];

export function nudgeMessage(index: number): NotifPayload {
  return {
    id: `nudge-${Date.now()}`,
    title: 'Refugio de Lu',
    body: NUDGES[index % NUDGES.length],
  };
}

/**
 * Configuración del regalo de cumpleaños.
 *
 * OJO con la fecha: se construye con new Date(año, mes, día) porque ese
 * constructor interpreta la hora en la zona horaria LOCAL del teléfono, que es
 * lo que queremos (medianoche donde ella esté). Si se usara la cadena
 * '2026-08-01' el navegador la interpretaría como UTC y el regalo se
 * desbloquearía a una hora equivocada.
 *
 * El mes va de 0 a 11, así que agosto es 7.
 */
export const BIRTHDAY_TARGET = new Date(2026, 7, 1, 0, 0, 0, 0);

export const BIRTHDAY_LABEL = '1 de agosto';

const DEV_UNLOCK_KEY = 'lu_dev_unlock';
const GIFT_OPENED_KEY = 'lu_gift_opened';

/**
 * Fecha objetivo real, permitiendo sobreescribirla para poder ensayar.
 *
 * Para probar el desbloqueo en vivo sin esperar al 1 de agosto, crea un
 * archivo .env.local con una fecha a un minuto vista:
 *   VITE_BIRTHDAY_TARGET=2026-07-21T18:30:00
 */
export function getBirthdayTarget(): Date {
  const override = import.meta.env.VITE_BIRTHDAY_TARGET;
  if (override) {
    const parsed = new Date(override);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    console.warn('[birthday] VITE_BIRTHDAY_TARGET no es una fecha válida:', override);
  }
  return BIRTHDAY_TARGET;
}

/**
 * Desbloqueo manual para previsualizar el regalo antes de tiempo.
 *
 * Abrir la app con ?unlock=1 lo activa y queda guardado, así se puede navegar
 * por toda la experiencia. Con ?unlock=0 se vuelve al comportamiento real.
 * No aparece en ninguna parte de la interfaz.
 */
export function isDevUnlocked(): boolean {
  if (typeof window === 'undefined') return false;

  const param = new URLSearchParams(window.location.search).get('unlock');
  if (param === '1') {
    localStorage.setItem(DEV_UNLOCK_KEY, '1');
    return true;
  }
  if (param === '0') {
    localStorage.removeItem(DEV_UNLOCK_KEY);
    return false;
  }

  return localStorage.getItem(DEV_UNLOCK_KEY) === '1';
}

/** Si ya abrió el regalo alguna vez, para adaptar los textos. */
export function hasOpenedGift(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(GIFT_OPENED_KEY) === '1';
}

export function markGiftOpened(): void {
  localStorage.setItem(GIFT_OPENED_KEY, '1');
}

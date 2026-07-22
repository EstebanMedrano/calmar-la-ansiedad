/**
 * Fases y tiempos de la escena del regalo.
 *
 * Toda la coreografía se ajusta desde aquí. Si algo va demasiado rápido o
 * demasiado lento, se cambia el número y ya: ningún componente tiene tiempos
 * propios escondidos.
 */
export type BirthdayStage =
  | 'idle'            // esperando el primer toque (necesario para el audio)
  | 'intro'           // rótulo "Tito y Lia tienen algo para ti"
  | 'dogsRunIn'       // los perros entran corriendo con la torta
  | 'handOff'         // te entregan la torta
  | 'zoomCake'        // la cámara se acerca en primera persona
  | 'candlesRising'   // las velas van saliendo formando el círculo
  | 'ringComplete'    // el círculo se cierra
  | 'dimming'         // se apagan las luces del fondo
  | 'awaitBlow'       // esperando que sople (sin límite de tiempo)
  | 'candlesOut'      // las velas se apagan
  | 'pullBack'        // la cámara retrocede a la oscuridad
  | 'letterIncoming'  // la carta llega volando desde lejos
  | 'letterOpening'   // se abre
  | 'reading'         // el mensaje se escribe
  | 'finale';         // confeti y botones

/** Duraciones en milisegundos. */
export const T = {
  intro: 2200,
  dogsRunIn: 3400,
  handOff: 1500,
  zoomCake: 2600,
  /** Retraso entre una vela y la siguiente. */
  candleStagger: 280,
  /** Lo que tarda cada vela en salir. */
  candleRise: 520,
  ringComplete: 1000,
  dimming: 1700,
  // awaitBlow no tiene duración: depende de ella
  candlesOut: 1100,
  pullBack: 2300,
  letterIncoming: 3200,
  letterOpening: 1300,
  // reading depende de la longitud del mensaje
} as const;

/** Número de velas. En móvil se reducen para no cargar la escena. */
export const CANDLE_COUNT = { desktop: 12, mobile: 9 } as const;

/** Cuánto dura toda la subida de velas, de la primera a la última. */
export function candlesRisingDuration(count: number): number {
  return (count - 1) * T.candleStagger + T.candleRise;
}

/**
 * Fases de la escena Carta.
 *
 * idle      → aún no ha empezado, esperando el toque
 * approach  → la carta cruza el cielo como un cometa y el perro la persigue
 * arrival   → ya está delante, quieta, un instante antes de abrirse
 * unfolding → salta el lacre y se abren las solapas
 * reading   → el mensaje se escribe letra a letra
 * done      → mensaje completo, aparecen los botones
 */
export type CartaStage = 'idle' | 'approach' | 'arrival' | 'unfolding' | 'reading' | 'done';

/**
 * Tiempos de la coreografía.
 *
 * El vuelo dura diez segundos a propósito: es el tiempo que hace falta para
 * que la carta pase de ser un punto de luz en el horizonte a llenar la
 * pantalla sin que en ningún momento se mueva deprisa. Antes eran 2.3 s y
 * pasaba de largo antes de que te dieras cuenta.
 */
export const T = {
  /** Vuelo de la carta, en SEGUNDOS. */
  flight: 10,
  /** Vueltas que da sobre sí misma mientras se acerca. */
  spin: 3,
  /** Cuánto va por detrás el perro, en fracción del recorrido. */
  dogLag: 0.09,
  /** Pausa con la carta ya delante antes de que salte el lacre, en ms. */
  arrival: 900,
  /** Desdoblado, en SEGUNDOS. */
  unfold: 1.9,
} as const;

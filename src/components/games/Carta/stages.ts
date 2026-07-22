/**
 * Fases de la escena Carta.
 *
 * idle      → aún no ha empezado, esperando el toque
 * approach  → Lia entra volando por el recorrido con la carta
 * handoff   → suelta la carta, que sigue sola hasta la cámara
 * unfolding → salta el lacre y se abren las solapas
 * reading   → el mensaje se escribe letra a letra
 * done      → mensaje completo, aparecen los botones
 */
export type CartaStage = 'idle' | 'approach' | 'handoff' | 'unfolding' | 'reading' | 'done';

/** Duraciones en milisegundos. Cambiar aquí afecta a toda la coreografía. */
export const T = {
  approach: 3800,
  handoff: 1700,
  unfolding: 1200,
} as const;

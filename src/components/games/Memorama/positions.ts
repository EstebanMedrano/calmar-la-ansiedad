export const PAIRS = 12;
export const IMG_PATHS = Array.from({ length: 12 }, (_, i) => `/assets/img/memorama/${i + 1}.png`);

/** Tamaño de una carta sin escalar. Debe coincidir con CW/CH de Card3D. */
export const CARD_W = 0.95;
export const CARD_H = 1.15;

export interface GridConfig {
  cols: number;
  rows: number;
  gapX: number;
  gapY: number;
  cardScale: number;
}

/**
 * Disposición de la rejilla según la forma de la pantalla.
 *
 * En vertical se usa 3x8 y no 4x6 aunque parezca peor: al ser la pantalla
 * mucho más alta que ancha, lo que limita el tamaño de las cartas es el
 * ancho, y con 3 columnas caben más grandes.
 */
export function getGridConfig(aspect: number): GridConfig {
  if (aspect < 0.65) return { cols: 3, rows: 8, gapX: 1.12, gapY: 1.30, cardScale: 1.0 };
  if (aspect < 0.95) return { cols: 3, rows: 8, gapX: 1.14, gapY: 1.32, cardScale: 1.0 };
  if (aspect < 1.25) return { cols: 4, rows: 6, gapX: 1.16, gapY: 1.36, cardScale: 1.0 };
  if (aspect < 1.8)  return { cols: 6, rows: 4, gapX: 1.18, gapY: 1.40, cardScale: 1.0 };
  return { cols: 6, rows: 4, gapX: 1.22, gapY: 1.44, cardScale: 1.05 };
}

/** Tamaño total que ocupa la rejilla, incluyendo el ancho de las cartas. */
export function getGridSize(cfg: GridConfig): { width: number; height: number } {
  return {
    width: (cfg.cols - 1) * cfg.gapX + CARD_W * cfg.cardScale,
    height: (cfg.rows - 1) * cfg.gapY + CARD_H * cfg.cardScale,
  };
}

/**
 * Esquina superior izquierda de la rejilla.
 *
 * La rejilla se centra en el origen. Antes estaba desplazada a x = -3.6
 * mientras la cámara miraba a x = +2.2, así que las cartas quedaban a un
 * lado de la pantalla y la mitad derecha era agua vacía.
 */
export function getGridOrigin(cfg: GridConfig): { sx: number; sy: number } {
  return {
    sx: -((cfg.cols - 1) * cfg.gapX) / 2,
    sy: ((cfg.rows - 1) * cfg.gapY) / 2,
  };
}

export function getCardPos(idx: number, cfg: GridConfig): [number, number, number] {
  const { sx, sy } = getGridOrigin(cfg);
  return [
    sx + (idx % cfg.cols) * cfg.gapX,
    sy - Math.floor(idx / cfg.cols) * cfg.gapY,
    0,
  ];
}

/** Margen alrededor de la rejilla, para que no toque los bordes de la pantalla. */
const FIT_MARGIN = 1.16;

/**
 * Distancia de cámara necesaria para que la rejilla entre en pantalla.
 *
 * Antes esto eran valores fijos (z: 38 en vertical) que no tenían relación
 * con el tamaño real de la rejilla: la cámara se iba cuatro veces más lejos
 * de lo necesario y las cartas se veían de unos 12 píxeles en un móvil.
 *
 * Una cámara en perspectiva mantiene el ángulo VERTICAL, así que al
 * estrecharse la pantalla el ancho visible se reduce con el aspect. Por eso
 * hay que comprobar las dos dimensiones y quedarse con la más exigente.
 */
export function getCameraConfig(aspect: number) {
  const cfg = getGridConfig(aspect);
  const { width, height } = getGridSize(cfg);
  const fov = aspect < 0.95 ? 62 : 55;
  const halfFov = (fov * Math.PI) / 180 / 2;

  const distForHeight = (height * FIT_MARGIN) / 2 / Math.tan(halfFov);
  const distForWidth = (width * FIT_MARGIN) / 2 / (Math.tan(halfFov) * aspect);

  return {
    fov,
    z: Math.max(distForHeight, distForWidth),
    // Rejilla y cámara comparten centro: sin esto la rejilla queda descuadrada.
    x: 0,
  };
}

/**
 * Profundidad a la que nadan los perros y el tiburón.
 *
 * Bien por detrás de las cartas (z = 0). Antes estaban a z = -1, tan cerca
 * que en vertical parecía que atravesaban el muro de cartas. A esta
 * distancia se leen claramente como fondo.
 */
export function getActorZ(aspect: number): number {
  return aspect < 0.95 ? -5.5 : -3.5;
}

/**
 * Zona por la que puede moverse cada personaje, calculada a partir de lo que
 * se ve realmente en pantalla a su profundidad. Antes eran rectángulos fijos
 * que en vertical se solapaban con las cartas.
 */
export function getActorZones(aspect: number) {
  const cam = getCameraConfig(aspect);
  const z = getActorZ(aspect);
  const halfFov = (cam.fov * Math.PI) / 180 / 2;
  // Distancia desde la cámara hasta el plano donde nadan
  const dist = cam.z - z;
  const halfH = Math.tan(halfFov) * dist;
  const halfW = halfH * aspect;

  // Un poco hacia dentro para que no se salgan del encuadre
  const mx = halfW * 0.82;
  const my = halfH * 0.82;

  return {
    // Tito arriba, Lia abajo: se reparten la pantalla y no se pisan
    tito: { xMin: -mx, xMax: mx, yMin: 0.15 * my, yMax: my },
    lia: { xMin: -mx, xMax: mx, yMin: -my, yMax: -0.15 * my },
    shark: { xMin: -mx, xMax: mx, yMin: -my, yMax: my },
    z,
  };
}

export const CAM_PLAY_POS: [number, number, number] = [0, 0, 18];
export const CAM_PLAY_LOOK: [number, number, number] = [0, 0, 0];

export const DOG_SPEED = 1.35;
export const SHARK_SPEED_CHASE = 1.35;
export const SHARK_SPEED_ATTACK = 5.5;
export const STUN_DURATION = 2.0;
export const ATTACK_TIMEOUT = 10.0;
export const BLINK_DURATION = 2.5;

export const PAIR_COLORS = [
  '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
  '#c77dff', '#ff9a3c', '#3de0ff', '#ff3d77',
  '#55efc4', '#fdcb6e', '#a29bfe', '#fd79a8',
];

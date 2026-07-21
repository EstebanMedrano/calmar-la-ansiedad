export const PAIRS = 12;
export const IMG_PATHS = Array.from({ length: 12 }, (_, i) => `/assets/img/memorama/${i + 1}.png`);

export interface GridConfig {
  cols: number;
  rows: number;
  gapX: number;
  gapY: number;
  cardScale: number;
}

export function getGridConfig(aspect: number): GridConfig {
  if (aspect < 0.65) {
    return { cols: 3, rows: 8, gapX: 1.05, gapY: 1.00, cardScale: 0.85 };
  }
  if (aspect < 0.95) {
    return { cols: 3, rows: 8, gapX: 1.06, gapY: 1.01, cardScale: 0.90 };
  }
  if (aspect < 1.25) {
    return { cols: 4, rows: 6, gapX: 1.08, gapY: 1.04, cardScale: 1.0 };
  }
  if (aspect < 1.8) {
    return { cols: 6, rows: 4, gapX: 1.10, gapY: 1.08, cardScale: 1.0 };
  }
  return { cols: 6, rows: 4, gapX: 1.15, gapY: 1.10, cardScale: 1.05 };
}

export function getGridOrigin(cfg: GridConfig): { sx: number; sy: number } {
  const sx = -3.6 - ((cfg.cols - 1) * cfg.gapX) / 2;
  const sy = ((cfg.rows - 1) * cfg.gapY) / 2;
  return { sx, sy };
}

export function getCardPos(idx: number, cfg: GridConfig): [number, number, number] {
  const { sx, sy } = getGridOrigin(cfg);
  return [
    sx + (idx % cfg.cols) * cfg.gapX,
    sy - Math.floor(idx / cfg.cols) * cfg.gapY,
    0,
  ];
}

// ⭐ CORRECCIÓN: Tito a la derecha (xMin: 2.2) y Lia a la izquierda (xMax: -2.2)
export const TITO_ZONE = { xMin: 2.2, xMax: 7.5, yMin: 0.3, yMax: 5.5 } as const;
export const LIA_ZONE = { xMin: -7.5, xMax: -2.2, yMin: -5.5, yMax: -0.3 } as const;

export const CAM_PLAY_POS: [number, number, number] = [-0.8, 0, 18];
export const CAM_PLAY_LOOK: [number, number, number] = [-0.8, 0, 0];

export function getCameraConfig(aspect: number) {
  if (aspect < 0.65) return { fov: 82, z: 38, x: 2.2 };
  if (aspect < 0.85) return { fov: 76, z: 32, x: 1.4 };
  if (aspect < 1.15) return { fov: 66, z: 25, x: 0.2 };
  if (aspect < 1.8) return { fov: 58, z: 19, x: -0.6 };
  return { fov: 54, z: 17, x: -0.8 };
}

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
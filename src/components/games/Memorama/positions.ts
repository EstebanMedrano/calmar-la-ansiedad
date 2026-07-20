export const PAIRS = 12;
export const IMG_PATHS = Array.from({length:12},(_,i)=>`/assets/img/memorama/${i+1}.png`);

export const CARD_COLS = 3;
export const CARD_ROWS = 8;
export const GAP_X = 1.08;
export const GAP_Y = 1.02;
export const GRID_CX = -3.6;
export const GRID_SX = GRID_CX - ((CARD_COLS-1)*GAP_X)/2;
export const GRID_SY = ((CARD_ROWS-1)*GAP_Y)/2;

// Tito: mitad SUPERIOR derecha  |  Lia: mitad INFERIOR derecha
export const TITO_ZONE = { xMin:2.5, xMax:7.5, yMin:0.3,  yMax:5.5  } as const;
export const LIA_ZONE  = { xMin:2.5, xMax:7.5, yMin:-5.5, yMax:-0.3 } as const;

export const CAM_PLAY_POS:  [number,number,number] = [-0.8, 0, 18];
export const CAM_PLAY_LOOK: [number,number,number] = [-0.8, 0,  0];

export const DOG_SPEED          = 1.35;
export const SHARK_SPEED_CHASE  = 1.35;
export const SHARK_SPEED_ATTACK = 5.5;
export const STUN_DURATION      = 2.0;
export const ATTACK_TIMEOUT     = 10.0;
export const BLINK_DURATION     = 2.5;

export const PAIR_COLORS = [
  '#ff6b6b','#ffd93d','#6bcb77','#4d96ff',
  '#c77dff','#ff9a3c','#3de0ff','#ff3d77',
  '#55efc4','#fdcb6e','#a29bfe','#fd79a8',
];
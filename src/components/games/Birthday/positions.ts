import type { CamPose } from '../../three/ResponsiveRig';
import type { BirthdayStage } from './timings';

/**
 * Altura de la superficie de la torta EN COORDENADAS LOCALES del grupo de la
 * torta, que es donde se clavan las velas y se escribe el texto.
 *
 * Es la suma de los dos pisos (0.22 + 0.18). Si se cambia la altura de algún
 * piso en Cake.tsx hay que actualizar este número, o las velas quedan
 * flotando en el aire.
 */
export const CAKE_TOP_Y = 0.4;

/** Altura de la superficie de la torta en coordenadas del mundo. */
export const CAKE_TOP_WORLD_Y = 0.55 + CAKE_TOP_Y;

/** Radio del círculo de velas sobre la torta. */
export const CANDLE_RING_RADIUS = 0.3;

/** Dónde reposa la torta una vez entregada. */
export const CAKE_POS: [number, number, number] = [0, 0.55, 0];

/** Desde dónde entran corriendo los perros. */
export const DOG_START_Z = -13;
/**
 * Los perros se quedan FLANQUEANDO la mesa y algo por delante de ella
 * (z positivo = hacia la cámara). Si se quedaran detrás, la mesa los taparía
 * por completo y no se les vería la carrera ni los gorritos.
 */
export const TITO_REST: [number, number, number] = [1.15, 0, 0.85];
export const LIA_REST: [number, number, number] = [-1.15, 0, 0.85];

/**
 * Ajuste del gorro sobre la cabeza, en fracciones del alto del propio perro.
 * y: 0.95 = casi arriba del todo; z: 0.22 = un poco hacia el hocico.
 * Si queda flotando o hundido, estos son los dos únicos números que tocar.
 */
export const HAT_HEAD_OFFSET = { y: 0.95, z: 0.22 };

/**
 * Poses de cámara por fase.
 *
 * Son las de una pantalla ancha. ResponsiveRig las corrige solo en vertical:
 * ensancha el campo de visión y retrocede, así la torta no se recorta en un
 * móvil sin necesidad de una segunda tabla de poses para móvil.
 */
const POSES = {
  wide:    { position: [0, 1.25, 3.3],  lookAt: [0, 0.75, -0.4],       fov: 55 },
  handOff: { position: [0, 1.35, 2.3],  lookAt: [0, 0.85, 0],          fov: 52 },
  // Mirada en picado sobre la torta: es la única forma de leer el texto,
  // que está escrito en plano sobre la superficie.
  cake:    { position: [0, 1.85, 1.75], lookAt: [0, CAKE_TOP_WORLD_Y, 0], fov: 46 },
  dark:    { position: [0, 1.4, 5.2],   lookAt: [0, 1.1, 0],           fov: 58 },
  reading: { position: [0, 1.3, 3.2],   lookAt: [0, 1.15, 0],          fov: 50 },
} satisfies Record<string, CamPose>;

const STAGE_POSE: Record<BirthdayStage, keyof typeof POSES> = {
  idle: 'wide',
  intro: 'wide',
  dogsRunIn: 'wide',
  handOff: 'handOff',
  zoomCake: 'cake',
  candlesRising: 'cake',
  ringComplete: 'cake',
  dimming: 'cake',
  awaitBlow: 'cake',
  candlesOut: 'cake',
  pullBack: 'dark',
  letterIncoming: 'dark',
  letterOpening: 'reading',
  reading: 'reading',
  finale: 'reading',
};

export function poseFor(stage: BirthdayStage): CamPose {
  return POSES[STAGE_POSE[stage]];
}

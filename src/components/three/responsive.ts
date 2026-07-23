import * as THREE from 'three';

export interface PortraitAdjustOptions {
  /**
   * Proporción (ancho/alto) para la que se compuso la escena. En ese aspect
   * la cámara muestra exactamente lo que el diseñador pensó. Por debajo (más
   * vertical) se corrige; por encima simplemente se ve un poco más a los lados.
   */
  refAspect?: number;
  /** Tope del fov vertical para que las pantallas muy altas no se deformen. */
  maxFov?: number;
  /**
   * Cuánto retrocede la cámara (en unidades de mundo) por cada radián de campo
   * horizontal que no se pudo recuperar solo ensanchando el fov. Al llegar al
   * tope de fov, en vez de deformar la escena la cámara se aleja para que
   * todo lo importante siga cabiendo.
   */
  dollyPerRad?: number;
}

export interface PortraitAdjust {
  /** fov vertical final que debe tener la cámara. */
  fov: number;
  /** Cuánto alejar la cámara del punto de mira, en unidades de mundo. */
  dollyBack: number;
}

/**
 * El problema de fondo: una cámara perspectiva mantiene constante su fov
 * *vertical*. Al estrecharse la pantalla (móvil vertical) el fov horizontal se
 * encoge y la escena se recorta por los lados. Esto pasaba en varios juegos.
 *
 * La corrección exacta —y no una aproximación lineal— es preservar el fov
 * horizontal que había en `refAspect`. Cuando eso exigiría un fov vertical
 * absurdo (pantallas muy altas), se topa el fov y el resto se compensa
 * alejando la cámara. Así funciona para *cualquier* tamaño de pantalla.
 */
export function portraitAdjust(
  aspect: number,
  baseFov: number,
  { refAspect = 1.5, maxFov = 84, dollyPerRad = 3.2 }: PortraitAdjustOptions = {},
): PortraitAdjust {
  const safeAspect = Math.max(aspect, 0.2);
  const vRad = THREE.MathUtils.degToRad(baseFov);

  // fov horizontal que se ve en la proporción de referencia: es el que
  // queremos conservar cueste lo que cueste.
  const hRef = 2 * Math.atan(Math.tan(vRad / 2) * refAspect);

  // fov vertical necesario en la proporción actual para conservar hRef.
  const vNeeded = 2 * Math.atan(Math.tan(hRef / 2) / safeAspect);
  const vTarget = Math.max(vRad, Math.min(vNeeded, THREE.MathUtils.degToRad(maxFov)));

  // Lo que el fov (ya topado) alcanza a mostrar en horizontal.
  const hAchieved = 2 * Math.atan(Math.tan(vTarget / 2) * safeAspect);
  const hDeficit = Math.max(0, hRef - hAchieved);

  return {
    fov: THREE.MathUtils.radToDeg(vTarget),
    dollyBack: hDeficit * dollyPerRad,
  };
}

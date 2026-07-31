import { useMemo } from 'react';
import useIsMobile from '../../hooks/useIsMobile';

/**
 * Ajustes de calidad compartidos por las nueve escenas 3D.
 *
 * Cada juego los tenía a ojo (uno con dpr 2 y antialias, otro con 1.5, otro sin
 * nada), así que la fluidez dependía de en qué juego entrabas. Aquí se decide
 * una vez, mirando de qué es capaz el dispositivo.
 *
 * Las tres decisiones que más se notan:
 *
 *   · dpr. Es el multiplicador que más cuesta: a dpr 3 (un móvil moderno) se
 *     dibujan NUEVE veces más píxeles que a dpr 1. Se limita a 1,5 en móvil.
 *
 *   · antialias. Cuando hay EffectComposer no sirve de nada: la escena se pinta
 *     en un framebuffer intermedio y el MSAA del canvas nunca llega a aplicarse.
 *     Se paga el coste sin ver el resultado.
 *
 *   · performance.min. Es el regulador automático de react-three-fiber: si los
 *     fotogramas se alargan, baja la resolución sola y la sube al soltar. Es lo
 *     que evita que un momento de carga deje la escena a tirones.
 */

/** Núcleos de CPU y memoria como aproximación a "teléfono de gama baja". */
function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as { deviceMemory?: number }).deviceMemory ?? 4;
  return cores <= 4 || mem <= 4;
}

export interface CanvasQuality {
  dpr: [number, number];
  gl: {
    antialias: boolean;
    powerPreference: 'high-performance';
    /** Sin buffer de profundidad de estarcido no se ahorra nada útil aquí. */
    stencil: false;
    /** El canvas no necesita conservar el dibujo entre fotogramas. */
    preserveDrawingBuffer: false;
  };
  performance: { min: number; max: number; debounce: number };
  /** Resolución del mapa de sombras, para las escenas que proyectan sombra. */
  shadowMapSize: number;
  /** Multiplicador para contar partículas, estrellas y demás adornos. */
  detail: number;
  isMobile: boolean;
}

/**
 * @param withPostprocessing true si la escena monta un EffectComposer.
 */
export function useCanvasQuality(withPostprocessing = true): CanvasQuality {
  const isMobile = useIsMobile();

  return useMemo(() => {
    const lowEnd = isMobile && isLowEndDevice();
    const maxDpr = lowEnd ? 1 : isMobile ? 1.5 : 2;

    return {
      dpr: [1, maxDpr] as [number, number],
      gl: {
        antialias: !withPostprocessing && !isMobile,
        powerPreference: 'high-performance' as const,
        stencil: false as const,
        preserveDrawingBuffer: false as const,
      },
      // min 0.4: si hace falta, se permite bajar hasta el 40 % de la resolución
      // antes que perder fotogramas. Mejor una imagen algo más blanda que una
      // escena a tirones, sobre todo en una app que busca calmar.
      performance: { min: 0.4, max: 1, debounce: 180 },
      shadowMapSize: lowEnd ? 512 : isMobile ? 1024 : 2048,
      detail: lowEnd ? 0.4 : isMobile ? 0.6 : 1,
      isMobile,
    };
  }, [isMobile, withPostprocessing]);
}

export default useCanvasQuality;

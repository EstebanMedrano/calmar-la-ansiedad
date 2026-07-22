import { useMediaQuery } from './useIsMobile';

/**
 * true si el sistema tiene activado "reducir movimiento".
 *
 * En una app pensada para calmar la ansiedad esto importa más que en otras:
 * hay personas a las que el movimiento continuo les provoca justo lo contrario
 * de lo que buscamos (y a algunas les marea). Donde se use, la animación no
 * debe desaparecer sin más: el resultado final tiene que verse igual,
 * solo que sin el recorrido animado.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export default useReducedMotion;

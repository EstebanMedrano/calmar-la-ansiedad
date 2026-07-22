import { useEffect, useState } from 'react';

/**
 * Detección de móvil compartida por toda la app.
 *
 * Antes esto vivía como función privada dentro de Memorama.tsx y usaba
 * solo el evento 'resize'. Se usa matchMedia porque en iOS el 'resize'
 * no siempre dispara al rotar el teléfono, y ahí es justo cuando hace
 * falta recalcular la escena 3D.
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Sincroniza por si la query cambió entre el render y el efecto
    setMatches(mql.matches);

    // Safari < 14 solo tiene addListener
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [query]);

  return matches;
}

/**
 * true en teléfonos y tablets pequeñas.
 * Se combina ancho + puntero grueso: un portátil táctil de 1440px no es "móvil",
 * y un teléfono en horizontal puede superar los 1024px de ancho pero sigue siéndolo.
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 1023px), (pointer: coarse) and (max-width: 1279px)');
}

/** true cuando la pantalla es más alta que ancha. */
export function useIsPortrait(): boolean {
  return useMediaQuery('(orientation: portrait)');
}

/** true en móvil horizontal: hay muy poca altura para los HUD. */
export function useIsShortScreen(): boolean {
  return useMediaQuery('(max-height: 500px) and (orientation: landscape)');
}

export { useMediaQuery };
export default useIsMobile;

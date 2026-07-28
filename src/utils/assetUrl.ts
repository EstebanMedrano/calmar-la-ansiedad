/**
 * Prepend Vite's base URL to any public asset path.
 *
 * En desarrollo:  base = '/'   → '/assets/3D/tito.glb'
 * En producción:  base = '/calmar-la-ansiedad/' → '/calmar-la-ansiedad/assets/3D/tito.glb'
 *
 * Uso:  assetUrl('/assets/3D/tito.glb')
 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, ''); // quita trailing slash
  const p    = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
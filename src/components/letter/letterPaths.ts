import * as THREE from 'three';

/**
 * Recorrido "hipnótico" para la carta de la escena Carta.
 *
 * No es una línea recta ni un arco simple: describe una especie de lazo que
 * cruza el encuadre, se aleja y vuelve, para que la mirada la siga. Los puntos
 * de control se generan alrededor del eje que une origen y destino, así la
 * curva funciona sea cual sea la posición de la cámara.
 */
export function makeHypnoticPath(from: THREE.Vector3, to: THREE.Vector3): THREE.CatmullRomCurve3 {
  const axis = to.clone().sub(from);
  const len = axis.length();
  const dir = axis.clone().normalize();

  // Dos vectores perpendiculares al recorrido, para desviarse a los lados
  // y hacia arriba sin depender de los ejes globales.
  const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
  if (side.lengthSq() < 0.01) side.set(1, 0, 0); // recorrido casi vertical
  const up = new THREE.Vector3().crossVectors(side, dir).normalize();

  const at = (t: number) => from.clone().addScaledVector(axis, t);
  const amp = len * 0.22;

  return new THREE.CatmullRomCurve3(
    [
      from.clone(),
      at(0.18).addScaledVector(side, amp).addScaledVector(up, amp * 0.55),
      at(0.38).addScaledVector(side, -amp * 0.9).addScaledVector(up, amp * 0.95),
      at(0.58).addScaledVector(side, amp * 0.75).addScaledVector(up, amp * 0.4),
      at(0.78).addScaledVector(side, -amp * 0.3).addScaledVector(up, amp * 0.6),
      to.clone(),
    ],
    false,
    'catmullrom',
    0.5,
  );
}

/**
 * Recorrido de aproximación para el final del regalo: la carta llega desde muy
 * lejos en la oscuridad.
 *
 * Describe una S suave en vez de venir recta hacia el objetivo, porque una
 * trayectoria frontal pura no se percibe como movimiento: el objeto solo
 * parece crecer. La desviación lateral es la que da sensación de vuelo.
 */
export function makeApproachPath(from: THREE.Vector3, to: THREE.Vector3): THREE.CatmullRomCurve3 {
  const axis = to.clone().sub(from);
  const dir = axis.clone().normalize();
  const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
  if (side.lengthSq() < 0.01) side.set(1, 0, 0);

  const at = (t: number) => from.clone().addScaledVector(axis, t);
  const amp = axis.length() * 0.1;

  return new THREE.CatmullRomCurve3(
    [
      from.clone(),
      at(0.3).addScaledVector(side, amp).addScaledVector(new THREE.Vector3(0, 1, 0), amp * 0.5),
      at(0.62).addScaledVector(side, -amp * 0.8).addScaledVector(new THREE.Vector3(0, 1, 0), amp * 0.3),
      at(0.85).addScaledVector(side, amp * 0.25),
      to.clone(),
    ],
    false,
    'catmullrom',
    0.5,
  );
}

/** Suavizado de entrada y salida: arranca despacio, acelera y frena al llegar. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Frenada suave: útil cuando algo debe llegar y detenerse sin rebotar. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

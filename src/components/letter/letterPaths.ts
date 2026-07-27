import * as THREE from 'three';

/**
 * Recorrido "hipnótico" para la carta de la escena Carta.
 *
 * No es una línea recta ni un arco simple: describe una especie de lazo que
 * cruza el encuadre, se aleja y vuelve, para que la mirada la siga. Los puntos
 * de control se generan alrededor del eje que une origen y destino, así la
 * curva funciona sea cual sea la posición de la cámara.
 */
export function makeHypnoticPath(
  from: THREE.Vector3,
  to: THREE.Vector3,
  /**
   * Amplitud del lazo, en fracción de la longitud del recorrido.
   *
   * El 0.22 por defecto está pensado para recorridos cortos. En uno largo hay
   * que bajarlo bastante: con 0.22 sobre cincuenta unidades la carta se va
   * once unidades a un lado y en un móvil vertical (fov horizontal de ~17°)
   * se sale del encuadre a mitad de vuelo.
   */
  ampFactor = 0.22,
): THREE.CatmullRomCurve3 {
  const axis = to.clone().sub(from);
  const len = axis.length();
  const dir = axis.clone().normalize();

  // Dos vectores perpendiculares al recorrido, para desviarse a los lados
  // y hacia arriba sin depender de los ejes globales.
  const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
  if (side.lengthSq() < 0.01) side.set(1, 0, 0); // recorrido casi vertical
  const up = new THREE.Vector3().crossVectors(side, dir).normalize();

  const at = (t: number) => from.clone().addScaledVector(axis, t);
  const amp = len * ampFactor;

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

/**
 * Sombra en el suelo de un recorrido aéreo.
 *
 * La usa el perro de la escena Carta: corre por el suelo persiguiendo la carta,
 * así que sigue la misma silueta pero aplanada en y=0. Las desviaciones
 * laterales se reducen (`lateralDamp`) porque la curva de la carta se abre
 * más de diez unidades a los lados y un perro haciendo ese zigzag se ve
 * ridículo; y el tramo final se funde con `end`, para que acabe siempre en un
 * punto conocido del encuadre en vez de donde caiga la curva.
 */
export function makeGroundShadowPath(
  air: THREE.CatmullRomCurve3,
  end: THREE.Vector3,
  lateralDamp = 0.35,
  samples = 28,
): THREE.CatmullRomCurve3 {
  const from = air.getPointAt(0);
  const to = air.getPointAt(1);
  const straight = new THREE.Vector3();
  const p = new THREE.Vector3();
  const pts: THREE.Vector3[] = [];

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    air.getPointAt(t, p);
    straight.lerpVectors(from, to, t);

    const x = straight.x + (p.x - straight.x) * lateralDamp;
    const z = straight.z + (p.z - straight.z) * lateralDamp;

    // Fundido hacia el punto de reposo en el último cuarto del recorrido.
    const k = smoothstep(t, 0.72, 1);
    pts.push(
      new THREE.Vector3(
        THREE.MathUtils.lerp(x, end.x, k),
        0,
        THREE.MathUtils.lerp(z, end.z, k),
      ),
    );
  }

  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
}

/** Interpolación suave entre dos umbrales, con derivada nula en los extremos. */
export function smoothstep(t: number, edge0: number, edge1: number): number {
  const x = THREE.MathUtils.clamp((t - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

/** Suavizado de entrada y salida: arranca despacio, acelera y frena al llegar. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Entrada y salida MUY suaves.
 *
 * Alternativa a easeInOutCubic para recorridos largos: su velocidad máxima es
 * 1.57 veces la media en vez de 2, así que el tramo central no se dispara.
 * Es la que usa el vuelo de diez segundos de la carta, que tenía que leerse
 * tranquilo de principio a fin.
 */
export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/** Frenada suave: útil cuando algo debe llegar y detenerse sin rebotar. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

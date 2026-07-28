import { useEffect, useMemo, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import type { Group } from 'three';
import { assetUrl } from '../utils/assetUrl';

export const TITO_PATH = assetUrl('/assets/3D/tito.glb');
export const LIA_PATH = assetUrl('/assets/3D/lia.glb');

interface UseDogModelOptions {
  /** Reproduce automáticamente el primer clip de animación. Por defecto true. */
  autoPlay?: boolean;
  /** Qué clip reproducir cuando autoPlay está activo. Por defecto el 0. */
  clipIndex?: number;
  /** Duración del fundido de entrada de la animación, en segundos. */
  fadeIn?: number;
}

interface UseDogModelResult {
  /** Copia independiente del modelo. Cada instancia necesita su propio esqueleto. */
  scene: THREE.Group;
  actions: ReturnType<typeof useAnimations>['actions'];
  /**
   * Cuánto hay que subir el modelo para que las patas queden en Y=0.
   * Aplícalo a un sub-grupo interno, NO al grupo que mueves por la escena,
   * o tendrás el desplazamiento aplicado dos veces.
   */
  footOffset: number;
  /**
   * Alto del modelo sin escalar. Sirve para colocar accesorios (un gorro,
   * por ejemplo) sin tener que adivinar la altura a ojo.
   */
  modelHeight: number;
}

/**
 * Carga uno de los perros (Tito o Lia) con el boilerplate ya resuelto.
 *
 * Este código estaba duplicado en 7 archivos distintos. La versión de
 * RitualFire/DogCompanions era la única que corregía la altura de las patas
 * con Box3, así que es la que se generalizó aquí.
 *
 * Uso:
 *   const groupRef = useRef<Group>(null);
 *   const { scene, footOffset } = useDogModel(TITO_PATH, groupRef);
 *   ...
 *   <group ref={groupRef}>
 *     <group position={[0, footOffset, 0]}>
 *       <primitive object={scene} scale={scale} />
 *     </group>
 *   </group>
 */
export function useDogModel(
  path: string,
  groupRef: React.RefObject<Group | null>,
  options: UseDogModelOptions = {},
): UseDogModelResult {
  const { autoPlay = true, clipIndex = 0, fadeIn = 0.3 } = options;

  const { scene: rawScene, animations } = useGLTF(path);
  // clone(true) da a cada instancia su propio esqueleto: sin esto, dos perros
  // en la misma escena comparten la animación y se mueven en espejo.
  const scene = useMemo(() => rawScene.clone(true), [rawScene]);
  const { actions } = useAnimations(animations, groupRef);

  const [footOffset, setFootOffset] = useState(0);
  const [modelHeight, setModelHeight] = useState(1);
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    setFootOffset(box.min.y < -0.01 ? -box.min.y : 0);
    setModelHeight(Math.max(0.01, box.max.y - box.min.y));
  }, [scene]);

  useEffect(() => {
    if (!autoPlay) return;
    const names = Object.keys(actions);
    const clip = names[clipIndex];
    if (!clip) return;
    const action = actions[clip];
    action?.reset().fadeIn(fadeIn).play();
    return () => {
      action?.fadeOut(fadeIn);
    };
  }, [actions, autoPlay, clipIndex, fadeIn]);

  return { scene, actions, footOffset, modelHeight };
}

/**
 * Precarga los dos modelos. Llamar una vez al arrancar la app para que las
 * escenas que dependen de ellos (regalo, carta) no muestren un hueco vacío
 * mientras descargan.
 */
export function preloadDogs() {
  useGLTF.preload(TITO_PATH);
  useGLTF.preload(LIA_PATH);
}

export default useDogModel;
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Group } from 'three';
import useDogModel, { LIA_PATH } from '../../../hooks/useDogModel';
import { easeInOutCubic } from '../../letter/letterPaths';

interface CourierDogProps {
  /** Recorrido que sigue, el mismo que después seguirá la carta. */
  path: THREE.CatmullRomCurve3;
  active: boolean;
  duration?: number;
  scale?: number;
  /** Fracción del recorrido en la que suelta la carta. */
  releaseAt?: number;
  onRelease?: () => void;
}

/**
 * Lia trayendo la carta.
 *
 * Recorre la misma curva que después seguirá la carta, la suelta a un 85% del
 * camino y sale del encuadre. La carta continúa sola hasta la cámara.
 */
export default function CourierDog({
  path,
  active,
  duration = 3.8,
  scale = 0.42,
  releaseAt = 0.85,
  onRelease,
}: CourierDogProps) {
  const groupRef = useRef<Group>(null);
  const { scene, footOffset } = useDogModel(LIA_PATH, groupRef);

  const t = useRef(0);
  const released = useRef(false);
  const tmpPos = useRef(new THREE.Vector3());
  const tmpTan = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;

    if (!active) {
      g.visible = false;
      t.current = 0;
      released.current = false;
      return;
    }

    g.visible = true;
    t.current = Math.min(1, t.current + delta / duration);
    const eased = easeInOutCubic(t.current);

    path.getPointAt(eased, tmpPos.current);
    g.position.copy(tmpPos.current);

    // Mira hacia donde vuela
    path.getTangentAt(eased, tmpTan.current);
    lookTarget.current.copy(tmpPos.current).add(tmpTan.current);
    g.lookAt(lookTarget.current);

    // Balanceo de vuelo y trotecillo
    g.rotateZ(Math.sin(t.current * Math.PI * 4) * 0.16);
    g.position.y += Math.sin(performance.now() / 180) * 0.05;

    // Se desvanece tras soltar la carta
    if (t.current > releaseAt) {
      const fade = (t.current - releaseAt) / (1 - releaseAt);
      g.scale.setScalar(scale * (1 - fade * 0.7));
      if (!released.current) {
        released.current = true;
        onRelease?.();
      }
    } else {
      g.scale.setScalar(scale);
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <group position={[0, footOffset, 0]}>
        <primitive object={scene} />
      </group>
      {/* Estela mágica que la acompaña */}
      <pointLight color="#e879f9" distance={3.5} decay={2} intensity={1.4} />
    </group>
  );
}

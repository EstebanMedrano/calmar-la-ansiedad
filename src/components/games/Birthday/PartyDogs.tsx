import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Group } from 'three';
import useDogModel, { TITO_PATH, LIA_PATH } from '../../../hooks/useDogModel';
import PartyHat from './PartyHat';
import { DOG_START_Z, TITO_REST, LIA_REST, HAT_HEAD_OFFSET } from './positions';
import { easeOutCubic } from '../../letter/letterPaths';

interface PartyDogProps {
  path: string;
  rest: [number, number, number];
  scale: number;
  /** 0 = fuera de plano, 1 = en su sitio. */
  progressRef: React.MutableRefObject<number>;
  hatColor: string;
  bobOffset: number;
}

function PartyDog({ path, rest, scale, progressRef, hatColor, bobOffset }: PartyDogProps) {
  const groupRef = useRef<Group>(null);
  const { scene, footOffset, modelHeight } = useDogModel(path, groupRef);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;

    const t = easeOutCubic(THREE.MathUtils.clamp(progressRef.current, 0, 1));
    g.position.set(
      rest[0] * t,
      rest[1],
      THREE.MathUtils.lerp(DOG_START_Z, rest[2], t),
    );

    // Trotecillo mientras se acerca; respiración leve al llegar
    const moving = t < 0.98;
    g.position.y += moving
      ? Math.abs(Math.sin(performance.now() / 95 + bobOffset)) * 0.07
      : Math.sin(performance.now() / 900 + bobOffset) * 0.012;

    // Mira hacia la cámara
    g.rotation.y = Math.PI;
  });

  return (
    <group ref={groupRef}>
      <group position={[0, footOffset, 0]}>
        <primitive object={scene} scale={scale} />
        {/* El gorro se coloca a partir del alto real del modelo, no de un
            número fijo: así queda bien aunque Tito y Lia tengan tamaños
            distintos. HAT_HEAD_OFFSET son fracciones de ese alto, por si
            hay que subirlo o adelantarlo un poco. */}
        <group
          position={[
            0,
            modelHeight * scale * HAT_HEAD_OFFSET.y,
            modelHeight * scale * HAT_HEAD_OFFSET.z,
          ]}
          rotation={[0.16, 0, 0.12]}
          scale={modelHeight * scale * 1.1}
        >
          <PartyHat color={hatColor} />
        </group>
      </group>
    </group>
  );
}

interface PartyDogsProps {
  /** 0 = fuera de plano, 1 = ya han llegado. */
  progressRef: React.MutableRefObject<number>;
  isMobile: boolean;
}

/** Tito y Lia entrando corriendo con sus gorritos. */
export default function PartyDogs({ progressRef, isMobile }: PartyDogsProps) {
  const s = isMobile ? 0.75 : 1;
  return (
    <group>
      <PartyDog
        path={TITO_PATH}
        rest={TITO_REST}
        scale={0.8 * s}
        progressRef={progressRef}
        hatColor="#60a5fa"
        bobOffset={0}
      />
      <PartyDog
        path={LIA_PATH}
        rest={LIA_REST}
        scale={0.72 * s}
        progressRef={progressRef}
        hatColor="#e879f9"
        bobOffset={1.7}
      />
    </group>
  );
}

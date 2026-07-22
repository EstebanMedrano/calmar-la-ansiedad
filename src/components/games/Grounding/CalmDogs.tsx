import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import useDogModel, { TITO_PATH, LIA_PATH } from '../../../hooks/useDogModel';

interface CalmDogProps {
  path: string;
  position: [number, number, number];
  scale: number;
  rotationY: number;
  seed: number;
}

function CalmDog({ path, position, scale, rotationY, seed }: CalmDogProps) {
  const groupRef = useRef<Group>(null);
  const { scene, footOffset } = useDogModel(path, groupRef);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    // Solo respiración. En este juego los perros no hacen nada más a
    // propósito: el ejercicio pide atención a lo de fuera, y un perro
    // correteando se la robaría entera.
    const t = state.clock.elapsedTime;
    g.position.y = position[1] + Math.sin(t * 0.55 + seed) * 0.02;
    g.rotation.y = rotationY + Math.sin(t * 0.22 + seed) * 0.07;
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      <group position={[0, footOffset, 0]}>
        <primitive object={scene} scale={scale} />
      </group>
    </group>
  );
}

/** Tito y Lia acompañando, tranquilos. */
export default function CalmDogs({ isMobile }: { isMobile: boolean }) {
  const s = isMobile ? 0.8 : 1;
  return (
    <group>
      <CalmDog path={TITO_PATH} position={[1.5, 0, 1.1]} scale={0.5 * s} rotationY={-0.5} seed={0} />
      <CalmDog path={LIA_PATH} position={[-1.6, 0, 0.9]} scale={0.45 * s} rotationY={0.6} seed={1.9} />
    </group>
  );
}

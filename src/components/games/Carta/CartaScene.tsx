import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import CustomStars from '../../three/CustomStars';
import ResponsiveRig from '../../three/ResponsiveRig';
import LetterPaper from '../../letter/LetterPaper';
import type { LetterState } from '../../letter/LetterPaper';
import CourierDog from './CourierDog';
import { makeHypnoticPath } from '../../letter/letterPaths';
import type { CartaStage } from './stages';

interface CartaSceneProps {
  stage: CartaStage;
  isMobile: boolean;
  onDogRelease: () => void;
  onLetterArrived: () => void;
  onLetterOpened: () => void;
}

const CAMERA_POSE = {
  position: [0, 1.2, 3.4] as [number, number, number],
  lookAt: [0, 1.15, 0] as [number, number, number],
  fov: 52,
};

/** De dónde viene la carta y dónde acaba, delante de quien mira. */
const ORIGIN = new THREE.Vector3(-7, 4.5, -14);
const DESTINATION = new THREE.Vector3(0, 1.15, 1.9);

function letterStateFor(stage: CartaStage): LetterState {
  switch (stage) {
    case 'idle':
    case 'approach':
      return 'hidden';
    case 'handoff':
      return 'flying';
    case 'unfolding':
      return 'unfolding';
    case 'reading':
    case 'done':
      return 'open';
  }
}

export default function CartaScene({
  stage,
  isMobile,
  onDogRelease,
  onLetterArrived,
  onLetterOpened,
}: CartaSceneProps) {
  const path = useMemo(() => makeHypnoticPath(ORIGIN, DESTINATION), []);

  return (
    <>
      <color attach="background" args={['#0a0a1f']} />
      <fog attach="fog" args={['#0a0a1f', 8, 34]} />

      <ambientLight intensity={0.22} color="#8ab4ff" />
      <hemisphereLight args={['#c9a8ff', '#0a0a1f', 0.35]} />
      {/* Luz de acento que da volumen al perro cuando cruza */}
      <pointLight position={[-4, 5, -3]} color="#e879f9" intensity={1.6} distance={22} decay={2} />

      <CustomStars count={isMobile ? 2500 : 6000} opacity={0.85} />

      <Suspense fallback={null}>
        <CourierDog
          path={path}
          active={stage === 'approach'}
          scale={isMobile ? 0.34 : 0.42}
          onRelease={onDogRelease}
        />
      </Suspense>

      <LetterPaper
        state={letterStateFor(stage)}
        flightPath={path}
        flightDuration={1.6}
        attachToCamera
        // Ver la nota en BirthdayScene: desdoblada ocupa el triple de ancho.
        holdDistance={isMobile ? 1.9 : 1.6}
        scale={isMobile ? 0.85 : 1}
        onFlightComplete={onLetterArrived}
        onOpened={onLetterOpened}
      />

      <ResponsiveRig pose={CAMERA_POSE} fovGain={26} dolly={1.9} lerp={0.05} />
    </>
  );
}

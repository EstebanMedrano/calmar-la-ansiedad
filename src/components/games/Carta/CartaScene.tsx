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
      <color attach="background" args={['#14122e']} />
      <fog attach="fog" args={['#14122e', 10, 40]} />

      <ambientLight intensity={0.5} color="#a9c4ff" />
      <hemisphereLight args={['#d4b6ff', '#191634', 0.7]} />
      {/* Luna suave que da relieve al conjunto */}
      <directionalLight position={[5, 8, 3]} color="#cdd8ff" intensity={0.55} />
      {/* Luz de acento que da volumen al perro cuando cruza */}
      <pointLight position={[-4, 5, -3]} color="#e879f9" intensity={2.2} distance={26} decay={2} />
      {/* Relleno cálido delante de la cámara: la carta y el perro llegan con vida */}
      <pointLight position={[0, 2, 3]} color="#ffd9a8" intensity={1.1} distance={12} decay={2} />

      <CustomStars count={isMobile ? 2500 : 6000} opacity={0.85} />

      <Suspense fallback={null}>
        <CourierDog
          path={path}
          active={stage === 'approach'}
          duration={4.8}
          scale={isMobile ? 0.5 : 0.62}
          onRelease={onDogRelease}
        />
      </Suspense>

      <LetterPaper
        state={letterStateFor(stage)}
        flightPath={path}
        flightDuration={2.3}
        unfoldDuration={1.6}
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

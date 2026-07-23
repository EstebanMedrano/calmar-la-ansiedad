import { Suspense, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GamePhase } from './ReverseText';
import ArcadeEnvironment from './ArcadeEnvironment';
import WordStage from './WordStage';
import DogActors from './DogActors';
import ClawMachine from './ClawMachine';
import ShardParticles from './ShardParticles';
import { portraitAdjust } from '../../three/responsive';

// Pose fija con la que se compuso la escena (Tito a la derecha en x=5,
// Lia a la izquierda en x=-5). En vertical hay que ensanchar el campo y
// alejar la cámara o esos dos se quedan fuera del encuadre.
const CAM_POS = new THREE.Vector3(0, 2.5, 10.5);
const CAM_LOOK = new THREE.Vector3(0, 1.5, 0);
const BASE_FOV = 54;

function CameraSetup() {
  const { camera } = useThree();
  const dir = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());

  useFrame((state) => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = state.size.width / state.size.height;
    const { fov, dollyBack } = portraitAdjust(aspect, BASE_FOV, {
      refAspect: 1.5,
      maxFov: 84,
      dollyPerRad: 6.5,
    });

    dir.current.copy(CAM_POS).sub(CAM_LOOK).normalize();
    target.current.copy(CAM_POS).addScaledVector(dir.current, dollyBack);
    camera.position.lerp(target.current, 0.12);

    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = THREE.MathUtils.lerp(cam.fov, fov, 0.12);
      cam.updateProjectionMatrix();
    }
    camera.lookAt(CAM_LOOK);
  });

  return null;
}

interface Props {
  phrase:      string;
  phraseColor: string;
  nextPhrase:  string;
  nextColor:   string;
  phase:       GamePhase;
  hasNext:     boolean;
  // ⭐ Nuevas props
  dropletsRef: React.MutableRefObject<THREE.Vector3[]>;
  splashes: { id: number; pos: THREE.Vector3; color: string }[]; // ⭐ CORREGIDO: Añadido el campo color
  onDropletImpact: (pos: THREE.Vector3) => void;
}

export default function ReverseScene({
  phrase, phraseColor, nextPhrase, nextColor, phase, hasNext,
  dropletsRef, splashes, onDropletImpact
}: Props) {
  return (
    <>
      <CameraSetup />
      {/* ⭐ Pasadas a ArcadeEnvironment */}
      <ArcadeEnvironment dropletsRef={dropletsRef} splashes={splashes} onDropletImpact={onDropletImpact} />
      <WordStage phrase={phrase} color={phraseColor} phase={phase} />
      <Suspense fallback={null}>
        {/* ⭐ Pasadas a DogActors */}
        <DogActors phase={phase} dropletsRef={dropletsRef} />
      </Suspense>
      <ClawMachine 
        phase={phase} 
        nextPhrase={nextPhrase} 
        nextColor={nextColor} 
        hasNext={hasNext}
      />
      <ShardParticles active={phase === 'success_break'} color={phraseColor} />
    </>
  );
}
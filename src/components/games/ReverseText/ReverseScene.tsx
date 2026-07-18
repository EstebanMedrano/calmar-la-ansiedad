import { Suspense, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { GamePhase } from './ReverseText';
import ArcadeEnvironment from './ArcadeEnvironment';
import WordStage from './WordStage';
import DogActors from './DogActors';
import ClawMachine from './ClawMachine';
import ShardParticles from './ShardParticles';

function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => { camera.lookAt(0, 1.5, 0); }, [camera]);
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
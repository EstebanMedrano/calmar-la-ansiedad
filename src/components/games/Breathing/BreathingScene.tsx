// BreathingScene.tsx
import { memo } from 'react';
import * as THREE from 'three';
import IllusionOrb    from './IllusionOrb';
import CosmicParticles from './CosmicParticles';
import CameraRig      from './CameraRig';
import BreathCarousel from './BreathCarousel';

function BreathingScene({
  phaseRef, progRef,
}: {
  phaseRef: React.MutableRefObject<number>;
  progRef:  React.MutableRefObject<number>;
}) {
  return (
    <>
      {/* 🛑 AUMENTAMOS LA LUZ AMBIENTE DE 0.08 a 0.18 para que los perros siempre tengan un brillo base */ }
      <ambientLight intensity={0.18} />
      {/* Radio 22 > max partícula (17) → nada queda detrás */}
      <mesh renderOrder={-1}>
        <sphereGeometry args={[22, 24, 24]} />
        <meshBasicMaterial color="#010510" side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <CosmicParticles phaseRef={phaseRef} progRef={progRef} />
      <IllusionOrb     phaseRef={phaseRef} progRef={progRef} />
      <BreathCarousel  phaseRef={phaseRef} progRef={progRef} />
      <CameraRig       phaseRef={phaseRef} progRef={progRef} />
    </>
  );
}

export default memo(BreathingScene);
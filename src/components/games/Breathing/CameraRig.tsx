// CameraRig.tsx
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, memo } from 'react';
import * as THREE from 'three';

function CameraRig({ phaseRef, progRef }: { phaseRef: React.MutableRefObject<number>; progRef: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  const baseZ = useRef(5.8);

  useFrame(() => {
    const phase = phaseRef.current;
    const progress = progRef.current;
    let targetZ = baseZ.current;
    if (phase === 0) targetZ = baseZ.current - 0.8 * progress;
    if (phase === 1) targetZ = baseZ.current - 0.8;
    if (phase === 2) targetZ = baseZ.current - 0.8 + 0.8 * progress;

    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.06);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default memo(CameraRig);
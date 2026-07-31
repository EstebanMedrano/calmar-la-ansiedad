import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Phase } from './Puzzle';
import { portraitAdjust } from '../../three/responsive';

const BASE_FOV = 58;

// FIX 4: Cámara más alejada para que entre toda la habitación en móviles
const FIXED: Partial<Record<Phase, { pos: THREE.Vector3; look: THREE.Vector3 }>> = {
  idle:     { pos: new THREE.Vector3(0, 1.8, 6.0),    look: new THREE.Vector3(0, 1.4, -1) },
  calling:  { pos: new THREE.Vector3(3.6, 1.8, 3.5),  look: new THREE.Vector3(4.3, 0.4, 0.8) },
  breaking: { pos: new THREE.Vector3(0, 1.75, -0.5),  look: new THREE.Vector3(0, 1.58, -4.45) },
  puzzle:   { pos: new THREE.Vector3(0, 1.8, 2.5),    look: new THREE.Vector3(0, 1.58, -4.45) },
  complete: { pos: new THREE.Vector3(0, 1.8, 1.2),    look: new THREE.Vector3(0, 1.58, -4.45) },
};

interface Props {
  phase: Phase;
  dogPosRef: React.MutableRefObject<THREE.Vector3>;
}

export default function CameraRig({ phase, dogPosRef }: Props) {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3(0, 1.4, -1));
  const dir = useRef(new THREE.Vector3());
  const adj = useRef(new THREE.Vector3());

  useFrame((state, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = state.size.width / state.size.height;
    // En vertical las fichas sueltas (x = ±2.5) quedaban fuera del encuadre y
    // el juego era imposible. Ensanchamos el campo y, al topar el fov,
    // alejamos la cámara para que entren a cualquier proporción.
    // maxFov 88 y un retroceso algo mayor que antes: con 80 y dollyPerRad 4 las
    // piezas de las columnas exteriores seguían saliéndose por los lados en un
    // móvil vertical (medido en 412x870), y ésas son justo las que hay que
    // arrastrar.
    const { fov, dollyBack } = portraitAdjust(aspect, BASE_FOV, {
      refAspect: 1.5,
      maxFov: 88,
      dollyPerRad: 4.5,
    });
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    // En idle manda OrbitControls la posición; solo aplicamos el fov de arriba.
    if (phase === 'idle') return;

    if (phase === 'intro') {
      const dp = dogPosRef.current;
      const targetCamPos = new THREE.Vector3(
        dp.x * 0.3 - 0.5,
        dp.y + 1.65,
        dp.z + 2.6
      );
      const ease = Math.min(0.13, 5 * dt);
      camera.position.lerp(targetCamPos, ease);
      lookTarget.current.lerp(
        new THREE.Vector3(dp.x * 0.35, dp.y + 0.25, dp.z - 0.2),
        ease
      );
      camera.lookAt(lookTarget.current);
      return;
    }

    const cfg = FIXED[phase];
    if (!cfg) return;
    const ease = Math.min(0.09, 3.8 * dt);
    dir.current.copy(cfg.pos).sub(cfg.look).normalize();
    adj.current.copy(cfg.pos).addScaledVector(dir.current, dollyBack);
    camera.position.lerp(adj.current, ease);
    lookTarget.current.lerp(cfg.look, ease);
    camera.lookAt(lookTarget.current);
  });

  if (phase !== 'idle') return null;

  return (
    <OrbitControls
      enablePan={false}
      enableZoom={false}
      enableDamping
      dampingFactor={0.08}
      target={new THREE.Vector3(0, 1.4, -1)}
      minAzimuthAngle={-0.65}
      maxAzimuthAngle={0.65}
      minPolarAngle={Math.PI / 2 - 0.28}
      maxPolarAngle={Math.PI / 2 + 0.2}
    />
  );
}
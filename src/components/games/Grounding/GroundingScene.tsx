import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AmbientLight, PointLight, Points } from 'three';
import CustomStars from '../../three/CustomStars';
import ResponsiveRig from '../../three/ResponsiveRig';
import SenseOrbs from './SenseOrbs';
import type { OrbData } from './SenseOrbs';
import CalmDogs from './CalmDogs';

interface GroundingSceneProps {
  stepIndex: number;
  accent: string;
  orbs: OrbData[];
  colors: string[];
  isMobile: boolean;
  finished: boolean;
}

const CAMERA_POSE = {
  position: [0, 1.65, 6.2] as [number, number, number],
  lookAt: [0, 1.15, 0] as [number, number, number],
  fov: 50,
};

const FINISH_POSE = {
  position: [0, 2.1, 7.4] as [number, number, number],
  lookAt: [0, 1.3, 0] as [number, number, number],
  fov: 52,
};

/** Siluetas de árboles alrededor del claro. */
function Clearing() {
  const trees = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2 + ((i * 31) % 17) / 30;
        const r = 9 + ((i * 53) % 19) / 5;
        return {
          key: i,
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
          h: 3.2 + ((i * 29) % 13) / 4,
          w: 0.9 + ((i * 17) % 9) / 18,
        };
      }),
    [],
  );

  return (
    <group>
      {/* Suelo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[22, 48]} />
        <meshStandardMaterial color="#151a2e" roughness={0.98} />
      </mesh>

      {trees.map((t) => (
        <mesh key={t.key} position={[t.x, t.h / 2, t.z]}>
          <coneGeometry args={[t.w, t.h, 6]} />
          <meshStandardMaterial color="#0d1120" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Motas de polvo flotando: dan sensación de aire quieto. */
function Motes({ count }: { count: number }) {
  const ref = useRef<Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 9;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = Math.random() * 5;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    // Se mueve el sistema entero, no cada mota: mil actualizaciones de
    // buffer por frame en el móvil no valen la pena para algo decorativo.
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.012;
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.14) * 0.22;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#cfe0ff"
        transparent
        opacity={0.42}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export default function GroundingScene({
  stepIndex,
  accent,
  orbs,
  colors,
  isMobile,
  finished,
}: GroundingSceneProps) {
  const ambientRef = useRef<AmbientLight>(null);
  const accentRef = useRef<PointLight>(null);
  const targetColor = useRef(new THREE.Color(accent));
  const currentColor = useRef(new THREE.Color(accent));

  useFrame((_, dt) => {
    targetColor.current.set(accent);
    // El color del paso actual tiñe el claro poco a poco. El cambio es lento
    // a propósito: un salto de color brusco es justo lo que no quieres en un
    // ejercicio para bajar la activación.
    currentColor.current.lerp(targetColor.current, Math.min(1, dt * 0.9));

    if (accentRef.current) {
      accentRef.current.color.copy(currentColor.current);
      accentRef.current.intensity = finished ? 3.2 : 1.6 + stepIndex * 0.22;
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = finished ? 0.5 : 0.3;
    }
  });

  return (
    <>
      <color attach="background" args={['#080b16']} />
      <fog attach="fog" args={['#080b16', 9, 26]} />

      <ambientLight ref={ambientRef} intensity={0.3} color="#8ea6d8" />
      <hemisphereLight args={['#4a5f9e', '#080b16', 0.35]} />
      {/* Luz del paso actual, en el centro del claro */}
      <pointLight
        ref={accentRef}
        position={[0, 2.2, 0]}
        distance={16}
        decay={2}
        intensity={1.6}
      />

      <CustomStars count={isMobile ? 2200 : 5000} opacity={0.8} />
      <Clearing />
      <Motes count={isMobile ? 120 : 260} />

      <SenseOrbs orbs={orbs} colors={colors} isMobile={isMobile} />

      <Suspense fallback={null}>
        <CalmDogs isMobile={isMobile} />
      </Suspense>

      <ResponsiveRig
        pose={finished ? FINISH_POSE : CAMERA_POSE}
        fovGain={24}
        dolly={2.4}
        lerp={0.035}
        parallax={{ yaw: 5, pitch: 3 }}
      />
    </>
  );
}

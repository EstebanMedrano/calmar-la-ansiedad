import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AmbientLight, PointLight, Points } from 'three';
import CustomStars from '../../three/CustomStars';
import MeadowEnvironment from '../../three/MeadowEnvironment';
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

/**
 * Pinos de tamaño medio rodeando el claro.
 *
 * Cierran el hueco entre el pradito (radio 30) y las montañas del horizonte:
 * sin ellos se ve el salto de una cosa a la otra. Antes eran siluetas planas
 * casi negras a 9 unidades y se comían el encuadre; ahora son verdes, más
 * lejos y algo más altos, para que lean como bosque y no como obstáculos.
 */
function TreeLine() {
  const trees = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2 + ((i * 31) % 17) / 18;
        // Lejos y no muy altos: a 13 unidades tapaban por completo la línea de
        // montañas, que es justo lo que se quería ver al fondo.
        const r = 17 + ((i * 53) % 19) / 2;
        return {
          key: i,
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
          h: 4.2 + ((i * 29) % 13) / 3.2,
          w: 1.1 + ((i * 17) % 9) / 12,
        };
      }),
    [],
  );

  return (
    <group>
      {trees.map((t) => (
        <group key={t.key} position={[t.x, 0, t.z]}>
          {/* Tronco */}
          <mesh position={[0, t.h * 0.12, 0]}>
            <cylinderGeometry args={[t.w * 0.11, t.w * 0.15, t.h * 0.24, 6]} />
            <meshStandardMaterial color="#33261c" roughness={1} />
          </mesh>
          {/* Copa en dos pisos: una sola es un cucurucho, dos ya es un pino */}
          <mesh position={[0, t.h * 0.5, 0]}>
            <coneGeometry args={[t.w, t.h * 0.68, 7]} />
            <meshStandardMaterial color="#1f5c3a" roughness={1} flatShading />
          </mesh>
          <mesh position={[0, t.h * 0.78, 0]}>
            <coneGeometry args={[t.w * 0.72, t.h * 0.5, 7]} />
            <meshStandardMaterial color="#28734a" roughness={1} flatShading />
          </mesh>
        </group>
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
      ambientRef.current.intensity = finished ? 0.85 : 0.62;
    }
  });

  return (
    <>
      <color attach="background" args={['#111a30']} />
      {/* Niebla mucho más larga que antes (era 12→30): con el alcance corto se
          comía el pradito entero y solo quedaban tres conos flotando. El
          alcance llega justo antes del borde del suelo, así el disco de césped
          se funde con el fondo en vez de acabar en una línea recta. */}
      <fog attach="fog" args={['#111a30', 20, 62]} />

      <ambientLight ref={ambientRef} intensity={0.62} color="#9fb4e0" />
      {/* El suelo verde es lo que tiñe el rebote: si no, el pasto sale gris */}
      <hemisphereLight args={['#6d84c4', '#1d4a33', 0.75]} />
      {/* Luna: da relieve a los árboles para que no sean una silueta plana */}
      <directionalLight color="#aebfe8" intensity={0.6} position={[-6, 9, 4]} />
      {/* Luz del paso actual, en el centro del claro */}
      <pointLight
        ref={accentRef}
        position={[0, 2.2, 0]}
        distance={18}
        decay={2}
        intensity={1.6}
      />

      <CustomStars count={isMobile ? 2200 : 5000} opacity={0.8} />

      {/* Mismo pradito que la escena de la carta, más las montañas del fondo */}
      <MeadowEnvironment
        isMobile={isMobile}
        radius={64}
        grassSpread={15}
        clearRadius={2.4}
        groundColor="#1b4630"
        orbs={{ kind: 'ring', radius: 4.6, count: isMobile ? 16 : 26 }}
        // SenseOrbs ya pone hasta quince pointLight en escritorio: aquí hay que
        // ser tacaño o el número de luces dinámicas se dispara.
        maxOrbLights={isMobile ? 4 : 6}
        mountains
        mountainDistance={70}
        mountainColor="#22314f"
        mountainCapColor="#465c85"
      />
      <TreeLine />
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

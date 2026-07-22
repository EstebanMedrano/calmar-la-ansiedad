import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Group } from 'three';

export interface OrbData {
  /** Índice del paso (0-4) al que pertenece: define su color. */
  step: number;
  /** Posición dentro de su paso, para repartirlos por la órbita. */
  slot: number;
}

interface SenseOrbsProps {
  orbs: OrbData[];
  colors: string[];
  isMobile: boolean;
}

/**
 * Las luces orbitan altas y no muy abiertas: abajo está la tarjeta de la
 * interfaz, y con un radio mayor se salían del encuadre en vertical.
 */
const RADIUS = 2.5;
const BASE_Y = 1.9;
/** Ángulo áureo: reparte bien las luces haya 1 o haya 15. */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/**
 * Cada cosa que anota se convierte en una luz que sube y se queda orbitando.
 *
 * Es la parte que le da sentido a hacer esto en 3D: al final del ejercicio
 * tiene delante quince luces que puso ella, una por cada cosa que consiguió
 * notar. El avance se ve, no se lee en una barra.
 */
export default function SenseOrbs({ orbs, colors, isMobile }: SenseOrbsProps) {
  const groupRef = useRef<Group>(null);

  // La posición de cada orbe es determinista a partir de su índice: así no
  // se recolocan solas cuando el componente vuelve a renderizarse.
  const placed = useMemo(
    () =>
      orbs.map((o, i) => ({
        key: `${o.step}-${o.slot}`,
        angle: i * GOLDEN,
        y: BASE_Y + o.step * 0.22 + Math.sin(i * 2.3) * 0.3,
        radius: RADIUS - o.step * 0.1,
        color: colors[o.step] ?? '#ffffff',
        seed: i * 1.37,
      })),
    [orbs, colors],
  );

  useFrame((state) => {
    // Un único giro lento del grupo entero en vez de mover cada orbe:
    // quince objetos con su propio cálculo por frame no aportarían nada.
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.075;
    }
  });

  return (
    <group ref={groupRef}>
      {placed.map(({ key, ...p }) => (
        <Orb key={key} {...p} isMobile={isMobile} />
      ))}
    </group>
  );
}

function Orb({
  angle,
  y,
  radius,
  color,
  seed,
  isMobile,
}: {
  angle: number;
  y: number;
  radius: number;
  color: string;
  seed: number;
  isMobile: boolean;
}) {
  const ref = useRef<Group>(null);
  const born = useRef(0);

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    // Aparece subiendo desde el suelo
    born.current = Math.min(1, born.current + dt * 1.4);
    const ease = 1 - Math.pow(1 - born.current, 3);
    const bob = Math.sin(state.clock.elapsedTime * 0.9 + seed) * 0.12;
    g.position.set(
      Math.cos(angle) * radius,
      THREE.MathUtils.lerp(0.3, y, ease) + bob,
      Math.sin(angle) * radius,
    );
    g.scale.setScalar(ease);
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.11, 12, 10]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {/* Halo. En móvil se omite la luz real: quince pointLight dinámicas
          hunden el rendimiento de un teléfono de gama media. */}
      <mesh>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {!isMobile && <pointLight color={color} intensity={0.35} distance={2.4} decay={2} />}
    </group>
  );
}

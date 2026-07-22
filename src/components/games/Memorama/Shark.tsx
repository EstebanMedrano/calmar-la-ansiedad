import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SharkState, DogTarget } from './types';
import { SHARK_SPEED_CHASE, SHARK_SPEED_ATTACK } from './positions';

function StunRings({ visible }: { visible: boolean }) {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const r3 = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    const mul = visible ? 1 : 0;
    if (r1.current) r1.current.rotation.y += dt * 5 * mul;
    if (r2.current) r2.current.rotation.y -= dt * 4 * mul;
    if (r3.current) r3.current.rotation.z += dt * 3.5 * mul;
  });
  if (!visible) return null;
  return (
    <group position={[0, 1.2, 0]}>
      <mesh ref={r1}><torusGeometry args={[.42, .018, 6, 28]} /><meshBasicMaterial color="#ffdd00" blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <mesh ref={r2} rotation={[Math.PI / 3, 0, 0]}><torusGeometry args={[.32, .014, 6, 22]} /><meshBasicMaterial color="#ffaa00" blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <mesh ref={r3} rotation={[Math.PI / 2, Math.PI / 4, 0]}><torusGeometry args={[.22, .011, 6, 18]} /><meshBasicMaterial color="#fff066" blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <pointLight color="#ffcc00" intensity={1.2} distance={3} decay={2} />
    </group>
  );
}

const SKIN = '#5a6f85';
const SKIN_DARK = '#3f5266';
const BELLY = '#dbe6ec';

/**
 * Cuerpo del tiburón.
 *
 * Era un montón de esferas y conos sueltos que se leía como un juguete de
 * bloques. Ahora tiene silueta de tiburón de verdad: hocico puntiagudo,
 * lomo más oscuro que la panza (contrasombreado, como los tiburones reales),
 * branquias, dientes, y sobre todo una cola articulada que se mueve.
 *
 * La cola va en su propio grupo con el pivote en el arranque, para que la
 * animación pueda batirla como un tiburón nadando en vez de deslizar todo el
 * bicho rígido por el agua.
 */
function SharkBody({
  isMobile,
  tailRef,
  finLRef,
  finRRef,
  jawRef,
}: {
  isMobile?: boolean;
  tailRef: React.RefObject<THREE.Group | null>;
  finLRef: React.RefObject<THREE.Mesh | null>;
  finRRef: React.RefObject<THREE.Mesh | null>;
  jawRef: React.RefObject<THREE.Group | null>;
}) {
  const s = isMobile ? 0.75 : 1.0;
  return (
    <group scale={s}>
      {/* Tronco */}
      <mesh scale={[1.15, 0.52, 0.46]}>
        <sphereGeometry args={[1.0, 20, 14]} />
        <meshStandardMaterial color={SKIN} roughness={0.55} metalness={0.05} />
      </mesh>

      {/* Lomo más oscuro */}
      <mesh position={[0, 0.14, 0]} scale={[1.1, 0.42, 0.42]}>
        <sphereGeometry args={[1.0, 18, 12]} />
        <meshStandardMaterial color={SKIN_DARK} roughness={0.6} />
      </mesh>

      {/* Panza clara */}
      <mesh position={[0.05, -0.2, 0]} scale={[1.0, 0.3, 0.4]}>
        <sphereGeometry args={[0.95, 16, 10]} />
        <meshStandardMaterial color={BELLY} roughness={0.45} />
      </mesh>

      {/* Hocico */}
      <mesh position={[1.28, 0.02, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.42, 0.72, 16]} />
        <meshStandardMaterial color={SKIN} roughness={0.55} />
      </mesh>

      {/* Boca y dientes */}
      <group ref={jawRef} position={[1.1, -0.2, 0]}>
        <mesh rotation={[0, 0, -0.12]} scale={[1, 0.42, 0.9]}>
          <sphereGeometry args={[0.42, 14, 10]} />
          <meshStandardMaterial color="#2a1520" roughness={0.9} />
        </mesh>
        {Array.from({ length: 9 }, (_, i) => {
          const a = (i / 8 - 0.5) * 1.5;
          return (
            <mesh
              key={i}
              position={[0.2 + Math.cos(a) * 0.1, 0.1, Math.sin(a) * 0.33]}
              rotation={[0, 0, Math.PI]}
            >
              <coneGeometry args={[0.035, 0.11, 4]} />
              <meshStandardMaterial color="#fffaf0" roughness={0.3} />
            </mesh>
          );
        })}
      </group>

      {/* Branquias */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[0.52 - i * 0.13, -0.02, 0.4]}
          rotation={[0, 0.35, 0.12]}
        >
          <planeGeometry args={[0.03, 0.24]} />
          <meshStandardMaterial color="#2c3c4d" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Aleta dorsal */}
      <mesh position={[-0.05, 0.56, 0]} rotation={[0, 0, -0.24]}>
        <coneGeometry args={[0.3, 0.78, 3]} />
        <meshStandardMaterial color={SKIN_DARK} roughness={0.6} />
      </mesh>

      {/* Aletas pectorales, animadas */}
      <mesh ref={finLRef} position={[0.36, -0.24, 0.42]} rotation={[0.5, 0, 0.35]}>
        <coneGeometry args={[0.17, 0.66, 3]} />
        <meshStandardMaterial color={SKIN_DARK} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={finRRef} position={[0.36, -0.24, -0.42]} rotation={[-0.5, 0, 0.35]}>
        <coneGeometry args={[0.17, 0.66, 3]} />
        <meshStandardMaterial color={SKIN_DARK} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Cola: pivote en el arranque para poder batirla */}
      <group ref={tailRef} position={[-1.05, 0, 0]}>
        <mesh position={[-0.28, 0, 0]} scale={[1, 0.34, 0.3]}>
          <sphereGeometry args={[0.42, 12, 8]} />
          <meshStandardMaterial color={SKIN} roughness={0.6} />
        </mesh>
        <mesh position={[-0.66, 0.24, 0]} rotation={[0, 0, 0.55]}>
          <coneGeometry args={[0.2, 0.72, 3]} />
          <meshStandardMaterial color={SKIN_DARK} roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.62, -0.2, 0]} rotation={[0, 0, Math.PI - 0.7]}>
          <coneGeometry args={[0.15, 0.5, 3]} />
          <meshStandardMaterial color={SKIN_DARK} roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Ojos */}
      {[-1, 1].map((side, i) => (
        <group key={i} position={[1.02, 0.14, side * 0.26]}>
          <mesh>
            <sphereGeometry args={[0.075, 10, 8]} />
            <meshStandardMaterial color="#0d0d12" roughness={0.15} />
          </mesh>
          {/* Reflejo: sin esto la mirada queda muerta */}
          <mesh position={[0.05, 0.03, side * 0.03]}>
            <sphereGeometry args={[0.024, 6, 5]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

interface Props {
  sharkState: SharkState;
  target: DogTarget;
  titoPos: React.MutableRefObject<THREE.Vector3>;
  liaPos: React.MutableRefObject<THREE.Vector3>;
  worldPos: React.MutableRefObject<THREE.Vector3>;
  /** Límites por los que puede nadar, según lo que se ve en pantalla. */
  zone: { xMin: number; xMax: number; yMin: number; yMax: number };
  depth: number;
  isMobile?: boolean;
}

export default function Shark({ sharkState, target, titoPos, liaPos, worldPos, zone, depth, isMobile }: Props) {
  const gRef = useRef<THREE.Group>(null);
  const deadY = useRef(0);
  const deadT = useRef(0);
  const tailRef = useRef<THREE.Group>(null);
  const finLRef = useRef<THREE.Mesh>(null);
  const finRRef = useRef<THREE.Mesh>(null);
  const jawRef = useRef<THREE.Group>(null);
  const hasBeenDead = useRef(false);

  useEffect(() => {
    deadY.current = 0;
    deadT.current = 0;
    hasBeenDead.current = false;
    if (gRef.current) {
      gRef.current.rotation.z = 0;
      gRef.current.visible = true;
    }
  }, []);

  useEffect(() => {
    if (sharkState === 'dead') {
      hasBeenDead.current = true;
      deadT.current = 0;
      deadY.current = 0;
    }
  }, [sharkState]);

  useFrame((state, dt) => {
    const g = gRef.current; if (!g) return;
    const t = state.clock.elapsedTime;

    // El coleteo va siempre, con distinto ritmo según lo que esté haciendo.
    // Es lo que hace que parezca que nada en vez de deslizarse.
    const beat = sharkState === 'attacking' ? 9 : sharkState === 'stunned' ? 1.2 : 3.4;
    const amp = sharkState === 'attacking' ? 0.55 : sharkState === 'stunned' ? 0.1 : 0.32;
    if (tailRef.current) tailRef.current.rotation.y = Math.sin(t * beat) * amp;
    // Las pectorales acompañan medio ciclo por detrás
    if (finLRef.current) finLRef.current.rotation.x = 0.5 + Math.sin(t * beat - 0.7) * 0.18;
    if (finRRef.current) finRRef.current.rotation.x = -0.5 - Math.sin(t * beat - 0.7) * 0.18;
    // Abre la boca al atacar
    if (jawRef.current) {
      const open = sharkState === 'attacking' ? 0.22 + Math.sin(t * 12) * 0.08 : 0.02;
      jawRef.current.rotation.z = THREE.MathUtils.lerp(jawRef.current.rotation.z, open, dt * 8);
    }

    if (sharkState === 'dead') {
      deadT.current += dt;
      deadY.current -= dt * .5;
      g.position.y = worldPos.current.y + deadY.current;
      g.rotation.z += dt * .8;
      return;
    }

    if (sharkState === 'stunned') {
      worldPos.current.x += Math.sin(t * .8) * .012;
      g.position.set(worldPos.current.x, worldPos.current.y + Math.sin(t * .5) * .05, worldPos.current.z);
      return;
    }

    const targetPos = target === 'tito' ? titoPos.current : liaPos.current;
    const dir = targetPos.clone().sub(worldPos.current);
    const dist = dir.length();
    const speed = sharkState === 'attacking' ? SHARK_SPEED_ATTACK : SHARK_SPEED_CHASE;

    if (dist > 0.08) {
      dir.normalize();
      worldPos.current.addScaledVector(dir, speed * dt);
    }
    worldPos.current.x = THREE.MathUtils.clamp(worldPos.current.x, zone.xMin, zone.xMax);
    worldPos.current.y = THREE.MathUtils.clamp(worldPos.current.y, zone.yMin, zone.yMax);
    worldPos.current.z = depth;

    const bob = Math.sin(t * 1.2) * .08;
    g.position.set(worldPos.current.x, worldPos.current.y + bob, worldPos.current.z);

    const mv = targetPos.clone().sub(worldPos.current);
    if (mv.length() > .05) {
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, Math.atan2(mv.x, mv.z) + Math.PI / 2, dt * 4);
    }
    // Se escora hacia donde gira, como al tomar una curva
    g.rotation.z = Math.sin(t * 1.8) * .06 + Math.sin(t * beat) * 0.05;
  });

  if (sharkState === 'dead' && deadT.current > 3) return null;

  return (
    <group ref={gRef} position={[zone.xMax * 0.8, 0, depth]}>
      <SharkBody
        isMobile={isMobile}
        tailRef={tailRef}
        finLRef={finLRef}
        finRRef={finRRef}
        jawRef={jawRef}
      />
      <StunRings visible={sharkState === 'stunned'} />
      <pointLight color="#4477aa" intensity={.3} distance={3} decay={2} />
    </group>
  );
}
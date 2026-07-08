import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { HurricaneStage } from './Hurricane';

const PARTICLE_COUNT = 7000;
const FUNNEL_HEIGHT  = 24;
const MAX_RADIUS     = 8;
const INNER_RADIUS   = 0.25;

export default function Tornado({ stage }: { stage: HurricaneStage }) {
  const groupRef  = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const currentPos = useRef(new THREE.Vector3(0, 0, -90));

  const particleData = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 4);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i*4]   = Math.random() * Math.PI * 2;
      arr[i*4+1] = Math.random() * FUNNEL_HEIGHT;
      arr[i*4+2] = 0.8 + Math.random() * 2.4;
      arr[i*4+3] = 0.65 + Math.random() * 0.7;
    }
    return arr;
  }, []);

  const positions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);

  useFrame((state, delta) => {
    const group  = groupRef.current;
    const points = pointsRef.current;
    if (!group || !points) return;

    const t = state.clock.elapsedTime;

    // 🛑 POSICIONES ACTUALIZADAS A -22.5
    const target = new THREE.Vector3();
    if (stage === 'intro')            target.set(0, 0, -90);
    else if (stage === 'tornado_approach') target.set(0, 0,  -1);
    else if (stage === 'tornado')     target.set(0, 0,   0);
    else if (stage === 'tornado_retreat') target.set(0, 0, -22.5); // 🛑 Retrocede a -22.5
    else if (stage === 'tornado_ascend')  target.set(0, 40, -22.5); // 🛑 Se eleva desde -22.5
    else if (stage === 'fireworks')       target.set(0, 40, -22.5);
    else                              target.set(0, 130, 0);

    currentPos.current.lerp(target, delta * 0.55);
    group.position.copy(currentPos.current);

    // Animate particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = particleData[i*4] + t * particleData[i*4+2];
      const h     = particleData[i*4+1];
      const rMult = particleData[i*4+3];
      const baseR = INNER_RADIUS + (MAX_RADIUS - INNER_RADIUS) * (h / FUNNEL_HEIGHT);
      const turb  = Math.sin(h * 0.9 + t * 3.5 + i * 0.012) * 0.22;
      const r     = baseR * rMult + turb;

      positions[i*3]   = Math.cos(angle) * r;
      positions[i*3+1] = h;
      positions[i*3+2] = Math.sin(angle) * r;
    }

    (points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  const visible = !['parachuting','complete'].includes(stage);

  return (
    <group ref={groupRef} visible={visible}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.08} color="#7733bb" transparent opacity={0.72}
          depthWrite={false} sizeAttenuation blending={THREE.AdditiveBlending} />
      </points>

      <mesh position={[0, FUNNEL_HEIGHT / 2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[MAX_RADIUS * 0.85, FUNNEL_HEIGHT, 14, 1, true]} />
        <meshBasicMaterial color="#0d0520" transparent opacity={0.38} side={THREE.BackSide} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.5, MAX_RADIUS * 1.1, 32]} />
        <meshBasicMaterial color="#4422aa" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
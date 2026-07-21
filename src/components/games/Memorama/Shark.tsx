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

function SharkBody({ isMobile }: { isMobile?: boolean }) {
  const s = isMobile ? 0.75 : 1.0;
  return (
    <group scale={s}>
      <mesh scale={[1, 0.55, 0.5]}><sphereGeometry args={[1.0, 12, 8]} /><meshStandardMaterial color="#556677" roughness={.6} emissive="#223344" emissiveIntensity={0.1} /></mesh>
      <mesh position={[1.2, -.05, 0]} scale={[.7, .45, .42]}><sphereGeometry args={[.6, 10, 7]} /><meshStandardMaterial color="#445566" roughness={.6} emissive="#223344" emissiveIntensity={0.1} /></mesh>
      <mesh position={[.2, -.35, 0]} scale={[.9, .25, .38]}><sphereGeometry args={[.7, 8, 6]} /><meshStandardMaterial color="#c8d8e0" roughness={.5} /></mesh>
      <mesh position={[-.1, .62, 0]} rotation={[0, 0, .18]}><coneGeometry args={[.22, .62, 4]} /><meshStandardMaterial color="#445566" roughness={.6} emissive="#223344" emissiveIntensity={0.1} /></mesh>
      {[-1, 1].map((s, i) => (
        <mesh key={i} position={[.25, -.12, s * .55]} rotation={[0, s * .3, .3]}><coneGeometry args={[.14, .5, 4]} /><meshStandardMaterial color="#4a5f70" roughness={.6} emissive="#223344" emissiveIntensity={0.1} /></mesh>
      ))}
      <mesh position={[-1.2, 0, 0]} rotation={[0, 0, Math.PI * .5]}><coneGeometry args={[.3, .6, 4]} /><meshStandardMaterial color="#445566" roughness={.6} emissive="#223344" emissiveIntensity={0.1} /></mesh>
      <mesh position={[-1.4, -.22, 0]} rotation={[0, 0, Math.PI * .7]}><coneGeometry args={[.18, .42, 4]} /><meshStandardMaterial color="#445566" roughness={.6} emissive="#223344" emissiveIntensity={0.1} /></mesh>
      {[-1, 1].map((s, i) => (
        <mesh key={i} position={[1.0, .08, s * .25]}><sphereGeometry args={[.07, 8, 6]} /><meshBasicMaterial color="#111" /></mesh>
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
  isMobile?: boolean;
}

export default function Shark({ sharkState, target, titoPos, liaPos, worldPos, isMobile }: Props) {
  const gRef = useRef<THREE.Group>(null);
  const deadY = useRef(0);
  const deadT = useRef(0);
  const finRef = useRef<THREE.Mesh>(null);
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
    worldPos.current.x = Math.max(-7.0, Math.min(7.0, worldPos.current.x));
    worldPos.current.y = Math.max(-5.5, Math.min(5.5, worldPos.current.y));
    worldPos.current.z = -1.0;

    const bob = Math.sin(t * 1.2) * .08;
    g.position.set(worldPos.current.x, worldPos.current.y + bob, worldPos.current.z);

    const mv = targetPos.clone().sub(worldPos.current);
    if (mv.length() > .05) {
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, Math.atan2(mv.x, mv.z) + Math.PI / 2, dt * 4);
    }
    g.rotation.z = Math.sin(t * 1.8) * .06;
    if (finRef.current) finRef.current.rotation.y = Math.sin(t * 2) * .1;
  });

  if (sharkState === 'dead' && deadT.current > 3) return null;

  return (
    <group ref={gRef} position={[5.5, 0, -1.0]}>
      <SharkBody isMobile={isMobile} />
      <StunRings visible={sharkState === 'stunned'} />
      <pointLight color="#4477aa" intensity={.3} distance={3} decay={2} />
    </group>
  );
}
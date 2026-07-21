import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import type { Group } from 'three';
import type { DogState } from './types';
import { TITO_ZONE, LIA_ZONE, DOG_SPEED } from './positions';

type Zone = { xMin: number; xMax: number; yMin: number; yMax: number };

function clampInZone(v: THREE.Vector3, z: Zone) {
  v.x = THREE.MathUtils.clamp(v.x, z.xMin, z.xMax);
  v.y = THREE.MathUtils.clamp(v.y, z.yMin, z.yMax);
  v.z = -1.0;
}

function DogEffects({ visible, blink, showMinus }: { visible: boolean; blink: boolean; showMinus: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    const g = ref.current; if (!g) return;
    g.visible = visible;
    if (!visible) return;
    if (r1.current) r1.current.rotation.y += dt * 4;
    if (r2.current) r2.current.rotation.y -= dt * 3;
  });
  return (
    <group ref={ref} position={[0, 1.1, 0]} visible={false}>
      {showMinus && (
        <>
          <mesh position={[0, .28, 0]}>
            <boxGeometry args={[.22, .06, .06]} /><meshBasicMaterial color="#ff2244" />
          </mesh>
          <mesh position={[-.1, .1, 0]}><boxGeometry args={[.04, .14, .04]} /><meshBasicMaterial color="#ff2244" /></mesh>
          <mesh position={[.1, .1, 0]}><boxGeometry args={[.16, .06, .04]} /><meshBasicMaterial color="#ff2244" /></mesh>
          <mesh position={[.1, .17, 0]}><boxGeometry args={[.16, .06, .04]} /><meshBasicMaterial color="#ff2244" /></mesh>
          <mesh position={[.1, .03, 0]}><boxGeometry args={[.16, .06, .04]} /><meshBasicMaterial color="#ff2244" /></mesh>
        </>
      )}
      {blink && (
        <>
          <mesh ref={r1}>
            <torusGeometry args={[.22, .015, 6, 22]} /><meshBasicMaterial color="#ff4499" blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh ref={r2} rotation={[Math.PI / 3, 0, 0]}>
            <torusGeometry args={[.18, .011, 6, 18]} /><meshBasicMaterial color="#ff88cc" blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <pointLight color="#ff44aa" intensity={.8} distance={2} decay={2} />
        </>
      )}
    </group>
  );
}

interface DogProps {
  path: string;
  scale: number;
  zone: Zone;
  dogState: DogState;
  sharkPos: React.MutableRefObject<THREE.Vector3>;
  worldPos: React.MutableRefObject<THREE.Vector3>;
  initY: number;
  isMobile?: boolean;
}

function DivingDog({ path, scale, zone, dogState, sharkPos, worldPos, initY, isMobile }: DogProps) {
  const gRef = useRef<Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const malletR = useRef<THREE.Group>(null);
  const helmetR = useRef<THREE.Mesh>(null);
  const blinkT = useRef(0);
  const showBlink = useRef(false);
  const showMinus = useRef(false);
  const minusT = useRef(0);

  const { scene: raw, animations } = useGLTF(path);
  const scene = useMemo(() => raw.clone(true), [raw]);
  const { actions } = useAnimations(animations, gRef);

  const finalScale = isMobile ? scale * 0.75 : scale;

  useEffect(() => {
    showBlink.current = false;
    showMinus.current = false;
    blinkT.current = 0;
    minusT.current = 0;
    if (gRef.current) gRef.current.visible = true;
  }, []);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const fy = Math.max(0, -box.min.y * finalScale);
    if (innerRef.current) innerRef.current.position.y = fy;
    const h = box.max.y * finalScale;
    if (helmetR.current) helmetR.current.position.y = h * .85;

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.emissive = new THREE.Color(0x446688);
          mat.emissiveIntensity = 0.15;
          mat.roughness = 0.6;
        }
      }
    });
  }, [scene, finalScale]);

  useEffect(() => {
    const f = Object.keys(actions)[0];
    if (f) actions[f]?.reset().fadeIn(.3).play();
  }, [actions]);

  useEffect(() => {
    if (dogState === 'blinking') {
      showBlink.current = true; showMinus.current = true; blinkT.current = 0; minusT.current = 0;
    }
  }, [dogState]);

  useFrame((state, dt) => {
    const g = gRef.current; if (!g) return;
    const t = state.clock.elapsedTime;

    if (showBlink.current) {
      blinkT.current += dt;
      g.visible = (Math.floor(blinkT.current / .15) % 2 === 0);
      if (blinkT.current > 2.5) { showBlink.current = false; g.visible = true; }
    } else {
      g.visible = true;
    }
    if (showMinus.current) {
      minusT.current += dt;
      if (minusT.current > 2.0) showMinus.current = false;
    }

    let targetPos = new THREE.Vector3(worldPos.current.x, worldPos.current.y, -1.0);

    switch (dogState) {
      case 'swimming':
      case 'blinking': {
        const toShark = sharkPos.current.clone().sub(worldPos.current);
        const dist = toShark.length();
        const fleeDir = dist < 7.0 ? toShark.clone().normalize().negate() : new THREE.Vector3(0, 0, 0);
        const wander = new THREE.Vector3(Math.sin(t * .4 + zone.yMin) * .5, Math.cos(t * .35 + zone.xMin) * .5, 0);
        const dir = fleeDir.add(wander).normalize();
        targetPos = worldPos.current.clone().addScaledVector(dir, DOG_SPEED * dt);
        clampInZone(targetPos, zone);
        break;
      }
      case 'fleeing': {
        const away = worldPos.current.clone().sub(sharkPos.current).normalize();
        targetPos = worldPos.current.clone().addScaledVector(away, DOG_SPEED * 4.0 * dt);
        clampInZone(targetPos, zone);
        break;
      }
      case 'hitting': {
        targetPos = worldPos.current.clone();
        if (malletR.current) {
          const toS = sharkPos.current.clone().sub(worldPos.current);
          malletR.current.rotation.z = Math.sin(t * 18) * 1.2;
          malletR.current.lookAt(worldPos.current.clone().add(toS));
        }
        break;
      }
      case 'celebrating': {
        if (g) g.rotation.y += dt * 4;
        targetPos = worldPos.current.clone();
        break;
      }
    }

    worldPos.current.lerp(targetPos, .75);
    const bob = Math.sin(t * 1.5 + zone.yMin) * .06;
    g.position.set(worldPos.current.x, worldPos.current.y + bob, worldPos.current.z);

    const mv = worldPos.current.clone().sub(new THREE.Vector3(g.position.x, g.position.y, g.position.z));
    if (mv.length() > .04) g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, Math.atan2(mv.x, mv.z), dt * 5);
  });

  return (
    <group ref={gRef} position={[zone.xMin + 1.5, initY, -1.0]}>
      <group ref={innerRef}>
        <primitive object={scene} scale={finalScale} />
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.65, 16, 12]} />
          <meshBasicMaterial color="#88ccff" transparent opacity={0.15} depthWrite={false} />
        </mesh>
        <mesh position={[-0.12, 0.45, 0.55]}>
          <sphereGeometry args={[0.06, 8, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {dogState === 'hitting' && (
          <group ref={malletR} position={[.4, .3, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[.04, .04, .5, 6]} /><meshStandardMaterial color="#8B4513" />
            </mesh>
            <mesh position={[.3, 0, 0]}>
              <sphereGeometry args={[.12, 8, 8]} /><meshStandardMaterial color="#5a3010" />
            </mesh>
          </group>
        )}
      </group>
      <DogEffects visible={showBlink.current || dogState === 'blinking'} blink={dogState === 'blinking'} showMinus={showMinus.current} />
    </group>
  );
}

interface Props {
  titoState: DogState;
  liaState: DogState;
  sharkPos: React.MutableRefObject<THREE.Vector3>;
  titoWorldPos: React.MutableRefObject<THREE.Vector3>;
  liaWorldPos: React.MutableRefObject<THREE.Vector3>;
  isMobile?: boolean;
}

export default function DivingDogs({ titoState, liaState, sharkPos, titoWorldPos, liaWorldPos, isMobile }: Props) {
  return (
    <>
      <DivingDog path="/assets/3D/tito.glb" scale={.55} zone={TITO_ZONE} dogState={titoState} sharkPos={sharkPos} worldPos={titoWorldPos} initY={2.5} isMobile={isMobile} />
      <DivingDog path="/assets/3D/lia.glb" scale={.50} zone={LIA_ZONE} dogState={liaState} sharkPos={sharkPos} worldPos={liaWorldPos} initY={-2.5} isMobile={isMobile} />
    </>
  );
}

useGLTF.preload('/assets/3D/tito.glb');
useGLTF.preload('/assets/3D/lia.glb');
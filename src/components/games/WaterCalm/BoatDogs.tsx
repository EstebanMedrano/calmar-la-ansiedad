import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Howl } from 'howler';
import * as THREE from 'three';
import type { Group } from 'three';
import { LAKE_Y, LAKE_Z_CENTER } from './Lake';

const TITO_INIT: [number,number,number] = [ 8, LAKE_Y, LAKE_Z_CENTER + 4];
const LIA_INIT:  [number,number,number] = [-6, LAKE_Y, LAKE_Z_CENTER - 4];

const TITO_SCALE = 0.36;
const LIA_SCALE  = 0.32;

const X_LIMIT = 5.2;
const Z_UP_LIMIT = 4.8;
const Z_DOWN_LIMIT = 5.8;

function clampToLake(v: THREE.Vector3) {
  v.x = THREE.MathUtils.clamp(v.x, -X_LIMIT, X_LIMIT);
  v.z = THREE.MathUtils.clamp(v.z, (LAKE_Z_CENTER - Z_UP_LIMIT), (LAKE_Z_CENTER + Z_DOWN_LIMIT));
  v.y = LAKE_Y;
  return v;
}

interface BoatDogProps {
  path:       string;
  initPos:    [number,number,number];
  dogScale:   number;
  boatColor:  string;
  target:     React.MutableRefObject<THREE.Vector3>;
  speedMul:   number;
  side:       'left' | 'right';
  active:     boolean;
  isFiring:   boolean;
  onCatch:    () => void;
  isWinner:   boolean;
  onJumpComplete: () => void;
}

function BoatDog({ path, initPos, dogScale, boatColor, target, speedMul, side, active, isFiring, onCatch, isWinner, onJumpComplete }: BoatDogProps) {
  const groupRef    = useRef<Group>(null);
  const dogGroupRef = useRef<THREE.Group>(null);
  const posRef      = useRef(new THREE.Vector3(...initPos));
  const { scene, animations } = useGLTF(path);
  const { actions } = useAnimations(animations, groupRef);
  const yOffset     = useRef(0);
  
  const barkSound = useMemo(() => new Howl({ src: ['/assets/sounds/lia-bark.mp3'], volume: 0.3 }), []);
  const lastBarkTime = useRef(0);
  const caughtRef = useRef(false);

  const jumpState = useRef<'idle' | 'jumping' | 'done'>('idle');
  const jumpProgress = useRef(0);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    yOffset.current = box.min.y < -0.01 ? -box.min.y * dogScale : 0;
    if (dogGroupRef.current) {
      dogGroupRef.current.position.y = 0.12; 
    }
  }, [scene, dogScale]);

  useEffect(() => {
    const first = Object.keys(actions)[0];
    if (first) actions[first]?.reset().fadeIn(0.3).play();
  }, [actions]);

  // 🛑 CORRECCIÓN DEL REINICIO: Resetea el tamaño del padre Y DEL HIJO (el perro)
  useEffect(() => {
    if (!isWinner) {
      jumpState.current = 'idle';
      jumpProgress.current = 0;
      if (groupRef.current) {
        groupRef.current.scale.setScalar(1);
        groupRef.current.rotation.y = 0;
      }
      // 🛑 Aquí está la clave: el perro se quedaba gigante porque no reescalábamos esto
      if (dogGroupRef.current) {
        dogGroupRef.current.scale.setScalar(1);
        dogGroupRef.current.position.y = 0.12;
      }
    }
  }, [isWinner]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    const dogGroup = dogGroupRef.current;
    if (!group) return;

    if (isWinner && jumpState.current === 'idle') {
      jumpState.current = 'jumping';
      jumpProgress.current = 0;
      group.position.set(0, LAKE_Y + 0.5, 1.0);
      
      if (path.includes('tito')) {
        group.rotation.y = -Math.PI / 2; 
      } else {
        group.rotation.y = 0;
      }
    }

    if (jumpState.current === 'jumping') {
      jumpProgress.current = Math.min(1, jumpProgress.current + delta * 1.2);
      const scale = 1 + jumpProgress.current * 3;
      
      if (dogGroup) {
        dogGroup.scale.setScalar(scale);
      }
      group.position.y = LAKE_Y + 0.5 + jumpProgress.current * 1.0;

      if (jumpProgress.current >= 1) {
        jumpState.current = 'done';
        onJumpComplete(); 
      }
      return;
    }

    if (jumpState.current === 'done') return;

    if (!active) return;

    let t = target.current.clone();
    
    if (side === 'right') {
      t.x = Math.max(0, t.x);
    } else {
      t.x = Math.min(0, t.x);
    }

    t = clampToLake(t);
    posRef.current.lerp(t, delta * speedMul);
    clampToLake(posRef.current);

    const bob = Math.sin(Date.now() / 650 + initPos[0] * 2) * 0.06;
    group.position.set(posRef.current.x, LAKE_Y + 0.25 + bob, posRef.current.z);
    group.scale.setScalar(1);

    if (dogGroup) dogGroup.position.y = 0.12;

    const dir = t.clone().sub(posRef.current);
    if (dir.length() > 0.08) group.rotation.y = Math.atan2(dir.x, dir.z);

    const distToLaser = posRef.current.distanceTo(target.current);
    if (isFiring && distToLaser < 0.3 && Date.now() - lastBarkTime.current > 800) {
      barkSound.play();
      lastBarkTime.current = Date.now();
      if (!caughtRef.current) {
        caughtRef.current = true;
        onCatch();
        setTimeout(() => { caughtRef.current = false; }, 500);
      }
    }
  });

  return (
    <group ref={groupRef} position={[...initPos]}>
      {/* CANOA */}
      <group visible={!isWinner}>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.35, 0.08, 0.9]} />
          <meshStandardMaterial color={boatColor} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.12, 0.4]}>
          <boxGeometry args={[0.35, 0.06, 0.08]} />
          <meshStandardMaterial color={boatColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.12, -0.4]}>
          <boxGeometry args={[0.35, 0.06, 0.08]} />
          <meshStandardMaterial color={boatColor} roughness={0.7} />
        </mesh>
      </group>
      
      {/* PERRO */}
      <group ref={dogGroupRef}>
        <primitive object={scene} scale={dogScale} />
      </group>

      {/* LUCES TIPO REFLECTOR */}
      {isWinner && (
        <>
          <pointLight position={[0, 2.5, 0]} intensity={5} distance={15} decay={0.5} color="#ffffff" />
          <pointLight position={[0, 0.0, 2.8]} intensity={5} distance={15} decay={0.5} color="#ffffff" />
        </>
      )}
    </group>
  );
}

interface BoatDogsProps {
  laserTarget: React.MutableRefObject<THREE.Vector3>;
  active:      boolean;
  isFiring:    boolean;
  onCatch:     (dog: 'tito' | 'lia') => void;
  winningDog:  'tito' | 'lia' | null;
  onJumpComplete: () => void;
}

export default function BoatDogs({ laserTarget, active, isFiring, onCatch, winningDog, onJumpComplete }: BoatDogsProps) {
  const handleCatch = (dog: 'tito' | 'lia') => {
    onCatch(dog);
  };

  return (
    <group visible={active || !!winningDog}>
      <BoatDog
        path="/assets/3D/tito.glb"
        initPos={TITO_INIT}
        dogScale={TITO_SCALE}
        boatColor="#7a4a20"
        target={laserTarget}
        speedMul={2}
        side="right"
        active={active && winningDog !== 'tito'}
        isFiring={isFiring}
        onCatch={() => handleCatch('tito')}
        isWinner={winningDog === 'tito'}
        onJumpComplete={onJumpComplete}
      />
      <BoatDog
        path="/assets/3D/lia.glb"
        initPos={LIA_INIT}
        dogScale={LIA_SCALE}
        boatColor="#5a3518"
        target={laserTarget}
        speedMul={2}
        side="left"
        active={active && winningDog !== 'lia'}
        isFiring={isFiring}
        onCatch={() => handleCatch('lia')}
        isWinner={winningDog === 'lia'}
        onJumpComplete={onJumpComplete}
      />
    </group>
  );
}

useGLTF.preload('/assets/3D/tito.glb');
useGLTF.preload('/assets/3D/lia.glb');
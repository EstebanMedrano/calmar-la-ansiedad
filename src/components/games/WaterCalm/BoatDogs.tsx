import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Howl } from 'howler';
import * as THREE from 'three';
import type { Group } from 'three';
import { LAKE_Y, LAKE_Z_CENTER, LAKE_WIDTH, LAKE_HEIGHT } from './Lake';

const TITO_INIT: [number,number,number] = [ 8, LAKE_Y, LAKE_Z_CENTER + 4];
const LIA_INIT:  [number,number,number] = [-6, LAKE_Y, LAKE_Z_CENTER - 4];

const TITO_SCALE = 0.36;
const LIA_SCALE  = 0.32;

// 🛑 LÍMITES VISUALES EXACTOS (Calculados matemáticamente según el shader)
// El shader estira el ancho x3.2 y tiene un radio de elipse de 0.48.
const VISUAL_HALF_WIDTH = LAKE_WIDTH * (0.48 / 3.2);  // 36 * 0.15 = 5.4
const VISUAL_HALF_HEIGHT = LAKE_HEIGHT * (0.48 / 1.0); // 12 * 0.48 = 5.76

function clampToLake(v: THREE.Vector3) {
  const margin = 0.12; // Un pequeño margen para que el perro no choque con el neón exacto
  v.x = THREE.MathUtils.clamp(v.x, -VISUAL_HALF_WIDTH + margin, VISUAL_HALF_WIDTH - margin);
  v.z = THREE.MathUtils.clamp(v.z, (LAKE_Z_CENTER - VISUAL_HALF_HEIGHT) + margin, (LAKE_Z_CENTER + VISUAL_HALF_HEIGHT) - margin);
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
}

function BoatDog({ path, initPos, dogScale, boatColor, target, speedMul, side, active }: BoatDogProps) {
  const groupRef    = useRef<Group>(null);
  const dogGroupRef = useRef<THREE.Group>(null);
  const posRef      = useRef(new THREE.Vector3(...initPos));
  const { scene, animations } = useGLTF(path);
  const { actions } = useAnimations(animations, groupRef);
  const yOffset     = useRef(0);
  
  const barkSound = useMemo(() => new Howl({ src: ['/assets/sounds/lia-bark.mp3'], volume: 0.3 }), []);
  const lastBarkTime = useRef(0);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    yOffset.current = box.min.y < -0.01 ? -box.min.y * dogScale : 0;
    // Altura fija sobre la canoa
    if (dogGroupRef.current) {
      dogGroupRef.current.position.y = 0.12; 
    }
  }, [scene, dogScale]);

  useEffect(() => {
    const first = Object.keys(actions)[0];
    if (first) actions[first]?.reset().fadeIn(0.3).play();
  }, [actions]);

  useFrame((_, delta) => {
    if (!active) return;

    const group = groupRef.current;
    if (!group) return;

    let t = target.current.clone();
    
    if (side === 'right') {
      t.x = Math.max(0, t.x);
    } else {
      t.x = Math.min(0, t.x);
    }

    // Aplicamos los límites exactos del neón
    t = clampToLake(t);

    posRef.current.lerp(t, delta * speedMul);
    
    // 🛑 TOPE DURO: Si el perro se pasa del límite, lo empujamos de vuelta inmediatamente
    clampToLake(posRef.current);

    const bob = Math.sin(Date.now() / 650 + initPos[0] * 2) * 0.06;
    group.position.set(posRef.current.x, LAKE_Y + 0.25 + bob, posRef.current.z);

    if (dogGroupRef.current) dogGroupRef.current.position.y = 0.12;

    const dir = t.clone().sub(posRef.current);
    if (dir.length() > 0.08) group.rotation.y = Math.atan2(dir.x, dir.z);

    const distToLaser = posRef.current.distanceTo(target.current);
    if (distToLaser < 0.3 && Date.now() - lastBarkTime.current > 1500) {
      barkSound.play();
      lastBarkTime.current = Date.now();
    }
  });

  return (
    <group ref={groupRef} position={[...initPos]}>
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
      
      <group ref={dogGroupRef}>
        <primitive object={scene} scale={dogScale} />
      </group>
    </group>
  );
}

interface BoatDogsProps {
  laserTarget: React.MutableRefObject<THREE.Vector3>;
  active:      boolean;
}

export default function BoatDogs({ laserTarget, active }: BoatDogsProps) {
  return (
    <group visible={active}>
      <BoatDog path="/assets/3D/tito.glb" initPos={TITO_INIT}
        dogScale={TITO_SCALE} boatColor="#7a4a20" target={laserTarget} speedMul={0.75} side="right" active={active} />
      <BoatDog path="/assets/3D/lia.glb"  initPos={LIA_INIT}
        dogScale={LIA_SCALE}  boatColor="#5a3518" target={laserTarget} speedMul={0.60} side="left" active={active} />
    </group>
  );
}

useGLTF.preload('/assets/3D/tito.glb');
useGLTF.preload('/assets/3D/lia.glb');
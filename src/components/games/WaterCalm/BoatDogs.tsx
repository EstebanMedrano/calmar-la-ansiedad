import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import type { Group } from 'three';
import { LAKE_Y, LAKE_Z_CENTER, LAKE_WIDTH, LAKE_HEIGHT } from './Lake';

const TITO_INIT: [number,number,number] = [ 5, LAKE_Y, LAKE_Z_CENTER + 2];
const LIA_INIT:  [number,number,number] = [-5, LAKE_Y, LAKE_Z_CENTER - 2];
const TITO_SCALE = 0.48;
const LIA_SCALE  = 0.42;

function clampToLake(v: THREE.Vector3) {
  v.x = THREE.MathUtils.clamp(v.x, -LAKE_WIDTH/2 + 1.5, LAKE_WIDTH/2 - 1.5);
  v.z = THREE.MathUtils.clamp(v.z, LAKE_Z_CENTER - LAKE_HEIGHT/2 + 1.5, LAKE_Z_CENTER + LAKE_HEIGHT/2 - 1.5);
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
}

function BoatDog({ path, initPos, dogScale, boatColor, target, speedMul }: BoatDogProps) {
  const groupRef    = useRef<Group>(null);
  const dogGroupRef = useRef<THREE.Group>(null);
  const posRef      = useRef(new THREE.Vector3(...initPos));
  const { scene, animations } = useGLTF(path);
  const { actions } = useAnimations(animations, groupRef);
  const yOffset     = useRef(0);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    yOffset.current = box.min.y < -0.01 ? -box.min.y * dogScale : 0;
    if (dogGroupRef.current) dogGroupRef.current.position.y = 0.14 + yOffset.current;
  }, [scene, dogScale]);

  useEffect(() => {
    const first = Object.keys(actions)[0];
    if (first) actions[first]?.reset().fadeIn(0.3).play();
  }, [actions]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const t = clampToLake(target.current.clone());
    posRef.current.lerp(t, delta * speedMul);

    const bob = Math.sin(Date.now() / 650 + initPos[0]) * 0.07;
    group.position.set(posRef.current.x, LAKE_Y + 0.32 + bob, posRef.current.z);

    if (dogGroupRef.current) dogGroupRef.current.position.y = 0.14 + yOffset.current;

    const dir = t.clone().sub(posRef.current);
    if (dir.length() > 0.08) group.rotation.y = Math.atan2(dir.x, dir.z);
  });

  return (
    <group ref={groupRef} position={[...initPos]}>
      <mesh>
        <boxGeometry args={[0.85, 0.28, 1.95]} />
        <meshStandardMaterial color={boatColor} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.14,  0.88]}>
        <boxGeometry args={[0.85, 0.18, 0.18]} />
        <meshStandardMaterial color={boatColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.14, -0.88]}>
        <boxGeometry args={[0.85, 0.18, 0.18]} />
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
        dogScale={TITO_SCALE} boatColor="#7a4a20" target={laserTarget} speedMul={0.65} />
      <BoatDog path="/assets/3D/lia.glb"  initPos={LIA_INIT}
        dogScale={LIA_SCALE}  boatColor="#5a3518" target={laserTarget} speedMul={0.55} />
    </group>
  );
}

useGLTF.preload('/assets/3D/tito.glb');
useGLTF.preload('/assets/3D/lia.glb');
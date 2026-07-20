import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  startPos: [number, number, number];
  texture: THREE.Texture;
  color: string;
  onArrived: () => void;
}

export default function FlyingCard({ startPos, texture, color, onArrived }: Props) {
  const ref = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const hasArrived = useRef(false);

  useFrame((_, dt) => {
    if (!ref.current || hasArrived.current) return;
    progress.current += dt * 1.2;

    if (progress.current >= 1) {
      hasArrived.current = true;
      onArrived();
      return;
    }

    const p = progress.current;
    const targetPos = new THREE.Vector3(0, 0, 5);
    const startPosVec = new THREE.Vector3(...startPos);
    
    ref.current.position.lerpVectors(startPosVec, targetPos, p);
    ref.current.scale.setScalar(1 + p * 2.0);
    ref.current.rotation.y += dt * 2;
  });

  return (
    <group ref={ref} position={startPos}>
      <mesh position={[0,0,-0.005]}>
        <planeGeometry args={[0.95, 1.15]}/>
        <meshBasicMaterial color="#0c0820"/>
      </mesh>
      <mesh position={[0,0,0.005]}>
        <planeGeometry args={[0.85, 1.05]}/>
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[0,0,0]}>
        <planeGeometry args={[0.93, 1.13]}/>
        <meshBasicMaterial color={color} transparent opacity={0.3}/>
      </mesh>
    </group>
  );
}
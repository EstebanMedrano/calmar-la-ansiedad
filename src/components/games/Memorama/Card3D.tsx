import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CardState } from './types';

interface Props {
  position: [number, number, number];
  texture: THREE.Texture | null;
  cardState: CardState;
  shake: boolean;
  color: string;
  scale?: number;
  onClick: () => void;
}

const CW = 0.95, CH = 1.15;

export default function Card3D({ position, texture, cardState, shake, color, scale = 1, onClick }: Props) {
  const gRef = useRef<THREE.Group>(null);
  const bubbleRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const rotY = useRef(cardState !== 'hidden' ? Math.PI : 0);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const initTilt = useMemo(() => ({ x: (Math.random() - .5) * .18, z: (Math.random() - .5) * .18 }), []);
  const shakeT = useRef(0);
  const bScale = useRef(1.0);
  const pressScale = useRef(1.0);
  const [hov, setHov] = useState(false);

  useFrame((state, dt) => {
    const g = gRef.current; if (!g) return;
    const t = state.clock.elapsedTime;

    const fY = Math.sin(t * .60 + phase) * .09;
    if (shake) {
      shakeT.current += dt * 30;
      g.position.set(position[0] + Math.sin(shakeT.current) * .10, position[1] + fY, position[2]);
    } else {
      shakeT.current = 0;
      g.position.set(position[0], position[1] + fY, position[2]);
    }

    g.rotation.x = initTilt.x + Math.sin(t * .35 + phase) * .02;
    g.rotation.z = initTilt.z + Math.sin(t * .28 + phase + 1) * .02;

    const tR = cardState !== 'hidden' ? Math.PI : 0;
    rotY.current += (tR - rotY.current) * Math.min(1, dt * 9);
    g.rotation.y = rotY.current;

    const tBS = cardState === 'matched' ? 0 : hov ? 1.08 : 1.0;
    bScale.current += (tBS - bScale.current) * Math.min(1, dt * 7);
    pressScale.current += (1.0 - pressScale.current) * Math.min(1, dt * 15);
    const finalScale = Math.max(0, bScale.current) * pressScale.current * scale;
    if (bubbleRef.current) bubbleRef.current.scale.setScalar(finalScale);

    if (glowRef.current && cardState === 'matched') {
      glowRef.current.intensity = .4 + Math.sin(t * 3.5 + phase) * .15;
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    pressScale.current = 0.92;
  };
  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    pressScale.current = 1.0;
    onClick();
  };

  return (
    <group
      ref={gRef}
      position={position}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerEnter={() => setHov(true)}
      onPointerLeave={() => { setHov(false); pressScale.current = 1.0; }}
    >
      <mesh ref={bubbleRef}>
        <sphereGeometry args={[0.75, 16, 12]} />
        <meshBasicMaterial color="#88ccff" transparent opacity={0.14} depthWrite={false} />
      </mesh>
      <mesh position={[-0.12, 0.16, 0.52]}>
        <sphereGeometry args={[0.065, 8, 6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.45}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <group position={[0, 0, .012]}>
        <mesh>
          <planeGeometry args={[CW, CH]} />
          <meshBasicMaterial color={hov ? '#2a2066' : '#1a1548'} />
        </mesh>
        <mesh position={[0, 0, .001]} rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[.22, .22]} />
          <meshBasicMaterial color={color} transparent opacity={hov ? .45 : .32} />
        </mesh>
        {[-1, 1].map((d, i) => (
          <mesh key={i} position={[0, 0, .001]} rotation={[0, 0, d * Math.PI / 4]}>
            <planeGeometry args={[.58, .014]} />
            <meshBasicMaterial color={color} transparent opacity={hov ? .60 : .50} />
          </mesh>
        ))}
        {([[-CW / 2 + .09, CH / 2 - .09], [CW / 2 - .09, CH / 2 - .09],
          [-CW / 2 + .09, -CH / 2 + .09], [CW / 2 - .09, -CH / 2 + .09]] as [number, number][])
          .map(([cx, cy], i) => (
            <mesh key={i} position={[cx, cy, .002]}>
              <circleGeometry args={[.035, 8]} />
              <meshBasicMaterial color={color} transparent opacity={hov ? .90 : .75} />
            </mesh>
          ))}
        <mesh position={[0, 0, .0005]}>
          <planeGeometry args={[CW + .02, CH + .02]} />
          <meshBasicMaterial color={color} transparent opacity={hov ? .18 : .08} />
        </mesh>
      </group>

      <group position={[0, 0, -.012]} rotation={[0, Math.PI, 0]}>
        <mesh>
          <planeGeometry args={[CW, CH]} />
          <meshBasicMaterial color="#08061c" />
        </mesh>
        {texture && (
          <mesh position={[0, 0, .003]}>
            <planeGeometry args={[CW - .06, CH - .06]} />
            {/* ⭐ Si la textura falla, el color de fondo se mostrará sin romper el motor */}
            <meshBasicMaterial map={texture} toneMapped={false} transparent={true} opacity={1} />
          </mesh>
        )}
        <mesh position={[0, 0, .001]}>
          <planeGeometry args={[CW - .018, CH - .018]} />
          <meshBasicMaterial
            color={cardState === 'matched' ? '#00ff88' : color}
            transparent opacity={cardState === 'matched' ? .32 : .18} />
        </mesh>
      </group>

      {cardState === 'matched' && (
        <pointLight ref={glowRef} color="#00ff99" intensity={.4} distance={2.0} decay={2} />
      )}
      {hov && cardState === 'hidden' && (
        <pointLight color={color} intensity={.30} distance={1.8} decay={2} />
      )}
    </group>
  );
}
import { useMemo } from 'react';
import * as THREE from 'three';

interface CartaEnvironmentProps {
  isMobile: boolean;
}

export default function CartaEnvironment({ isMobile }: CartaEnvironmentProps) {
  const grassTufts = useMemo(() => {
    const tufts = [];
    for (let i = 0; i < (isMobile ? 40 : 80); i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * 8;
      tufts.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        scale: 0.6 + Math.random() * 0.8,
        rot: Math.random() * Math.PI * 2,
      });
    }
    return tufts;
  }, [isMobile]);

  const lightPoints = useMemo(() => {
    const points = [];
    for (let i = 0; i < (isMobile ? 12 : 24); i++) {
      const angle = (i / (isMobile ? 12 : 24)) * Math.PI * 2;
      const radius = 0.8 + Math.random() * 0.4;
      points.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        intensity: 0.8 + Math.random() * 0.4,
        color: ['#ffd700', '#ffed4e', '#fff44f'][Math.floor(Math.random() * 3)],
      });
    }
    return points;
  }, [isMobile]);

  return (
    <group>
      {/* Piso mejorado con textura */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[16, 64]} />
        <meshStandardMaterial
          color="#1a4d2e"
          roughness={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Pasto - malla de cilindros pequeños */}
      {grassTufts.map((tuft, i) => (
        <group key={i} position={[tuft.x, 0.05, tuft.z]} rotation={[0, tuft.rot, 0]} scale={tuft.scale}>
          <mesh position={[0, 0.15, 0]}>
            <coneGeometry args={[0.08, 0.3, 6]} />
            <meshStandardMaterial color="#2d7a4a" roughness={1} />
          </mesh>
          <mesh position={[0.05, 0.12, 0.02]}>
            <coneGeometry args={[0.06, 0.25, 5]} />
            <meshStandardMaterial color="#3a8f5e" roughness={1} />
          </mesh>
        </group>
      ))}

      {/* Luces del camino - pequeños orbes de luz */}
      {lightPoints.map((point, i) => (
        <group key={`light-${i}`} position={[point.x, 0.15, point.z]}>
          <mesh>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial
              color={point.color}
              emissive={point.color}
              emissiveIntensity={point.intensity}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            color={point.color}
            intensity={1.2 * point.intensity}
            distance={3}
            decay={2}
          />
        </group>
      ))}

      {/* Iluminación ambiental adicional */}
      <pointLight
        position={[2, 4, 2]}
        intensity={0.8}
        color="#e0b050"
        distance={20}
        decay={2}
      />
      <pointLight
        position={[-2, 4, -2]}
        intensity={0.6}
        color="#a8d8ff"
        distance={20}
        decay={2}
      />
    </group>
  );
}

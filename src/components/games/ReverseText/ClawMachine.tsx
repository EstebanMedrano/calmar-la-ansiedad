// ClawMachine.tsx - Offset ajustado a -0.10 para caer en Y=2.0
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { GamePhase } from './ReverseText';
import { CLAW_TOP_Y, CABLE_MAX_LEN, CABLE_MIN_LEN } from './positions';

interface Props {
  phase:      GamePhase;
  nextPhrase: string;
  nextColor:  string;
  hasNext:    boolean;
}

export default function ClawMachine({ phase, nextPhrase, nextColor, hasNext }: Props) {
  const cableRef     = useRef<THREE.Mesh>(null);
  const clawGroupRef = useRef<THREE.Group>(null);
  const clawLightRef = useRef<THREE.PointLight>(null);
  const cableLen     = useRef(CABLE_MIN_LEN);

  useFrame((_, dt) => {
    let target = CABLE_MIN_LEN;
    if (phase === 'claw_down' || phase === 'claw_place') {
      target = CABLE_MAX_LEN;
    }
    const speed = phase === 'claw_down'  ? 1.6 :
                  phase === 'claw_up'    ? 1.4 : 3.0;
    cableLen.current = THREE.MathUtils.lerp(cableLen.current, target, dt * speed);

    const cl = cableLen.current;
    if (cableRef.current) {
      cableRef.current.scale.y    = cl;
      cableRef.current.position.y = CLAW_TOP_Y - cl / 2;
    }
    if (clawGroupRef.current) {
      clawGroupRef.current.position.y = CLAW_TOP_Y - cl;
      // Garra estática en el centro
      clawGroupRef.current.position.x = 0; 
    }
    if (clawLightRef.current) {
      const active = phase === 'claw_down' || phase === 'claw_place';
      clawLightRef.current.intensity = THREE.MathUtils.lerp(
        clawLightRef.current.intensity, active ? 2.5 : 0.5, dt * 3.0
      );
    }
  });

  const showWord = hasNext && (phase === 'claw_down' || phase === 'claw_place');

  return (
    <group>
      {/* Cable */}
      <mesh ref={cableRef} position={[0, CLAW_TOP_Y, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 1, 6]} />
        <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Garra */}
      <group ref={clawGroupRef} position={[0, CLAW_TOP_Y - CABLE_MIN_LEN, 0]}>
        <mesh>
          <sphereGeometry args={[0.08, 10, 8]} />
          <meshStandardMaterial color="#777" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Pinzas básicas estáticas */}
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2;
          return (
            <mesh key={i}
              position={[Math.cos(a) * 0.20, -0.22, Math.sin(a) * 0.20]}
              rotation={[Math.cos(a) * 0.42, a, Math.sin(a) * 0.42]}
            >
              <cylinderGeometry args={[0.014, 0.026, 0.48, 6]} />
              <meshStandardMaterial color="#888" metalness={0.9} roughness={0.1} />
            </mesh>
          );
        })}

        <pointLight ref={clawLightRef} color="#cc44ff" intensity={0} distance={3.5} decay={2} position={[0, 0, 0]} />

        {/* 🛑 OFFSET AJUSTADO: Ahora baja la frase a Y=2.0 (5.0 - 2.9 - 0.10 = 2.0) */}
        {showWord && (
          <group position={[0, -0.10, 0]}>
            <mesh position={[0, 0, -0.025]}>
              <planeGeometry args={[Math.max(1.8, nextPhrase.length * 0.26), 0.72]} />
              <meshBasicMaterial color={nextColor} transparent opacity={0.20}
                blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <Text rotation={[0, 0, Math.PI]} fontSize={0.38} color={nextColor}
              anchorX="center" anchorY="middle" outlineWidth={0.048} outlineColor="#000">
              {nextPhrase}
            </Text>
          </group>
        )}
      </group>
    </group>
  );
}
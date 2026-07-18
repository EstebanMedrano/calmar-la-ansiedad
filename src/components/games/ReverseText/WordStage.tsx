// WordStage.tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { GamePhase } from './ReverseText';
import { WORD_POS } from './positions';

const HIDDEN: GamePhase[] = [
  'success_break', 'lia_run', 'lia_press',
  'claw_down', 'claw_place', 'complete',
];

export default function WordStage({ phrase, color, phase }: {
  phrase: string; color: string; phase: GamePhase;
}) {
  const gRef     = useRef<THREE.Group>(null);
  const scaleRef = useRef(0);
  const shakeX   = useRef(0);

  useFrame((state) => {
    const g = gRef.current; if (!g) return;
    const t = state.clock.elapsedTime;

    const hidden = HIDDEN.includes(phase);
    const ts     = hidden ? 0 : 1.0;
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, ts, hidden ? 0.22 : 0.09);
    g.scale.setScalar(Math.max(0, scaleRef.current));

    if (phase === 'success_tito') {
      shakeX.current = (Math.random() - 0.5) * 0.065;
    } else {
      shakeX.current = THREE.MathUtils.lerp(shakeX.current, 0, 0.18);
    }

    // 🛑 Sincronizado con la fuente (frecuencia 2.0, amplitud 0.08)
    g.position.set(
      shakeX.current,
      WORD_POS[1] + Math.sin(t * 2.0) * 0.08,
      WORD_POS[2]
    );
  });

  return (
    <group ref={gRef} position={[...WORD_POS]}>
      <mesh position={[0, 0, -0.03]}>
        <planeGeometry args={[Math.max(2.4, phrase.length * 0.26), 0.85]} />
        <meshBasicMaterial color={color} transparent opacity={0.20}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <Text
        rotation={[0, 0, Math.PI]}
        fontSize={0.44}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.055}
        outlineColor="#000000"
      >
        {phrase}
      </Text>
    </group>
  );
}
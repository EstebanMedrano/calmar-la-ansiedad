import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WORD_POS } from './positions';

const N = 58;

export default function ShardParticles({ active, color }: { active: boolean; color: string }) {
  const ref  = useRef<THREE.Points>(null);
  const vel  = useRef(new Float32Array(N * 3));
  const life = useRef(new Float32Array(N));
  const pos  = useMemo(() => new Float32Array(N * 3), []);

  useEffect(() => {
    if (!active) return;
    for (let i = 0; i < N; i++) {
      const a  = Math.random() * Math.PI * 2;
      const el = (Math.random() - 0.5) * Math.PI;
      const sp = 1.5 + Math.random() * 5.0;
      vel.current[i*3]   = Math.cos(el) * Math.cos(a) * sp;
      vel.current[i*3+1] = Math.sin(el) * sp + 1.8;
      vel.current[i*3+2] = Math.cos(el) * Math.sin(a) * sp;
      pos[i*3]   = WORD_POS[0]; pos[i*3+1] = WORD_POS[1]; pos[i*3+2] = WORD_POS[2];
      life.current[i] = 1.0;
    }
    if (ref.current) (ref.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }, [active, pos]);

  useFrame((_, dt) => {
    const pts = ref.current;
    if (!pts) return;
    if (!active) { pts.visible = false; return; }
    pts.visible = true;
    const pa = pts.geometry.attributes.position as THREE.BufferAttribute;
    let maxLife = 0;
    for (let i = 0; i < N; i++) {
      if (life.current[i] <= 0) continue;
      life.current[i] -= dt * 0.98;
      maxLife = Math.max(maxLife, life.current[i]);
      vel.current[i*3+1] -= dt * 5.5;
      pos[i*3]   += vel.current[i*3]   * dt;
      pos[i*3+1] += vel.current[i*3+1] * dt;
      pos[i*3+2] += vel.current[i*3+2] * dt;
      pa.setXYZ(i, pos[i*3], pos[i*3+1], pos[i*3+2]);
    }
    pa.needsUpdate = true;
    (pts.material as THREE.PointsMaterial).opacity = maxLife * 0.95;
  });

  return (
    <points ref={ref} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.20} color={color} transparent opacity={1}
        sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}
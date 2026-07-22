import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Points } from 'three';

interface ConfettiProps {
  active: boolean;
  count?: number;
  origin?: [number, number, number];
}

const COLORS = ['#fbbf24', '#e879f9', '#60a5fa', '#34d399', '#fb7185', '#fff3e6'];

/**
 * Confeti del final.
 *
 * Un único sistema de puntos con velocidad y gravedad por partícula. Los
 * buffers se crean una sola vez y luego solo se escriben las posiciones:
 * recrear la geometría cada frame es lo que hace que otros efectos de la
 * app den tirones.
 */
export default function Confetti({ active, count = 250, origin = [0, 1.2, 0] }: ConfettiProps) {
  const pointsRef = useRef<Points>(null);
  const velocities = useRef<Float32Array>(new Float32Array(count * 3));
  const elapsed = useRef(0);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      c.set(COLORS[i % COLORS.length]);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, [count]);

  const reset = () => {
    elapsed.current = 0;
    const v = velocities.current;
    for (let i = 0; i < count; i++) {
      positions[i * 3] = origin[0];
      positions[i * 3 + 1] = origin[1];
      positions[i * 3 + 2] = origin[2];

      // Reparto esférico hacia arriba
      const theta = Math.random() * Math.PI * 2;
      const speed = 1.4 + Math.random() * 2.6;
      const up = 0.5 + Math.random() * 1.4;
      v[i * 3] = Math.cos(theta) * speed * 0.6;
      v[i * 3 + 1] = up * speed * 0.7;
      v[i * 3 + 2] = Math.sin(theta) * speed * 0.6;
    }
    const geo = pointsRef.current?.geometry;
    geo?.attributes.position && (geo.attributes.position.needsUpdate = true);
  };

  useEffect(() => {
    if (active) reset();
    // reset depende de refs y de arrays estables; no hace falta en deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useFrame((_, delta) => {
    const p = pointsRef.current;
    if (!p || !active) return;

    const dt = Math.min(delta, 0.05); // evita saltos si la pestaña se congela
    elapsed.current += dt;
    const v = velocities.current;

    for (let i = 0; i < count; i++) {
      v[i * 3 + 1] -= 2.6 * dt;            // gravedad
      v[i * 3] *= 1 - 0.6 * dt;            // rozamiento del aire
      v[i * 3 + 2] *= 1 - 0.6 * dt;

      positions[i * 3] += v[i * 3] * dt;
      positions[i * 3 + 1] += v[i * 3 + 1] * dt;
      positions[i * 3 + 2] += v[i * 3 + 2] * dt;
    }

    p.geometry.attributes.position.needsUpdate = true;
    const mat = p.material as THREE.PointsMaterial;
    mat.opacity = Math.max(0, 1 - elapsed.current / 6);
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        vertexColors
        transparent
        opacity={1}
        sizeAttenuation
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

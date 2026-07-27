import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Points } from 'three';

interface CartaMagicParticlesProps {
  active: boolean;
  origin?: [number, number, number];
}

const MAGIC_COLORS = ['#e879f9', '#a78bfa', '#fbbf24', '#60a5fa', '#34d399'];

export default function CartaMagicParticles({ active, origin = [0, 1.15, 1.9] }: CartaMagicParticlesProps) {
  const pointsRef = useRef<Points>(null);
  const elapsedRef = useRef(0);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
    color: THREE.Color;
  }>>([]);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(300 * 3);
    const col = new Float32Array(300 * 3);
    return { positions: pos, colors: col };
  }, []);

  const createParticles = (count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 0.8 + Math.random() * 1.8;

      const color = new THREE.Color(MAGIC_COLORS[Math.floor(Math.random() * MAGIC_COLORS.length)]);

      particlesRef.current.push({
        x: origin[0],
        y: origin[1],
        z: origin[2],
        vx: Math.sin(phi) * Math.cos(angle) * speed,
        vy: Math.sin(phi) * Math.sin(angle) * speed + 0.5,
        vz: Math.cos(phi) * speed,
        life: 0,
        maxLife: 1.2 + Math.random() * 0.8,
        color,
      });
    }
  };

  useEffect(() => {
    if (!active) {
      elapsedRef.current = 0;
      particlesRef.current = [];
    }
  }, [active]);

  useFrame((_, delta) => {
    const p = pointsRef.current;
    if (!p || !active) return;

    elapsedRef.current += delta;

    // Crear nuevas partículas periódicamente
    if (Math.floor(elapsedRef.current / 0.1) % 2 === 0 && particlesRef.current.length < 300) {
      createParticles(4);
    }

    // Actualizar y limpiar partículas viejas
    const particles = particlesRef.current;
    for (let i = 0; i < particles.length; i++) {
      particles[i].life += delta;
      if (particles[i].life > particles[i].maxLife) {
        particles.splice(i, 1);
        i--;
      }
    }

    // Actualizar buffers
    positions.fill(0);
    colors.fill(0);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.vy -= 1.2 * delta;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.vz *= 0.98;

      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;

      const lifeRatio = p.life / p.maxLife;
      const opacity = Math.max(0, 1 - lifeRatio * 1.5);

      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      colors[i * 3] = p.color.r * opacity;
      colors[i * 3 + 1] = p.color.g * opacity;
      colors[i * 3 + 2] = p.color.b * opacity;
    }

    p.geometry.attributes.position.needsUpdate = true;
    p.geometry.attributes.color.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
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

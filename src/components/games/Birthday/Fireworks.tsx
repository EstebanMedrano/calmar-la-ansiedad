import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Points } from 'three';

interface FireworksProps {
  active: boolean;
  duration?: number;
}

const FIREWORK_COLORS = ['#ff1744', '#f50057', '#ff6f00', '#ffea00', '#00e676', '#00bcd4', '#2196f3', '#7c4dff'];

export default function Fireworks({ active, duration = 3.2 }: FireworksProps) {
  const pointsRef = useRef<Points>(null);
  const particlesRef = useRef<Array<{
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    life: number;
    maxLife: number;
    color: THREE.Color;
    size: number;
  }>>([]);
  const elapsedRef = useRef(0);

  const { positions, colors, sizes } = useMemo(() => {
    const particleCount = 400;
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const siz = new Float32Array(particleCount);
    return { positions: pos, colors: col, sizes: siz, particleCount };
  }, []);

  const createExplosion = (center: THREE.Vector3, colorIdx: number) => {
    const particleCount = 50;
    const color = new THREE.Color(FIREWORK_COLORS[colorIdx % FIREWORK_COLORS.length]);

    for (let i = 0; i < particleCount; i++) {
      if (particlesRef.current.length >= 400) break;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 3.5 + Math.random() * 4.5;

      const vel = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed + 2,
        Math.cos(phi) * speed
      );

      particlesRef.current.push({
        pos: center.clone(),
        vel,
        life: 0,
        maxLife: 2.2 + Math.random() * 0.8,
        color: color.clone(),
        size: 0.12 + Math.random() * 0.08,
      });
    }
  };

  useEffect(() => {
    if (!active) {
      elapsedRef.current = 0;
      particlesRef.current = [];
      return;
    }

    const explosionInterval = setInterval(() => {
      if (elapsedRef.current < duration) {
        const x = (Math.random() - 0.5) * 1.2;
        const y = 1.5 + Math.random() * 2;
        const z = (Math.random() - 0.5) * 1.5;
        const colorIdx = Math.floor(Math.random() * FIREWORK_COLORS.length);
        createExplosion(new THREE.Vector3(x, y, z), colorIdx);
      }
    }, 180);

    return () => clearInterval(explosionInterval);
  }, [active, duration]);

  useFrame((_, delta) => {
    const p = pointsRef.current;
    if (!p || !active) return;

    elapsedRef.current += delta;

    if (elapsedRef.current > duration) {
      particlesRef.current = particlesRef.current.filter(particle => particle.life < particle.maxLife);
    }

    const dt = Math.min(delta, 0.05);
    const particles = particlesRef.current;

    // Limpiar particles viejas
    particlesRef.current = particles.filter(particle => particle.life < particle.maxLife);

    // Actualizar posiciones
    for (let i = 0; i < particlesRef.current.length; i++) {
      const particle = particlesRef.current[i];
      particle.life += dt;

      particle.vel.y -= 9.8 * dt;
      particle.vel.x *= 1 - 0.3 * dt;
      particle.vel.z *= 1 - 0.3 * dt;

      particle.pos.add(particle.vel.clone().multiplyScalar(dt));
    }

    // Actualizar buffer de posiciones
    const posArray = positions;
    posArray.fill(0);
    const colArray = colors;
    colArray.fill(0);
    const sizeArray = sizes;
    sizeArray.fill(0);

    for (let i = 0; i < particlesRef.current.length; i++) {
      const particle = particlesRef.current[i];
      const life = particle.life / particle.maxLife;
      const opacity = Math.max(0, 1 - life);

      posArray[i * 3] = particle.pos.x;
      posArray[i * 3 + 1] = particle.pos.y;
      posArray[i * 3 + 2] = particle.pos.z;

      colArray[i * 3] = particle.color.r * opacity;
      colArray[i * 3 + 1] = particle.color.g * opacity;
      colArray[i * 3 + 2] = particle.color.b * opacity;

      sizeArray[i] = particle.size * opacity * 0.8;
    }

    p.geometry.attributes.position.needsUpdate = true;
    p.geometry.attributes.color.needsUpdate = true;
    const mat = p.material as THREE.PointsMaterial;
    mat.size = 0.1;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
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

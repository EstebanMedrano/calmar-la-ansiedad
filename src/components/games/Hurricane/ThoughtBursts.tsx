import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BurstParticle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number;
  color: string;
  size: number;
}

interface ThoughtBurstsProps {
  active: boolean;
  bursts: { id: number; position: THREE.Vector3 }[]; // Recibe array de objetos con ID y posición
}

export default function ThoughtBursts({ active, bursts }: ThoughtBurstsProps) {
  const particlesRef = useRef<BurstParticle[]>([]);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const clock = useRef(0);

  // Generamos partículas de explosión para cada centro activo
  useMemo(() => {
    if (!active || bursts.length === 0) {
      // Si no hay bursts activos, vaciamos el array de partículas
      particlesRef.current = [];
      return;
    }

    const newParticles: BurstParticle[] = [];
    const colors = ['#ef4444','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316','#ffffff','#10b981'];

    bursts.forEach(({ position }) => {
      const count = 80 + Math.floor(Math.random() * 60);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const pitch = Math.acos(2 * Math.random() - 1);
        const speed = 3.0 + Math.random() * 6.0;

        const color = colors[Math.floor(Math.random() * colors.length)];

        newParticles.push({
          x: position.x, y: position.y, z: position.z,
          vx: Math.sin(pitch) * Math.cos(angle) * speed,
          vy: Math.sin(pitch) * Math.sin(angle) * speed,
          vz: Math.cos(pitch) * speed,
          life: 1.2 + Math.random() * 0.8,
          color: color,
          size: 0.20 + Math.random() * 0.35,
        });
      }
    });

    particlesRef.current = newParticles;
  }, [active, bursts]);

  useFrame((_, delta) => {
    if (!active || particlesRef.current.length === 0) return;
    clock.current += delta;

    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];

    // Actualizar y filtrar partículas
    const newParticles = particlesRef.current.filter(p => {
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      p.vy -= 0.8 * delta; // Gravedad ligera
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.vz *= 0.99;
      p.life -= delta * 0.9;

      if (p.life <= 0) return false;

      positions.push(p.x, p.y, p.z);
      const c = new THREE.Color(p.color);
      colors.push(c.r, c.g, c.b);
      sizes.push(p.size * Math.max(0, p.life));
      return true;
    });

    particlesRef.current = newParticles;

    if (geometryRef.current) {
      geometryRef.current.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometryRef.current.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometryRef.current.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
      geometryRef.current.attributes.position.needsUpdate = true;
      geometryRef.current.attributes.color.needsUpdate = true;
      geometryRef.current.attributes.size.needsUpdate = true;
    }
  });

  if (!active || particlesRef.current.length === 0) return null;

  return (
    <points>
      <bufferGeometry ref={geometryRef} />
      <pointsMaterial
        size={0.25}
        vertexColors
        transparent
        opacity={0.95}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
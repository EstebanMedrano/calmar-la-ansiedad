import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Group } from 'three';
import { assetUrl } from '../../../utils/assetUrl';

interface TulipsProps {
  count?: number;
  /** Radio del anillo donde se reparten alrededor de la torta. */
  radius?: number;
  /** Atenúa su brillo cuando se apagan las luces. */
  dimFactor?: number;
}

/**
 * Tulipanes alrededor de la escena. Son sus flores favoritas.
 *
 * Se usan sprites cruzados (dos planos perpendiculares con la misma textura)
 * en vez de geometría: desde cualquier ángulo se ve volumen, y cuesta dos
 * triángulos por flor en lugar de cientos.
 *
 * alphaTest en vez de transparencia normal para que no haya problemas de
 * orden de dibujado entre flores que se solapan.
 */
export default function Tulips({ count = 16, radius = 2.4, dimFactor = 0 }: TulipsProps) {
  const texture = useTexture(assetUrl('/assets/img/objetos/tulipan2.png'));
  const groupRef = useRef<Group>(null);
  const stemRefs = useRef<(Group | null)[]>([]);

  const tulips = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        // Distribución en anillo con algo de desorden, para que no se vea
        // el patrón. Se usa una secuencia determinista y no Math.random()
        // porque un random aquí recolocaría las flores en cada render.
        const a = (i / count) * Math.PI * 2 + ((i * 37) % 23) / 40;
        const r = radius + (((i * 53) % 17) / 17) * 1.1;
        return {
          key: i,
          x: Math.cos(a) * r,
          z: Math.sin(a) * r,
          scale: 0.42 + (((i * 29) % 13) / 13) * 0.28,
          rotY: ((i * 71) % 31) / 31 * Math.PI,
          seed: ((i * 17) % 19) / 19 * Math.PI * 2,
        };
      }),
    [count, radius],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < stemRefs.current.length; i++) {
      const s = stemRefs.current[i];
      if (!s) continue;
      // Vaivén suave, cada flor con su fase
      s.rotation.z = Math.sin(t * 0.7 + tulips[i].seed) * 0.07;
      s.rotation.x = Math.cos(t * 0.5 + tulips[i].seed) * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      {tulips.map((tu, i) => (
        <group key={tu.key} position={[tu.x, 0, tu.z]}>
          <group ref={(el) => { stemRefs.current[i] = el; }}>
            {/* Tallo */}
            <mesh position={[0, tu.scale * 0.34, 0]}>
              <cylinderGeometry args={[0.012, 0.016, tu.scale * 0.68, 5]} />
              <meshStandardMaterial color="#3f7d3a" roughness={0.85} />
            </mesh>

            {/* Flor: dos planos cruzados */}
            <group position={[0, tu.scale * 0.78, 0]} rotation={[0, tu.rotY, 0]}>
              {[0, Math.PI / 2].map((ry) => (
                <mesh key={ry} rotation={[0, ry, 0]}>
                  <planeGeometry args={[tu.scale * 0.5, tu.scale * 0.5]} />
                  <meshStandardMaterial
                    map={texture}
                    transparent
                    alphaTest={0.5}
                    side={THREE.DoubleSide}
                    roughness={0.8}
                    emissive="#ff6b8a"
                    emissiveIntensity={0.1 + dimFactor * 0.35}
                  />
                </mesh>
              ))}
            </group>
          </group>
        </group>
      ))}
    </group>
  );
}
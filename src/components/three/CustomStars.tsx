import { useMemo, forwardRef } from 'react';
import type { Points } from 'three';

interface CustomStarsProps {
  /**
   * Número de estrellas. 6500 es el valor original de RitualFire; en móvil
   * conviene bajarlo, porque en una pantalla de 400px no se distinguen y
   * solo consumen relleno.
   */
  count?: number;
  size?: number;
  color?: string;
  opacity?: number;
}

/**
 * Cielo estrellado propio.
 *
 * Se usa <points> en vez de las Stars de drei porque estas quedan afectadas
 * por la niebla de la escena y desaparecen; con fog={false} se mantienen
 * visibles aunque el resto del escenario esté envuelto en bruma.
 */
const CustomStars = forwardRef<Points, CustomStarsProps>(function CustomStars(
  { count = 6500, size = 0.55, color = '#d8eaff', opacity = 0.9 },
  ref,
) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const cosP = Math.random();
      const sinP = Math.sqrt(1 - cosP * cosP);
      const r = 60 + Math.random() * 40;
      arr[i * 3] = r * sinP * Math.cos(theta);
      arr[i * 3 + 1] = r * cosP; // solo el hemisferio superior
      arr[i * 3 + 2] = r * sinP * Math.sin(theta);
    }
    return arr;
  }, [count]);

  return (
    <points ref={ref} renderOrder={-1}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
        fog={false}
      />
    </points>
  );
});

export default CustomStars;

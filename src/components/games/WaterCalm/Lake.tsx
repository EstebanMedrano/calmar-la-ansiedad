import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { lakeVertexShader, lakeFragmentShader } from './lakeShader';

// Lago redimensionado para que el borde neón quede justo frente al jugador
export const LAKE_Y        = -0.5;
export const LAKE_Z_CENTER = -4.0;
export const LAKE_WIDTH    = 24;
export const LAKE_HEIGHT   = 16;
const MAX_RIPPLES = 20;

export interface LakeHandle {
  addRipple: (wx: number, wz: number) => void;
}

interface LakeProps {
  laserColorRef: React.MutableRefObject<THREE.Color>;
}

const Lake = forwardRef<LakeHandle, LakeProps>(({ laserColorRef }, ref) => {
  const matRef     = useRef<THREE.ShaderMaterial>(null);
  const ripplesRef = useRef<{ wx: number; wz: number; time: number }[]>([]);

  const uniforms = useMemo(() => ({
    uTime:        { value: 0 },
    uBaseColor:   { value: new THREE.Color('#0a1f2e') },
    uLaserColor:  { value: new THREE.Color('#3b82f6') },
    uRipplePos:   { value: Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector2(0, LAKE_Z_CENTER)) },
    uRippleTime:  { value: new Float32Array(MAX_RIPPLES).fill(-100) },
    uRippleCount: { value: 0 },
  }), []);

  useImperativeHandle(ref, () => ({
    addRipple: (wx: number, wz: number) => {
      const mat = matRef.current;
      if (!mat) return;
      const time    = mat.uniforms.uTime.value;
      const ripples = ripplesRef.current;
      ripples.push({ wx, wz, time });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
      for (let i = 0; i < MAX_RIPPLES; i++) {
        if (i < ripples.length) {
          mat.uniforms.uRipplePos.value[i].set(ripples[i].wx, ripples[i].wz);
          mat.uniforms.uRippleTime.value[i] = ripples[i].time;
        } else {
          mat.uniforms.uRippleTime.value[i] = -100;
        }
      }
      mat.uniforms.uRippleCount.value = ripples.length;
    },
  }));

  useFrame((_, delta) => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value  += delta;
    mat.uniforms.uLaserColor.value.copy(laserColorRef.current);
  });

  return (
    <group>
      <mesh position={[0, LAKE_Y, LAKE_Z_CENTER]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Más divisiones para que las ondas se vean suaves */}
        <planeGeometry args={[LAKE_WIDTH, LAKE_HEIGHT, 180, 180]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={lakeVertexShader}
          fragmentShader={lakeFragmentShader}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Luces para bañar el agua y que se vea el brillo */}
      <pointLight position={[0, LAKE_Y+2.5, LAKE_Z_CENTER]} color="#00ffcc" intensity={18} distance={40} decay={1.2} />
      <pointLight position={[-12, LAKE_Y+1.5, LAKE_Z_CENTER-3]} color="#00e8b0" intensity={10} distance={30} decay={1.8} />
      <pointLight position={[ 12, LAKE_Y+1.5, LAKE_Z_CENTER+3]} color="#00e8b0" intensity={10} distance={30} decay={1.8} />
    </group>
  );
});

Lake.displayName = 'Lake';
export default Lake;
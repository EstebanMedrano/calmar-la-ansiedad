// CosmicParticles.tsx
import { useMemo, useRef, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const N_CLOSE = 300;
const N_FAR   = 140;
const N       = N_CLOSE + N_FAR;

// Textura circular — elimina los cuadrados
function makeStarTex(): THREE.Texture {
  const sz  = 64;
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = sz;
  const ctx = cvs.getContext('2d')!;
  const grd = ctx.createRadialGradient(sz/2, sz/2, 0, sz/2, sz/2, sz/2);
  grd.addColorStop(0,    'rgba(255,255,255,1.0)');
  grd.addColorStop(0.22, 'rgba(215,235,255,0.90)');
  grd.addColorStop(0.52, 'rgba(180,215,255,0.40)');
  grd.addColorStop(1.0,  'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, sz, sz);
  const tex = new THREE.CanvasTexture(cvs);
  tex.needsUpdate = true;
  return tex;
}

function CosmicParticles({
  phaseRef,
  progRef,
}: {
  phaseRef: React.MutableRefObject<number>;
  progRef:  React.MutableRefObject<number>;
}) {
  const ref      = useRef<THREE.Points>(null);
  const theta    = useRef(new Float32Array(N));
  const phi      = useRef(new Float32Array(N));
  const baseR    = useRef(new Float32Array(N));
  const curR     = useRef(new Float32Array(N));
  const sp       = useRef(new Float32Array(N));
  const isClose  = useRef(new Uint8Array(N));
  const starTex  = useMemo(() => makeStarTex(), []);

  const positions = useMemo(() => {
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      const r = i < N_CLOSE ? 4.0 + Math.random()*7.0 : 11 + Math.random()*5;
      theta.current[i] = t; phi.current[i] = p;
      baseR.current[i] = r; curR.current[i] = r;
      sp.current[i]    = 0.4 + Math.random()*0.9;
      isClose.current[i] = i < N_CLOSE ? 1 : 0;
      arr[i*3]   = r*Math.sin(p)*Math.cos(t);
      arr[i*3+1] = r*Math.sin(p)*Math.sin(t);
      arr[i*3+2] = r*Math.cos(p);
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    const pts = ref.current; if (!pts) return;
    const pa       = pts.geometry.attributes.position as THREE.BufferAttribute;
    const phase    = phaseRef.current;
    const progress = progRef.current;

    for (let i = 0; i < N; i++) {
      theta.current[i] += dt * 0.012 * sp.current[i]; // drift angular suave

      if (isClose.current[i]) {
        const base = baseR.current[i];
        if (phase === 0) {
          // INHALA: estrellas VUELAN hacia el centro — efecto dramático
          const tgt = Math.max(1.8, base * (1 - progress * 0.88));
          curR.current[i] = THREE.MathUtils.lerp(curR.current[i], tgt, dt*sp.current[i]*1.7);
        } else if (phase === 1) {
          // RETÉN: regresan suavemente a posición base
          curR.current[i] = THREE.MathUtils.lerp(curR.current[i], base, dt * 0.55);
        } else {
          // EXHALA: estrellas SALEN disparadas
          const tgt = Math.min(17, base + (17 - base)*progress*0.92);
          curR.current[i] = THREE.MathUtils.lerp(curR.current[i], tgt, dt*sp.current[i]*1.5);
        }
      }

      const r = curR.current[i];
      pa.setXYZ(i,
        r*Math.sin(phi.current[i])*Math.cos(theta.current[i]),
        r*Math.sin(phi.current[i])*Math.sin(theta.current[i]),
        r*Math.cos(phi.current[i])
      );
    }
    pa.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.32}             // 🛑 Más grandes
        map={starTex}
        color="#e6f3ff"         // 🛑 Blanco azulado brillante
        transparent
        opacity={0.85}          // 🛑 Brillo máximo (antes era 0.36)
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        alphaTest={0.004}
      />
    </points>
  );
}

export default memo(CosmicParticles);
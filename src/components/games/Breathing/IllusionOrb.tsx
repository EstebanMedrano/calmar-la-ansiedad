// IllusionOrb.tsx
import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { illusionVertex, illusionFragment } from './illusionShader';

const PHASE_COLORS: Array<[string, string]> = [
  ['#10d4b0', '#05a0ea'],
  ['#9b6df6', '#5542e8'],
  ['#f5a020', '#ef5040'],
];
const MIN_S = 0.55, MAX_S = 1.90;
const _tc = new THREE.Color();

// Glow manual sin post-processing (3 capas concéntricas)
function GlowShell({
  scaleRef, colorRef,
}: {
  scaleRef: React.MutableRefObject<number>;
  colorRef: React.MutableRefObject<THREE.Color>;
}) {
  const layers = [
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
    useRef<THREE.Mesh>(null),
  ];
  const mats = [
    useRef<THREE.MeshBasicMaterial>(null),
    useRef<THREE.MeshBasicMaterial>(null),
    useRef<THREE.MeshBasicMaterial>(null),
  ];
  const SCALES  = [1.18, 1.50, 1.92];
  const OPACITY = [0.065, 0.028, 0.011];

  useFrame(() => {
    const s = scaleRef.current;
    const c = colorRef.current;
    layers.forEach((ref, i) => {
      if (ref.current) ref.current.scale.setScalar(s * SCALES[i]);
    });
    mats.forEach((ref) => {
      if (ref.current) ref.current.color.copy(c);
    });
  });

  return (
    <>
      {layers.map((ref, i) => (
        <mesh key={i} ref={ref}>
          <sphereGeometry args={[1.0, 8, 8]} />
          <meshBasicMaterial
            ref={mats[i]}
            color="#ffffff"
            transparent
            opacity={OPACITY[i]}
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </>
  );
}

function IllusionOrb({
  phaseRef, progRef,
}: {
  phaseRef: React.MutableRefObject<number>;
  progRef:  React.MutableRefObject<number>;
}) {
  const meshRef  = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const scaleRef = useRef(MIN_S);
  const colorRef = useRef(new THREE.Color(PHASE_COLORS[0][0]));
  const speedRef = useRef(0);

  const uniforms = useMemo(() => ({
    uTime:   { value: 0 },
    uSpeed:  { value: 0.5 },
    uColor1: { value: new THREE.Color(PHASE_COLORS[0][0]) },
    uColor2: { value: new THREE.Color(PHASE_COLORS[0][1]) },
  }), []);

  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
    const phase = phaseRef.current;
    const prog  = progRef.current;

    const tgtS =
      phase === 0 ? MIN_S + (MAX_S - MIN_S) * prog :
      phase === 1 ? MAX_S :
                    MAX_S - (MAX_S - MIN_S) * prog;
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, tgtS, 0.06);
    if (meshRef.current) meshRef.current.scale.setScalar(scaleRef.current);

    const tgtSp =
      phase === 0 ?  0.8 + prog * 1.2 :
      phase === 1 ?  0.0 :
                    -(0.8 + prog * 1.2);
    speedRef.current = THREE.MathUtils.lerp(speedRef.current, tgtSp, dt * 2.8);
    uniforms.uSpeed.value = speedRef.current;

    const [c1, c2] = PHASE_COLORS[phase] ?? PHASE_COLORS[0];
    uniforms.uColor1.value.lerp(_tc.set(c1), 0.07);
    uniforms.uColor2.value.lerp(_tc.set(c2), 0.07);
    colorRef.current.copy(uniforms.uColor1.value);

    if (lightRef.current) {
      lightRef.current.intensity = THREE.MathUtils.lerp(
        lightRef.current.intensity, 0.8 + scaleRef.current * 1.35, 0.045
      );
      lightRef.current.color.copy(uniforms.uColor1.value);
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.0, 64, 64]} />
        {/* 🛑 CAMBIO CLAVE: transparent={false} y depthWrite={true} para que la esfera oculte lo que está detrás */}
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={illusionVertex}
          fragmentShader={illusionFragment}
          transparent={false}
          depthWrite={true}
          side={THREE.FrontSide}
        />
      </mesh>
      <GlowShell scaleRef={scaleRef} colorRef={colorRef} />
      <pointLight ref={lightRef} intensity={0.8} distance={9} decay={1.5} />
    </group>
  );
}

export default memo(IllusionOrb);
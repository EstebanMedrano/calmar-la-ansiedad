import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { HurricaneStage } from './Hurricane';
import useIsMobile from '../../../hooks/useIsMobile';

const FUNNEL_HEIGHT = 24;
const MAX_RADIUS = 8;
const INNER_RADIUS = 0.25;

/**
 * El giro del tornado se calcula en la tarjeta gráfica.
 *
 * Antes había un bucle en JavaScript que recorría las 7000 partículas en cada
 * fotograma haciendo un seno y un coseno por cada una, y volvía a subir todo
 * el buffer de posiciones a la GPU: era, con diferencia, lo que más costaba
 * de toda la app y lo que hacía que el juego fuera a tirones en el móvil.
 *
 * Ahora cada partícula guarda sus datos fijos (ángulo inicial, altura,
 * velocidad, radio) una sola vez, y el vértice calcula su posición a partir
 * del tiempo. La CPU no vuelve a tocar las partículas nunca más.
 */
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uHeight;
  uniform float uInner;
  uniform float uMax;

  attribute float aAngle;
  attribute float aHeight;
  attribute float aSpeed;
  attribute float aRMult;

  void main() {
    float angle = aAngle + uTime * aSpeed;
    float baseR = uInner + (uMax - uInner) * (aHeight / uHeight);
    float turb  = sin(aHeight * 0.9 + uTime * 3.5 + aAngle * 12.0) * 0.22;
    float r     = baseR * aRMult + turb;

    vec3 pos = vec3(cos(angle) * r, aHeight, sin(angle) * r);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    // sizeAttenuation: las partículas lejanas se ven más pequeñas
    gl_PointSize = 0.08 * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;

  void main() {
    // Recorta el cuadrado del punto a un círculo suave
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c);
    if (d > 0.5) discard;
    float alpha = uOpacity * smoothstep(0.5, 0.15, d);
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export default function Tornado({ stage }: { stage: HurricaneStage }) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const currentPos = useRef(new THREE.Vector3(0, 0, -90));
  // Reutilizado en cada frame: crear un Vector3 por fotograma genera basura
  // que el recolector acaba pagando con microcortes.
  const target = useRef(new THREE.Vector3());

  const isMobile = useIsMobile();
  const count = isMobile ? 3000 : 7000;

  const attrs = useMemo(() => {
    const angle = new Float32Array(count);
    const height = new Float32Array(count);
    const speed = new Float32Array(count);
    const rMult = new Float32Array(count);
    // Las posiciones reales las calcula el shader, pero three necesita un
    // atributo 'position' para saber cuántos vértices dibujar.
    const position = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      angle[i] = Math.random() * Math.PI * 2;
      height[i] = Math.random() * FUNNEL_HEIGHT;
      speed[i] = 0.8 + Math.random() * 2.4;
      rMult[i] = 0.65 + Math.random() * 0.7;
    }
    return { angle, height, speed, rMult, position };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHeight: { value: FUNNEL_HEIGHT },
      uInner: { value: INNER_RADIUS },
      uMax: { value: MAX_RADIUS },
      uColor: { value: new THREE.Color('#7733bb') },
      uOpacity: { value: 0.72 },
    }),
    [],
  );

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    if (stage === 'intro') target.current.set(0, 0, -90);
    else if (stage === 'tornado_approach') target.current.set(0, 0, -1);
    else if (stage === 'tornado') target.current.set(0, 0, 0);
    else if (stage === 'tornado_retreat') target.current.set(0, 0, -22.5);
    else if (stage === 'tornado_ascend') target.current.set(0, 40, -22.5);
    else if (stage === 'fireworks') target.current.set(0, 40, -22.5);
    else target.current.set(0, 130, 0);

    currentPos.current.lerp(target.current, delta * 0.55);
    group.position.copy(currentPos.current);
  });

  const visible = !['parachuting', 'complete'].includes(stage);

  return (
    <group ref={groupRef} visible={visible}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[attrs.position, 3]} />
          <bufferAttribute attach="attributes-aAngle" args={[attrs.angle, 1]} />
          <bufferAttribute attach="attributes-aHeight" args={[attrs.height, 1]} />
          <bufferAttribute attach="attributes-aSpeed" args={[attrs.speed, 1]} />
          <bufferAttribute attach="attributes-aRMult" args={[attrs.rMult, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <mesh position={[0, FUNNEL_HEIGHT / 2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[MAX_RADIUS * 0.85, FUNNEL_HEIGHT, 14, 1, true]} />
        <meshBasicMaterial color="#0d0520" transparent opacity={0.38} side={THREE.BackSide} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.5, MAX_RADIUS * 1.1, 32]} />
        <meshBasicMaterial color="#4422aa" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

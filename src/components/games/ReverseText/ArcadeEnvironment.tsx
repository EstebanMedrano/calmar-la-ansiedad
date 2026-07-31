// ArcadeEnvironment.tsx - Importaciones limpias (eliminados useEffect y useState)
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';
import { LIA_BTN } from './positions';

/**
 * Rejilla de neón del suelo.
 *
 * Las 24 líneas eran 24 mallas sueltas, cada una con su material y su llamada
 * de dibujo. Como todas comparten color y opacidad, se fusionan en una sola
 * geometría: mismo aspecto, una llamada.
 */
function NeonFloor() {
  const gridGeo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 14; i++) {
      const g = new THREE.PlaneGeometry(0.025, 18);
      g.rotateX(-Math.PI / 2);
      g.translate(-6.5 + i, -0.49, 0);
      parts.push(g);
    }
    for (let i = 0; i < 10; i++) {
      const g = new THREE.PlaneGeometry(24, 0.025);
      g.rotateX(-Math.PI / 2);
      g.translate(0, -0.49, -4.5 + i);
      parts.push(g);
    }
    const merged = mergeBufferGeometries(parts);
    parts.forEach(p => p.dispose());
    return merged;
  }, []);

  useEffect(() => () => { gridGeo?.dispose(); }, [gridGeo]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[24, 18]} />
        <meshStandardMaterial color="#555153" roughness={0.7} metalness={0.2} />
      </mesh>
      {gridGeo && (
        <mesh geometry={gridGeo}>
          <meshBasicMaterial color="#00ddff" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}

/**
 * @param withLight Solo dos de los cinco focos llevan luz real.
 *
 * Contexto: la escena tenía TRECE pointLight dinámicas. En three.js el número
 * de luces se compila dentro del shader de cada material, así que cada píxel de
 * cada superficie recorría las trece. Bajarlas a tres es lo que devuelve la
 * fluidez; el resto de focos siguen viéndose porque el cono emite luz propia.
 */
function OverheadSpot({ position, color, offset, withLight }: {
  position: [number, number, number]; color: string; offset: number; withLight: boolean;
}) {
  const lRef = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (lRef.current)
      lRef.current.intensity = 2.4 + Math.sin(state.clock.elapsedTime * 0.9 + offset) * 0.8;
  });
  return (
    <group position={position}>
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.12, 0.25, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} metalness={0.8} toneMapped={false} />
      </mesh>
      {withLight && (
        <pointLight ref={lRef} color={color} intensity={2.4} distance={22} decay={2} position={[0, -0.3, 0]} />
      )}
    </group>
  );
}

function NeonPillar({ x, color }: { x: number; color: string }) {
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (glowRef.current)
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.55 + Math.sin(state.clock.elapsedTime * 1.8 + x) * 0.2;
  });
  return (
    <group position={[x, 2.0, -4.5]}>
      <mesh>
        <cylinderGeometry args={[0.08, 0.08, 5.5, 8]} />
        <meshStandardMaterial color="#f399cd" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh ref={glowRef}>
        <cylinderGeometry args={[0.075, 0.075, 5.5, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.65}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Sin pointLight: el cilindro aditivo ya se lee como neón encendido y
          cuatro luces más no cambiaban la imagen lo bastante como para pagarlas. */}
    </group>
  );
}

function WaterRipple({ phase }: { phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = ((state.clock.elapsedTime * 0.48) + phase) % 1.0;
    ref.current.scale.setScalar(0.18 + t * 1.65);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = (1.0 - t) * 0.60;
  });
  return (
    <mesh ref={ref}>
      <ringGeometry args={[0.82, 1.0, 36]} />
      <meshBasicMaterial
        color="#4477ff" transparent opacity={0.60}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ⭐ Salpicadura con color variable
function SplashImpact({ pos, color, onComplete }: { pos: THREE.Vector3, color: string, onComplete: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const op = useRef(1.0);
  const scale = useRef(0.1);
  useFrame((_, dt) => {
    if (!ref.current) return;
    scale.current += dt * 1.8;
    op.current -= dt * 1.1;
    ref.current.scale.setScalar(Math.min(scale.current, 2.5));
    (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, op.current);
    if (op.current <= 0) onComplete();
  });
  return (
    <mesh ref={ref} position={pos} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.1, 0.5, 16]} />
      <meshBasicMaterial color={color} transparent opacity={1.0} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

/**
 * Los 54 sillares del brocal de la fuente.
 *
 * Eran 54 <mesh> con 54 materiales: 54 llamadas de dibujo para un anillo de
 * piedra que nunca se mueve. Fusionados en una geometría con color por vértice
 * son una sola llamada, y el degradado de tonos se conserva igual.
 */
function StoneRim() {
  const geo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const tones = ['#6b5c55', '#584c45', '#4a3d35'].map(c => new THREE.Color(c));
    const layers = [
      { y: 0.08, offset: 0 },
      { y: 0.24, offset: Math.PI / 18 },
      { y: 0.40, offset: 0 },
    ];

    for (const { y, offset } of layers) {
      for (let i = 0; i < 18; i++) {
        const angle = (i / 18) * Math.PI * 2 + offset;
        const g = new THREE.BoxGeometry(0.55, 0.12, 0.30);
        g.rotateX(Math.PI / 2);
        g.rotateY(-angle);
        g.translate(Math.cos(angle) * 2.1, y, Math.sin(angle) * 2.1);

        const tone = tones[i % 3];
        const colors = new Float32Array(g.attributes.position.count * 3);
        for (let v = 0; v < g.attributes.position.count; v++) {
          colors[v * 3] = tone.r; colors[v * 3 + 1] = tone.g; colors[v * 3 + 2] = tone.b;
        }
        g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        parts.push(g);
      }
    }
    const merged = mergeBufferGeometries(parts);
    parts.forEach(p => p.dispose());
    return merged;
  }, []);

  useEffect(() => () => { geo?.dispose(); }, [geo]);

  if (!geo) return null;
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial vertexColors roughness={0.95} />
    </mesh>
  );
}

function WaterFountain({ dropletsRef, onDropletImpact }: { dropletsRef: React.MutableRefObject<THREE.Vector3[]>, onDropletImpact: (pos: THREE.Vector3) => void }) {
  const pointsRef     = useRef<THREE.Points>(null);
  const waterBaseRef  = useRef<THREE.Mesh>(null);
  const conePivotRef  = useRef<THREE.Group>(null);
  const coneMeshRef   = useRef<THREE.Mesh>(null);
  const innerConeRef  = useRef<THREE.Mesh>(null);
  const shakeX        = useRef(0);

  const PARTICLE_COUNT = 80;
  const SEGS_PER  = 1;     
  const GRAV      = 1.8;   
  const DT_TRAIL  = 0.04;  

  const pPositions  = useRef(new Float32Array(PARTICLE_COUNT * 3));
  const pVelocities = useRef(new Float32Array(PARTICLE_COUNT * 3));

  // Bolsa de Vector3 reutilizables. Antes se creaban ochenta objetos nuevos en
  // cada fotograma solo para publicar la posición de las gotas: a 60 fps son
  // 4.800 objetos por segundo que el recolector de basura tiene que limpiar, y
  // eso se nota como tirones periódicos. Los perros solo leen estos valores.
  const dropletPool = useRef<THREE.Vector3[]>(
    Array.from({ length: PARTICLE_COUNT }, () => new THREE.Vector3()),
  );
  const impactVec = useRef(new THREE.Vector3());

  const waterTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0,   'rgba(38, 0, 255, 0.9)');
    gradient.addColorStop(0.3, 'rgba(160, 177, 255, 0.7)');
    gradient.addColorStop(0.6, 'rgba(73, 60, 255, 0.6)');
    gradient.addColorStop(1,   'rgba(4, 0, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 512);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.y = 2;
    return texture;
  }, []);

  const pointsGeom = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const floatCount = PARTICLE_COUNT * SEGS_PER * 3; 
    const positions = new Float32Array(floatCount);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 1.4;
      pPositions.current[i3]     = (Math.random() - 0.5) * 1.8;
      pPositions.current[i3 + 1] = 1.7 + Math.random() * 0.3;
      pPositions.current[i3 + 2] = (Math.random() - 0.5) * 1.8;
      pVelocities.current[i3]     = Math.cos(angle) * speed;
      pVelocities.current[i3 + 1] = 1.0 + Math.random() * 2.0;
      pVelocities.current[i3 + 2] = Math.sin(angle) * speed;
    }
    return geo;
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;

    if (waterBaseRef.current) {
      const mat = waterBaseRef.current.material as THREE.MeshStandardMaterial;
      const pulse = 1.0 + Math.sin(t * 2.0) * 0.02;
      waterBaseRef.current.scale.set(pulse, 1.0, pulse);
      waterBaseRef.current.rotation.z += dt * 0.02;
      mat.emissiveIntensity = 0.8 + Math.sin(t * 2.0) * 0.15;
    }

    if (coneMeshRef.current && conePivotRef.current) {
      shakeX.current = Math.sin(t * 2.5) * 0.025;
      conePivotRef.current.position.x = shakeX.current;
      const height   = 2.15;
      const upPulse  = 1.0 + Math.sin(t * 2.0) * 0.08;
      coneMeshRef.current.scale.y    = upPulse;
      coneMeshRef.current.position.y = (height * upPulse) / 2;
      if (innerConeRef.current) {
        innerConeRef.current.scale.y    = upPulse;
        innerConeRef.current.position.y = (height * upPulse) / 2;
      }
      if (waterTexture) waterTexture.offset.y -= dt * 0.4;
    }

    // Se reutiliza el mismo array y los mismos Vector3 en cada fotograma.
    if (dropletsRef) dropletsRef.current = dropletPool.current;
    let liveDroplets = 0;

    if (pointsRef.current) {
      const pa  = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = pa.array as Float32Array;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;

        pVelocities.current[i3 + 1] -= GRAV * dt;
        pPositions.current[i3]      += pVelocities.current[i3]      * dt;
        pPositions.current[i3 + 1]  += pVelocities.current[i3 + 1]  * dt;
        pPositions.current[i3 + 2]  += pVelocities.current[i3 + 2]  * dt;

        if (pPositions.current[i3 + 1] < -0.2) {
          if (onDropletImpact) {
            impactVec.current.set(pPositions.current[i3], -0.2, pPositions.current[i3 + 2]);
            onDropletImpact(impactVec.current);
          }

          const angle = Math.random() * Math.PI * 2;
          const speed = 0.6 + Math.random() * 1.4;
          pPositions.current[i3]      = (Math.random() - 0.5) * 1.8;
          pPositions.current[i3 + 1]  = 1.7 + Math.random() * 0.3;
          pPositions.current[i3 + 2]  = (Math.random() - 0.5) * 1.8;
          pVelocities.current[i3]     = Math.cos(angle) * speed;
          pVelocities.current[i3 + 1] = 1.0 + Math.random() * 1.5;
          pVelocities.current[i3 + 2] = Math.sin(angle) * speed;
        }

        const px = pPositions.current[i3];
        const py = pPositions.current[i3 + 1];
        const pz = pPositions.current[i3 + 2];

        if (dropletsRef) dropletPool.current[liveDroplets++].set(px, py, pz);

        for (let j = 0; j < SEGS_PER; j++) {
          const tA = (j + 1) * DT_TRAIL;
          const ax = px - pVelocities.current[i3] * tA;
          const ay = py - pVelocities.current[i3 + 1] * tA + 0.5 * GRAV * tA * tA;
          const az = pz - pVelocities.current[i3 + 2] * tA;
          const base = (i * SEGS_PER + j) * 3;
          arr[base] = ax; arr[base + 1] = ay; arr[base + 2] = az;
        }
      }
      pa.needsUpdate = true;
    }
  });

  return (
    <group position={[0, -0.48, 0]}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[2.15, 2.2, 0.45, 24]} />
        <meshStandardMaterial color="#584c45" roughness={0.9} />
      </mesh>

      <StoneRim />

      <mesh
        ref={waterBaseRef}
        position={[0, 0.3, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[1.8, 24]} />
        <meshStandardMaterial
          color="#050477" emissive="#344d74" emissiveIntensity={1.0}
          transparent opacity={0.8} side={THREE.DoubleSide}
        />
      </mesh>

      <group position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <WaterRipple phase={0}    />
        <WaterRipple phase={0.33} />
        <WaterRipple phase={0.67} />
      </group>


      <group ref={conePivotRef} position={[0, -0.15, 0]}>
        <mesh ref={coneMeshRef} position={[0, 0, 0]}>
          <cylinderGeometry args={[0.85, 0.05, 2.15, 16]} />
          <meshBasicMaterial
            map={waterTexture}
            transparent opacity={0.55}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh ref={innerConeRef} position={[0, 0, 0]}>
          <cylinderGeometry args={[0.65, 0.02, 2.05, 16]} />
          <meshBasicMaterial
            color="#3b3679" transparent opacity={0.25}
            side={THREE.DoubleSide} blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Una sola luz para toda la fuente, en vez de dos casi superpuestas. */}
      <pointLight color="#66ddff" intensity={7.5} distance={13} decay={2} position={[0, 1.7, 0]} />

      <points ref={pointsRef} geometry={pointsGeom}>
        <pointsMaterial
          color="#897dfa"
          size={0.15}            
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

    </group>
  );
}

interface ArcadeEnvironmentProps {
  dropletsRef?: React.MutableRefObject<THREE.Vector3[]>;
  splashes?: { id: number; pos: THREE.Vector3; color: string }[];
  onDropletImpact?: (pos: THREE.Vector3) => void;
}

function ButtonConsole() {
  const [bx, , bz] = LIA_BTN;
  return (
    <group position={[bx, 0, bz - 0.2]}>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.85, 0.45, 0.55]} />
        <meshStandardMaterial color="#6dc9ff" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.50, 0.15]}>
        <cylinderGeometry args={[0.26, 0.26, 0.1, 20]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000"
          emissiveIntensity={1.4} metalness={0.25} roughness={0.3} toneMapped={false} />
      </mesh>
    </group>
  );
}

function ClawRail() {
  return (
    <mesh position={[0, 5.25, 0]}>
      <boxGeometry args={[7, 0.07, 0.07]} />
      <meshStandardMaterial color="#666" metalness={0.9} roughness={0.1} emissive="#222" emissiveIntensity={0.3} />
    </mesh>
  );
}

function ClawHousing() {
  return (
    <group position={[0, 5.55, 0]}>
      <mesh>
        <boxGeometry args={[2.0, 0.5, 0.8]} />
        <meshStandardMaterial color="#ff0000" metalness={0.7} roughness={0.2}
          emissive="#08021a" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0, -0.28, 0]}>
        <boxGeometry args={[1.9, 0.04, 0.7]} />
        <meshBasicMaterial color="#cc44ff" toneMapped={false} />
      </mesh>
    </group>
  );
}

const SPOTS: Array<[number, string]> = [
  [-4, '#ff3366'], [-2, '#33ccff'], [0, '#ff000d'], [2, '#33ff99'], [4, '#cc33ff'],
];

export default function ArcadeEnvironment({ dropletsRef, splashes, onDropletImpact }: ArcadeEnvironmentProps = {}) {
  return (
    <>
      {/* Algo más de luz general para compensar las diez pointLight retiradas. */}
      <ambientLight color="#88ccff" intensity={1.05} />
      <directionalLight color="#ffffff" intensity={1.9} position={[5, 10, 5]} />

      <NeonFloor />

      <mesh position={[0, 2.5, -5.2]}>
        <planeGeometry args={[26, 12]} />
        <meshStandardMaterial color="#bd1270" roughness={1} />
      </mesh>

      <NeonPillar x={-7.5} color="#ff3366" />
      <NeonPillar x={-3.5} color="#cc33ff" />
      <NeonPillar x={ 3.5} color="#33ccff" />
      <NeonPillar x={ 7.5} color="#33ff99" />

      <mesh position={[0, 4.5, -4.2]}>
        <boxGeometry args={[18, 0.10, 0.10]} />
        <meshStandardMaterial color="#2a2a4e" metalness={0.85} />
      </mesh>

      {SPOTS.map(([x, c], i) => (
        <OverheadSpot key={i} position={[x, 4.6, -3.8]} color={c} offset={i * 1.25}
          withLight={i === 0 || i === 4} />
      ))}

      <ClawRail />
      <ClawHousing />
      
      <WaterFountain dropletsRef={dropletsRef as React.MutableRefObject<THREE.Vector3[]>} onDropletImpact={onDropletImpact!} /> 

      {splashes && splashes.map((splash) => (
        <SplashImpact key={splash.id} pos={splash.pos} color={splash.color} onComplete={() => {}} />
      ))}

      <ButtonConsole />
    </>
  );
}
// ArcadeEnvironment.tsx - Importaciones limpias (eliminados useEffect y useState)
import { useRef, useMemo } from 'react'; // ⭐ CORREGIDO: Solo useRef y useMemo
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LIA_BTN } from './positions';

function NeonFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[24, 18]} />
        <meshStandardMaterial color="#555153" roughness={0.7} metalness={0.2} />
      </mesh>
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={`gx${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-6.5 + i, -0.49, 0]}>
          <planeGeometry args={[0.025, 18]} />
          <meshBasicMaterial color="#00ddff" transparent opacity={0.7} />
        </mesh>
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={`gz${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, -4.5 + i]}>
          <planeGeometry args={[24, 0.025]} />
          <meshBasicMaterial color="#00ddff" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function OverheadSpot({ position, color, offset }: {
  position: [number, number, number]; color: string; offset: number;
}) {
  const lRef = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (lRef.current)
      lRef.current.intensity = 1.5 + Math.sin(state.clock.elapsedTime * 0.9 + offset) * 0.5;
  });
  return (
    <group position={position}>
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.12, 0.25, 8]} />
        <meshStandardMaterial color="#9046d4" metalness={0.8} />
      </mesh>
      <pointLight ref={lRef} color={color} intensity={1.5} distance={18} decay={2} position={[0, -0.3, 0]} />
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
        <cylinderGeometry args={[0.065, 0.065, 5.5, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.55}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight color={color} intensity={2.5} distance={10} decay={2} position={[0, 0, 0.6]} />
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

    if (dropletsRef) {
      dropletsRef.current = [];
    }

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
            const impactPos = new THREE.Vector3(
              pPositions.current[i3],
              -0.2,
              pPositions.current[i3 + 2]
            );
            onDropletImpact(impactPos);
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

        if (dropletsRef) {
          dropletsRef.current.push(new THREE.Vector3(px, py, pz));
        }

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

      {Array.from({ length: 3 }).map((_, layerIdx) => {
        const yPos = layerIdx === 0 ? 0.08 : (layerIdx === 1 ? 0.24 : 0.40);
        const angleOffset = layerIdx === 0 ? 0 : (layerIdx === 1 ? Math.PI / 18 : 0);
        return Array.from({ length: 18 }).map((_, i) => {
          const angle = (i / 18) * Math.PI * 2;
          const finalAngle = angle + angleOffset;
          const color = i % 3 === 0 ? "#6b5c55" : (i % 3 === 1 ? "#584c45" : "#4a3d35");
          return (
            <mesh
              key={`${layerIdx}-${i}`}
              position={[Math.cos(finalAngle) * 2.1, yPos, Math.sin(finalAngle) * 2.1]}
              rotation={[Math.PI / 2, -finalAngle, 0]}
            >
              <boxGeometry args={[0.55, 0.12, 0.30]} />
              <meshStandardMaterial color={color} roughness={0.95} />
            </mesh>
          );
        });
      })}

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

      <pointLight color="#3b767a" intensity={8.0} distance={5} decay={1} position={[0, 1.5, 0]} />

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

      <pointLight color="#66ddff" intensity={6.0} distance={12} decay={2} position={[0, 1.8, 0]} />

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
        <meshStandardMaterial color="#ff0000" emissive="#050505"
          emissiveIntensity={2.0} metalness={0.25} roughness={0.3} />
      </mesh>
      <pointLight color="#ff0000" intensity={4.5} distance={7} decay={2} position={[0, 1.0, 0]} />
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
        <meshBasicMaterial color="#cc44ff" />
      </mesh>
      <pointLight color="#cc44ff" intensity={3.5} distance={7} decay={2} position={[0, -0.8, 0]} />
    </group>
  );
}

const SPOTS: Array<[number, string]> = [
  [-4, '#ff3366'], [-2, '#33ccff'], [0, '#ff000d'], [2, '#33ff99'], [4, '#cc33ff'],
];

export default function ArcadeEnvironment({ dropletsRef, splashes, onDropletImpact }: ArcadeEnvironmentProps = {}) {
  return (
    <>
      <ambientLight color="#88ccff" intensity={0.65} />
      <directionalLight color="#ffffff" intensity={1.5} position={[5, 10, 5]} />

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
        <OverheadSpot key={i} position={[x, 4.6, -3.8]} color={c} offset={i * 1.25} />
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
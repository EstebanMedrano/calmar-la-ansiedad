// BreathCarousel.tsx - PERROS CON SU COLOR ORIGINAL + FOCO INFALIBLE DESDE ARRIBA
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import type { Group } from 'three';
import { assetUrl } from '../../../utils/assetUrl';

const TRACK_COLS = ['#10d4b0', '#9b6df6', '#f5a020'] as const;
const _tc = new THREE.Color();

// Helix: R=2.4, hAmp=1.0, loops=3
function createHelixCurve(): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  const R = 2.4, hAmp = 1.0, loops = 3;
  for (let i = 0; i <= 220; i++) {
    const t = (i / 220) * Math.PI * 2;
    pts.push(new THREE.Vector3(
      R * Math.cos(t),
      hAmp * Math.sin(t * loops),
      R * Math.sin(t)
    ));
  }
  return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
}

function Track({ curve, phaseRef }: {
  curve: THREE.CatmullRomCurve3;
  phaseRef: React.MutableRefObject<number>;
}) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 260, 0.017, 7, true), [curve]);
  useEffect(() => () => geo.dispose(), [geo]);
  useFrame((_, dt) => {
    if (!matRef.current) return;
    matRef.current.color.lerp(_tc.set(TRACK_COLS[phaseRef.current] ?? TRACK_COLS[0]), dt * 2.0);
  });
  return (
    <mesh>
      <primitive object={geo} attach="geometry" />
      <meshBasicMaterial ref={matRef} color={TRACK_COLS[0]}
        transparent opacity={0.58} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

function TrackRings({ curve, phaseRef }: {
  curve: THREE.CatmullRomCurve3;
  phaseRef: React.MutableRefObject<number>;
}) {
  const N        = 14;
  const meshRefs = useRef<Array<THREE.Mesh | null>>(Array(N).fill(null));
  const matRefs  = useRef<Array<THREE.MeshBasicMaterial | null>>(Array(N).fill(null));

  const ringData = useMemo(() => Array.from({ length: N }, (_, i) => ({
    pos:  curve.getPointAt(i / N),
    quat: (() => {
      const tan = curve.getTangentAt(i / N).normalize();
      return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
    })(),
  })), [curve]);

  useFrame((_, dt) => {
    const tc = _tc.clone().set(TRACK_COLS[phaseRef.current] ?? TRACK_COLS[0]);
    meshRefs.current.forEach((m, i) => {
      if (m) m.rotation.y += dt * (0.28 + i * 0.038);
    });
    matRefs.current.forEach(mat => { if (mat) mat.color.lerp(tc, dt * 1.5); });
  });

  return (
    <group>
      {ringData.map((d, i) => (
        <mesh key={i} ref={el => { meshRefs.current[i] = el; }}
          position={d.pos} quaternion={d.quat}>
          <torusGeometry args={[0.20, 0.010, 6, 22]} />
          <meshBasicMaterial ref={el => { matRefs.current[i] = el; }}
            color={TRACK_COLS[0]} transparent opacity={0.40}
            blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

const _vP = new THREE.Vector3();
const _vT = new THREE.Vector3();
const _vL = new THREE.Vector3();

function DogCart({ path, scale, startT, curve, phaseRef, progRef }: {
  path:     string;
  scale:    number;
  startT:   number;
  curve:    THREE.CatmullRomCurve3;
  phaseRef: React.MutableRefObject<number>;
  progRef:  React.MutableRefObject<number>;
}) {
  const groupRef   = useRef<Group>(null);
  const innerRef   = useRef<THREE.Group>(null);
  const lightRef   = useRef<THREE.SpotLight>(null);
  const cartMatRef = useRef<THREE.MeshStandardMaterial>(null);
  
  // 🛑 OBJETIVO DEL FOCO: Lo añadimos al grupo para que siempre apunte al perro
  const lightTargetRef = useRef<THREE.Object3D>(new THREE.Object3D());

  const { scene: raw, animations } = useGLTF(path);
  const scene = useMemo(() => raw.clone(true), [raw]);
  const { actions } = useAnimations(animations, groupRef);

  const tPos   = useRef(startT);
  const spd    = useRef(0);
  const lColor = useRef(new THREE.Color(TRACK_COLS[0]));

  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const fy  = -box.min.y * scale;
    if (innerRef.current) innerRef.current.position.y = fy;

    // 🛑 ELIMINADO: Ya no inyectamos "emissive" blanco. Tito y Lia conservan su color original.
    // Solo dejamos este pequeño brillo base *negro* para que el spotlight haga su magia.
    
    // 🛑 CONFIGURACIÓN DEL TARGET (Clave para que el foco funcione)
    if (groupRef.current) {
      groupRef.current.add(lightTargetRef.current);
      lightTargetRef.current.position.set(0, 0, 0); // Apunta al centro del grupo (donde está el perro)
    }
  }, [scene, scale]);

  useEffect(() => {
    const first = Object.keys(actions)[0];
    if (first) actions[first]?.reset().fadeIn(0.3).play();
  }, [actions]);

  useFrame((_, dt) => {
    const group = groupRef.current; if (!group) return;
    const phase = phaseRef.current;
    const prog  = progRef.current;

    const tgt = phase === 1 ? 0 : 0.055 + 0.150 * prog;
    spd.current  = THREE.MathUtils.lerp(spd.current, tgt, dt * 3.0);
    tPos.current = (tPos.current + spd.current * dt) % 1;

    curve.getPointAt(tPos.current, _vP);
    curve.getTangentAt(tPos.current, _vT);
    group.position.copy(_vP);
    _vL.copy(_vP).addScaledVector(_vT, 0.5);
    group.lookAt(_vL);
    group.rotateY(Math.PI);

    const tc = _tc.set(TRACK_COLS[phase] ?? TRACK_COLS[0]);
    lColor.current.lerp(tc, dt * 2.0);
    
    // 🛑 ACTUALIZACIÓN DEL FOCO
    if (lightRef.current) {
      lightRef.current.color.copy(lColor.current);
      lightRef.current.target = lightTargetRef.current; // Se asigna el target local
      lightTargetRef.current.updateMatrixWorld();       // Se actualiza la orientación
    }
    if (cartMatRef.current) {
      cartMatRef.current.emissive.copy(lColor.current).multiplyScalar(0.6);
    }
  });

  return (
    <group ref={groupRef}>
      {/* 🛑 FOCO REAL DESDE ARRIBA: Penumbra suave y potencia elevada */}
      <spotLight
        ref={lightRef}
        position={[0, scale * 1.6, 0]} // Encima de la cabeza
        angle={0.5}
        penumbra={0.6}
        intensity={30.0}
        distance={8.0}
        decay={1.0} // Decaimiento lineal para que el haz se vea suave
      />

      {/* Carrito */}
      <mesh position={[0, -0.028, 0]}>
        <boxGeometry args={[0.24, 0.055, 0.34]} />
        <meshStandardMaterial ref={cartMatRef}
          color="#daa520"
          metalness={0.6}
          roughness={0.3}
          emissive="#553010" 
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Ruedas */}
      {([
        [-0.10, -0.055,  0.12], [ 0.10, -0.055,  0.12],
        [-0.10, -0.055, -0.12], [ 0.10, -0.055, -0.12],
      ] as [number, number, number][]).map((p, i) => (
        <mesh key={i} position={p} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.040, 0.013, 6, 12]} />
          <meshStandardMaterial color="#151525" metalness={0.95} roughness={0.1} />
        </mesh>
      ))}

      {/* Perro — Ahora con su color original (marrón/negro) */}
      <group ref={innerRef}>
        <primitive object={scene} scale={scale} />
      </group>
    </group>
  );
}

export default function BreathCarousel({
  phaseRef, progRef,
}: {
  phaseRef: React.MutableRefObject<number>;
  progRef:  React.MutableRefObject<number>;
}) {
  const curve = useMemo(() => createHelixCurve(), []);
  return (
    <group>
      <Track      curve={curve} phaseRef={phaseRef} />
      <TrackRings curve={curve} phaseRef={phaseRef} />
      <DogCart path={assetUrl('/assets/3D/tito.glb')} scale={0.40} startT={0.00}
        curve={curve} phaseRef={phaseRef} progRef={progRef} />
      <DogCart path={assetUrl('/assets/3D/lia.glb')}  scale={0.36} startT={0.50}
        curve={curve} phaseRef={phaseRef} progRef={progRef} />
    </group>
  );
}

useGLTF.preload(assetUrl('/assets/3D/tito.glb'));
useGLTF.preload(assetUrl('/assets/3D/lia.glb'));
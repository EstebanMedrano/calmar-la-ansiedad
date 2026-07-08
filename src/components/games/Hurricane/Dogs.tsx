import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import type { Group } from 'three';
import type { HurricaneStage } from './Hurricane';

function Parachute() {
  return (
    <group position={[0, 2.4, 0]}>
      <mesh>
        <sphereGeometry args={[1.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ff3333" side={THREE.DoubleSide} transparent opacity={0.88} />
      </mesh>
      {Array.from({ length: 4 }, (_, i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.9, -1.2, Math.sin(a) * 0.9]}>
            <cylinderGeometry args={[0.013, 0.013, 2.4, 4]} />
            <meshBasicMaterial color="#eeeeee" />
          </mesh>
        );
      })}
    </group>
  );
}

interface DogModelProps {
  path:           string;
  dogScale:       number;
  baseAngle:      number;
  orbitRadius:    number;
  orbitHeight:    number;
  orbitSpeed:     number;
  runRadius:      number;
  runSpeed:       number;
  runOffset:      number;
  stage:          HurricaneStage;
  tornadoCenter: THREE.Vector3;
  isFetching:     boolean;
  fetchTarget:    THREE.Vector3 | null;
}

function DogModel({
  path, dogScale, baseAngle,
  orbitRadius, orbitHeight, orbitSpeed,
  runRadius, runSpeed, runOffset,
  stage, tornadoCenter,
  isFetching, fetchTarget,
}: DogModelProps) {
  const groupRef = useRef<Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const { scene: rawScene, animations } = useGLTF(path);
  const scene = useMemo(() => rawScene.clone(true), [rawScene]);
  const { actions } = useAnimations(animations, groupRef);

  const pos             = useRef(new THREE.Vector3(runRadius, 0, 0));
  const yFix            = useRef(0);
  const fetchT          = useRef(0);
  const orbitPos        = useRef(new THREE.Vector3());
  const ascendStart     = useRef<number | null>(null);
  const parachStart     = useRef<number | null>(null);
  const hasLanded       = useRef(false);
  const runStarted      = useRef(false);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    yFix.current = box.min.y < -0.01 ? -box.min.y * dogScale : 0;
    if (innerRef.current) innerRef.current.position.y = yFix.current;
  }, [scene, dogScale]);

  useEffect(() => {
    const first = Object.keys(actions)[0];
    if (first) actions[first]?.reset().fadeIn(0.3).play();
  }, [actions]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const t = state.clock.elapsedTime;

    // INTRO
    if (stage === 'intro') {
      parachStart.current = null;
      ascendStart.current = null;
      fetchT.current = 0;
      hasLanded.current = false;
      runStarted.current = false;

      const angle = t * runSpeed + runOffset;
      const bob   = Math.abs(Math.sin(t * 3.8)) * 0.14;
      const target = new THREE.Vector3(Math.cos(angle)*runRadius, bob, Math.sin(angle)*runRadius);
      pos.current.lerp(target, 0.09);
      group.position.copy(pos.current);
      const na = angle + 0.1;
      group.lookAt(new THREE.Vector3(Math.cos(na)*runRadius, pos.current.y, Math.sin(na)*runRadius));
    }

    // APROXIMACIÓN DEL TORNADO
    else if (stage === 'tornado_approach') {
      parachStart.current = null;
      ascendStart.current = null;
      pos.current.lerp(new THREE.Vector3(pos.current.x, 0, pos.current.z), 0.04);
      group.position.copy(pos.current);
      group.lookAt(new THREE.Vector3(pos.current.x, pos.current.y, -40));
    }

    // 🛑 FASES DE TORNADO
    else if (stage === 'tornado' || stage === 'tornado_retreat' || stage === 'tornado_ascend' || stage === 'fireworks') {
      parachStart.current = null;

      if (stage === 'tornado_ascend') {
        if (!ascendStart.current) ascendStart.current = t;
      } else {
        ascendStart.current = null;
      }

      const ascendY = ascendStart.current ? Math.min(38, (t - ascendStart.current) * 6.5) : 0;

      if (isFetching && fetchTarget) {
        fetchT.current = Math.min(1, fetchT.current + delta * 2.8);
        const target = orbitPos.current.clone().lerp(fetchTarget, fetchT.current);
        pos.current.copy(target);
      } else {
        fetchT.current = 0;
        const angle = baseAngle + t * orbitSpeed;
        const wobble = Math.sin(t * 1.3 + baseAngle) * 0.38;
        
        const target = new THREE.Vector3(
          tornadoCenter.x + Math.cos(angle) * orbitRadius,
          tornadoCenter.y + orbitHeight + wobble + ascendY,
          tornadoCenter.z + Math.sin(angle) * orbitRadius
        );
        pos.current.lerp(target, 0.055);
        orbitPos.current.copy(pos.current);
      }

      group.position.copy(pos.current);
      group.lookAt(new THREE.Vector3(0, pos.current.y, 0));
    }

    // 🛑 PARACAÍDAS
    else if (stage === 'parachuting') {
      ascendStart.current = null;
      if (!parachStart.current) parachStart.current = t;
      
      const elapsed  = t - parachStart.current;
      const duration = 3.0;
      const progress = Math.min(elapsed / duration, 1);

      const startPos = new THREE.Vector3(0, 22 + tornadoCenter.y, tornadoCenter.z);
      const endPos   = new THREE.Vector3(0, yFix.current, tornadoCenter.z);
      const base = startPos.clone().lerp(endPos, progress);
      
      const radOffset = new THREE.Vector3(Math.cos(baseAngle) * 3.0, 0, Math.sin(baseAngle) * 3.0);
      const targetXZ = base.clone().add(radOffset);
      
      pos.current.lerp(targetXZ, 0.06);
      group.position.copy(pos.current);
      group.rotation.y = t * 0.35;

      if (progress >= 1) {
        hasLanded.current = true;
        parachStart.current = null;
        runStarted.current = false;
        // 🛑 Fijar exactamente al suelo para evitar rebotes
        pos.current.y = yFix.current;
        group.position.y = yFix.current;
      }
    }

    // 🛑 DESPUÉS DE ATERRIZAR (Corren hacia el jugador)
    else {
      if (hasLanded.current) {
        if (!runStarted.current) {
          runStarted.current = true;
        }
        const targetRun = new THREE.Vector3(Math.cos(baseAngle) * 1.6, yFix.current, 0);
        pos.current.lerp(targetRun, 0.04);
        // 🛑 Mantener Y en el suelo en todo momento
        pos.current.y = yFix.current;
        group.position.copy(pos.current);
        group.lookAt(new THREE.Vector3(0, yFix.current, 0));
      } else {
        const target = new THREE.Vector3(Math.cos(baseAngle) * 1.6, yFix.current, Math.sin(baseAngle) * 1.6);
        pos.current.lerp(target, 0.04);
        pos.current.y = yFix.current;
        group.position.copy(pos.current);
        group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, 0, 0.04);
      }
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={innerRef}>
        <primitive object={scene} scale={dogScale} />
      </group>
      {stage === 'parachuting' && !hasLanded.current && <Parachute />}
      
      <pointLight position={[0, 1.0, 1.2]} intensity={8} distance={30} decay={1.5} color="#ffffff" />
    </group>
  );
}

interface DogsProps {
  stage:     HurricaneStage;
  dogTarget: THREE.Vector3 | null;
  activeDog: 'tito' | 'lia';
  tornadoCenter: THREE.Vector3;
}

export default function Dogs({ stage, dogTarget, activeDog, tornadoCenter }: DogsProps) {
  return (
    <group>
      {/* 🛑 AUMENTAMOS EL TAMAÑO DE LOS PERRITOS PARA QUE SE VEAN DESDE LEJOS */}
      <DogModel
        path="/assets/3D/tito.glb" dogScale={0.75} // Antes 0.50
        baseAngle={0} orbitRadius={4} orbitHeight={2.5} orbitSpeed={0.55}
        runRadius={3.2} runSpeed={0.9} runOffset={0}
        stage={stage} tornadoCenter={tornadoCenter}
        isFetching={dogTarget !== null && activeDog === 'tito'}
        fetchTarget={dogTarget}
      />
      <DogModel
        path="/assets/3D/lia.glb" dogScale={0.65} // Antes 0.45
        baseAngle={Math.PI} orbitRadius={5} orbitHeight={3.6} orbitSpeed={0.45}
        runRadius={4.2} runSpeed={-0.72} runOffset={Math.PI / 2}
        stage={stage} tornadoCenter={tornadoCenter}
        isFetching={dogTarget !== null && activeDog === 'lia'}
        fetchTarget={dogTarget}
      />
    </group>
  );
}

useGLTF.preload('/assets/3D/tito.glb');
useGLTF.preload('/assets/3D/lia.glb');
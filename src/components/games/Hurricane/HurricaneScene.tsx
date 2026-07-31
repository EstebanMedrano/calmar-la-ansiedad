import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import type { HurricaneStage } from './Hurricane';
import { THOUGHTS } from './Hurricane';
import Tornado from './Tornado';
import Thought from './Thought';
import ThoughtBursts from './ThoughtBursts';
import Dogs from './Dogs';

// ── Park ──────────────────────────────────────────────────────────────────────

/**
 * Una capa del arbolado (troncos, o uno de los dos niveles de copa) como
 * InstancedMesh.
 *
 * Con 36 árboles de tres mallas cada uno eran 108 llamadas de dibujo, y todas
 * proyectando sombra, así que se pagaban dos veces: una para el mapa de sombras
 * y otra para la imagen. Instanciado son tres llamadas.
 */
function TreeLayer({ trees, geometry, color, localY }: {
  trees: Array<{ pos: [number,number,number]; s: number }>;
  geometry: THREE.BufferGeometry;
  color: string;
  localY: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    trees.forEach((t, i) => {
      p.set(t.pos[0], t.pos[1] + localY * t.s, t.pos[2]);
      sc.setScalar(t.s);
      mesh.setMatrixAt(i, m.compose(p, q, sc));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [trees, localY]);

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, trees.length]} castShadow frustumCulled={false}>
      <meshStandardMaterial color={color} roughness={1}/>
    </instancedMesh>
  );
}

function SwingSet() {
  const xs = [-1.6, 1.6] as const;
  return (
    <group position={[-10, 0, -8]}>
      {xs.map((x, i) => (
        <mesh key={i} position={[x,2.0,0]} rotation={[0,0,x<0?0.22:-0.22]} castShadow>
          <cylinderGeometry args={[0.09,0.09,4.5,8]}/>
          <meshStandardMaterial color="#8B4513"/>
        </mesh>
      ))}
      <mesh position={[0,4.1,0]} rotation={[0,0,Math.PI/2]} castShadow>
        <cylinderGeometry args={[0.07,0.07,3.8,8]}/>
        <meshStandardMaterial color="#8B4513"/>
      </mesh>
      <mesh position={[0,1.6,0]}>
        <boxGeometry args={[0.9,0.1,0.36]}/>
        <meshStandardMaterial color="#4a2c0f"/>
      </mesh>
    </group>
  );
}

function Slide() {
  return (
    <group position={[10,0,-9]}>
      <mesh position={[0,1.6,0.8]} castShadow>
        <boxGeometry args={[0.9,3.2,0.10]}/><meshStandardMaterial color="#cc3333"/>
      </mesh>
      <mesh position={[0,3.3,0.8]} castShadow>
        <boxGeometry args={[1.3,0.12,1.4]}/><meshStandardMaterial color="#cc3333"/>
      </mesh>
      <mesh position={[0,1.6,-0.6]} rotation={[-0.48,0,0]} castShadow>
        <boxGeometry args={[1.1,0.07,3.8]}/><meshStandardMaterial color="#ff8833" roughness={0.4}/>
      </mesh>
    </group>
  );
}

function Park({ isMobile }: { isMobile: boolean }) {
  const treeConfig = useMemo<Array<{pos:[number,number,number];s:number}>>(() => {
    const arr = [];
    const treeCount = isMobile ? 18 : 36;
    for (let i = 0; i < treeCount; i++) {
      const angle = (i/treeCount)*Math.PI*2 + Math.random()*0.5;
      const r = 18 + Math.random()*32;
      arr.push({ pos:[Math.cos(angle)*r, 0, Math.sin(angle)*r] as [number,number,number], s:0.8+Math.random()*0.65 });
    }
    return arr;
  }, [isMobile]);

  const treeGeo = useMemo(() => ({
    trunk: new THREE.CylinderGeometry(0.22, 0.30, 3.0, 7),
    cone1: new THREE.ConeGeometry(2.0, 3.2, 8),
    cone2: new THREE.ConeGeometry(1.4, 2.4, 8),
  }), []);

  useEffect(() => () => Object.values(treeGeo).forEach(g => g.dispose()), [treeGeo]);

  return (
    <group>
      <mesh rotation={[-Math.PI/2,0,0]} receiveShadow>
        <planeGeometry args={[300,300]}/><meshStandardMaterial color="#3a6b35" roughness={0.95}/>
      </mesh>
      {/* Paths */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.01,0]}>
        <planeGeometry args={[3,80]}/><meshStandardMaterial color="#9a7450" roughness={0.95}/>
      </mesh>
      <mesh rotation={[-Math.PI/2,Math.PI/2,0]} position={[0,0.01,0]}>
        <planeGeometry args={[3,80]}/><meshStandardMaterial color="#9a7450" roughness={0.95}/>
      </mesh>
      <SwingSet/>
      <Slide/>
      <TreeLayer trees={treeConfig} geometry={treeGeo.trunk} color="#5c3a1e" localY={1.5}/>
      <TreeLayer trees={treeConfig} geometry={treeGeo.cone1} color="#1a4a22" localY={3.8}/>
      <TreeLayer trees={treeConfig} geometry={treeGeo.cone2} color="#235a2e" localY={5.4}/>
      {([[5,0,5],[-5,0,5]] as [number,number,number][]).map((p,i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[2.2,0.12,0.55]}/><meshStandardMaterial color="#6b3a1f"/>
        </mesh>
      ))}
    </group>
  );
}

// ── Lighting ──────────────────────────────────────────────────────────────────

function Lighting({ stage }: { stage: HurricaneStage }) {
  const ambRef   = useRef<THREE.AmbientLight>(null);
  const sunRef   = useRef<THREE.DirectionalLight>(null);
  const stormRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!ambRef.current || !sunRef.current) return;
    const isDay = ['intro','parachuting','complete'].includes(stage);
    const isApp = stage === 'tornado_approach' || stage === 'tornado_retreat';
    ambRef.current.intensity   = THREE.MathUtils.lerp(ambRef.current.intensity, isDay?0.9:isApp?0.42:0.10, 0.02);
    sunRef.current.intensity   = THREE.MathUtils.lerp(sunRef.current.intensity, isDay?2.2:isApp?0.65:0.16, 0.02);
    if (stormRef.current)
      stormRef.current.intensity = THREE.MathUtils.lerp(stormRef.current.intensity, (!isDay&&!isApp)?1.6:0, 0.02);
  });

  return (
    <>
      <ambientLight ref={ambRef} color="#c8d8f0" intensity={0.9}/>
      <directionalLight ref={sunRef} color="#fff8e8" intensity={2.2}
        position={[20,30,10]} castShadow shadow-mapSize={[1024,1024]}/>
      <pointLight ref={stormRef} color="#5511cc" intensity={0} position={[0,20,0]} distance={65} decay={1.3}/>
    </>
  );
}

// ── Camera ─────────────────────────────────────────────────────────────────────

function CameraRig({ stage }: { stage: HurricaneStage }) {
  const { camera } = useThree();

  useFrame((state, delta) => {
    camera.position.set(0, 1.6, 0);
    camera.rotation.order = 'YXZ';
    const t = state.clock.elapsedTime;

    if (stage === 'intro') {
      camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, Math.sin(t*0.22)*0.45, 0.025);
      camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, 0.06, 0.03);

    } else if (stage === 'tornado_approach') {
      camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, 0, 0.025);
      camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, 0.05, 0.025);

    } else if (stage === 'tornado') {
      camera.rotation.y += delta * 0.28;
      camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, 0.18, 0.015);

    } else if (stage === 'tornado_retreat') {
      camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, 0, 0.02);
      camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, 0.25, 0.01);

    } else if (stage === 'tornado_ascend') {
      camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, 0, 0.02);
      camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, 0.75, 0.01);

    } else if (stage === 'fireworks') {
      camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, 0, 0.02);
      camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, 0.95, 0.01);

    } else if (stage === 'parachuting') {
      camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, 0, 0.02);
      camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, 0.65, 0.015);

    } else { // complete
      // 🛑 Movimiento suave hacia el ángulo original y el horizonte
      camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, 0, 0.06);
      camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, 0.06, 0.15);
    }
  });

  return null;
}

// ── Main Scene ─────────────────────────────────────────────────────────────────

interface HurricaneSceneProps {
  stage: HurricaneStage;
  isMobile: boolean;
  onThoughtDestroyed: () => void;
}

export default function HurricaneScene({ stage, isMobile, onThoughtDestroyed }: HurricaneSceneProps) {
  const [destroyedIds, setDestroyedIds] = useState<Set<number>>(new Set());
  const [dogTarget, setDogTarget] = useState<THREE.Vector3 | null>(null);
  const [activeDog, setActiveDog] = useState<'tito'|'lia'>('tito');
  
  const [activeBursts, setActiveBursts] = useState<{ id: number; position: THREE.Vector3 }[]>([]);
  const [burstCounter, setBurstCounter] = useState(0);
  
  const [finalBurstsDone, setFinalBurstsDone] = useState(false);

  const { camera } = useThree();

  // 🛑 FUERZA DE SEGURIDAD: Asegura que la cámara aterrice en el ángulo exacto
  useEffect(() => {
    if (stage === 'complete') {
      // Reseteamos la rotación completa usando el orden de ejes correcto
      camera.rotation.set(0.06, 0, 0, 'YXZ');
    }
  }, [stage, camera]);

  /*
   * useMemo, no una llamada suelta en el cuerpo del render.
   *
   * Antes esto creaba un THREE.Vector3 NUEVO en cada render. Como se pasa como
   * prop a cada pensamiento y a los perros, React los daba todos por cambiados
   * y los volvía a renderizar; y cada re-render de un pensamiento hacía que
   * troika recompusiera la textura de su texto. Con veinte frases en pantalla,
   * eso es lo que producía el tirón al aparecer y al explotarlas.
   */
  const tornadoCenter = useMemo(() => {
    if (stage === 'tornado_retreat' || stage === 'parachuting') return new THREE.Vector3(0, 0, -22.5);
    if (stage === 'tornado_ascend' || stage === 'fireworks') return new THREE.Vector3(0, 40, -22.5);
    return new THREE.Vector3(0, 0, 0);
  }, [stage]);

  const thoughtData = useMemo(() =>
    THOUGHTS.map((text, i) => ({
      id: i, text,
      initialAngle: (i / THOUGHTS.length) * Math.PI * 2,
      radius:  4.5 + (i % 5) * 0.62,
      yBase:   1.5 + (i % 4) * 0.82,
      color: ['#ef4444','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316'][i % 6],
      destroyed: false,
    })), []);

  // 🛑 Cuando la fase cambia a 'fireworks', generamos las explosiones finales
  useEffect(() => {
    if (stage === 'fireworks' && !finalBurstsDone) {
      const remaining = thoughtData.filter(t => !destroyedIds.has(t.id));
      const centers: { id: number; position: THREE.Vector3 }[] = [];
      remaining.forEach(() => {
        const angle = Math.random() * Math.PI * 2;
        const radius = 3 + Math.random() * 4;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        centers.push({
          id: burstCounter + Math.random(),
          position: new THREE.Vector3(
            tornadoCenter.x + x,
            tornadoCenter.y + Math.random() * 3,
            tornadoCenter.z + z
          )
        });
      });
      setActiveBursts(prev => [...prev, ...centers]);
      setFinalBurstsDone(true);
    }
    if (stage !== 'fireworks' && stage !== 'tornado_ascend') {
      setFinalBurstsDone(false);
    }
  }, [stage, thoughtData, destroyedIds, tornadoCenter, finalBurstsDone, burstCounter]);

  /*
   * La versión anterior dependía de destroyedIds y burstCounter, así que
   * cambiaba de identidad cada vez que se reventaba una frase. Al ser una prop
   * de los veinte <Thought>, React los volvía a renderizar todos —y con ellos
   * sus veinte textos de troika— justo en el momento de la explosión.
   *
   * Con las lecturas dentro de los setState y la fase en una ref, el callback
   * es estable y, junto al React.memo de Thought, solo se vuelve a dibujar la
   * frase que de verdad ha cambiado.
   */
  const stageRef = useRef(stage);
  useEffect(() => { stageRef.current = stage; }, [stage]);

  const handleThoughtClick = useCallback((id: number, worldPos: THREE.Vector3) => {
    if (stageRef.current !== 'tornado') return;

    setDogTarget(worldPos.clone());
    setActiveDog(Math.random() < 0.5 ? 'tito' : 'lia');

    const burstId = Date.now() + Math.random();
    setBurstCounter(c => c + 1);

    window.setTimeout(() => {
      setDestroyedIds(prev => (prev.has(id) ? prev : new Set([...prev, id])));
      setActiveBursts(prev => [...prev, { id: burstId, position: worldPos.clone() }]);
      onThoughtDestroyed();
      setDogTarget(null);

      window.setTimeout(() => {
        setActiveBursts(prev => prev.filter(b => b.id !== burstId));
      }, 2500);
    }, 1350);
  }, [onThoughtDestroyed]);

  const isDay = ['intro','parachuting','complete'].includes(stage);
  const showThoughts = stage === 'tornado' || stage === 'tornado_ascend' || stage === 'tornado_retreat';

  return (
    <>
      <Sky sunPosition={isDay?[100,20,50]:[0,-10,0]} turbidity={isDay?1:18} rayleigh={isDay?0.8:4}/>
      <fog attach="fog" args={[isDay?'#a8d8f0':'#160828', 45, 170]}/>

      <Lighting stage={stage}/>
      <CameraRig stage={stage}/>
      <Park isMobile={isMobile}/>
      <Tornado stage={stage}/>

      {showThoughts && thoughtData.map(td =>
        !destroyedIds.has(td.id) && (
          <Thought key={td.id} {...td} stage={stage} onDestroy={handleThoughtClick} tornadoCenter={tornadoCenter} />
        )
      )}

      <ThoughtBursts
        active={stage === 'fireworks' || activeBursts.length > 0}
        bursts={activeBursts}
      />

      <Dogs stage={stage} dogTarget={dogTarget} activeDog={activeDog} tornadoCenter={tornadoCenter}/>
    </>
  );
}
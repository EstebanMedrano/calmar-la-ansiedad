// DogActors.tsx - Rebote en el centro y caída hacia atrás (con chiche visual)
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import type { Group } from 'three';
import type { GamePhase } from './ReverseText';
import { TITO_REST, TITO_HIT, TITO_BACK, LIA_REST, LIA_BTN, WORD_POS } from './positions';
import { assetUrl } from '../../../utils/assetUrl';

// ── Stun Rings ──────────────────────────────────────────────────────────────
function StunRings({ hostPos }: { hostPos: React.MutableRefObject<THREE.Vector3> }) {
  const ref = useRef<THREE.Group>(null);
  const COLS = ['#ffee00', '#ff4499', '#44aaff'];
  useFrame((state) => {
    const g = ref.current; if (!g) return;
    g.position.copy(hostPos.current).add(new THREE.Vector3(0, 0.7, 0));
    g.rotation.set(0, state.clock.elapsedTime * 4.0, 0);
  });
  return (
    <group ref={ref}>
      {COLS.map((c, i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 0.30, 0, Math.sin(a) * 0.30]}>
            <mesh rotation={[Math.PI / 2, i * 0.5, i * 0.3]}>
              <torusGeometry args={[0.10, 0.012, 6, 18]} />
              <meshBasicMaterial color={c} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <pointLight color={c} intensity={0.4} distance={0.8} decay={2} />
          </group>
        );
      })}
    </group>
  );
}

// ── Single Dog ──────────────────────────────────────────────────────────────
interface DogProps {
  path:    string;
  scale:   number;
  restPos: [number, number, number];
  phase:   GamePhase;
  role:    'tito' | 'lia';
  dropletsRef: React.MutableRefObject<THREE.Vector3[]>;
}

function Dog({ path, scale, restPos, phase, role, dropletsRef }: DogProps) {
  const groupRef  = useRef<Group>(null);
  const innerRef  = useRef<THREE.Group>(null);
  const posRef    = useRef(new THREE.Vector3(...restPos));
  const hostPos   = useRef(new THREE.Vector3(...restPos));
  const prevPhase = useRef<GamePhase>(phase);
  const phaseT    = useRef(0);

  const { scene: raw, animations } = useGLTF(path);
  const scene = useMemo(() => raw.clone(true), [raw]);
  const { actions } = useAnimations(animations, groupRef);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const fy  = Math.max(0, -box.min.y * scale);
    if (innerRef.current) innerRef.current.position.y = fy;
  }, [scene, scale]);

  useEffect(() => {
    const first = Object.keys(actions)[0];
    if (first) actions[first]?.reset().fadeIn(0.3).play();
  }, [actions]);

  useFrame((state, dt) => {
    const g = groupRef.current; if (!g) return;
    const t = state.clock.elapsedTime;

    if (phase !== prevPhase.current) {
      prevPhase.current = phase;
      phaseT.current = t;
    }
    const elapsed = t - phaseT.current;
    const rest = new THREE.Vector3(...restPos);
    
    let target = rest.clone();
    const isTito = role === 'tito';

    // Lógica del salto hacia la palabra
    if (isTito && (phase === 'success_tito' || phase === 'fail_run')) {
      const totalDuration = 0.62;
      const runDuration = 0.30;
      const p = Math.min(elapsed / totalDuration, 1);
      
      let targetX;
      let targetY = 0;

      targetX = THREE.MathUtils.lerp(restPos[0], TITO_HIT[0], p);

      if (elapsed > runDuration) {
        const pJump = Math.min((elapsed - runDuration) / (totalDuration - runDuration), 1);
        targetY = THREE.MathUtils.lerp(0, WORD_POS[1], pJump);
      }
      target.set(targetX, targetY, restPos[2]);
      
    } else if (isTito) {
      switch (phase) {
        case 'success_break': target.set(...TITO_HIT); break;
        
        // 🛑 En fail_bounce, Tito se queda QUIETO en el centro. 
        // El efecto de choque se hará con un offset manual.
        case 'fail_bounce':
          target.set(...TITO_HIT); 
          break;
        
        case 'fail_stun': target.set(...TITO_BACK); break;
      }
    } else {
      if (phase === 'lia_run' || phase === 'lia_press') {
        target.set(LIA_BTN[0], 0, LIA_BTN[2] + 0.25);
      }
    }

    // Persecución de gotas (Solo en reposo)
    if (phase === 'idle') {
      let closestDist = 100.0;
      let closestPos: THREE.Vector3 | null = null;
      for (let i = 0; i < dropletsRef.current.length; i++) {
        const drop = dropletsRef.current[i];
        if (!drop) continue;
        const dist = posRef.current.distanceToSquared(drop);
        if (dist < closestDist) {
          closestDist = dist;
          closestPos = drop.clone();
        }
      }
      if (closestPos && closestDist < 30) { 
        closestPos.y = 0;
        target.copy(closestPos);
      }
    }

    // Límites de movimiento (Lateral y Profundidad)
    const limitX = 2.5;
    const limitZ = 2.5;

    target.z = THREE.MathUtils.clamp(target.z, -limitZ, limitZ);

    if (phase === 'idle') {
      if (isTito) {
        target.x = Math.max(target.x, limitX);
      } else {
        target.x = Math.min(target.x, -limitX);
      }
    }

    const dir = target.clone().sub(posRef.current);
    const moving = dir.length() > 0.08;
    let targetRotY = g.rotation.y;
    if (phase !== 'fail_stun') {
      targetRotY = moving ? Math.atan2(dir.x, dir.z) : g.rotation.y;
    }

    const isAction = (isTito && ['success_tito','fail_run'].includes(phase)) || (!isTito && phase === 'lia_run');
    let speed = isAction ? 0.08 : 0.03; 
    if (phase === 'idle' && moving) {
      speed = 0.04;
    }

    posRef.current.lerp(target, speed);

    let jumpY = 0;
    if (isTito && phase === 'fail_run') {
      const p = Math.min(elapsed / 0.62, 1);
      jumpY = Math.sin(p * Math.PI) * 0.45;
    }
    if (!isTito && phase === 'lia_run') {
      const p = Math.min(elapsed / 0.9, 1);
      jumpY = Math.sin(p * Math.PI) * 0.25;
    }

    if (isTito && phase === 'fail_stun') {
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, Math.PI / 2, 0.12);
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, 0, 0.12);
    } else if (isTito) {
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0, 0.1);
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, 0, 0.1);
    }

    const bob = Math.sin(t * 1.5 + (isTito ? 0 : 1.3)) * 0.03;
    g.position.set(posRef.current.x, posRef.current.y + bob + jumpY, posRef.current.z);
    
    // 🛑 FORZAMOS EL LÍMITE Z ABSOLUTO
    g.position.z = THREE.MathUtils.clamp(g.position.z, -limitZ, limitZ);

    if (phase !== 'fail_stun') {
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetRotY, dt * 6.0);
    }

    // 🛑 EFECTO DE CHOQUE REAL: Rebote en Y y retroceso en X
    if (isTito && phase === 'fail_bounce') {
      const p = Math.min(elapsed / 0.3, 1);
      // Pequeño rebote hacia arriba y ligero retroceso hacia la derecha (impacto sólido)
      const bounceY = Math.sin(p * Math.PI) * 0.35 * (1 - p);
      const recoilX = Math.sin(p * Math.PI) * 0.15 * (1 - p);
      
      g.position.y += bounceY;
      g.position.x += recoilX;
    }

    if (!isTito && phase === 'lia_press' && innerRef.current) {
      innerRef.current.scale.y = 0.80 + Math.abs(Math.sin(elapsed * 14)) * 0.20;
    } else if (!isTito && innerRef.current) {
      innerRef.current.scale.y = THREE.MathUtils.lerp(innerRef.current.scale.y, 1.0, dt * 5);
    }

    hostPos.current.copy(g.position);
  });

  const isStunned = role === 'tito' && phase === 'fail_stun';

  return (
    <>
      <group ref={groupRef} position={[...restPos]}>
        <group ref={innerRef}>
          <primitive object={scene} scale={scale} />
        </group>
        {isStunned && <pointLight color="#ffdd44" intensity={1.6} distance={2.5} decay={2} position={[0, 0.6, 0]} />}
      </group>

      {isStunned && <StunRings hostPos={hostPos} />}
    </>
  );
}

export default function DogActors({ phase, dropletsRef }: { phase: GamePhase; dropletsRef: React.MutableRefObject<THREE.Vector3[]> }) {
  return (
    <>
      <Dog path={assetUrl('/assets/3D/tito.glb')} scale={0.50} restPos={TITO_REST} phase={phase} role="tito" dropletsRef={dropletsRef} />
      <Dog path={assetUrl('/assets/3D/lia.glb')}  scale={0.46} restPos={LIA_REST} phase={phase} role="lia" dropletsRef={dropletsRef} />
    </>
  );
}

useGLTF.preload(assetUrl('/assets/3D/tito.glb'));
useGLTF.preload(assetUrl('/assets/3D/lia.glb'));
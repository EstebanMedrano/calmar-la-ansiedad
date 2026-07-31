import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Text } from '@react-three/drei';
import { Howl } from 'howler';
import * as THREE from 'three';
import CliffScene from './CliffScene';
import Lake, { type LakeHandle, LAKE_Y, LAKE_Z_CENTER } from './Lake';
import LaserPointer from './LaserPointer';
import BoatDogs from './BoatDogs';
import CustomStars from '../RitualFire/CustomStars';
import { useAnxiety } from '../../context/AnxietyContext';
import { useCanvasQuality } from '../../three/quality';
import { assetUrl } from '../../../utils/assetUrl';
import './WaterCalm.scss';

export const LASER_COLORS = [
  { name: 'Calma',      hex: '#3b82f6', emoji: '🔵' },
  { name: 'Naturaleza', hex: '#10b981', emoji: '🟢' },
  { name: 'Serenidad',  hex: '#8b5cf6', emoji: '🟣' },
  { name: 'Alegría',    hex: '#fbbf24', emoji: '🟡' },
  { name: 'Amor',       hex: '#f472b6', emoji: '🩷' },
  { name: 'Energía',    hex: '#fb923c', emoji: '🟠' },
  { name: 'Claridad',   hex: '#e5e7eb', emoji: '⚪' },
  { name: 'Arcoíris',   hex: 'rainbow', emoji: '🌈' },
];

type WaterStage =
  | 'approaching' | 'atEdge' | 'sitting'
  | 'gazingLake'  | 'spotLaser'
  | 'holdingLaser' | 'shooting';

const CAMERA_POSES: Record<WaterStage, {
  pos:    [number,number,number];
  lookAt: [number,number,number];
}> = {
  approaching:  { pos: [0, 1.6, 14], lookAt: [0,  0.5,  6.0] },
  atEdge:       { pos: [0, 1.5,  6], lookAt: [0,  0.1,  2.0] },
  sitting:      { pos: [0, 1.4,  5], lookAt: [0,  0.6, -1.0] },
  gazingLake:   { pos: [0, 2.5,  5], lookAt: [0, -0.2, -4.5] },
  spotLaser:    { pos: [0, 1.4,  5], lookAt: [2.2, 0.8,  4.0] },
  holdingLaser: { pos: [0, 2.5,  5], lookAt: [0, -0.2, -4.5] },
  shooting:     { pos: [0, 2.5,  5], lookAt: [0, -0.2, -4.5] },
};

const BASE_FOV = 58;

// ─── Color del láser ────────────────────────────────────────────────────────
function ColorController({
  colorIdx, laserColorRef,
}: { colorIdx: number; laserColorRef: React.MutableRefObject<THREE.Color> }) {
  useFrame((state) => {
    const sel = LASER_COLORS[colorIdx];
    if (sel.hex === 'rainbow') {
      laserColorRef.current.setHSL((state.clock.elapsedTime * 0.22) % 1, 1, 0.58);
    } else {
      laserColorRef.current.set(sel.hex);
    }
  });
  return null;
}

// ─── Contador 3D en el bosque ─────────────────────────────────────────────
function CatchCounter({ count }: { count: number }) {
  // El rótulo vive en el mundo 3D, así que su tamaño no depende del CSS: en un
  // móvil vertical el campo horizontal se encoge y "Capturas: 0/10" se salía
  // por la derecha de la pantalla. Se encoge con la proporción para que quepa.
  const aspect = useThree(s => s.size.width / s.size.height);
  const scale = Math.min(1, Math.max(0.42, aspect / 0.72));

  return (
    <group position={[0, LAKE_Y + 3.5, LAKE_Z_CENTER - 14]} scale={scale}>
      <Text
        fontSize={1.6}
        color="#f0f8ff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#00ffcc"
      >
        🦊 Capturas: {count}/10
      </Text>
    </group>
  );
}

// ─── Cámara ───────────────────────────────────────────────────────────────────
function CameraRig({ stage }: { stage: WaterStage }) {
  const { camera } = useThree();
  const curPos    = useRef(new THREE.Vector3(...CAMERA_POSES.approaching.pos));
  const curLookAt = useRef(new THREE.Vector3(...CAMERA_POSES.approaching.lookAt));
  const yaw       = useRef(0);
  const pitch     = useRef(0);

  useFrame((state) => {
    const cam    = camera as THREE.PerspectiveCamera;
    const pose   = CAMERA_POSES[stage];
    const aspect = state.size.width / state.size.height;
    const pf     = THREE.MathUtils.clamp(1 - aspect, 0, 0.85);

    const base = new THREE.Vector3(...pose.pos);
    const look = new THREE.Vector3(...pose.lookAt);
    const adj  = base.clone().addScaledVector(base.clone().sub(look).normalize(), pf * 2.1);

    curPos.current.lerp(adj, 0.038);
    curLookAt.current.lerp(look, 0.038);
    camera.position.copy(curPos.current);

    cam.fov = BASE_FOV + pf * 26;
    cam.updateProjectionMatrix();

    if (stage !== 'shooting') {
      yaw.current   = THREE.MathUtils.lerp(yaw.current,   -state.pointer.x * THREE.MathUtils.degToRad(12), 0.04);
      pitch.current = THREE.MathUtils.lerp(pitch.current,   state.pointer.y * THREE.MathUtils.degToRad(6), 0.04);
    } else {
      yaw.current   = THREE.MathUtils.lerp(yaw.current,   -state.pointer.x * THREE.MathUtils.degToRad(10), 0.08);
      pitch.current = THREE.MathUtils.lerp(pitch.current,   state.pointer.y * THREE.MathUtils.degToRad(5), 0.08);
    }

    const baseQ = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(camera.position, curLookAt.current, camera.up)
    );
    const offQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch.current, yaw.current, 0, 'YXZ'));
    camera.quaternion.copy(baseQ).multiply(offQ);
  });

  return null;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function WaterCalm() {
  const navigate        = useNavigate();
  const { reduceLevel } = useAnxiety();
  const quality         = useCanvasQuality();

  const [stage,        setStage]        = useState<WaterStage>('approaching');
  const [colorIdx,     setColorIdx]     = useState(0);
  const [isFiring,     setIsFiring]     = useState(false);
  const [catchCount,   setCatchCount]   = useState(0);
  const [winningDog,   setWinningDog]   = useState<'tito' | 'lia' | null>(null);
  const [gameOver,     setGameOver]     = useState(false); 

  const lakeRef        = useRef<LakeHandle>(null);
  const laserColorRef  = useRef(new THREE.Color('#10b981'));
  const laserTargetRef = useRef(new THREE.Vector3(0, LAKE_Y, LAKE_Z_CENTER));
  const ids            = useRef<number[]>([]);
  const lastReduce     = useRef(0);

  const waterSoundRef = useRef<Howl | null>(null);
  useEffect(() => {
    waterSoundRef.current = new Howl({ src: [assetUrl('/assets/sounds/water-drop.mp3')], loop: true, volume: 0.22 });
    return () => { waterSoundRef.current?.unload(); };
  }, []);

  useEffect(() => {
    if (isFiring) {
      waterSoundRef.current?.play();
    } else {
      waterSoundRef.current?.stop();
    }
  }, [isFiring]);

  const addT = (fn: () => void, delay: number) => {
    ids.current.push(window.setTimeout(fn, delay));
  };

  useEffect(() => () => { ids.current.forEach(clearTimeout); }, []);

  // Progresión cinematográfica
  useEffect(() => {
    if (stage === 'approaching')  addT(() => setStage('atEdge'),       1500);
    if (stage === 'atEdge')       addT(() => setStage('sitting'),       1500);
    if (stage === 'sitting')      addT(() => setStage('gazingLake'),    1500);
    if (stage === 'gazingLake')   addT(() => setStage('spotLaser'),     2000);
    if (stage === 'spotLaser')    addT(() => setStage('holdingLaser'),  1500);
  }, [stage]);

  // ─── Callback de impacto del láser ──────────────────────────────────────────
  const handleHit = useCallback((wx: number, wz: number) => {
    lakeRef.current?.addRipple(wx, wz);
    laserTargetRef.current.set(wx, LAKE_Y, wz);
    const now = Date.now();
    if (now - lastReduce.current > 30000) { lastReduce.current = now; reduceLevel(); }
  }, [reduceLevel]);

  const handleFireStart = useCallback(() => { if (stage === 'shooting') setIsFiring(true);  }, [stage]);
  const handleFireEnd   = useCallback(() => setIsFiring(false), []);

  // ─── Lógica de atrape ──────────────────────────────────────────────────────
  const onDogCatch = useCallback((dog: 'tito' | 'lia') => {
    if (gameOver) return;
    setCatchCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 10) {
        setWinningDog(dog);  
        setIsFiring(false);  
      }
      return newCount;
    });
  }, [gameOver]);

  // 🛑 Callback que ejecuta el perro cuando termina su salto (Aumentado a 4 segundos)
  const handleJumpComplete = useCallback(() => {
    setTimeout(() => {
      setGameOver(true); 
    }, 4000); // 🛑 Retraso de 4 segundos (los 2 anteriores + 2 extra)
  }, []);

  // ─── Reiniciar juego ──────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    setCatchCount(0);
    setGameOver(false);
    setWinningDog(null);
    setStage('approaching');
    laserTargetRef.current.set(0, LAKE_Y, LAKE_Z_CENTER);
    ids.current.forEach(clearTimeout);
    ids.current = [];
  }, []);

  const goToMenu = useCallback(() => {
    navigate('/games');
  }, [navigate]);

  return createPortal(
    <div className="watercalm-container">
      <button className="btn-secondary watercalm-back-btn" onClick={() => navigate('/games')}>
        ← Volver a juegos
      </button>

      <Canvas
        className="watercalm-canvas"
        dpr={quality.dpr}
        gl={quality.gl}
        performance={quality.performance}
        camera={{ position: CAMERA_POSES.approaching.pos, fov: BASE_FOV, near: 0.1, far: 130 }}
        onPointerDown={handleFireStart}
        onPointerUp={handleFireEnd}
      >
        <color attach="background" args={['#16284d']} />
        <fog   attach="fog"        args={['#16284d', 22, 60]} />

        <ambientLight    color="#1e3060" intensity={1.1} />
        <directionalLight color="#9ab8e0" intensity={0.55} position={[6, 14, -5]} />

        <CustomStars />

        {/* Escenario y lago son geometría propia: se dibujan ya. Solo BoatDogs
            carga un .glb, así que es el único que necesita barrera; antes
            compartían una y el lago no aparecía hasta tener los dos perros. */}
        <CliffScene />
        <Lake ref={lakeRef} laserColorRef={laserColorRef} />
        <LaserPointer
          visible={stage === 'holdingLaser' || stage === 'shooting'}
          firing={isFiring && !gameOver}
          laserColorRef={laserColorRef}
          onHit={handleHit}
        />
        <CatchCounter count={catchCount} />

        <Suspense fallback={null}>
          <BoatDogs
            laserTarget={laserTargetRef}
            active={stage === 'shooting' && !gameOver}
            isFiring={isFiring}
            onCatch={onDogCatch}
            winningDog={winningDog}
            onJumpComplete={handleJumpComplete}
          />
        </Suspense>

        <ColorController colorIdx={colorIdx} laserColorRef={laserColorRef} />
        <CameraRig stage={stage} />

        <EffectComposer>
          <Bloom intensity={0.75} luminanceThreshold={0.22} luminanceSmoothing={0.3} mipmapBlur />
        </EffectComposer>
      </Canvas>

      {stage === 'holdingLaser' && !gameOver && (
        <button className="watercalm-hotspot" onClick={() => setStage('shooting')}>
          🔦 Tomar el láser
        </button>
      )}

      {stage === 'shooting' && !gameOver && (
        <div className="watercalm-color-bar">
          {LASER_COLORS.map((c, i) => (
            <button
              key={i}
              className={`watercalm-color-btn${i === colorIdx ? ' watercalm-color-btn--active' : ''}${c.hex === 'rainbow' ? ' watercalm-color-btn--rainbow' : ''}`}
              style={c.hex !== 'rainbow' ? { background: c.hex } : {}}
              onClick={() => setColorIdx(i)}
              title={c.name}
            >
              {c.emoji}
            </button>
          ))}
        </div>
      )}

      {stage === 'shooting' && !gameOver && (
        <p className="watercalm-hint">
          {isFiring ? '✨ Dibujando ondas…' : '🔦 Mantén presionado para disparar al lago'}
        </p>
      )}

      {/* 🛑 Pantalla de Game Over (Retrasada ahora 4 segundos) */}
      {gameOver && (
        <div className="watercalm-gameover">
          <div className="watercalm-gameover-card">
            <div className="watercalm-gameover-emoji">
              {winningDog === 'tito' ? '🦊' : '🤍'}
            </div>
            <h2>¡Te atrapó {winningDog === 'tito' ? 'Tito' : 'Lia'}!</h2>
            <p>El perrito saltó de su bote y te alcanzó.</p>
            <div className="watercalm-gameover-actions">
              <button className="btn-primary" onClick={resetGame}>🔄 Volver a jugar</button>
              <button className="btn-secondary" onClick={goToMenu}>← Volver al menú</button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
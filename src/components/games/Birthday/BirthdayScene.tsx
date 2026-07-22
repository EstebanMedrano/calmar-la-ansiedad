import { Suspense, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AmbientLight, DirectionalLight, Group } from 'three';
import CustomStars from '../../three/CustomStars';
import ResponsiveRig from '../../three/ResponsiveRig';
import LetterPaper from '../../letter/LetterPaper';
import type { LetterState } from '../../letter/LetterPaper';
import { makeApproachPath } from '../../letter/letterPaths';
import Cake from './Cake';
import CandleRing from './CandleRing';
import PartyDogs from './PartyDogs';
import Tulips from './Tulips';
import Confetti from './Confetti';
import { poseFor, CAKE_POS, CAKE_TOP_WORLD_Y } from './positions';
import type { BirthdayStage } from './timings';

interface BirthdaySceneProps {
  stage: BirthdayStage;
  isMobile: boolean;
  candleCount: number;
  /** Segundos desde que empezaron a salir las velas. */
  risingElapsed: number;
  /** Segundos desde que empezó el apagado. */
  outElapsed: number;
  blowLevel: number;
  /** 0 = perros fuera, 1 = ya llegaron. */
  dogProgress: number;
  onLetterArrived: () => void;
  onLetterOpened: () => void;
}

/** Fases en las que las velas están encendidas. */
const LIT_STAGES = new Set<BirthdayStage>([
  'candlesRising', 'ringComplete', 'dimming', 'awaitBlow',
]);

/** Fases en las que el fondo ya está a oscuras. */
const DARK_STAGES = new Set<BirthdayStage>([
  'dimming', 'awaitBlow', 'candlesOut', 'pullBack',
  'letterIncoming', 'letterOpening', 'reading', 'finale',
]);

function letterStateFor(stage: BirthdayStage): LetterState {
  switch (stage) {
    case 'letterIncoming': return 'flying';
    case 'letterOpening':  return 'unfolding';
    case 'reading':
    case 'finale':         return 'open';
    default:               return 'hidden';
  }
}

const LETTER_ORIGIN = new THREE.Vector3(0, 1.2, -40);
const LETTER_TARGET = new THREE.Vector3(0, 1.15, 4.9);

export default function BirthdayScene({
  stage,
  isMobile,
  candleCount,
  risingElapsed,
  outElapsed,
  blowLevel,
  dogProgress,
  onLetterArrived,
  onLetterOpened,
}: BirthdaySceneProps) {
  const ambientRef = useRef<AmbientLight>(null);
  const dirRef = useRef<DirectionalLight>(null);
  const starsRef = useRef<THREE.Points>(null);
  const cakeGroupRef = useRef<Group>(null);
  const dimRef = useRef(0);

  const letterPath = useMemo(() => makeApproachPath(LETTER_ORIGIN, LETTER_TARGET), []);
  const isDark = DARK_STAGES.has(stage);

  useFrame((state, delta) => {
    // Un único factor de oscurecimiento controla luces, fondo, niebla y
    // estrellas a la vez: así todo se apaga de forma coherente.
    const target = isDark ? 1 : 0;
    dimRef.current = THREE.MathUtils.damp(dimRef.current, target, 1.8, delta);
    const d = dimRef.current;

    if (ambientRef.current) ambientRef.current.intensity = 0.55 - d * 0.49;
    if (dirRef.current) dirRef.current.intensity = 0.45 - d * 0.4;

    if (starsRef.current) {
      const m = starsRef.current.material as THREE.PointsMaterial;
      m.opacity = 0.12 + d * 0.8;
    }

    const bg = state.scene.background as THREE.Color | null;
    if (bg) bg.lerpColors(new THREE.Color('#1a1230'), new THREE.Color('#04060f'), d);

    const fog = state.scene.fog as THREE.Fog | null;
    if (fog) {
      fog.near = THREE.MathUtils.lerp(6, 2.5, d);
      fog.far = THREE.MathUtils.lerp(40, 16, d);
    }

    // La torta aparece cuando los perros llegan: sube desde debajo de la mesa
    // y crece hasta su tamaño. Se hizo así en vez de hacerla volar entre los
    // dos perros porque un objeto grande desplazándose por el aire delata
    // enseguida que nadie lo está sujetando de verdad; que surja al llegar
    // ellos se lee como que la acaban de dejar ahí.
    if (cakeGroupRef.current) {
      const placed = stage !== 'idle' && stage !== 'intro' && stage !== 'dogsRunIn';
      const g = cakeGroupRef.current;
      const targetY = placed ? CAKE_POS[1] : CAKE_POS[1] - 0.45;
      const targetS = placed ? 1 : 0.0001;
      g.position.set(
        CAKE_POS[0],
        THREE.MathUtils.damp(g.position.y, targetY, 4, delta),
        CAKE_POS[2],
      );
      const s = THREE.MathUtils.damp(g.scale.x, targetS, 5, delta);
      g.scale.setScalar(s);
      g.visible = s > 0.01;
    }
  });

  return (
    <>
      <color attach="background" args={['#1a1230']} />
      <fog attach="fog" args={['#1a1230', 6, 40]} />

      <ambientLight ref={ambientRef} intensity={0.55} color="#ffd9c0" />
      <directionalLight ref={dirRef} position={[3, 6, 4]} intensity={0.45} color="#fff0e0" />
      {/* Luz de relleno fría, para que las sombras no queden negras del todo */}
      <pointLight position={[-3, 2.5, 3]} color="#7c9dff" intensity={0.35} distance={16} decay={2} />

      <CustomStars ref={starsRef} count={isMobile ? 2500 : 6000} opacity={0.12} />

      {/* Suelo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[16, 48]} />
        <meshStandardMaterial color="#1b1533" roughness={0.95} />
      </mesh>

      {/* Tulips carga una textura con useTexture, que suspende. Sin este
          Suspense la suspensión llega hasta el Canvas y el EffectComposer
          se monta con el renderer aún sin inicializar. */}
      <Suspense fallback={null}>
        <Tulips count={isMobile ? 12 : 18} dimFactor={dimRef.current} />
      </Suspense>

      {/* Mesa: un pedestal estrecho con tablero. Una mesa maciza y ancha
          se comía medio encuadre y tapaba a los perros. */}
      <group>
        <mesh position={[0, 0.52, 0]}>
          <cylinderGeometry args={[0.72, 0.72, 0.05, 32]} />
          <meshStandardMaterial color="#5b4880" roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.16, 0.22, 0.5, 16]} />
          <meshStandardMaterial color="#43356a" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.34, 0.38, 0.04, 20]} />
          <meshStandardMaterial color="#43356a" roughness={0.85} />
        </mesh>
      </group>

      <group ref={cakeGroupRef} position={CAKE_POS}>
        <Cake isMobile={isMobile} dimFactor={dimRef.current} />
        <CandleRing
          count={candleCount}
          risingElapsed={risingElapsed}
          lit={LIT_STAGES.has(stage)}
          blowLevel={blowLevel}
          outElapsed={outElapsed}
        />
      </group>

      <Suspense fallback={null}>
        <PartyDogs progress={dogProgress} isMobile={isMobile} />
      </Suspense>

      <LetterPaper
        state={letterStateFor(stage)}
        flightPath={letterPath}
        flightDuration={3.2}
        attachToCamera
        // Al desdoblarse la carta triplica su ancho, así que necesita bastante
        // más distancia de la que pide plegada; si no, tapa toda la pantalla
        // por detrás del texto.
        holdDistance={isMobile ? 1.9 : 1.6}
        scale={isMobile ? 0.85 : 1}
        onFlightComplete={onLetterArrived}
        onOpened={onLetterOpened}
      />

      <Confetti active={stage === 'finale'} origin={[0, CAKE_TOP_WORLD_Y + 0.7, 1]} />

      <ResponsiveRig pose={poseFor(stage)} fovGain={26} dolly={2.2} lerp={0.04} />
    </>
  );
}

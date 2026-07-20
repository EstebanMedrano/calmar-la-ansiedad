import { Suspense, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import OceanEnvironment from './OceanEnvironment';
import CameraIntro from './CameraIntro';
import Card3D from './Card3D';
import MatchBurst from './MatchBurst';
import DivingDogs from './DivingDogs';
import Shark from './Shark';
import type {
  IntroStage, CardState, SharkState, DogTarget, DogState, CardData, BurstData,
} from './types';
import {
  IMG_PATHS, GRID_SX, GRID_SY, GAP_X, GAP_Y, CARD_COLS,
  PAIR_COLORS, CAM_PLAY_POS, CAM_PLAY_LOOK,
} from './positions';

interface SceneProps {
  introStage:    IntroStage;
  isPlaying:     boolean;
  deck:          CardData[];
  cardStates:    CardState[];
  shakeSet:      Set<number>;
  bursts:        BurstData[];
  matched:       number;
  sharkState:    SharkState;
  sharkTarget:   DogTarget;
  titoState:     DogState;
  liaState:      DogState;
  titoWorldPos:  React.MutableRefObject<THREE.Vector3>;
  liaWorldPos:   React.MutableRefObject<THREE.Vector3>;
  sharkWorldPos: React.MutableRefObject<THREE.Vector3>;
  onCardClick:   (idx: number) => void;
  onStageChange: (s: IntroStage) => void;
  onComplete:    () => void;
}

// ── Cámara adaptativa responsive ─────────────────────────────────────────────
// Estrategia Mobile-First: en portrait mueve la cámara hacia atrás y abre el FOV
// para que todo el contenido (cartas X≈-5 a -2, perros X≈2.5 a 7.5) sea visible.
function AdaptiveCamera() {
  const { camera, size } = useThree();

  useFrame(() => {
    const cam    = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;

    // Breakpoints basados en contenido (no en dispositivo)
    let tFov: number, tZ: number, tX: number;

    if (aspect < 0.65) {
      // Portrait móvil estrecho (≤ 375px ancho)
      tFov = 80; tZ = 36; tX = 2.0;
    } else if (aspect < 0.85) {
      // Portrait tablet / móvil grande
      tFov = 73; tZ = 30; tX = 1.0;
    } else if (aspect < 1.15) {
      // Near-square
      tFov = 64; tZ = 24; tX = 0;
    } else {
      // Landscape / desktop
      tFov = 58; tZ = 18; tX = -0.8;
    }

    // Lerp suave para transiciones en rotación de pantalla
    cam.fov = THREE.MathUtils.lerp(cam.fov, tFov, 0.055);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, tX, 0.055);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0,  0.055);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, tZ, 0.055);
    camera.lookAt(tX, 0, 0);
    cam.updateProjectionMatrix();
  });

  return null;
}

function PlaygroundCamera() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...CAM_PLAY_POS);
    camera.lookAt(new THREE.Vector3(...CAM_PLAY_LOOK));
  }, [camera]);
  return <AdaptiveCamera />;
}

// ── Inner scene con texturas ──────────────────────────────────────────────────
function WithTextures(props: SceneProps) {
  const textures = useTexture(IMG_PATHS) as THREE.Texture[];

  return (
    <>
      {!props.isPlaying
        ? <CameraIntro onStageChange={props.onStageChange} onComplete={props.onComplete} />
        : <PlaygroundCamera />
      }

      <OceanEnvironment introStage={props.introStage} />

      {props.isPlaying && (
        <>
          {/* Grid de cartas */}
          {props.deck.map((card, idx) => {
            const col = idx % CARD_COLS;
            const row = Math.floor(idx / CARD_COLS);
            const x   = GRID_SX + col * GAP_X;
            const y   = GRID_SY - row * GAP_Y;
            return (
              <Card3D
                key={`${card.id}-${idx}`}
                position={[x, y, 0]}
                texture={textures[card.pairId] ?? null}
                cardState={props.cardStates[idx]}
                shake={props.shakeSet.has(idx)}
                color={PAIR_COLORS[card.pairId % PAIR_COLORS.length]}
                onClick={() => props.onCardClick(idx)}
              />
            );
          })}

          {props.bursts.map(b => (
            <MatchBurst key={b.id} position={b.pos} color={b.color} active={true} />
          ))}

          {/* Perros y tiburón */}
          <DivingDogs
            titoState={props.titoState}
            liaState={props.liaState}
            sharkPos={props.sharkWorldPos}
            titoWorldPos={props.titoWorldPos}
            liaWorldPos={props.liaWorldPos}
          />
          <Shark
            sharkState={props.sharkState}
            target={props.sharkTarget}
            titoPos={props.titoWorldPos}
            liaPos={props.liaWorldPos}
            worldPos={props.sharkWorldPos}
          />
        </>
      )}
    </>
  );
}

export default function MemoramaScene(props: SceneProps) {
  return (
    <Suspense fallback={null}>
      <WithTextures {...props} />
    </Suspense>
  );
}
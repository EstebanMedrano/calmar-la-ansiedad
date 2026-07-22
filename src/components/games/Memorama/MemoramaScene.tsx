import { Suspense, memo, useEffect, useMemo, useRef } from 'react';
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
  IMG_PATHS, getGridConfig, getCardPos, getCameraConfig, getActorZones,
  PAIR_COLORS,
} from './positions';

interface SceneProps {
  introStage: IntroStage;
  isPlaying: boolean;
  deck: CardData[];
  cardStates: CardState[];
  shakeSet: Set<number>;
  bursts: BurstData[];
  matched: number;
  sharkState: SharkState;
  sharkTarget: DogTarget;
  titoState: DogState;
  liaState: DogState;
  titoWorldPos: React.MutableRefObject<THREE.Vector3>;
  liaWorldPos: React.MutableRefObject<THREE.Vector3>;
  sharkWorldPos: React.MutableRefObject<THREE.Vector3>;
  onCardClick: (idx: number) => void;
  onStageChange: (s: IntroStage) => void;
  onComplete: () => void;
  isMobile: boolean;
}

function AdaptiveCamera({ enabled }: { enabled: boolean }) {
  const { camera, size } = useThree();
  const hasSnapped = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (enabled) hasSnapped.current = false;
  }, [enabled]);

  useFrame(() => {
    if (!enabled || !isMounted.current) return;
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const cfg = getCameraConfig(aspect);

    if (!hasSnapped.current) {
      cam.fov = cfg.fov;
      camera.position.set(cfg.x, 0, cfg.z);
      camera.lookAt(cfg.x, 0, 0);
      cam.updateProjectionMatrix();
      hasSnapped.current = true;
      return;
    }

    cam.fov = THREE.MathUtils.lerp(cam.fov, cfg.fov, 0.045);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, cfg.x, 0.045);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, 0.045);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, cfg.z, 0.045);
    camera.lookAt(cfg.x, 0, 0);
    cam.updateProjectionMatrix();
  });

  return null;
}

function WithTextures(props: SceneProps) {
  const textures = useTexture(IMG_PATHS) as THREE.Texture[];
  const { size } = useThree();
  const aspect = size.width / size.height;
  const gridCfg = useMemo(() => getGridConfig(aspect), [aspect]);
  const zones = useMemo(() => getActorZones(aspect), [aspect]);

  return (
    <>
      <AdaptiveCamera enabled={props.isPlaying} />
      {!props.isPlaying && (
        <CameraIntro onStageChange={props.onStageChange} onComplete={props.onComplete} />
      )}
      <OceanEnvironment introStage={props.introStage} />

      {props.isPlaying && (
        <>
          {props.deck.map((card, idx) => {
            const pos = getCardPos(idx, gridCfg);
            return (
              <Card3D
                key={`${card.id}-${idx}`}
                position={pos}
                texture={textures[card.pairId] ?? null}
                cardState={props.cardStates[idx]}
                shake={props.shakeSet.has(idx)}
                color={PAIR_COLORS[card.pairId % PAIR_COLORS.length]}
                scale={gridCfg.cardScale}
                onClick={() => props.onCardClick(idx)}
              />
            );
          })}
          {props.bursts.map(b => (
            <MatchBurst key={b.id} position={b.pos} color={b.color} active={true} />
          ))}

          <Suspense fallback={null}>
            <DivingDogs
              titoState={props.titoState}
              liaState={props.liaState}
              sharkPos={props.sharkWorldPos}
              titoWorldPos={props.titoWorldPos}
              liaWorldPos={props.liaWorldPos}
              titoZone={zones.tito}
              liaZone={zones.lia}
              depth={zones.z}
              isMobile={props.isMobile}
            />
            <Shark
              sharkState={props.sharkState}
              target={props.sharkTarget}
              titoPos={props.titoWorldPos}
              liaPos={props.liaWorldPos}
              worldPos={props.sharkWorldPos}
              zone={zones.shark}
              depth={zones.z}
              isMobile={props.isMobile}
            />
          </Suspense>
        </>
      )}
    </>
  );
}

/**
 * memo es importante aquí: el HUD tiene un cronómetro que actualiza el estado
 * cada segundo, y sin esto toda la escena 3D (24 cartas, los dos perros y el
 * tiburón) se volvía a renderizar una vez por segundo para siempre, sin que
 * hubiera cambiado nada de lo que dibuja.
 */
export default memo(function MemoramaScene(props: SceneProps) {
  return (
    <Suspense fallback={null}>
      <WithTextures {...props} />
    </Suspense>
  );
});
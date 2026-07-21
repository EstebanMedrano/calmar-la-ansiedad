import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { IntroStage } from './types';
import { CAM_PLAY_POS, CAM_PLAY_LOOK } from './positions';

const KEYS = [
  { t: 0, pos: [0, 4, 28], look: [0, 1, 5] },
  { t: 4, pos: [0, 2, 20], look: [0, -.5, 5] },
  { t: 6, pos: [0, .5, 15], look: [0, -2, 0] },
  { t: 10, pos: CAM_PLAY_POS, look: CAM_PLAY_LOOK },
] as const;

type Key = typeof KEYS[number];

function easeInOut(x: number) { return x < .5 ? 2 * x * x : -1 + (4 - 2 * x) * x; }
function easeIn(x: number) { return x * x * x; }

interface Props {
  onStageChange: (s: IntroStage) => void;
  onComplete: () => void;
}

export default function CameraIntro({ onStageChange, onComplete }: Props) {
  const { camera } = useThree();
  const elapsed = useRef(0);
  const done = useRef(false);
  const lastStage = useRef<IntroStage>('beach');
  const fired = useRef(false);
  const _pos = useRef(new THREE.Vector3());
  const _look = useRef(new THREE.Vector3());
  const completePos = useRef(new THREE.Vector3());
  const completeLook = useRef(new THREE.Vector3());
  const outroT = useRef(0);

  useFrame((_, dt) => {
    if (done.current) {
      outroT.current += dt;
      const p = Math.min(outroT.current / 0.6, 1);
      const ease = easeInOut(p);
      camera.position.lerpVectors(completePos.current, new THREE.Vector3(...CAM_PLAY_POS), ease);
      const look = new THREE.Vector3();
      look.lerpVectors(completeLook.current, new THREE.Vector3(...CAM_PLAY_LOOK), ease);
      camera.lookAt(look);
      if (p >= 1 && !fired.current) {
        fired.current = true;
        onComplete();
      }
      return;
    }

    elapsed.current = Math.min(elapsed.current + dt, 10.2);
    const t = elapsed.current;

    let stage: IntroStage = 'beach';
    if (t >= 10) stage = 'playing';
    else if (t >= 6) stage = 'diving';
    else if (t >= 4) stage = 'surface';

    if (stage !== lastStage.current) {
      lastStage.current = stage;
      onStageChange(stage);
    }

    if (stage === 'playing' && !done.current) {
      done.current = true;
      completePos.current.copy(camera.position);
      _look.current.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()));
      completeLook.current.copy(_look.current);
      outroT.current = 0;
      return;
    }

    let a: Key = KEYS[0], b: Key = KEYS[KEYS.length - 1];
    for (let i = 0; i < KEYS.length - 1; i++) {
      if (t >= KEYS[i].t && t <= KEYS[i + 1].t) { a = KEYS[i]; b = KEYS[i + 1]; break; }
    }
    const raw = (t - a.t) / (b.t - a.t + .0001);
    const p = stage === 'diving' ? easeIn(raw) : easeInOut(raw);

    _pos.current.lerpVectors(
      new THREE.Vector3(...a.pos), new THREE.Vector3(...b.pos), p
    );
    _look.current.lerpVectors(
      new THREE.Vector3(...a.look), new THREE.Vector3(...b.look), p
    );

    camera.position.copy(_pos.current);
    camera.lookAt(_look.current);
  });

  return null;
}
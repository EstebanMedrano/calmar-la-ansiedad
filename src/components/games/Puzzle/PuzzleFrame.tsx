import { useRef, useState, useCallback, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useTexture, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { SnapSparkle } from './sparkleShader';
import type { Phase } from './Puzzle';

const GRID        = 4;
const SNAP_DIST   = 0.28;
const SCATTER_DUR = 1.2;
const SETTLE_DELAY = 2400;

interface PuzzleFrameProps {
  phase:      Phase;
  textureUrl: string;
  center:     THREE.Vector3;
  size:       { w: number; h: number };
  floatDepth: number;
  onSettled:  () => void;
  onSnap:     (n: number) => void;
  onComplete: () => void;
}

function buildFloatPositions(breakTick: number): { x: number; y: number }[] {
  void breakTick;
  const n    = GRID * GRID;
  const half = n / 2;
  const pts: { x: number; y: number }[] = [];

  for (let i = 0; i < half; i++) {
    pts.push({
      x: -2.2 + (i % 2) * 0.72 + (Math.random() - 0.5) * 0.16,
      y:  0.28 + Math.floor(i / 2) * 0.50 + (Math.random() - 0.5) * 0.12,
    });
  }
  for (let i = 0; i < half; i++) {
    pts.push({
      x: 1.8 + (i % 2) * 0.72 + (Math.random() - 0.5) * 0.16,
      y: 0.28 + Math.floor(i / 2) * 0.50 + (Math.random() - 0.5) * 0.12,
    });
  }

  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }
  return pts;
}

export interface PuzzleFrameHandle {
  getUnplacedPiecePosition: () => THREE.Vector3 | null;
  placeSelectedPiece: () => void;
}

const PuzzleFrame = forwardRef<PuzzleFrameHandle, PuzzleFrameProps>(({
  phase, textureUrl, center, size, floatDepth, onSettled, onSnap, onComplete,
}, ref) => {
  const texture = useTexture(textureUrl);
  useEffect(() => { texture.colorSpace = THREE.SRGBColorSpace; texture.needsUpdate = true; }, [texture]);

  const snapCountRef = useRef(0);
  const [breakTick, setBreakTick] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const floatPositions = useMemo(() => buildFloatPositions(breakTick), [breakTick]);

  useEffect(() => {
    if (phase !== 'breaking') return;
    snapCountRef.current = 0;
    setBreakTick(t => t + 1);
    const t = setTimeout(onSettled, SETTLE_DELAY);
    return () => clearTimeout(t);
  }, [phase, onSettled]);

  const handleSnap = useCallback(() => {
    snapCountRef.current += 1;
    onSnap(snapCountRef.current);
    if (snapCountRef.current >= GRID * GRID) setTimeout(onComplete, 600);
  }, [onSnap, onComplete]);

  const pw = size.w / GRID;
  const ph = size.h / GRID;
  const showPieces = phase !== 'idle' && phase !== 'calling' && phase !== 'intro';

  const pieces = useMemo(() => {
    const arr: { row: number; col: number; target: THREE.Vector3 }[] = [];
    for (let row = 0; row < GRID; row++)
      for (let col = 0; col < GRID; col++)
        arr.push({
          row, col,
          target: new THREE.Vector3(
            center.x - size.w / 2 + pw * col + pw / 2,
            center.y + size.h / 2 - ph * row - ph / 2,
            center.z + 0.018,
          ),
        });
    return arr;
  }, [center, size, pw, ph]);

  const [placedStates, setPlacedStates] = useState<boolean[]>([]);
  const piecesCount = GRID * GRID;

  // 🛑 CORRECCIÓN: Usamos useRef en lugar de let para que no se pierda al renderizar
  const selectedPieceIdx = useRef<number | null>(null);

  useEffect(() => {
    if (phase === 'breaking' || phase === 'intro') {
      setPlacedStates(new Array(piecesCount).fill(false));
    }
  }, [phase, piecesCount]);

  useImperativeHandle(ref, () => ({
    getUnplacedPiecePosition: () => {
      const unplacedIndices = placedStates.map((p, i) => !p ? i : null).filter(v => v !== null) as number[];
      if (unplacedIndices.length === 0) return null;
      const randomIdx = unplacedIndices[Math.floor(Math.random() * unplacedIndices.length)];
      selectedPieceIdx.current = randomIdx; // Actualizamos el ref
      const fp = floatPositions[randomIdx];
      return new THREE.Vector3(fp.x, fp.y, floatDepth);
    },
    placeSelectedPiece: () => {
      if (selectedPieceIdx.current === null) return;
      const randomIdx = selectedPieceIdx.current;
      const newPlaced = [...placedStates];
      newPlaced[randomIdx] = true;
      setPlacedStates(newPlaced);
      handleSnap();
      selectedPieceIdx.current = null; // Limpiamos el ref
    }
  }), [placedStates, floatPositions, floatDepth, handleSnap]);

  return (
    <group>
      {/* Marco de madera */}
      <group position={center}>
        {([
          [0,  size.h/2+0.045, 0, [size.w+0.18, 0.09, 0.07]],
          [0, -size.h/2-0.045, 0, [size.w+0.18, 0.09, 0.07]],
          [-size.w/2-0.045, 0, 0, [0.09, size.h, 0.07]],
          [ size.w/2+0.045, 0, 0, [0.09, size.h, 0.07]],
        ] as [number,number,number,[number,number,number]][]).map(([x,y,z,args],i) => (
          <mesh key={i} position={[x,y,z]} castShadow>
            <boxGeometry args={args} />
            <meshStandardMaterial color="#8b5e30" roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[0,0,-0.01]}>
          <planeGeometry args={[size.w, size.h]} />
          <meshStandardMaterial color="#f0e8d8" />
        </mesh>
      </group>

      {/* Imagen intacta */}
      {!showPieces && (
        <mesh position={[center.x, center.y, center.z + 0.018]}>
          <planeGeometry args={[size.w, size.h]} />
          <meshStandardMaterial map={texture} roughness={0.85} />
        </mesh>
      )}

      {/* Guías de destino */}
      {showPieces && pieces.map((p, i) => (
        <mesh key={i} position={[p.target.x, p.target.y, p.target.z - 0.005]}>
          <planeGeometry args={[pw * 0.96, ph * 0.96]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.06} />
        </mesh>
      ))}

      {/* Piezas */}
      {pieces.map((p, i) => (
        <Piece
          key={`${breakTick}-${i}`}
          texture={texture}
          row={p.row} col={p.col}
          pieceW={pw} pieceH={ph}
          target={p.target}
          frameCenter={center}
          floatDepth={floatDepth}
          floatPos={floatPositions[i]}
          phase={phase}
          visible={showPieces}
          onSnap={handleSnap}
          isPlaced={placedStates[i] || false}
          onPlacedChange={(val) => {
            const newPlaced = [...placedStates];
            newPlaced[i] = val;
            setPlacedStates(newPlaced);
          }}
        />
      ))}
    </group>
  );
});

PuzzleFrame.displayName = 'PuzzleFrame';
export default PuzzleFrame;

// ── Pieza individual ──────────────────────────────────────────────────────
interface PieceProps {
  texture:     THREE.Texture;
  row:         number;
  col:         number;
  pieceW:      number;
  pieceH:      number;
  target:      THREE.Vector3;
  frameCenter: THREE.Vector3;
  floatDepth:  number;
  floatPos:    { x: number; y: number };
  phase:       Phase;
  visible:     boolean;
  onSnap:      () => void;
  isPlaced:    boolean;
  onPlacedChange: (val: boolean) => void;
}

type PieceSub = 'attached' | 'scatter' | 'float' | 'placed';

function Piece({ texture, row, col, pieceW, pieceH, target, frameCenter, floatDepth, floatPos, phase, visible, onSnap, isPlaced, onPlacedChange }: PieceProps) {
  const meshRef    = useRef<THREE.Mesh>(null);
  const sub        = useRef<PieceSub>('attached');
  const vel        = useRef(new THREE.Vector3());
  const scatterClk = useRef(0);
  const seed       = useMemo(() => Math.random() * Math.PI * 2, []);
  const dragging   = useRef(false);
  const destRef    = useRef(new THREE.Vector3());
  const [snapped, setSnapped] = useState(false);

  const { camera, gl } = useThree();

  const geo = useMemo(() => {
    const g  = new THREE.PlaneGeometry(pieceW * 0.93, pieceH * 0.93);
    const uv = g.attributes.uv;
    const u0 = col / GRID, u1 = (col+1) / GRID;
    const v0 = 1-(row+1)/GRID, v1 = 1-row/GRID;
    uv.setXY(0, u0, v1); uv.setXY(1, u1, v1);
    uv.setXY(2, u0, v0); uv.setXY(3, u1, v0);
    uv.needsUpdate = true;
    return g;
  }, [pieceW, pieceH, row, col]);

  useEffect(() => {
    if (isPlaced) {
      sub.current = 'placed';
      if (meshRef.current) {
        meshRef.current.position.copy(target);
        meshRef.current.position.z = frameCenter.z + 0.05;
        meshRef.current.rotation.set(0, 0, 0);
      }
    }
  }, [isPlaced, target, frameCenter]);

  useEffect(() => {
    if (phase !== 'breaking' || sub.current !== 'attached') return;
    sub.current        = 'scatter';
    scatterClk.current = 0;
    if (meshRef.current) meshRef.current.position.copy(target);

    const xSign = floatPos.x < 0 ? -1 : 1;
    const speed = 2.6 + Math.random() * 2.8;
    vel.current.set(
      xSign * speed * (0.6 + Math.random() * 0.8),
      Math.random() * 3.2 + 0.5,
      (Math.random() - 0.5) * 0.9
    );
  }, [phase, target, floatPos]);

  useFrame((state, dt) => {
    const m = meshRef.current;
    if (!m || dragging.current || sub.current === 'placed' || sub.current === 'attached') return;
    const t = state.clock.elapsedTime;

    if (sub.current === 'scatter') {
      scatterClk.current += dt;
      m.position.addScaledVector(vel.current, dt);
      vel.current.y -= 2.8 * dt;
      vel.current.multiplyScalar(0.975);
      m.rotation.x += vel.current.x * 0.025;
      m.rotation.y += vel.current.z * 0.025;
      const floor = frameCenter.y - 1.5;
      if (m.position.y < floor) {
        m.position.y  = floor;
        vel.current.y *= -0.28;
        vel.current.x *= 0.72;
        vel.current.z *= 0.72;
      }
      if (scatterClk.current > SCATTER_DUR) sub.current = 'float';

    } else if (sub.current === 'float') {
      destRef.current.set(
        floatPos.x + Math.sin(seed * 0.4) * 0.04,
        floatPos.y + Math.sin(seed * 1.2) * 0.04,
        floatDepth
      );
      m.position.lerp(destRef.current, Math.min(1, dt * 1.6));
      m.position.y   += Math.sin(t * 1.1 + seed) * 0.0006;
      m.rotation.x   *= 0.93;
      m.rotation.y   *= 0.93;
      m.rotation.z    = Math.sin(t * 0.6 + seed) * 0.012;
    }
  });

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (phase !== 'puzzle' || sub.current === 'placed') return;
    e.stopPropagation();
    const m = meshRef.current;
    if (!m) return;

    dragging.current = true;
    const dragZ  = target.z + 0.015;
    m.position.z = dragZ;

    const point = new THREE.Vector3(e.point.x, e.point.y, dragZ);
    const offset = point.clone().sub(m.position);

    const mat = m.material as THREE.MeshStandardMaterial;
    mat.emissive.setHex(0x281400);

    const onMove = (ev: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const ndcX = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((ev.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -dragZ);
      const hitPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, hitPoint);

      if (hitPoint) {
        m.position.x = hitPoint.x - offset.x;
        m.position.y = hitPoint.y - offset.y;
      }
    };

    const onUp = () => {
      dragging.current = false;
      mat.emissive.setHex(0);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);

      const dx   = m.position.x - target.x;
      const dy   = m.position.y - target.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < SNAP_DIST) {
        m.position.copy(target);
        m.position.z = frameCenter.z + 0.05;
        m.rotation.set(0, 0, 0);
        sub.current = 'placed';
        onPlacedChange(true);
        setSnapped(true);
        onSnap();
        setTimeout(() => setSnapped(false), 700);
      } else {
        m.position.z = floatDepth;
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
  }, [phase, gl, camera, target, frameCenter, floatDepth, onSnap, onPlacedChange]);

  return (
    <mesh
      ref={meshRef}
      geometry={geo}
      position={target}
      visible={visible}
      onPointerDown={handlePointerDown}
      onPointerOver={() => { if (phase === 'puzzle' && sub.current !== 'placed') gl.domElement.style.cursor = 'grab'; }}
      onPointerOut={()  => { gl.domElement.style.cursor = 'default'; }}
      castShadow
    >
      <meshStandardMaterial map={texture} roughness={0.82} />
      {isPlaced  && <Edges color="#22e07a" lineWidth={2.5} threshold={1} />}
      {snapped && <SnapSparkle />}
    </mesh>
  );
}
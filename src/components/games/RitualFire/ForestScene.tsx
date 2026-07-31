import { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import useIsMobile from '../../../hooks/useIsMobile';

export const RIGHT_STUMP: [number, number, number] = [1.65, 0.2, 0.6];
export const LEFT_STUMP: [number, number, number] = [-1.65, 0.2, 0.6];
export const STUMP_TOP_Y = 0.43;

interface TreeTransform {
  position: [number, number, number];
  scale: number;
  rotationY: number;
}

function generateTrees(count: number, minRadius: number, maxRadius: number): TreeTransform[] {
  const trees: TreeTransform[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    trees.push({
      position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
      scale: 0.8 + Math.random() * 0.6,
      rotationY: Math.random() * Math.PI * 2,
    });
  }
  return trees;
}

/**
 * Una capa del pinar (los troncos, o uno de los tres niveles de copa) dibujada
 * como InstancedMesh.
 *
 * Antes cada pino eran cuatro <mesh> sueltos: con cincuenta árboles el bosque
 * costaba 200 llamadas de dibujo por fotograma, que en un móvil es la mitad del
 * presupuesto de la escena. Instanciado son cuatro.
 */
function TreeLayer({
  trees, geometry, color, localY, localScale = 1,
}: {
  trees: TreeTransform[];
  geometry: THREE.BufferGeometry;
  color: string;
  localY: number;
  localScale?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    trees.forEach((t, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.rotationY);
      pos.set(t.position[0], t.position[1] + localY * t.scale, t.position[2]);
      scl.setScalar(t.scale * localScale);
      mesh.setMatrixAt(i, m.compose(pos, q, scl));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [trees, localY, localScale]);

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, trees.length]} frustumCulled={false}>
      <meshStandardMaterial color={color} roughness={1} />
    </instancedMesh>
  );
}

function Stump({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.32, 0.36, 0.42, 10]} />
      <meshStandardMaterial color="#3a2614" roughness={0.95} />
    </mesh>
  );
}

function PenOnDesk() {
  return (
    <mesh
      position={[RIGHT_STUMP[0] + 0.05, STUMP_TOP_Y + 0.02, RIGHT_STUMP[2] - 0.1]}
      rotation={[0, 0.4, Math.PI / 2.1]}
    >
      <cylinderGeometry args={[0.012, 0.012, 0.32, 8]} />
      <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
    </mesh>
  );
}

function LettersOnDesk({ count = 3 }: { count?: number }) {
  return (
    <group position={[RIGHT_STUMP[0], STUMP_TOP_Y, RIGHT_STUMP[2] + 0.1]}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[0, i * 0.012, 0]} rotation={[0, 0.15 * i, 0]}>
          <boxGeometry args={[0.28, 0.01, 0.2]} />
          <meshStandardMaterial color="#f3ead9" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

export default function ForestScene({ lettersOnDesk = 3 }: { lettersOnDesk?: number }) {
  const isMobile = useIsMobile();
  const trees = useMemo(() => generateTrees(isMobile ? 32 : 50, 4, 13), [isMobile]);

  // Geometrías compartidas por todas las instancias de cada capa.
  const geo = useMemo(() => ({
    trunk: new THREE.CylinderGeometry(0.08, 0.12, 1, 6),
    cone1: new THREE.ConeGeometry(0.55, 1.1, 7),
    cone2: new THREE.ConeGeometry(0.42, 0.9, 7),
    cone3: new THREE.ConeGeometry(0.28, 0.7, 7),
  }), []);

  useMemo(() => () => Object.values(geo).forEach(g => g.dispose()), [geo]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[16, 32]} />
        <meshStandardMaterial color="#10160f" roughness={1} />
      </mesh>

      <TreeLayer trees={trees} geometry={geo.trunk} color="#3a2a18" localY={0.5} />
      <TreeLayer trees={trees} geometry={geo.cone1} color="#163a26" localY={1.2} />
      <TreeLayer trees={trees} geometry={geo.cone2} color="#1c4530" localY={1.7} />
      <TreeLayer trees={trees} geometry={geo.cone3} color="#235a3c" localY={2.1} />

      <Stump position={RIGHT_STUMP} />
      <Stump position={LEFT_STUMP} />

      {/* Un solo juego de cartas y un solo bolígrafo: antes se pintaban dos
          veces, y el segundo montón ignoraba `lettersOnDesk`, así que al coger
          una carta seguían viéndose tres sobre el tocón. */}
      <LettersOnDesk count={lettersOnDesk} />
      <PenOnDesk />
    </group>
  );
}

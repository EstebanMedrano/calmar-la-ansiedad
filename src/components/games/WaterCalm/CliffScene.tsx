import { useMemo } from 'react';
import * as THREE from 'three';
import { LAKE_Y, LAKE_Z_CENTER, LAKE_HEIGHT } from './Lake';

export const LOG_POS:   [number,number,number] = [0,   0.35, 3.8];
export const LASER_POS: [number,number,number] = [2.2, 0.80, 3.8];

interface TreeTransform {
  position: [number,number,number];
  scale:    number;
  rotationY:number;
}

function Pine({ position, scale, rotationY, baseY=0 }: TreeTransform & { baseY?: number }) {
  return (
    <group position={[position[0], baseY, position[2]]} scale={scale} rotation={[0,rotationY,0]}>
      <mesh position={[0,0.5,0]}>
        <cylinderGeometry args={[0.09,0.14,1,6]} />
        <meshStandardMaterial color="#2d1e0e" roughness={1} />
      </mesh>
      <mesh position={[0,1.2,0]}><coneGeometry args={[0.62,1.2,7]}/><meshStandardMaterial color="#0d2818" roughness={1}/></mesh>
      <mesh position={[0,1.76,0]}><coneGeometry args={[0.46,0.96,7]}/><meshStandardMaterial color="#123420" roughness={1}/></mesh>
      <mesh position={[0,2.22,0]}><coneGeometry args={[0.32,0.74,7]}/><meshStandardMaterial color="#184428" roughness={1}/></mesh>
    </group>
  );
}

function DeciduousTree({ position, scale, rotationY, baseY=0 }: TreeTransform & { baseY?: number }) {
  return (
    <group position={[position[0], baseY, position[2]]} scale={scale} rotation={[0,rotationY,0]}>
      <mesh position={[0,0.5,0]}>
        <cylinderGeometry args={[0.08,0.12,1,6]} />
        <meshStandardMaterial color="#2d1e0e" roughness={1} />
      </mesh>
      <mesh position={[0,1.6,0]}><sphereGeometry args={[0.5, 7, 6]} /><meshStandardMaterial color="#1a2e12" roughness={1}/></mesh>
      <mesh position={[0,2.2,0]}><sphereGeometry args={[0.4, 7, 6]} /><meshStandardMaterial color="#223e1a" roughness={1}/></mesh>
      <mesh position={[0.3,1.3,0.2]}><sphereGeometry args={[0.35, 6, 5]} /><meshStandardMaterial color="#182a10" roughness={1}/></mesh>
      <mesh position={[-0.3,1.3,-0.2]}><sphereGeometry args={[0.35, 6, 5]} /><meshStandardMaterial color="#182a10" roughness={1}/></mesh>
    </group>
  );
}

function Moon() {
  return (
    <mesh position={[-16, 24, -22]}>
      <sphereGeometry args={[3.2, 16, 16]} />
      <meshBasicMaterial color="#f4f8ff" fog={false} />
      <pointLight color="#c8dcff" intensity={6.0} distance={140} decay={0.5} />
    </mesh>
  );
}

function LaserPropOnRock() {
  return (
    <group position={LASER_POS}>
      <mesh rotation={[Math.PI/2,0,0]}>
        <cylinderGeometry args={[0.04,0.034,0.30,10]}/>
        <meshStandardMaterial color="#111122" metalness={0.9} roughness={0.15}/>
      </mesh>
      <mesh position={[0,0,-0.16]} rotation={[Math.PI/2,0,0]}>
        <cylinderGeometry args={[0.017,0.030,0.07,8]}/>
        <meshStandardMaterial color="#00ff80" emissive="#00ff80" emissiveIntensity={1.8}/>
      </mesh>
      <pointLight color="#00ff80" intensity={1.6} distance={5} decay={2}/>
    </group>
  );
}

function Mountains() {
  const positions = useMemo(() => [
    { x: -18, z: LAKE_Z_CENTER - 24, scale: 1.6 },
    { x: -12, z: LAKE_Z_CENTER - 28, scale: 2.0 },
    { x: -8,  z: LAKE_Z_CENTER - 30, scale: 2.4 },
    { x: 8,   z: LAKE_Z_CENTER - 26, scale: 2.0 },
    { x: 14,  z: LAKE_Z_CENTER - 24, scale: 2.2 },
    { x: 20,  z: LAKE_Z_CENTER - 20, scale: 1.8 },
  ], []);

  return (
    <group>
      {positions.map((p, i) => (
        <mesh key={i} position={[p.x, LAKE_Y + p.scale * 2.5, p.z]} castShadow>
          <coneGeometry args={[p.scale * 3.0, p.scale * 5.0, 5]} />
          <meshStandardMaterial color="#3b1f1a" roughness={1} fog={true} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Rocks() {
  const rocks = useMemo(() => {
    const arr: { x: number; z: number; sX: number; sY: number; sZ: number; c: string }[] = [];
    const count = 120;
    
    for (let i = 0; i < count; i++) {
      let x, z;
      const side = Math.random();
      
      if (side < 0.35) { 
        x = -6.2 - Math.random() * 1.2;
        z = LAKE_Z_CENTER + (Math.random() - 0.5) * 6.0;
      } else if (side < 0.70) { 
        x = 6.2 + Math.random() * 1.2;
        z = LAKE_Z_CENTER + (Math.random() - 0.5) * 6.0;
      } else { 
        x = (Math.random() - 0.5) * 12.0;
        z = LAKE_Z_CENTER - 4.5 - Math.random() * 3.0;
        if (Math.abs(x) < 1.5) {
          x = x < 0 ? -2.0 : 2.0;
        }
      }
      
      if (Math.abs(x) < 5.6 && Math.abs(z - LAKE_Z_CENTER) < 3.0) continue;

      const sizeBase = 0.15 + Math.random() * 0.20;
      const sX = sizeBase * (0.6 + Math.random() * 0.8);
      const sY = sizeBase * (0.4 + Math.random() * 0.5);
      const sZ = sizeBase * (0.6 + Math.random() * 0.8);

      const colors = ['#b0b5b9', '#a0a4a8', '#8a8e94', '#9e8d7a'];
      const c = colors[Math.floor(Math.random() * colors.length)];
      
      arr.push({ x, z, sX, sY, sZ, c });
    }
    return arr;
  }, []);

  return (
    <group>
      {rocks.map((r, i) => (
        <mesh key={i} position={[r.x, LAKE_Y + r.sY * 0.5, r.z]} rotation={[Math.random()*1, Math.random()*1, 0]}>
          <dodecahedronGeometry args={[0.5, 1]} />
          <mesh scale={[r.sX, r.sY, r.sZ]} />
          <meshStandardMaterial color={r.c} roughness={1.0} flatShading={true} />
        </mesh>
      ))}
    </group>
  );
}

const FIXED_TREES = {
  shoreLeft: [
    [-11, 0, 4], [-13, 0, 0], [-12, 0, -4], [-14, 0, -8], [-10, 0, -12], [-15, 0, 2], [-9, 0, 8],
    [-16, 0, -6], [-8, 0, -10], [-17, 0, 10], [-11.5, 0, -16], [-13.5, 0, -15], [-18, 0, -2], [-12, 0, 12],
    [-20, 0, 2], [-18, 0, 10], [-15, 0, 14], [-20, 0, -10], [-18, 0, -15], [-14, 0, -12], [-22, 0, 8], [-21, 0, -6]
  ],
  shoreRight: [
    [11, 0, 4], [13, 0, 0], [12, 0, -4], [14, 0, -8], [10, 0, -12], [15, 0, 2], [9, 0, 8],
    [16, 0, -6], [8, 0, -10], [17, 0, 10], [11.5, 0, -16], [13.5, 0, -15], [18, 0, -2], [12, 0, 12],
    [20, 0, 2], [18, 0, 10], [15, 0, 14], [20, 0, -10], [18, 0, -15], [14, 0, -12], [22, 0, 8], [21, 0, -6]
  ],
  back: [
    [-7, 0, 8], [7, 0, 8], [-9, 0, 11], [9, 0, 11], [-6, 0, 13], [6, 0, 13], [-5, 0, 16],
    [5, 0, 16], [-8, 0, 18], [8, 0, 18], [-3, 0, 19], [3, 0, 19], [-10, 0, 21], [10, 0, 21]
  ],
  far: [
    [-10, 0, -12], [10, 0, -12], [-15, 0, -10], [15, 0, -10],
    [-12, 0, -16], [-8, 0, -18], [8, 0, -18], [12, 0, -16],
    [-18, 0, -14], [18, 0, -14], [-13, 0, -20], [13, 0, -20],
    [-20, 0, -12], [20, 0, -12], [-22, 0, -16], [22, 0, -16],
    [-25, 0, -20], [25, 0, -20], [-28, 0, -15], [28, 0, -15],
    [-18, 0, -20], [18, 0, -20]
  ]
};

export default function CliffScene() {
  // 🛑 FILTRO EXTREMO DE ÁRBOLES: Elimina cualquier árbol en el medio del fondo para despejar el marcador
  const allTrees = useMemo(() => {
    const result: { pos: [number,number,number]; scale: number; rot: number; type: 'pine' | 'deciduous'; baseY: number }[] = [];
    const addTrees = (arr: number[][], baseY: number) => {
      arr.forEach((pos, i) => {
        // Bloqueo central absoluto (X=0)
        if (Math.abs(pos[0]) < 0.5) return; 
        // Bloqueo de visión central en el fondo (Z cerca del marcador)
        if (Math.abs(pos[0]) < 4 && Math.abs(pos[2] - LAKE_Z_CENTER) < 12) return;
        
        const scale = 1.0 + (i % 10) * 0.15;
        const rot = i * 0.25;
        const type = (i % 2 === 0) ? 'pine' : 'deciduous';
        result.push({ pos: pos as [number,number,number], scale, rot, type, baseY });
      });
    };
    addTrees(FIXED_TREES.shoreLeft, 0);
    addTrees(FIXED_TREES.shoreRight, 0);
    addTrees(FIXED_TREES.back, 0);
    addTrees(FIXED_TREES.far, LAKE_Y);
    return result;
  }, []);

  return (
    <group>
      <Moon />
      <Mountains />
      <Rocks />

      <mesh rotation={[-Math.PI/2,0,0]} position={[0, -0.5, -4]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#080a0d" roughness={1} />
      </mesh>

      <mesh rotation={[-Math.PI/2,0,0]} position={[-16,-0.5, LAKE_Z_CENTER]}>
        <planeGeometry args={[6, LAKE_HEIGHT+8]} />
        <meshStandardMaterial color="#090d08" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI/2,0,0]} position={[16, -0.5, LAKE_Z_CENTER]}>
        <planeGeometry args={[6, LAKE_HEIGHT+8]} />
        <meshStandardMaterial color="#090d08" roughness={1} />
      </mesh>

      <group position={LOG_POS}>
        <mesh rotation={[0,0,Math.PI/2]}>
          <cylinderGeometry args={[0.28,0.32,1.4,10]}/>
          <meshStandardMaterial color="#3a2410" roughness={0.95}/>
        </mesh>
        <mesh position={[-0.71,0,0]} rotation={[0,0,Math.PI/2]}>
          <cylinderGeometry args={[0.28,0.28,0.06,10]}/>
          <meshStandardMaterial color="#a07040" roughness={0.9}/>
        </mesh>
        <mesh position={[0.71,0,0]} rotation={[0,0,Math.PI/2]}>
          <cylinderGeometry args={[0.28,0.28,0.06,10]}/>
          <meshStandardMaterial color="#a07040" roughness={0.9}/>
        </mesh>
      </group>

      <mesh position={[2.1,0.08,3.8]}>
        <dodecahedronGeometry args={[0.40,0]}/>
        <meshStandardMaterial color="#2a2a2a" roughness={0.9}/>
      </mesh>
      <LaserPropOnRock />

      {allTrees.map((t, i) => t.type === 'pine' ? 
        <Pine key={`t${i}`} position={t.pos} scale={t.scale} rotationY={t.rot} baseY={t.baseY} /> :
        <DeciduousTree key={`t${i}`} position={t.pos} scale={t.scale} rotationY={t.rot} baseY={t.baseY} />
      )}
    </group>
  );
}
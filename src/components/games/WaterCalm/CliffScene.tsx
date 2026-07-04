import { useMemo } from 'react';
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

export default function CliffScene() {
  const shoreTreesLeft = useMemo<TreeTransform[]>(() => {
    const arr: TreeTransform[] = [];
    for (let i=0;i<14;i++) arr.push({
      position: [-12 - Math.random()*8, 0, 6 - Math.random()*22] as [number,number,number],
      scale: 0.85+Math.random()*0.75, rotationY: Math.random()*Math.PI*2,
    });
    return arr;
  },[]);

  const shoreTreesRight = useMemo<TreeTransform[]>(() => {
    const arr: TreeTransform[] = [];
    for (let i=0;i<14;i++) arr.push({
      position: [12 + Math.random()*8, 0, 6 - Math.random()*22] as [number,number,number],
      scale: 0.85+Math.random()*0.75, rotationY: Math.random()*Math.PI*2,
    });
    return arr;
  },[]);

  const backTrees = useMemo<TreeTransform[]>(() => {
    const arr: TreeTransform[] = [];
    for (let i=0;i<12;i++) arr.push({
      position: [(Math.random()-0.5)*20, 0, 5 + Math.random()*14] as [number,number,number],
      scale: 0.9+Math.random()*0.7, rotationY: Math.random()*Math.PI*2,
    });
    return arr;
  },[]);

  const farBankTrees = useMemo<TreeTransform[]>(() => {
    const arr: TreeTransform[] = [];
    const farZ = LAKE_Z_CENTER - LAKE_HEIGHT/2 - 2.5;
    for (let i=0;i<18;i++) arr.push({
      position: [(Math.random()-0.5)*20, 0, farZ - Math.random()*6] as [number,number,number],
      scale: 0.9+Math.random()*0.8, rotationY: Math.random()*Math.PI*2,
    });
    return arr;
  },[]);

  return (
    <group>
      <Moon />

      {/* 🛑 SUELO EXTENDIDO: Ahora cubre TODO el fondo y tiene color oscuro unificado */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0, -0.5, -4]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#080a0d" roughness={1} />
      </mesh>

      {/* Tiras de tierra a los lados del lago */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[-16,-0.5, LAKE_Z_CENTER]}>
        <planeGeometry args={[6, LAKE_HEIGHT+8]} />
        <meshStandardMaterial color="#090d08" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI/2,0,0]} position={[16, -0.5, LAKE_Z_CENTER]}>
        <planeGeometry args={[6, LAKE_HEIGHT+8]} />
        <meshStandardMaterial color="#090d08" roughness={1} />
      </mesh>

      {/* Tronco */}
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

      {/* Piedra con láser */}
      <mesh position={[2.1,0.08,3.8]}>
        <dodecahedronGeometry args={[0.40,0]}/>
        <meshStandardMaterial color="#2a2a2a" roughness={0.9}/>
      </mesh>
      <LaserPropOnRock />

      {shoreTreesLeft.map((t,i)  => <Pine key={`sl${i}`} {...t} />)}
      {shoreTreesRight.map((t,i) => <Pine key={`sr${i}`} {...t} />)}
      {backTrees.map((t,i)       => <Pine key={`b${i}`}  {...t} />)}
      {farBankTrees.map((t,i)    => <Pine key={`fb${i}`} {...t} baseY={LAKE_Y}/>)}
    </group>
  );
}
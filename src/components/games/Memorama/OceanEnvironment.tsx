import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { IntroStage } from './types';

// ── Fish ────────────────────────────────────────────────────────────────────

interface FishCfg {cx:number;cy:number;cz:number;rx:number;rz:number;
                   color:string;accent:string;sz:number;spd:number;ph:number;}

const FISH: FishCfg[] = [
  {cx:0,cy:2,cz:-5,rx:3,rz:2,color:'#ff6b35',accent:'#ffaa55',sz:.7,spd:.5,ph:0},
  {cx:-2,cy:1,cz:-6,rx:2,rz:1.5,color:'#3b6fff',accent:'#88aaff',sz:.5,spd:.7,ph:1.2},
  {cx:4,cy:-1,cz:-5,rx:2,rz:1.5,color:'#ffdd00',accent:'#ffee88',sz:.42,spd:.9,ph:2.4},
  {cx:-3,cy:3,cz:-4,rx:1.8,rz:1,color:'#ff44aa',accent:'#ff99cc',sz:.55,spd:.6,ph:.8},
  {cx:1,cy:-2,cz:-7,rx:2.5,rz:1.5,color:'#44ffaa',accent:'#88ffcc',sz:.62,spd:.55,ph:3.5},
  {cx:-4,cy:-.5,cz:-5,rx:1.8,rz:1.8,color:'#aa55ff',accent:'#cc88ff',sz:.45,spd:.8,ph:1.8},
];

function Fish({cfg}:{cfg:FishCfg}) {
  const ref = useRef<THREE.Group>(null);
  const t   = useRef(cfg.ph);
  useFrame((_,dt)=>{
    if(!ref.current) return;
    t.current += dt*cfg.spd;
    const x=cfg.cx+Math.cos(t.current)*cfg.rx;
    const y=cfg.cy+Math.sin(t.current*.4)*.5;
    const z=cfg.cz+Math.sin(t.current)*cfg.rz;
    ref.current.position.set(x,y,z);
    const dx=-Math.sin(t.current)*cfg.rx, dz=Math.cos(t.current)*cfg.rz;
    ref.current.rotation.y=Math.atan2(dx,dz)+Math.PI;
    ref.current.rotation.z=Math.sin(t.current*2)*.08;
  });
  return (
    <group ref={ref} scale={cfg.sz}>
      <mesh scale={[1.8,.8,.7]}>
        <sphereGeometry args={[.18,8,6]}/>
        <meshStandardMaterial color={cfg.color}/>
      </mesh>
      <mesh position={[-.28,0,0]} rotation={[0,0,Math.PI*.5]}>
        <coneGeometry args={[.10,.22,4]}/>
        <meshStandardMaterial color={cfg.accent}/>
      </mesh>
      <mesh position={[.15,.08,0]} rotation={[0,0,.4]}>
        <planeGeometry args={[.09,.07]}/>
        <meshStandardMaterial color={cfg.accent} side={THREE.DoubleSide}/>
      </mesh>
    </group>
  );
}

// ── Kelp ───────────────────────────────────────────────────────────────────

const KELP_POS:[number,number,number][] = [
  [-5.5,-5.5,-8],[-3,-5.5,-9],[0.5,-5.5,-7.5],[6.5,-5.5,-8],
  [4,-5.5,-9],[-1.5,-5.5,-8.5],
];

function Kelp({pos}:{pos:[number,number,number]}) {
  const refs = useRef<Array<THREE.Mesh|null>>([]);
  const ph   = useMemo(()=>Math.random()*Math.PI*2,[]);
  useFrame((s)=>{
    refs.current.forEach((m,i)=>{
      if(m) m.rotation.z=Math.sin(s.clock.elapsedTime*.75+ph+i*.3)*.12;
    });
  });
  const h=.72, segs=7;
  return (
    <group position={pos}>
      {Array.from({length:segs},(_,i)=>(
        <mesh key={i} ref={el=>{refs.current[i]=el;}} position={[0,i*h,0]}>
          <cylinderGeometry args={[.04,.06,h+.05,6]}/>
          <meshStandardMaterial color={i%2===0?'#1a6b3a':'#228844'}/>
        </mesh>
      ))}
    </group>
  );
}

// ── Coral ──────────────────────────────────────────────────────────────────

function Coral({pos,color}:{pos:[number,number,number];color:string}) {
  return (
    <group position={pos}>
      {Array.from({length:5},(_,i)=>{
        const a=(i/5)*Math.PI*2, r=.18+Math.random()*.12;
        return (
          <mesh key={i} position={[Math.cos(a)*r,0,Math.sin(a)*r]}
            rotation={[0,0,(Math.random()-.5)*.5]}>
            <cylinderGeometry args={[.04,.07,.6+Math.random()*.4,6]}/>
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={.25}/>
          </mesh>
        );
      })}
    </group>
  );
}

// ── Light Rays ────────────────────────────────────────────────────────────

function LightRays() {
  const refs = useRef<Array<THREE.Mesh|null>>([]);
  useFrame((s)=>{
    refs.current.forEach((m,i)=>{
      if(!m) return;
      (m.material as THREE.MeshBasicMaterial).opacity =
        .055+Math.sin(s.clock.elapsedTime*.4+i)*.025;
    });
  });
  return (
    <group>
      {Array.from({length:6},(_,i)=>{
        const x=(i-2.5)*2.5, rot=(Math.random()-.5)*.22;
        return (
          <mesh key={i} ref={el=>{refs.current[i]=el;}}
            position={[x,4,-4]} rotation={[rot,0,0]}>
            <planeGeometry args={[.55,14]}/>
            <meshBasicMaterial color="#88ddff" transparent opacity={.06}
              side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false}/>
          </mesh>
        );
      })}
    </group>
  );
}

// ── Rising Bubbles ────────────────────────────────────────────────────────

function RisingBubbles({count=30}:{count?:number}) {
  const ref = useRef<THREE.Points>(null);
  const {pos,vel,ph} = useMemo(()=>{
    const pos=new Float32Array(count*3), vel=new Float32Array(count), ph=new Float32Array(count);
    for(let i=0;i<count;i++){
      pos[i*3]=(Math.random()-.5)*14; pos[i*3+1]=(Math.random()-.5)*12; pos[i*3+2]=-2-Math.random()*6;
      vel[i]=.3+Math.random()*.6; ph[i]=Math.random()*Math.PI*2;
    }
    return {pos,vel,ph};
  },[count]);
  useFrame((_,dt)=>{
    const pts=ref.current; if(!pts) return;
    const pa=pts.geometry.attributes.position as THREE.BufferAttribute;
    for(let i=0;i<count;i++){
      pos[i*3]  +=Math.sin(ph[i]+pos[i*3+1]*.5)*dt*.18;
      pos[i*3+1]+=vel[i]*dt;
      if(pos[i*3+1]>8){pos[i*3+1]=-6;pos[i*3]=(Math.random()-.5)*14;}
      pa.setXYZ(i,pos[i*3],pos[i*3+1],pos[i*3+2]);
    }
    pa.needsUpdate=true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos,3]}/></bufferGeometry>
      <pointsMaterial size={.08} color="#88ddff" transparent opacity={.45}
        sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending}/>
    </points>
  );
}

// ── Sunken Ship ───────────────────────────────────────────────────────────

function SunkenShip() {
  return (
    <group position={[2,-6.5,-12]} rotation={[0,.5,.18]}>
      <mesh position={[0,0,0]}>
        <boxGeometry args={[7,1.4,2]}/><meshStandardMaterial color="#3a2818" roughness={.95}/>
      </mesh>
      <mesh position={[.5,1.1,0]}>
        <boxGeometry args={[2.5,1.2,1.8]}/><meshStandardMaterial color="#2a1c10" roughness={.95}/>
      </mesh>
      <mesh position={[0,2.8,0]}>
        <cylinderGeometry args={[.09,.09,3.5,6]}/><meshStandardMaterial color="#2a1c10"/>
      </mesh>
      {/* Portholes */}
      {[-1.5,0,1.5].map((x,i)=>(
        <mesh key={i} position={[x,.2,1.02]}>
          <circleGeometry args={[.18,12]}/>
          <meshBasicMaterial color="#1a4a66" transparent opacity={.7}/>
        </mesh>
      ))}
      <pointLight color="#004488" intensity={.35} distance={5} decay={2} position={[0,0.5,1]}/>
    </group>
  );
}

// ── Beach Scene (intro only) ──────────────────────────────────────────────

// ── Beach Scene (intro only) ─────────────────────────────────────────────────
function BeachScene() {
  return (
    <group>
      {/* Sky sphere — envuelve todo, sin gap con el horizonte */}
      <mesh>
        <sphereGeometry args={[55, 16, 14]} />
        <meshBasicMaterial color="#7ec8e3" side={THREE.BackSide} depthWrite={false} />
      </mesh>

      {/* Sun */}
      <mesh position={[8, 14, -18]}>
        <sphereGeometry args={[1.6, 12, 10]} />
        <meshBasicMaterial color="#fffacc" />
        <pointLight color="#fff9e0" intensity={3.5} distance={90} decay={0.4} />
      </mesh>

      {/* Clouds */}
      {([[-6,12,-20],[4,15,-24],[-12,13,-22]] as [number,number,number][]).map((p,i)=>(
        <mesh key={i} position={p} scale={[2.2,0.7,1]}>
          <sphereGeometry args={[1.4,8,6]}/>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.82}/>
        </mesh>
      ))}

      {/* Sand — large ground plane at Y=0 */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 12]}>
        <planeGeometry args={[80, 30]} />
        <meshStandardMaterial color="#f0d09a" roughness={1} />
      </mesh>

      {/* Ocean — same Y=0 but extends forward (negative Z) */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.01, -8]}>
        <planeGeometry args={[80, 40]} />
        <meshStandardMaterial color="#0077bb" transparent opacity={0.92} roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Shoreline foam strip */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 1.5]}>
        <planeGeometry args={[80, 3]} />
        <meshBasicMaterial color="#ddeeff" transparent opacity={0.75} />
      </mesh>

      {/* Horizon glow strip to avoid hard edge */}
      <mesh position={[0, 0, -25]} rotation={[0, 0, 0]}>
        <planeGeometry args={[80, 4]} />
        <meshBasicMaterial color="#4499cc" transparent opacity={0.45} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ── Diving Bubbles (during dive intro) ────────────────────────────────────

export function DivingBubbles() {
  const ref = useRef<THREE.Points>(null);
  const N   = 120;
  const {pos,vel} = useMemo(()=>{
    const pos=new Float32Array(N*3), vel=new Float32Array(N);
    for(let i=0;i<N;i++){
      pos[i*3]=(Math.random()-.5)*5; pos[i*3+1]=(Math.random()-.5)*6+2; pos[i*3+2]=-1-Math.random()*3;
      vel[i]=1.5+Math.random()*3;
    }
    return {pos,vel};
  },[]);
  useFrame((_,dt)=>{
    const pts=ref.current; if(!pts) return;
    const pa=pts.geometry.attributes.position as THREE.BufferAttribute;
    for(let i=0;i<N;i++){
      pos[i*3+1]+=vel[i]*dt;
      if(pos[i*3+1]>6){pos[i*3+1]=-6;pos[i*3]=(Math.random()-.5)*5;}
      pa.setXYZ(i,pos[i*3],pos[i*3+1],pos[i*3+2]);
    }
    pa.needsUpdate=true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos,3]}/></bufferGeometry>
      <pointsMaterial size={.14} color="#aaddff" transparent opacity={.65}
        sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending}/>
    </points>
  );
}

// ── Main export ───────────────────────────────────────────────────────────

export default function OceanEnvironment({introStage}:{introStage:IntroStage}) {
  const isBeach     = introStage==='beach' || introStage==='surface';
  const isUnderwater= introStage==='diving' || introStage==='playing';

  return (
    <>
      <ambientLight color={isBeach ? "#d0e4ff" : "#2a5a8a"} intensity={isBeach ? 0.8 : 0.55}/>
      {isUnderwater && (<hemisphereLight color="#4488ff" groundColor="#001a33" intensity={0.8} />)}

      {isBeach && <BeachScene />}

      {isUnderwater && (
        <>
          <directionalLight color="#ffffff" intensity={2.5} position={[0, 15, -5]}/>
          <pointLight color="#1a8aaa" intensity={4.0} distance={50} decay={1} position={[0, 10, -5]}/>

          <mesh rotation={[-Math.PI/2,0,0]} position={[0,-6,0]}><planeGeometry args={[50,40]} /><meshStandardMaterial color="#3a2a1a" roughness={.95}/></mesh>
          
          {/* ⭐ CAMBIA EL COLOR DE LA PARED DE FONDO AQUÍ ABAJO (#02101e) */}
          <mesh position={[0,0,-15]}>
            <planeGeometry args={[50,30]} /><meshBasicMaterial color="#2e2797" transparent opacity={.88}/>
          </mesh>

          {/* ⭐ CAMBIA EL TINTE DEL AGUA AQUÍ ABAJO (#011530) */}
          <mesh>
            <sphereGeometry args={[30,10,8]}/>
            <meshBasicMaterial color="#3118be" transparent opacity={.45} side={THREE.BackSide} depthWrite={false}/>
          </mesh>

          <LightRays/>
          <RisingBubbles count={28}/>
          <SunkenShip/>
          {FISH.map((f,i)=><Fish key={i} cfg={f}/>)}
          {KELP_POS.map((p,i)=><Kelp key={i} pos={p}/>)}
          {([ [-4.5,-6,-7,'#ff4466'],[-2,-6,-8,'#ff9933'],[3,-6,-7,'#ff4466'],[5.5,-6,-8,'#ffdd00'],[0,-6,-9,'#ff6688'],[-6,-6,-8,'#cc44ff'], ] as [number,number,number,string][]).map(([x,y,z,c],i)=>(<Coral key={i} pos={[x,y,z]} color={c}/>))}
          {([[-4,-5.8,-6,1.2],[-6,-5.5,-9,.9],[5,-5.8,-7,1.0],[7,-5.6,-9,.8]] as number[][]).map(([x,y,z,s],i)=>(<mesh key={i} position={[x,y,z]} scale={s}><icosahedronGeometry args={[.5,0]} /><meshStandardMaterial color="#3a3428" roughness={.95}/></mesh>))}
        </>
      )}
      {introStage==='diving' && <DivingBubbles/>}
    </>
  );
}
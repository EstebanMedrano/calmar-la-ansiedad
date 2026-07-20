import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const N = 55;

export default function MatchBurst({
  position, color, active,
}: { position:[number,number,number]; color:string; active:boolean }) {
  const ref  = useRef<THREE.Points>(null);
  const vel  = useRef(new Float32Array(N*3));
  const life = useRef(new Float32Array(N));
  const pos  = useMemo(()=>new Float32Array(N*3),[]);

  useEffect(()=>{
    if(!active) return;
    for(let i=0;i<N;i++){
      const a=(Math.random())*Math.PI*2, el=(Math.random()-.5)*Math.PI;
      const sp=.7+Math.random()*3.2;
      vel.current[i*3]  =Math.cos(el)*Math.cos(a)*sp;
      vel.current[i*3+1]=Math.sin(el)*sp+.6;
      vel.current[i*3+2]=Math.cos(el)*Math.sin(a)*sp;
      pos[i*3]=position[0]; pos[i*3+1]=position[1]; pos[i*3+2]=position[2];
      life.current[i]=1.0;
    }
    if(ref.current)(ref.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate=true;
  },[active,position,pos]);

  useFrame((_,dt)=>{
    const pts=ref.current; if(!pts) return;
    if(!active){pts.visible=false;return;}
    pts.visible=true;
    const pa=pts.geometry.attributes.position as THREE.BufferAttribute;
    let mx=0;
    for(let i=0;i<N;i++){
      if(life.current[i]<=0) continue;
      life.current[i]-=dt*1.1;
      mx=Math.max(mx,life.current[i]);
      vel.current[i*3+1]-=dt*4.2;
      pos[i*3]  +=vel.current[i*3]  *dt;
      pos[i*3+1]+=vel.current[i*3+1]*dt;
      pos[i*3+2]+=vel.current[i*3+2]*dt;
      pa.setXYZ(i,pos[i*3],pos[i*3+1],pos[i*3+2]);
    }
    pa.needsUpdate=true;
    (pts.material as THREE.PointsMaterial).opacity=mx*.92;
  });

  return (
    <points ref={ref} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos,3]}/>
      </bufferGeometry>
      <pointsMaterial size={0.18} color={color} transparent opacity={1}
        sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending}/>
    </points>
  );
}
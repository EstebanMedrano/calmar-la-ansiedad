import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LAKE_Y, LAKE_Z_CENTER, LAKE_WIDTH, LAKE_HEIGHT } from './Lake';

const THROTTLE_MS = 60; // Aún más responsivo

function orientSegment(mesh: THREE.Mesh, start: THREE.Vector3, end: THREE.Vector3) {
  const dir = new THREE.Vector3().subVectors(end, start);
  const len = Math.max(dir.length(), 0.001);
  mesh.position.copy(start).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.scale.y = len;
}

interface LaserPointerProps {
  visible:       boolean;
  firing:        boolean;
  laserColorRef: React.MutableRefObject<THREE.Color>;
  onHit:         (wx: number, wz: number) => void;
}

export default function LaserPointer({ visible, firing, laserColorRef, onHit }: LaserPointerProps) {
  const { camera, scene } = useThree();

  const gunGroupRef  = useRef<THREE.Group>(null);
  const gunBodyRef   = useRef<THREE.Mesh>(null);
  const gunTipRef    = useRef<THREE.Mesh>(null);
  const beamRef      = useRef<THREE.Mesh>(null);
  const hitGlowRef   = useRef<THREE.Mesh>(null);
  const hitLightRef  = useRef<THREE.PointLight>(null);

  const hitPoint     = useRef(new THREE.Vector3(0, LAKE_Y, LAKE_Z_CENTER));
  const muzzleWorld  = useRef(new THREE.Vector3());
  const lastFire     = useRef(0);
  const lakePlane    = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -LAKE_Y));
  const rc           = useRef(new THREE.Raycaster());
  const tmpV         = useRef(new THREE.Vector3());

  useEffect(() => {
    const g = gunGroupRef.current;
    if (!g) return;
    scene.add(camera);
    camera.add(g);
    return () => { camera.remove(g); };
  }, [camera, scene]);

  useFrame((state) => {
    const gun     = gunGroupRef.current;
    const beam    = beamRef.current;
    const hitGlow = hitGlowRef.current;
    const hitLight = hitLightRef.current;
    if (!gun || !beam || !hitGlow) return;

    const col = laserColorRef.current;

    if (gunBodyRef.current) {
      (gunBodyRef.current.material as THREE.MeshStandardMaterial).emissive.copy(col);
    }
    if (gunTipRef.current) {
      (gunTipRef.current.material as THREE.MeshStandardMaterial).emissive.copy(col);
    }
    (beam.material as THREE.MeshBasicMaterial).color.copy(col);
    (hitGlow.material as THREE.MeshBasicMaterial).color.copy(col);
    if (hitLight) hitLight.color.copy(col);

    gun.visible = visible;

    if (!visible) { beam.visible = false; hitGlow.visible = false; if (hitLight) hitLight.visible = false; return; }

    rc.current.setFromCamera(state.pointer, camera);
    const hit = tmpV.current;
    const hitOk = rc.current.ray.intersectPlane(lakePlane.current, hit);

    const withinLake = hitOk &&
      hit.x > -LAKE_WIDTH/2 && hit.x < LAKE_WIDTH/2 &&
      hit.z > LAKE_Z_CENTER - LAKE_HEIGHT/2 && hit.z < LAKE_Z_CENTER + LAKE_HEIGHT/2;

    beam.visible     = !!firing;
    hitGlow.visible  = !!(firing && withinLake);
    if (hitLight) hitLight.visible = !!(firing && withinLake);

    if (firing && withinLake) {
      hitPoint.current.copy(hit);

      muzzleWorld.current.set(0.26, -0.14, -0.38);
      camera.localToWorld(muzzleWorld.current);
      const endPt = hitPoint.current.clone();
      endPt.y = LAKE_Y + 0.1;
      orientSegment(beam, muzzleWorld.current, endPt);

      // Resplandor de impacto más grande
      hitGlow.position.set(endPt.x, LAKE_Y + 0.15, endPt.z);
      hitGlow.scale.setScalar(1.0 + Math.sin(state.clock.elapsedTime * 30) * 0.1); // Lateo suave
      
      if (hitLight) hitLight.position.set(endPt.x, LAKE_Y + 0.8, endPt.z);

      const now = Date.now();
      if (now - lastFire.current > THROTTLE_MS) {
        lastFire.current = now;
        onHit(endPt.x, endPt.z);
      }
    }
  });

  return (
    <>
      <group ref={gunGroupRef} position={[0.27, -0.19, -0.40]} visible={false}>
        <mesh ref={gunBodyRef} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.028, 0.24, 10]} />
          <meshStandardMaterial color="#0f0f20" metalness={0.85} roughness={0.18}
            emissive="#000000" emissiveIntensity={0.35} />
        </mesh>
        <mesh ref={gunTipRef} position={[0, 0, -0.13]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.022, 0.06, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#00ff80" emissiveIntensity={1.3} />
        </mesh>
        <mesh position={[0, -0.06, 0.04]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.055, 0.11, 0.06]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.5} />
        </mesh>
      </group>

      <mesh ref={beamRef} visible={false}>
        <cylinderGeometry args={[0.010, 0.008, 1, 5]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Esfera de resplandor de impacto */}
      <mesh ref={hitGlowRef} visible={false}>
        <sphereGeometry args={[0.55, 10, 10]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.70}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight ref={hitLightRef} intensity={0} distance={5} decay={2} visible={false} />
    </>
  );
}
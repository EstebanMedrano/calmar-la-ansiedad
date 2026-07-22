import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface CamPose {
  position: [number, number, number];
  lookAt: [number, number, number];
  /** fov base de esta pose. Si se omite se usa el baseFov del rig. */
  fov?: number;
}

export interface ResponsiveRigProps {
  /** Pose objetivo. Cambiarla hace que la cámara viaje suavemente hasta ella. */
  pose: CamPose;
  /** fov de referencia cuando la pose no trae uno propio. */
  baseFov?: number;
  /** Suavizado del movimiento. Más bajo = más lento y cinematográfico. */
  lerp?: number;
  /**
   * Cuánto se ensancha el fov en pantallas verticales.
   * Un móvil 9:19.5 tiene aspect ≈ 0.46, así que pf ≈ 0.54 y el fov sube
   * fovGain * 0.54 grados. Sin esto la escena se recorta por los lados.
   */
  fovGain?: number;
  /** Cuánto retrocede la cámara en pantallas verticales, en unidades de mundo. */
  dolly?: number;
  /** Parallax sutil siguiendo el puntero/dedo. null lo desactiva. */
  parallax?: { yaw: number; pitch: number } | null;
}

/**
 * Rig de cámara que se adapta solo a la forma de la pantalla.
 *
 * El problema que resuelve: una pose de cámara pensada en un monitor 16:9
 * recorta por los lados en un móvil vertical, porque una cámara perspectiva
 * mantiene el fov *vertical* y estrecha el horizontal al reducirse el aspect.
 * La corrección es doble: ensanchar el fov y retroceder un poco.
 *
 * `pf` (portrait factor) va de 0 (apaisado) a 0.85 (muy vertical).
 * Este patrón estaba copiado a mano en WaterCalm/CliffScene y en RitualFire.
 */
export default function ResponsiveRig({
  pose,
  baseFov = 55,
  lerp = 0.045,
  fovGain = 26,
  dolly = 2.1,
  parallax = { yaw: 8, pitch: 5 },
}: ResponsiveRigProps) {
  const { camera } = useThree();
  const curPos = useRef(new THREE.Vector3(...pose.position));
  const curLookAt = useRef(new THREE.Vector3(...pose.lookAt));
  const yaw = useRef(0);
  const pitch = useRef(0);

  // Vectores reutilizados: asignarlos en useFrame crearía basura 60 veces por
  // segundo y el recolector acabaría provocando tirones en móvil.
  const base = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const dir = useRef(new THREE.Vector3());
  const adj = useRef(new THREE.Vector3());

  useFrame((state) => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = state.size.width / state.size.height;
    const pf = THREE.MathUtils.clamp(1 - aspect, 0, 0.85);

    base.current.set(...pose.position);
    look.current.set(...pose.lookAt);

    // Retrocede alejándose del punto de mira, no en el eje Z global:
    // así funciona sea cual sea la orientación de la pose.
    dir.current.copy(base.current).sub(look.current).normalize();
    adj.current.copy(base.current).addScaledVector(dir.current, pf * dolly);

    curPos.current.lerp(adj.current, lerp);
    curLookAt.current.lerp(look.current, lerp);
    camera.position.copy(curPos.current);

    const targetFov = (pose.fov ?? baseFov) + pf * fovGain;
    if (Math.abs(cam.fov - targetFov) > 0.01) {
      cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov, lerp);
      cam.updateProjectionMatrix();
    }

    if (parallax) {
      yaw.current = THREE.MathUtils.lerp(
        yaw.current,
        -state.pointer.x * THREE.MathUtils.degToRad(parallax.yaw),
        0.04,
      );
      pitch.current = THREE.MathUtils.lerp(
        pitch.current,
        state.pointer.y * THREE.MathUtils.degToRad(parallax.pitch),
        0.04,
      );
    }

    camera.lookAt(curLookAt.current);
    if (parallax) {
      camera.rotateY(yaw.current);
      camera.rotateX(pitch.current);
    }
  });

  return null;
}

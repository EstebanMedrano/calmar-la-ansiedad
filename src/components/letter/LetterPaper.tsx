import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Group, Mesh, PointLight } from 'three';
import { easeInOutCubic, easeOutCubic } from './letterPaths';

export type LetterState = 'hidden' | 'flying' | 'landing' | 'unfolding' | 'open';

export interface LetterPaperProps {
  state: LetterState;
  /** Recorrido que sigue durante 'flying'. */
  flightPath?: THREE.CatmullRomCurve3;
  /** Duración del vuelo en segundos. */
  flightDuration?: number;
  /** Duración del desdoblado en segundos. */
  unfoldDuration?: number;
  /**
   * Si es true, al aterrizar la carta se engancha a la cámara y se queda
   * delante de quien mira, como si la tuviera en las manos.
   */
  attachToCamera?: boolean;
  /** Distancia a la cámara cuando attachToCamera está activo. */
  holdDistance?: number;
  /** Escala general de la carta. */
  scale?: number;
  onFlightComplete?: () => void;
  onOpened?: () => void;
}

const PAPER_COLOR = '#f4ead6';
const PAPER_W = 0.46;
const PAPER_H = 0.62;

/**
 * La carta en 3D: vuela, aterriza, se le salta el lacre y se desdobla sola.
 *
 * El texto NO va aquí, va en LetterText (DOM). Un texto largo en una malla 3D
 * hay que partirlo en líneas a mano y se vuelve ilegible en una pantalla de
 * 360px; en DOM se ajusta solo, se puede hacer scroll y se lee bien.
 *
 * Este componente lo comparten la escena Carta y el regalo de cumpleaños.
 */
export default function LetterPaper({
  state,
  flightPath,
  flightDuration = 3.2,
  unfoldDuration = 1.1,
  attachToCamera = false,
  holdDistance = 0.85,
  scale = 1,
  onFlightComplete,
  onOpened,
}: LetterPaperProps) {
  const { camera } = useThree();
  const groupRef = useRef<Group>(null);
  const leftFoldRef = useRef<Mesh>(null);
  const rightFoldRef = useRef<Mesh>(null);
  const sealRef = useRef<Mesh>(null);
  const lightRef = useRef<PointLight>(null);

  const flightT = useRef(0);
  const unfoldT = useRef(0);
  const flightDone = useRef(false);
  const openDone = useRef(false);

  // Vectores reutilizados para no generar basura en cada frame
  const tmpPos = useRef(new THREE.Vector3());
  const tmpTangent = useRef(new THREE.Vector3());
  const camTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    if (state === 'hidden') {
      flightT.current = 0;
      unfoldT.current = 0;
      flightDone.current = false;
      openDone.current = false;
    }
  }, [state]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;

    g.visible = state !== 'hidden';
    if (state === 'hidden') return;

    // ── Vuelo ────────────────────────────────────────────────────────────
    if (state === 'flying' && flightPath) {
      flightT.current = Math.min(1, flightT.current + delta / flightDuration);
      const t = easeInOutCubic(flightT.current);

      flightPath.getPointAt(t, tmpPos.current);
      g.position.copy(tmpPos.current);

      // Orienta la carta según hacia dónde va, con un balanceo suave
      flightPath.getTangentAt(t, tmpTangent.current);
      g.lookAt(tmpPos.current.clone().add(tmpTangent.current));
      g.rotateZ(Math.sin(flightT.current * Math.PI * 3) * 0.28);

      // Crece al acercarse: refuerza la sensación de distancia
      const s = scale * (0.35 + 0.65 * t);
      g.scale.setScalar(s);

      if (lightRef.current) {
        lightRef.current.intensity = 0.6 + t * 2.4;
      }

      if (flightT.current >= 1 && !flightDone.current) {
        flightDone.current = true;
        onFlightComplete?.();
      }
      return;
    }

    // ── Reposo delante de la cámara ─────────────────────────────────────
    if (attachToCamera) {
      // Punto fijo delante de la cámara, recalculado cada frame para que
      // acompañe el parallax sin quedarse atrás.
      camTarget.current
        .set(0, 0, -holdDistance)
        .applyQuaternion(camera.quaternion)
        .add(camera.position);
      g.position.lerp(camTarget.current, 0.08);
      g.quaternion.slerp(camera.quaternion, 0.08);
    }
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, scale, 0.1));

    // Flotación muy leve para que no parezca congelada
    g.position.y += Math.sin(performance.now() / 1400) * 0.0006;

    // ── Desdoblado ───────────────────────────────────────────────────────
    if (state === 'unfolding' || state === 'open') {
      unfoldT.current = Math.min(1, unfoldT.current + delta / unfoldDuration);
      const t = easeOutCubic(unfoldT.current);

      // El lacre salta primero, en el primer 25% de la animación
      if (sealRef.current) {
        const sealT = Math.min(1, t / 0.25);
        sealRef.current.visible = sealT < 1;
        sealRef.current.position.z = 0.012 + sealT * 0.25;
        sealRef.current.position.y = sealT * 0.18 - sealT * sealT * 0.3;
        sealRef.current.rotation.z += delta * 6;
      }

      // Las dos solapas se abren después
      const foldT = Math.max(0, (t - 0.2) / 0.8);
      const angle = foldT * Math.PI * 0.98;
      if (leftFoldRef.current) leftFoldRef.current.rotation.y = -angle;
      if (rightFoldRef.current) rightFoldRef.current.rotation.y = angle;

      if (lightRef.current) {
        lightRef.current.intensity = 1.6 + foldT * 1.4 + Math.sin(performance.now() / 300) * 0.15;
      }

      if (unfoldT.current >= 1 && !openDone.current) {
        openDone.current = true;
        onOpened?.();
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Hoja central */}
      <mesh>
        <planeGeometry args={[PAPER_W, PAPER_H]} />
        <meshStandardMaterial
          color={PAPER_COLOR}
          roughness={0.85}
          emissive="#ffe9b0"
          emissiveIntensity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Solapas. El giro tiene que ocurrir en el borde, no en el centro:
          por eso el mesh que rota va vacío en la bisagra y el plano cuelga
          de él desplazado media anchura hacia dentro. */}
      <mesh ref={leftFoldRef} position={[-PAPER_W / 2, 0, 0.001]}>
        <planeGeometry args={[0.001, 0.001]} />
        <meshBasicMaterial visible={false} />
        <mesh position={[PAPER_W / 2, 0, 0]}>
          <planeGeometry args={[PAPER_W, PAPER_H]} />
          <meshStandardMaterial
            color="#ede0c8"
            roughness={0.9}
            emissive="#ffe9b0"
            emissiveIntensity={0.18}
            side={THREE.DoubleSide}
          />
        </mesh>
      </mesh>
      <mesh ref={rightFoldRef} position={[PAPER_W / 2, 0, 0.001]}>
        <planeGeometry args={[0.001, 0.001]} />
        <meshBasicMaterial visible={false} />
        <mesh position={[-PAPER_W / 2, 0, 0]}>
          <planeGeometry args={[PAPER_W, PAPER_H]} />
          <meshStandardMaterial
            color="#ede0c8"
            roughness={0.9}
            emissive="#ffe9b0"
            emissiveIntensity={0.18}
            side={THREE.DoubleSide}
          />
        </mesh>
      </mesh>

      {/* Lacre. El cilindro nace con el eje en Y, así que hay que tumbarlo
          para que la cara circular mire hacia fuera de la carta. */}
      <mesh ref={sealRef} position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.012, 20]} />
        <meshStandardMaterial color="#b02a35" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Resplandor propio: es lo que la hace visible en la oscuridad */}
      <pointLight ref={lightRef} color="#ffe0a0" distance={4.5} decay={2} intensity={1.6} />
    </group>
  );
}

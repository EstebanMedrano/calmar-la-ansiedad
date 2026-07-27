import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Group, Mesh, PointLight } from 'three';
import { easeInOutCubic, easeOutCubic } from './letterPaths';

export type LetterState = 'hidden' | 'flying' | 'landing' | 'unfolding' | 'open';

/** Estela de cometa que arrastra la carta mientras vuela. */
export interface LetterTrail {
  color?: string;
  /** Número de segmentos. El primero es la cabeza, sobre la propia carta. */
  count?: number;
  /** Separación entre segmentos, en fracción del recorrido. */
  gap?: number;
  /** Radio del segmento de cabeza, en unidades de mundo a escala 1. */
  size?: number;
}

export interface LetterPaperProps {
  state: LetterState;
  /** Recorrido que sigue durante 'flying'. */
  flightPath?: THREE.CatmullRomCurve3;
  /** Duración del vuelo en segundos. */
  flightDuration?: number;
  /** Curva de avance del vuelo. Por defecto easeInOutCubic. */
  flightEase?: (t: number) => number;
  /** Vueltas completas que da sobre sí misma mientras se acerca. */
  flightSpin?: number;
  /** Escala al arrancar el vuelo, en fracción de `scale`. */
  flightScaleFrom?: number;
  /** Estela de cometa. null (por defecto) = sin estela. */
  trail?: LetterTrail | null;
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
  flightEase = easeInOutCubic,
  flightSpin = 0,
  flightScaleFrom = 0.35,
  trail = null,
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
  const trailRef = useRef<Group>(null);

  const trailCount = trail?.count ?? 20;
  const trailGap = trail?.gap ?? 0.006;
  const trailSize = trail?.size ?? 0.07;
  const trailColor = trail?.color ?? '#ffe3a8';

  const flightT = useRef(0);
  const unfoldT = useRef(0);
  const flightDone = useRef(false);
  const openDone = useRef(false);

  // Vectores reutilizados para no generar basura en cada frame
  const tmpPos = useRef(new THREE.Vector3());
  const tmpTangent = useRef(new THREE.Vector3());
  const tmpTrail = useRef(new THREE.Vector3());
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
    if (state === 'hidden') {
      if (trailRef.current) trailRef.current.visible = false;
      return;
    }

    // ── Vuelo ────────────────────────────────────────────────────────────
    if (state === 'flying' && flightPath) {
      flightT.current = Math.min(1, flightT.current + delta / flightDuration);
      const raw = flightT.current;
      const t = flightEase(raw);

      flightPath.getPointAt(t, tmpPos.current);
      g.position.copy(tmpPos.current);

      // Orienta la carta según hacia dónde va, con un balanceo suave
      flightPath.getTangentAt(t, tmpTangent.current);
      g.lookAt(tmpPos.current.clone().add(tmpTangent.current));

      // Giro sobre sí misma: es lo que la lee como un objeto girando en el aire
      // y no como una textura que crece.
      //
      // El ángulo se interpola con easeOutCubic, no linealmente: así el giro
      // es rápido al principio (cuando es un puntito lejano) y se va frenando
      // hasta pararse solo. Con una rampa lineal habría que cortarlo de golpe,
      // y con un factor de apagado el giro se deshacía marcha atrás.
      if (flightSpin > 0) {
        const spinT = Math.min(1, raw / 0.92);
        g.rotateZ(flightSpin * Math.PI * 2 * easeOutCubic(spinT));
      }
      g.rotateZ(Math.sin(raw * Math.PI * 3) * 0.22 * (1 - raw));

      // Crece al acercarse. La curva es cuadrática, no lineal: casi todo el
      // crecimiento ocurre al final, que es como se comporta de verdad algo
      // que se acerca.
      const grow = flightScaleFrom + (1 - flightScaleFrom) * raw * raw;
      const s = scale * grow;
      g.scale.setScalar(s);

      if (lightRef.current) {
        lightRef.current.intensity = 0.6 + t * 2.4;
      }

      // ── Estela ─────────────────────────────────────────────────────────
      const tail = trailRef.current;
      if (tail && trail) {
        tail.visible = true;
        const n = tail.children.length;
        for (let i = 0; i < n; i++) {
          const seg = tail.children[i] as Mesh;
          const mat = seg.material as THREE.MeshBasicMaterial;
          const segRaw = raw - i * trailGap;
          if (segRaw <= 0) {
            mat.opacity = 0;
            continue;
          }
          flightPath.getPointAt(flightEase(segRaw), tmpTrail.current);
          seg.position.copy(tmpTrail.current);

          const fade = 1 - i / n;
          mat.opacity = fade * fade * 0.9;
          // La cola engorda con la carta: si no, al llegar se ve un hilo fino
          // pegado a un sobre enorme.
          seg.scale.setScalar(trailSize * grow * (0.35 + fade * 0.65));
        }
      }

      if (flightT.current >= 1 && !flightDone.current) {
        flightDone.current = true;
        onFlightComplete?.();
      }
      return;
    }

    if (trailRef.current) trailRef.current.visible = false;

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
    <>
      {/* Estela de cometa. Va FUERA del grupo de la carta a propósito: sus
          segmentos se quedan atrás en el recorrido, así que necesitan
          coordenadas de mundo, no las de la carta que ya se movió.
          fog={false} porque el vuelo arranca más lejos que el alcance de la
          niebla y con niebla no se vería nada del principio. */}
      {trail && (
        <group ref={trailRef} visible={false}>
          {Array.from({ length: trailCount }, (_, i) => (
            <mesh key={i}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshBasicMaterial
                color={trailColor}
                transparent
                opacity={0}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
                fog={false}
              />
            </mesh>
          ))}
        </group>
      )}

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
          fog={false}
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
            fog={false}
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
            fog={false}
          />
        </mesh>
      </mesh>

      {/* Lacre. El cilindro nace con el eje en Y, así que hay que tumbarlo
          para que la cara circular mire hacia fuera de la carta. */}
      <mesh ref={sealRef} position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.012, 20]} />
        <meshStandardMaterial color="#b02a35" roughness={0.4} metalness={0.1} fog={false} />
      </mesh>

      {/* Resplandor propio: es lo que la hace visible en la oscuridad */}
      <pointLight ref={lightRef} color="#ffe0a0" distance={4.5} decay={2} intensity={1.6} />
      </group>
    </>
  );
}

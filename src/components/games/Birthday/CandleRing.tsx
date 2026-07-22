import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Group, Mesh, PointLight } from 'three';
import { CAKE_TOP_Y, CANDLE_RING_RADIUS } from './positions';
import { T } from './timings';

interface CandleRingProps {
  count: number;
  /** Segundos transcurridos desde que empezaron a salir las velas. */
  risingElapsed: number;
  /** true mientras están encendidas. */
  lit: boolean;
  /**
   * 0 a 1: fuerza con la que está soplando ahora mismo.
   * Las llamas se inclinan y encogen en proporción, para que se note que
   * el micrófono la está oyendo antes de que se apaguen del todo.
   */
  blowLevel: number;
  /** Segundos desde que empezó el apagado. */
  outElapsed: number;
}

const WAX_H = 0.16;
const FLAME_PLANES = 3;

/**
 * El círculo de velas.
 *
 * Todo se anima desde un único useFrame en el padre, no uno por vela: con 12
 * velas y 3 planos de llama cada una serían 36 bucles por frame haciendo el
 * mismo cálculo.
 *
 * Lo mismo con la iluminación: 12 pointLight dinámicas hunden el rendimiento
 * de un móvil de gama media, así que hay una sola luz central cuya intensidad
 * sube según cuántas velas están encendidas. El resto del brillo lo aporta el
 * Bloom y el material emisivo de las llamas.
 */
export default function CandleRing({
  count,
  risingElapsed,
  lit,
  blowLevel,
  outElapsed,
}: CandleRingProps) {
  const groupRefs = useRef<(Group | null)[]>([]);
  const flameRefs = useRef<(Group | null)[]>([]);
  const flameMeshRefs = useRef<(Mesh | null)[][]>([]);
  const lightRef = useRef<PointLight>(null);

  const candles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 - Math.PI / 2; // empieza arriba
        return {
          key: i,
          x: Math.cos(a) * CANDLE_RING_RADIUS,
          z: Math.sin(a) * CANDLE_RING_RADIUS,
          delay: (i * T.candleStagger) / 1000,
          seed: (i * 1.7) % (Math.PI * 2),
          // Colores ligeramente distintos para que no parezcan clonadas
          wax: i % 3 === 0 ? '#f9c5d5' : i % 3 === 1 ? '#fdf0e4' : '#c5e0f9',
        };
      }),
    [count],
  );

  useFrame((state, delta) => {
    const now = state.clock.elapsedTime;
    let litCount = 0;

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const g = groupRefs.current[i];
      const flame = flameRefs.current[i];
      if (!g) continue;

      // ── Salida de la vela ──────────────────────────────────────────────
      const localT = THREE.MathUtils.clamp(
        (risingElapsed - c.delay) / (T.candleRise / 1000),
        0,
        1,
      );
      // Arranca hundida dentro de la torta, que la tapa mientras sube
      g.position.set(c.x, CAKE_TOP_Y - 0.12 + localT * (WAX_H / 2 + 0.12), c.z);
      g.scale.setScalar(localT === 0 ? 0.0001 : 0.85 + localT * 0.15);
      g.visible = localT > 0;

      if (!flame) continue;

      // La llama prende justo cuando la vela termina de salir
      const flameOn = lit && localT >= 1;

      // ── Apagado ────────────────────────────────────────────────────────
      // Escalonado también, para que se apaguen en cascada y no de golpe
      const outT = flameOn
        ? 0
        : THREE.MathUtils.clamp((outElapsed - i * 0.07) / 0.3, 0, 1);

      const alive = flameOn ? 1 : 1 - outT;
      if (alive > 0.01) litCount++;

      // El soplido encoge la llama y la inclina antes de apagarla
      const shrink = 1 - blowLevel * 0.55;
      const flicker = 0.92 + Math.sin(now * 11 + c.seed) * 0.08;
      flame.visible = alive > 0.01;
      flame.scale.set(
        alive * shrink * flicker,
        alive * shrink * (1 + Math.sin(now * 7 + c.seed) * 0.06),
        alive * shrink * flicker,
      );
      // Se dobla hacia fuera del círculo, como empujada por el aire
      flame.rotation.z = -blowLevel * 0.85 * Math.sign(c.x || 1);
      flame.rotation.x = blowLevel * 0.4;

      const meshes = flameMeshRefs.current[i];
      if (meshes) {
        for (let p = 0; p < meshes.length; p++) {
          const m = meshes[p];
          if (!m) continue;
          // Cada plano gira un poco distinto: da volumen sin usar geometría
          m.rotation.y = (p / FLAME_PLANES) * Math.PI + now * 0.6 + c.seed;
        }
      }
    }

    // Una sola luz para todo el círculo
    if (lightRef.current) {
      const ratio = candles.length ? litCount / candles.length : 0;
      lightRef.current.intensity = THREE.MathUtils.lerp(
        lightRef.current.intensity,
        ratio * 1.5 * (1 - blowLevel * 0.4) + Math.sin(now * 9) * 0.06 * ratio,
        Math.min(1, delta * 8),
      );
    }
  });

  return (
    <group>
      {candles.map((c, i) => (
        <group key={c.key} ref={(el) => { groupRefs.current[i] = el; }}>
          {/* Cera */}
          <mesh>
            <cylinderGeometry args={[0.012, 0.014, WAX_H, 8]} />
            <meshStandardMaterial color={c.wax} roughness={0.55} />
          </mesh>
          {/* Mecha */}
          <mesh position={[0, WAX_H / 2 + 0.012, 0]}>
            <cylinderGeometry args={[0.0025, 0.0025, 0.024, 4]} />
            <meshStandardMaterial color="#2a2018" roughness={0.9} />
          </mesh>

          {/* Llama: planos cruzados aditivos. Es la forma más barata de
              simular fuego volumétrico sin un shader por vela. */}
          <group ref={(el) => { flameRefs.current[i] = el; }} position={[0, WAX_H / 2 + 0.06, 0]}>
            {Array.from({ length: FLAME_PLANES }, (_, p) => (
              <mesh
                key={p}
                ref={(el) => {
                  if (!flameMeshRefs.current[i]) flameMeshRefs.current[i] = [];
                  flameMeshRefs.current[i][p] = el;
                }}
              >
                <planeGeometry args={[0.045, 0.1]} />
                <meshBasicMaterial
                  color={p === 0 ? '#fff8d0' : '#ffb03a'}
                  transparent
                  opacity={p === 0 ? 0.95 : 0.55}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                  toneMapped={false}
                />
              </mesh>
            ))}
          </group>
        </group>
      ))}

      {/* Luz única del círculo (ver comentario de arriba) */}
      {/* La luz va bastante por encima del círculo, no pegada a él: si se
          deja a la altura de las mechas, quema la superficie de la torta y
          el mensaje escrito encima deja de leerse. */}
      <pointLight
        ref={lightRef}
        position={[0, CAKE_TOP_Y + 0.5, 0]}
        color="#ffb454"
        distance={7}
        decay={2}
        intensity={0}
      />
    </group>
  );
}

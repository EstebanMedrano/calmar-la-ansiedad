import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * El pradito nocturno de la escena Carta, convertido en pieza reutilizable.
 *
 * Nació dentro de Carta/CartaEnvironment y era el único escenario que se veía
 * bien en el móvil: suelo verde, pinitos y orbes de luz que sí iluminan el
 * suelo. El regalo y el grounding eran manchas negras, así que en vez de
 * duplicarlo tres veces se parametrizó aquí.
 */

export type OrbLayout =
  | { kind: 'none' }
  /** Corro de luces alrededor del centro, como en la escena Carta. */
  | { kind: 'ring'; radius?: number; count?: number }
  /** Dos hileras de luces que marcan un pasillo por el que llega alguien. */
  | { kind: 'corridor'; fromZ: number; toZ: number; halfWidth: number; count?: number };

export interface MeadowEnvironmentProps {
  isMobile: boolean;
  /** Radio del disco de césped. */
  radius?: number;
  /** Hasta dónde se esparcen los pinitos, medido desde el centro. */
  grassSpread?: number;
  /** Deja libre este radio en el centro (una mesa, una torta...). */
  clearRadius?: number;
  groundColor?: string;
  grassColors?: [string, string];
  orbs?: OrbLayout;
  orbColors?: string[];
  /** Silueta de montañas en el horizonte. */
  mountains?: boolean;
  mountainColor?: string;
  mountainCapColor?: string;
  /** A qué distancia del centro se levantan las montañas. */
  mountainDistance?: number;
  /** Luces cálida y fría de relleno. Desactívalas si la escena ya trae las suyas. */
  fillLights?: boolean;
  /**
   * Cuántos orbes llevan pointLight de verdad. Bájalo en escenas que ya tienen
   * muchas luces dinámicas propias (grounding llega a quince).
   */
  maxOrbLights?: number;
}

interface Orb {
  x: number;
  z: number;
  color: string;
  intensity: number;
  /** Solo unos pocos orbes llevan pointLight: el resto son emisivos y basta. */
  light: boolean;
}

/**
 * Cuántos orbes pueden llevar luz real por defecto.
 *
 * Cada pointLight se paga en cada fragmento; con los 24 del original la escena
 * del regalo (que ya trae velas) se arrastraba en el móvil. Los demás orbes se
 * ven igual gracias al bloom, porque son emisivos.
 */
function defaultLightBudget(isMobile: boolean): number {
  return isMobile ? 6 : 12;
}

function buildOrbs(
  layout: OrbLayout,
  colors: string[],
  isMobile: boolean,
  maxLights: number,
): Orb[] {
  if (layout.kind === 'none') return [];

  const pick = () => colors[Math.floor(Math.random() * colors.length)];
  const raw: { x: number; z: number }[] = [];

  if (layout.kind === 'ring') {
    const count = layout.count ?? (isMobile ? 14 : 24);
    const r = layout.radius ?? 1.2;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const rr = r * (0.85 + Math.random() * 0.35);
      raw.push({ x: Math.cos(a) * rr, z: Math.sin(a) * rr });
    }
  } else {
    // Pasillo: dos hileras paralelas que se estrechan un poco al acercarse,
    // porque en perspectiva unas paralelas exactas se leen como una valla.
    const perSide = layout.count ?? (isMobile ? 9 : 14);
    for (let i = 0; i < perSide; i++) {
      const t = i / (perSide - 1);
      const z = THREE.MathUtils.lerp(layout.fromZ, layout.toZ, t);
      const w = layout.halfWidth * (1 - t * 0.25);
      const jitter = (Math.random() - 0.5) * 0.28;
      raw.push({ x: -w + jitter, z });
      raw.push({ x: w - jitter, z });
    }
  }

  // Las luces reales se reparten a intervalos regulares para que el suelo
  // quede iluminado de forma pareja en vez de a manchones.
  const budget = Math.min(maxLights, raw.length);
  const step = budget > 0 ? raw.length / budget : Infinity;

  return raw.map((p, i) => ({
    ...p,
    color: pick(),
    intensity: 0.8 + Math.random() * 0.4,
    light: budget > 0 && Math.floor(i / step) !== Math.floor((i - 1) / step),
  }));
}

export default function MeadowEnvironment({
  isMobile,
  radius = 16,
  grassSpread,
  clearRadius = 0.5,
  groundColor = '#1a4d2e',
  grassColors = ['#2d7a4a', '#3a8f5e'],
  orbs = { kind: 'ring' },
  orbColors = ['#ffd700', '#ffed4e', '#fff44f'],
  mountains = false,
  mountainColor = '#1d2b45',
  mountainCapColor = '#3c4d6f',
  mountainDistance = 42,
  fillLights = true,
  maxOrbLights,
}: MeadowEnvironmentProps) {
  const spread = grassSpread ?? radius * 0.55;
  const lightBudget = maxOrbLights ?? defaultLightBudget(isMobile);

  const grassTufts = useMemo(() => {
    const tufts = [];
    for (let i = 0; i < (isMobile ? 46 : 90); i++) {
      const angle = Math.random() * Math.PI * 2;
      const t = Math.random();
      // Raíz cuadrada: sin ella todos los pinitos se apelotonan en el centro.
      const r = clearRadius + Math.sqrt(t) * (spread - clearRadius);
      tufts.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        scale: 0.6 + Math.random() * 0.9,
        rot: Math.random() * Math.PI * 2,
      });
    }
    return tufts;
  }, [isMobile, clearRadius, spread]);

  // orbs y orbColors llegan como literales nuevos en cada render, así que la
  // identidad del objeto no sirve como dependencia: lo que importa es su
  // contenido. Se resume en una clave de texto.
  const orbKey = JSON.stringify(orbs);
  const colorKey = orbColors.join();
  const orbList = useMemo(
    () => buildOrbs(orbs, orbColors, isMobile, lightBudget),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orbKey, colorKey, isMobile, lightBudget],
  );

  const peaks = useMemo(() => {
    if (!mountains) return [];
    // Muchas más de las que se ven a la vez: el encuadre solo abarca una franja
    // estrecha del anillo, y con pocas salía UNA montaña suelta en medio del
    // cielo. Con esta densidad las siluetas se solapan y forman una cordillera.
    // Las que quedan fuera del encuadre las descarta el frustum culling.
    const n = isMobile ? 26 : 40;
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + ((i * 41) % 13) / 90;
      const r = mountainDistance + ((i * 37) % 11);
      return {
        key: i,
        x: Math.cos(a) * r,
        z: Math.sin(a) * r,
        // Altas y LEJOS. Es la combinación que las hace leer como cordillera:
        // cerca, una sola montaña llena media pantalla y parece un cono; a
        // setenta unidades entran varias en el encuadre y asoman por encima de
        // la arboleda sin comérselo todo.
        h: 12 + ((i * 23) % 14) * 1.15,
        w: 9 + ((i * 17) % 8) * 1.1,
      };
    });
  }, [mountains, isMobile, mountainDistance]);

  return (
    <group>
      {/* Suelo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial color={groundColor} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>

      {/* Pinitos: dos conos desalineados por mata, que es lo que les da volumen */}
      {grassTufts.map((tuft, i) => (
        <group
          key={i}
          position={[tuft.x, 0.05, tuft.z]}
          rotation={[0, tuft.rot, 0]}
          scale={tuft.scale}
        >
          <mesh position={[0, 0.15, 0]}>
            <coneGeometry args={[0.08, 0.3, 6]} />
            <meshStandardMaterial color={grassColors[0]} roughness={1} />
          </mesh>
          <mesh position={[0.05, 0.12, 0.02]}>
            <coneGeometry args={[0.06, 0.25, 5]} />
            <meshStandardMaterial color={grassColors[1]} roughness={1} />
          </mesh>
        </group>
      ))}

      {/* Orbes de luz */}
      {orbList.map((orb, i) => (
        <group key={`orb-${i}`} position={[orb.x, 0.15, orb.z]}>
          <mesh>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial
              color={orb.color}
              emissive={orb.color}
              emissiveIntensity={orb.intensity}
              toneMapped={false}
            />
          </mesh>
          {orb.light && (
            <pointLight color={orb.color} intensity={1.6 * orb.intensity} distance={4} decay={2} />
          )}
        </group>
      ))}

      {/* Montañas del horizonte.
          fog={false} a propósito: quedan más allá del alcance de la niebla de
          cualquiera de estas escenas, y con niebla se las traga enteras. */}
      {peaks.map((p) => (
        <group key={`peak-${p.key}`} position={[p.x, 0, p.z]}>
          <mesh position={[0, p.h / 2, 0]}>
            <coneGeometry args={[p.w, p.h, 5]} />
            <meshStandardMaterial color={mountainColor} roughness={1} flatShading fog={false} />
          </mesh>
          {/* Cumbre clara: sin ella la silueta se confunde con el cielo */}
          <mesh position={[0, p.h * 0.82, 0]}>
            <coneGeometry args={[p.w * 0.28, p.h * 0.26, 5]} />
            <meshStandardMaterial color={mountainCapColor} roughness={1} flatShading fog={false} />
          </mesh>
        </group>
      ))}

      {fillLights && (
        <>
          <pointLight position={[2, 4, 2]} intensity={0.8} color="#e0b050" distance={20} decay={2} />
          <pointLight position={[-2, 4, -2]} intensity={0.6} color="#a8d8ff" distance={20} decay={2} />
        </>
      )}
    </group>
  );
}

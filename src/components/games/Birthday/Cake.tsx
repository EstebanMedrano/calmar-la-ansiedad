import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { CAKE_TOP_Y } from './positions';

interface CakeProps {
  isMobile: boolean;
  /** 0 = luces encendidas, 1 = todo oscuro. Atenúa el brillo del glaseado. */
  dimFactor?: number;
}

const TIER1_H = 0.22;
const TIER2_H = 0.18;
const TIER1_R = 0.56;
const TIER2_R = 0.43;

/**
 * La torta, hecha con primitivas.
 *
 * Es procedural en vez de un modelo .glb por dos razones: no hay que modelar
 * ni exportar nada, y el texto de encima puede cambiarse escribiendo una
 * cadena en lugar de rehacer una textura.
 */
export default function Cake({ isMobile, dimFactor = 0 }: CakeProps) {
  // Chorreados de glaseado repartidos por el borde
  const drips = useMemo(() => {
    const n = 12;
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return {
        key: i,
        x: Math.cos(a) * TIER1_R,
        z: Math.sin(a) * TIER1_R,
        // Alturas irregulares para que no parezca un patrón
        len: 0.06 + ((i * 37) % 11) / 100,
      };
    });
  }, []);

  // Muy bajo a propósito: el glaseado no debe brillar por sí mismo, solo
  // recibir la luz de las velas. Si emite, el texto de encima se lava.
  const glazeEmissive = 0.04 + dimFactor * 0.1;

  return (
    <group>
      {/* Piso inferior */}
      <mesh position={[0, TIER1_H / 2, 0]} castShadow>
        <cylinderGeometry args={[TIER1_R, TIER1_R + 0.02, TIER1_H, 48]} />
        <meshStandardMaterial color="#4a3728" roughness={0.85} />
      </mesh>

      {/* Borde de cobertura de chocolate del piso inferior */}
      <mesh position={[0, TIER1_H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[TIER1_R, 0.035, 10, 48]} />
        <meshStandardMaterial
          color="#5d4a38"
          roughness={0.7}
          emissive="#2a1f14"
          emissiveIntensity={glazeEmissive * 0.5}
        />
      </mesh>

      {/* Chorreados de chocolate */}
      {drips.map((d) => (
        <mesh key={d.key} position={[d.x, TIER1_H - d.len / 2, d.z]}>
          <capsuleGeometry args={[0.028, d.len, 4, 8]} />
          <meshStandardMaterial color="#5d4a38" roughness={0.7} />
        </mesh>
      ))}

      {/* Piso superior */}
      <mesh position={[0, TIER1_H + TIER2_H / 2, 0]} castShadow>
        <cylinderGeometry args={[TIER2_R, TIER2_R + 0.02, TIER2_H, 48]} />
        <meshStandardMaterial color="#3d2e22" roughness={0.85} />
      </mesh>

      <mesh position={[0, TIER1_H + TIER2_H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[TIER2_R, 0.03, 10, 48]} />
        <meshStandardMaterial
          color="#4a3728"
          roughness={0.7}
          emissive="#1a120d"
          emissiveIntensity={glazeEmissive * 0.5}
        />
      </mesh>

      {/* Superficie donde van el texto y las velas */}
      <mesh position={[0, CAKE_TOP_Y - 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[TIER2_R - 0.01, 48]} />
        <meshStandardMaterial color="#e8d5c4" roughness={0.8} />
      </mesh>

      {/*
        La dedicatoria, en el frente del piso inferior y no tumbada encima.

        Estaba plana sobre la superficie de la torta, y desde donde mira la
        cámara esa cara se ve casi de canto: el texto quedaba aplastado a unos
        diez píxeles de alto, en marrón oscuro sobre penumbra y medio tapado por
        las velas. Era ilegible. Aquí da de frente a la cámara, así que se lee
        entera, y encima es donde va la dedicatoria en una torta de verdad.

        SIN prop `font`: antes apuntaba a /fonts/georgia.ttf, que no existe en
        el repositorio. El servidor devolvía el index.html, troika no conseguía
        parsearlo y al fallar nunca resolvía su promesa de carga. Como <Text>
        suspende esperándola, el <Suspense> de toda la escena del regalo no se
        resolvía jamás: el canvas se quedaba en negro y solo se oían los
        ladridos. Con la fuente por defecto de drei se ve y la escena se monta.
      */}
      <Text
        // Delante de los chorreados de chocolate, no a su misma altura: están
        // en el mismo radio (TIER1_R) con grosor 0.028, y el que cae justo al
        // frente cortaba una letra por la mitad.
        position={[0, TIER1_H / 2 + 0.005, TIER1_R + 0.058]}
        fontSize={isMobile ? 0.058 : 0.052}
        maxWidth={0.62}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        lineHeight={1.25}
        color="#fff3d6"
        // Contorno oscuro: el chocolate de detrás y el texto tienen luminancias
        // parecidas cuando la escena se atenúa para soplar las velas.
        outlineWidth={0.006}
        outlineColor="#2a1810"
      >
        {'Feliz cumpleaños\nmi querida Lu'}
      </Text>

      {/* Plato dorado */}
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <cylinderGeometry args={[TIER1_R + 0.16, TIER1_R + 0.16, 0.02, 48]} />
        <meshStandardMaterial color="#d4af37" roughness={0.25} metalness={0.6} />
      </mesh>
    </group>
  );
}

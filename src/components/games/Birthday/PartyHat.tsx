interface PartyHatProps {
  scale?: number;
  color?: string;
  stripeColor?: string;
}

/** Gorrito de fiesta: cono, dos franjas y un pompón. */
export default function PartyHat({
  scale = 1,
  color = '#e879f9',
  stripeColor = '#fbbf24',
}: PartyHatProps) {
  return (
    <group scale={scale}>
      <mesh>
        <coneGeometry args={[0.09, 0.22, 16, 1, true]} />
        <meshStandardMaterial color={color} roughness={0.6} side={2} />
      </mesh>

      {/* Franjas: dos aros finos, más barato que generar una textura */}
      <mesh position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.062, 0.009, 6, 20]} />
        <meshStandardMaterial color={stripeColor} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.072, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.081, 0.009, 6, 20]} />
        <meshStandardMaterial color={stripeColor} roughness={0.5} />
      </mesh>

      {/* Pompón */}
      <mesh position={[0, 0.118, 0]}>
        <sphereGeometry args={[0.028, 10, 8]} />
        <meshStandardMaterial
          color="#fff3e6"
          roughness={0.85}
          emissive="#ffd9a0"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

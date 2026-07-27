import MeadowEnvironment from '../../three/MeadowEnvironment';

interface CartaEnvironmentProps {
  isMobile: boolean;
}

/**
 * El pradito de la escena Carta.
 *
 * El escenario en sí vive ahora en MeadowEnvironment, porque el regalo y el
 * grounding usan el mismo. Aquí solo quedan los ajustes propios de esta
 * escena: el corro de luces alrededor del punto donde aterriza la carta.
 */
export default function CartaEnvironment({ isMobile }: CartaEnvironmentProps) {
  return (
    <MeadowEnvironment
      isMobile={isMobile}
      radius={16}
      grassSpread={8.5}
      orbs={{ kind: 'ring', radius: 1.1 }}
    />
  );
}

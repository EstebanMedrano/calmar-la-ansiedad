import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import CustomStars from '../../three/CustomStars';
import ResponsiveRig from '../../three/ResponsiveRig';
import LetterPaper from '../../letter/LetterPaper';
import type { LetterState } from '../../letter/LetterPaper';
import CourierDog from './CourierDog';
import CartaEnvironment from './CartaEnvironment';
import CartaMagicParticles from './CartaMagicParticles';
import { makeHypnoticPath, makeGroundShadowPath, easeInOutSine } from '../../letter/letterPaths';
import type { CartaStage } from './stages';
import { T } from './stages';

interface CartaSceneProps {
  stage: CartaStage;
  isMobile: boolean;
  onLetterArrived: () => void;
  onLetterOpened: () => void;
}

const CAMERA_POSE = {
  position: [0, 1.2, 3.4] as [number, number, number],
  lookAt: [0, 1.15, 0] as [number, number, number],
  fov: 52,
};

/**
 * De dónde viene la carta y dónde acaba.
 *
 * El origen está MUCHO más lejos que antes (era -14 en z): a cincuenta
 * unidades la carta se ve como un punto de luz de tres píxeles, y todo el
 * crecimiento posterior es lo que da la sensación de que se acerca. Con el
 * origen antiguo ya entraba grande y solo se veía cruzar.
 */
const ORIGIN = new THREE.Vector3(-7, 11, -47);
const DESTINATION = new THREE.Vector3(0, 1.15, 1.9);

/**
 * Amplitud del lazo. Muy por debajo del 0.22 por defecto: el recorrido mide
 * cincuenta unidades y con la amplitud normal la carta se iría once unidades
 * a un lado, fuera del encuadre de un móvil vertical.
 */
const PATH_AMP = 0.06;

/** Dónde se queda el perro al llegar: delante y a un lado, sin tapar la carta. */
const DOG_REST = new THREE.Vector3(-1.3, 0, 0.95);

function letterStateFor(stage: CartaStage): LetterState {
  switch (stage) {
    case 'idle':
      return 'hidden';
    case 'approach':
      return 'flying';
    case 'arrival':
      return 'landing';
    case 'unfolding':
      return 'unfolding';
    case 'reading':
    case 'done':
      return 'open';
  }
}

export default function CartaScene({
  stage,
  isMobile,
  onLetterArrived,
  onLetterOpened,
}: CartaSceneProps) {
  const path = useMemo(() => makeHypnoticPath(ORIGIN, DESTINATION, PATH_AMP), []);
  // El perro corre por la sombra en el suelo de esa misma curva.
  const groundPath = useMemo(() => makeGroundShadowPath(path, DOG_REST, 0.3), [path]);

  return (
    <>
      <color attach="background" args={['#14122e']} />
      {/* Niebla larga: el vuelo arranca a casi cincuenta unidades y con el
          alcance corto de antes (10→40) la carta salía ya dentro de la bruma. */}
      <fog attach="fog" args={['#14122e', 20, 85]} />

      <ambientLight intensity={0.5} color="#a9c4ff" />
      <hemisphereLight args={['#d4b6ff', '#191634', 0.7]} />
      {/* Luna suave que da relieve al conjunto */}
      <directionalLight position={[5, 8, 3]} color="#cdd8ff" intensity={0.55} />
      {/* Luz de acento que da volumen al perro cuando cruza */}
      <pointLight position={[-4, 5, -3]} color="#e879f9" intensity={2.2} distance={26} decay={2} />
      {/* Relleno cálido delante de la cámara: la carta y el perro llegan con vida */}
      <pointLight position={[0, 2, 3]} color="#ffd9a8" intensity={1.1} distance={12} decay={2} />

      <CustomStars count={isMobile ? 2500 : 6000} opacity={0.85} />

      <CartaEnvironment isMobile={isMobile} />

      <Suspense fallback={null}>
        <CourierDog
          path={groundPath}
          started={stage !== 'idle'}
          duration={T.flight}
          lag={T.dogLag}
          scale={isMobile ? 0.42 : 0.52}
        />
      </Suspense>

      <LetterPaper
        state={letterStateFor(stage)}
        flightPath={path}
        flightDuration={T.flight}
        // Curva muy suave: su velocidad punta es 1.57 veces la media, no el
        // doble. En diez segundos la diferencia se nota mucho.
        flightEase={easeInOutSine}
        flightSpin={T.spin}
        flightScaleFrom={0.5}
        trail={{ color: '#ffd9f5', count: isMobile ? 14 : 22, gap: 0.0055, size: 0.1 }}
        unfoldDuration={T.unfold}
        attachToCamera
        // Ver la nota en BirthdayScene: desdoblada ocupa el triple de ancho.
        holdDistance={isMobile ? 1.9 : 1.6}
        scale={isMobile ? 0.85 : 1}
        onFlightComplete={onLetterArrived}
        onOpened={onLetterOpened}
      />

      <CartaMagicParticles active={stage === 'reading' || stage === 'done'} />

      {/* Parallax reducido: con los 8° por defecto, en un móvil vertical el
          giro de cámara se comía el margen que le queda a la carta por los
          lados durante el vuelo. */}
      <ResponsiveRig
        pose={CAMERA_POSE}
        fovGain={26}
        dolly={1.9}
        lerp={0.05}
        parallax={{ yaw: 4, pitch: 3 }}
      />
    </>
  );
}

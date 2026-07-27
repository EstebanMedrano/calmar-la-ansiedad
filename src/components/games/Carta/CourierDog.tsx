import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Group } from 'three';
import useDogModel, { TITO_PATH, LIA_PATH } from '../../../hooks/useDogModel';
import { easeInOutSine } from '../../letter/letterPaths';

interface CourierDogProps {
  /** Recorrido POR EL SUELO. Se sigue tal cual: ya viene aplanado en y=0. */
  path: THREE.CatmullRomCurve3;
  /** true desde que arranca la escena; el perro se queda después de llegar. */
  started: boolean;
  /** Lo que tarda en recorrerlo, en segundos. */
  duration: number;
  /** Cuánto va por detrás de la carta, en fracción del recorrido. */
  lag?: number;
  scale?: number;
  /** Se llama la primera vez que el perro llega a su sitio. */
  onArrived?: () => void;
}

/**
 * Tito o Lia (a cara o cruz) persiguiendo la carta.
 *
 * Antes venía VOLANDO por la misma curva aérea que la carta y la soltaba a
 * mitad de camino, que es justo lo que se pidió quitar. Ahora corre por el
 * suelo siguiendo la sombra de esa curva, un poco por detrás, y al llegar se
 * queda ahí respirando mientras se lee la carta.
 */
export default function CourierDog({
  path,
  started,
  duration,
  lag = 0.075,
  scale = 0.5,
  onArrived,
}: CourierDogProps) {
  // Se elige una sola vez por montaje: useGLTF necesita una ruta estable, y
  // sortearlo en cada render volvería a suspender el componente sin parar.
  const [modelPath] = useState(() => (Math.random() < 0.5 ? TITO_PATH : LIA_PATH));

  const groupRef = useRef<Group>(null);
  const { scene, footOffset } = useDogModel(modelPath, groupRef);

  const t = useRef(0);
  const arrived = useRef(false);
  const tmpPos = useRef(new THREE.Vector3());
  const tmpTan = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;

    if (!started) {
      g.visible = false;
      t.current = 0;
      arrived.current = false;
      return;
    }

    g.visible = true;
    g.scale.setScalar(scale);

    // Tarda algo MÁS que la carta en hacer el mismo recorrido, así que en todo
    // momento va por detrás de ella: eso es lo que se lee como persecución.
    // Llega a su sitio poco después de que la carta se pare delante.
    const runFor = duration * (1 + lag);
    t.current = Math.min(1, t.current + delta / runFor);
    const eased = easeInOutSine(t.current);

    path.getPointAt(eased, tmpPos.current);
    g.position.set(tmpPos.current.x, 0, tmpPos.current.z);

    // Mira hacia donde corre. El recorrido es plano, así que la tangente ya
    // es horizontal y el perro no acaba apuntando al cielo.
    path.getTangentAt(eased, tmpTan.current);
    tmpTan.current.y = 0;
    if (tmpTan.current.lengthSq() > 1e-6) {
      lookTarget.current.copy(g.position).add(tmpTan.current);
      g.lookAt(lookTarget.current);
    }

    const running = t.current < 1;
    if (running) {
      // Trotecillo: rebote de las patas y balanceo del cuerpo
      const clock = state.clock.elapsedTime;
      g.position.y = Math.abs(Math.sin(clock * 9)) * 0.09;
      g.rotateZ(Math.sin(clock * 9) * 0.05);
    } else {
      // Ya llegó: solo respira
      g.position.y = Math.sin(state.clock.elapsedTime * 1.1) * 0.012;
      if (!arrived.current) {
        arrived.current = true;
        onArrived?.();
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <group position={[0, footOffset, 0]}>
        <primitive object={scene} />
      </group>
      {/* Halo que lo acompaña: sin él es una silueta negra sobre el pasto */}
      <pointLight color="#ffd9a8" distance={3.2} decay={2} intensity={1.1} position={[0, 0.6, 0]} />
    </group>
  );
}

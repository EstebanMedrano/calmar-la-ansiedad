import { memo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Howl } from 'howler';
import * as THREE from 'three';
import type { HurricaneStage } from './Hurricane';
import { assetUrl } from '../../../utils/assetUrl';

const barkHowl = new Howl({ src: [assetUrl('/assets/sounds/lia-bark.mp3')], volume: 0.55 });

interface ThoughtProps {
  id: number;
  text: string;
  initialAngle: number;
  radius: number;
  yBase: number;
  color: string;
  stage: HurricaneStage;
  tornadoCenter: THREE.Vector3; // 🛑 NUEVA PROPIEDAD
  onDestroy: (id: number, worldPos: THREE.Vector3) => void;
}

function Thought({
  id, text, initialAngle, radius, yBase, color, stage, tornadoCenter, onDestroy
}: ThoughtProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isDestroying, setIsDestroying] = useState(false);
  const [destroyed, setDestroyed] = useState(false);
  const worldPos = useRef(new THREE.Vector3());
  const currentScale = useRef(1);
  const yAscend = useRef(0);
  const flashRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group || destroyed) return;

    const t = state.clock.elapsedTime;
    const orbitSpeed = 0.28 + (id % 5) * 0.07;
    const angle = initialAngle + t * orbitSpeed;
    const yOsc = Math.sin(t * 0.75 + id) * 0.28;

    // Durante el ascenso y los fuegos artificiales, las frases suben de altura
    if (stage === 'tornado_ascend' || stage === 'fireworks') yAscend.current += delta * 7.5;

    // 🛑 POSICIÓN CORREGIDA: Se suma el centro del tornado a la órbita
    group.position.set(
      tornadoCenter.x + Math.cos(angle) * radius,
      tornadoCenter.y + yBase + yOsc + yAscend.current,
      tornadoCenter.z + Math.sin(angle) * radius
    );
    group.lookAt(state.camera.position);
    worldPos.current.copy(group.position);

    // Las frases orbitan pasando muy cerca de la cámara, así que al acercarse
    // ocupaban toda la pantalla y se salían por los lados (sobre todo en
    // vertical, donde hay menos ancho). Se compensa la distancia para que
    // conserven más o menos el mismo tamaño en pantalla siempre.
    const dist = group.position.distanceTo(state.camera.position);
    const fit = THREE.MathUtils.clamp(dist / 6.5, 0.42, 1.35);

    if (isDestroying) {
      currentScale.current = THREE.MathUtils.lerp(currentScale.current, 0, 0.12);
      group.scale.setScalar(Math.max(0, currentScale.current) * fit);
      // El fogonazo es una malla aditiva que se apaga, no una luz.
      if (flashRef.current) {
        const m = flashRef.current.material as THREE.MeshBasicMaterial;
        m.opacity = Math.max(0, m.opacity - delta * 1.6);
        flashRef.current.scale.setScalar(1 + (1 - currentScale.current) * 2.2);
      }
      if (currentScale.current < 0.02) setDestroyed(true);
    } else {
      group.scale.setScalar(fit);
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (isDestroying || stage !== 'tornado') return;
    setIsDestroying(true);
    barkHowl.play();
    onDestroy(id, worldPos.current.clone());
  };

  if (destroyed) return null;

  const displayColor = isDestroying ? '#ffffff' : color;

  return (
    <group ref={groupRef} onClick={handleClick}>
      {/* Large invisible hitbox */}
      <mesh>
        <planeGeometry args={[Math.max(1.2, text.length * 0.28), 0.85]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[Math.max(1.1, text.length * 0.26), 0.7]} />
        <meshBasicMaterial color={color} transparent opacity={isDestroying ? 0.55 : 0.10} />
      </mesh>

      <Text
        fontSize={0.30}
        color={displayColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#000000"
      >
        {text}
      </Text>

      {/* Fogonazo al reventar. Antes era una pointLight por pensamiento: con
          veinte frases en pantalla eran veinte luces dinámicas, y three.js
          recompila el shader de TODOS los materiales cada vez que cambia el
          número de luces. Por eso el juego se congelaba justo al explotar una.
          Una malla aditiva da el mismo destello y no toca los shaders. */}
      {isDestroying && (
        <mesh ref={flashRef} position={[0, 0, 0.02]}>
          <planeGeometry args={[2.2, 1.4]} />
          <meshBasicMaterial
            color={color} transparent opacity={0.9}
            blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}

/*
 * memo: sin esto, cualquier cambio de estado del padre (la lista de
 * explosiones, el perro activo, el objetivo) volvía a renderizar las veinte
 * frases, y cada render hace que troika recomponga la textura del texto.
 */
export default memo(Thought);

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useNavigate } from 'react-router-dom';
import { startAmbient } from '../../../audio/ambient';
import CartaScene from './CartaScene';
import LetterText from '../../letter/LetterText';
import { CARTA_MESSAGE, UI_TEXT } from '../../../content/messages';
import { useCanvasQuality } from '../../three/quality';
import useReducedMotion from '../../../hooks/useReducedMotion';
import type { CartaStage } from './stages';
import { T } from './stages';
import './Carta.scss';

export default function Carta() {
  const navigate = useNavigate();
  const quality  = useCanvasQuality();
  const isMobile = quality.isMobile;
  const reducedMotion = useReducedMotion();
  const [stage, setStage] = useState<CartaStage>('idle');

  // Todos los temporizadores en una ref para poder limpiarlos al salir:
  // si no, un setTimeout pendiente intenta actualizar un componente
  // desmontado cuando se pulsa "volver" a mitad de la animación.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const addT = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, reducedMotion ? ms * 0.4 : ms));
  }, [reducedMotion]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const start = useCallback(() => {
    if (stage !== 'idle') return;

    // Antes se creaba aquí un segundo Howl con la MISMA pista 432 Hz que ya
    // suena de fondo en toda la app → se oía doble y desfasada. Ahora solo nos
    // aseguramos de que la música compartida esté sonando (idempotente); el
    // toque de este botón sirve de gesto para desbloquear el audio en móvil.
    startAmbient();

    setStage('approach');
  }, [stage]);

  const handleLetterArrived = useCallback(() => {
    // La carta cerrada se queda un momento "en las manos" antes de que salte
    // el lacre. Da respiro y hace la escena menos atropellada.
    setStage('arrival');
    addT(() => setStage('unfolding'), T.arrival);
  }, [addT]);
  const handleLetterOpened = useCallback(() => setStage('reading'), []);
  const handleReadDone = useCallback(() => setStage('done'), []);

  const replay = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStage('idle');
    addT(() => setStage('approach'), 80);
  }, [addT]);

  const leave = useCallback(() => {
    // La música es la compartida de la app: sobrevive al cambio de pantalla,
    // así que aquí no se toca.
    navigate('/games');
  }, [navigate]);

  return createPortal(
    <div className="carta">
      <Canvas
        className="carta__canvas"
        dpr={quality.dpr}
        gl={quality.gl}
        performance={quality.performance}
        camera={{ position: [0, 1.2, 3.4], fov: 52, near: 0.1, far: 120 }}
      >
        <CartaScene
          stage={stage}
          isMobile={isMobile}
          onLetterArrived={handleLetterArrived}
          onLetterOpened={handleLetterOpened}
        />
        <EffectComposer>
          <Bloom intensity={0.55} luminanceThreshold={0.32} luminanceSmoothing={0.25} mipmapBlur />
        </EffectComposer>
      </Canvas>

      <button className="carta__back" onClick={leave}>← {UI_TEXT.backToGames}</button>

      {stage === 'idle' && (
        <button className="carta__start" onClick={start}>
          <span className="carta__start-seal" aria-hidden="true" />
          {UI_TEXT.cartaHint}
        </button>
      )}

      {(stage === 'reading' || stage === 'done') && (
        <LetterText
          text={CARTA_MESSAGE}
          enabled
          onDone={handleReadDone}
          accent="#e879f9"
        />
      )}

      {stage === 'done' && (
        <div className="carta__actions">
          <button className="carta__action" onClick={replay}>{UI_TEXT.readAgain}</button>
          <button className="carta__action carta__action--primary" onClick={leave}>
            {UI_TEXT.backToGames}
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}

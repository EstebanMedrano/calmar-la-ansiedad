import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useNavigate } from 'react-router-dom';
import { Howl } from 'howler';
import CartaScene from './CartaScene';
import LetterText from '../../letter/LetterText';
import { CARTA_MESSAGE, UI_TEXT } from '../../../content/messages';
import useIsMobile from '../../../hooks/useIsMobile';
import useReducedMotion from '../../../hooks/useReducedMotion';
import type { CartaStage } from './stages';
import './Carta.scss';

export default function Carta() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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

  // Música ambiente. Se crea tras el primer toque (start), nunca al montar:
  // los navegadores móviles bloquean el audio que no nace de un gesto.
  const ambientRef = useRef<Howl | null>(null);
  useEffect(() => () => {
    ambientRef.current?.stop();
    ambientRef.current?.unload();
  }, []);

  const start = useCallback(() => {
    if (stage !== 'idle') return;

    ambientRef.current = new Howl({
      src: ['/assets/sounds/ambient-432hz.mp3'],
      loop: true,
      volume: 0,
    });
    ambientRef.current.play();
    ambientRef.current.fade(0, 0.18, 2500);

    setStage('approach');
  }, [stage]);

  const handleDogRelease = useCallback(() => setStage('handoff'), []);
  const handleLetterArrived = useCallback(() => {
    addT(() => setStage('unfolding'), 250);
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
    ambientRef.current?.fade(ambientRef.current.volume(), 0, 400);
    navigate('/games');
  }, [navigate]);

  return createPortal(
    <div className="carta">
      <Canvas
        className="carta__canvas"
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        camera={{ position: [0, 1.2, 3.4], fov: 52, near: 0.1, far: 120 }}
      >
        <CartaScene
          stage={stage}
          isMobile={isMobile}
          onDogRelease={handleDogRelease}
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

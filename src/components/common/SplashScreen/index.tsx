import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import RippleCanvas from './RippleCanvas';
import SplashScene from './SplashScene';
import { startAmbient } from '../../../audio/ambient';
import useReducedMotion from '../../../hooks/useReducedMotion';
import { useCanvasQuality } from '../../three/quality';
import './SplashScreen.scss';

interface SplashScreenProps {
  onFinish: () => void;
}

const SEEN_KEY = 'lu_seen_intro';

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [stage, setStage] = useState<'intro' | 'revealed'>('intro');
  const [progress, setProgress] = useState(0);
  const hasFinished = useRef(false);
  const revealedRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const quality = useCanvasQuality(false);

  // La primera vez merece la pena verla entera. A partir de ahí es una espera
  // cada vez que abre la app, así que se acorta bastante.
  const seenBefore = useRef(localStorage.getItem(SEEN_KEY) === '1');
  const speed = reducedMotion ? 0.25 : seenBefore.current ? 0.55 : 1;

  const finish = useCallback(() => {
    if (hasFinished.current) return;
    hasFinished.current = true;
    localStorage.setItem(SEEN_KEY, '1');
    onFinish();
  }, [onFinish]);

  const handleRevealed = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    setStage('revealed');
  }, []);

  /**
   * Cualquier toque salta la intro y, de paso, es el gesto que autoriza el
   * audio. Antes no había forma de saltarla: once segundos cada vez que
   * abría la app, sin escapatoria.
   */
  const handleSkip = useCallback(() => {
    startAmbient();
    finish();
  }, [finish]);

  useEffect(() => {
    const t = setTimeout(handleRevealed, 5500 * speed);
    return () => clearTimeout(t);
  }, [handleRevealed, speed]);

  useEffect(() => {
    if (stage !== 'revealed') return;
    const step = 100 / ((5000 * speed) / 100);
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + step, 100);
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(finish, 500);
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [stage, finish, speed]);

  return createPortal(
    <div
      className="splash-screen"
      onPointerDown={handleSkip}
      role="button"
      tabIndex={0}
      aria-label="Saltar la introducción"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSkip(); }}
    >
      <RippleCanvas onRevealed={handleRevealed} />

      {stage === 'revealed' && (
        <Canvas
          className="splash-screen__threejs"
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ ...quality.gl, alpha: true }}
          dpr={quality.dpr}
          performance={quality.performance}
        >
          <SplashScene />
        </Canvas>
      )}

      {stage === 'revealed' && (
        <div className="splash-screen__bar-wrap">
          <div className="splash-screen__bar">
            <div className="splash-screen__bar-fill" style={{ width: `${progress}%` }} />
          </div>
          {/* Antes ponía un porcentaje, que sugería que estaba cargando algo.
              No cargaba nada: era una espera decorativa. Ahora la barra es
              solo un ritmo, y el texto dice lo único accionable que hay. */}
          <p className="splash-screen__percent">Toca para entrar</p>
        </div>
      )}
    </div>,
    document.body
  );
}

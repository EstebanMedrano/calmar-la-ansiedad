import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Howl } from 'howler';
import BirthdayScene from './BirthdayScene';
import BlowControls from './BlowControls';
import LetterText from '../../letter/LetterText';
import { BIRTHDAY_MESSAGE, UI_TEXT } from '../../../content/messages';
import { useBirthday } from '../../context/BirthdayContext';
import useIsMobile from '../../../hooks/useIsMobile';
import useReducedMotion from '../../../hooks/useReducedMotion';
import type { BirthdayStage } from './timings';
import { T, CANDLE_COUNT, candlesRisingDuration } from './timings';
import './Birthday.scss';

export default function Birthday() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const { markGiftOpened } = useBirthday();

  const [stage, setStage] = useState<BirthdayStage>('idle');
  const [dogProgress, setDogProgress] = useState(0);
  const [risingElapsed, setRisingElapsed] = useState(0);
  const [outElapsed, setOutElapsed] = useState(0);
  const [blowLevel, setBlowLevel] = useState(0);

  const candleCount = isMobile ? CANDLE_COUNT.mobile : CANDLE_COUNT.desktop;

  // ── Temporizadores ──────────────────────────────────────────────────────
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef<number | null>(null);

  const addT = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, reducedMotion ? ms * 0.4 : ms));
  }, [reducedMotion]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  // ── Audio ───────────────────────────────────────────────────────────────
  const barkRef = useRef<Howl | null>(null);
  const fireworksRef = useRef<Howl | null>(null);
  useEffect(() => () => {
    [barkRef, fireworksRef].forEach((r) => {
      r.current?.stop();
      r.current?.unload();
    });
  }, []);

  /** Avanza un valor de 0 a 1 durante `ms` y llama a onDone al terminar. */
  const animateProgress = useCallback(
    (ms: number, setter: (v: number) => void, onDone?: () => void) => {
      const duration = reducedMotion ? ms * 0.4 : ms;
      const start = performance.now();
      const step = () => {
        const t = Math.min(1, (performance.now() - start) / duration);
        setter(t);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          rafRef.current = null;
          onDone?.();
        }
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [reducedMotion],
  );

  /** Cronómetro en segundos, para las velas. */
  const runSeconds = useCallback(
    (ms: number, setter: (v: number) => void, onDone?: () => void) => {
      const duration = reducedMotion ? ms * 0.4 : ms;
      const start = performance.now();
      const step = () => {
        const el = performance.now() - start;
        setter(el / 1000);
        if (el < duration) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          rafRef.current = null;
          onDone?.();
        }
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [reducedMotion],
  );

  // ── Coreografía ─────────────────────────────────────────────────────────
  const start = useCallback(() => {
    if (stage !== 'idle') return;

    barkRef.current = new Howl({ src: ['/assets/sounds/lia-bark.mp3'], volume: 0.6 });

    setStage('intro');
    addT(() => {
      setStage('dogsRunIn');
      animateProgress(T.dogsRunIn, setDogProgress, () => {
        setStage('handOff');
        addT(() => {
          setStage('zoomCake');
          addT(() => {
            setStage('candlesRising');
            runSeconds(candlesRisingDuration(candleCount), setRisingElapsed, () => {
              setStage('ringComplete');
              addT(() => {
                setStage('dimming');
                addT(() => setStage('awaitBlow'), T.dimming);
              }, T.ringComplete);
            });
          }, T.zoomCake);
        }, T.handOff);
      });
      // Ladrido a mitad de la carrera
      addT(() => barkRef.current?.play(), 1800);
    }, T.intro);
  }, [stage, addT, animateProgress, runSeconds, candleCount]);

  /**
   * Punto único de entrada al apagado.
   * Da igual si vino del micrófono o del botón: a partir de aquí es lo mismo.
   */
  const handleBlow = useCallback(() => {
    if (stage !== 'awaitBlow') return;

    setBlowLevel(1);
    setStage('candlesOut');
    fireworksRef.current = new Howl({ src: ['/assets/sounds/Artificiales.mp3'], volume: 0.35 });
    fireworksRef.current.play();

    runSeconds(T.candlesOut, setOutElapsed, () => {
      setBlowLevel(0);
      setStage('pullBack');
      addT(() => setStage('letterIncoming'), T.pullBack);
    });
  }, [stage, runSeconds, addT]);

  const handleLetterArrived = useCallback(() => {
    addT(() => setStage('letterOpening'), 300);
  }, [addT]);

  const handleLetterOpened = useCallback(() => setStage('reading'), []);

  const handleReadDone = useCallback(() => {
    setStage('finale');
    markGiftOpened();
  }, [markGiftOpened]);

  const replay = useCallback(() => {
    clearTimers();
    setDogProgress(0);
    setRisingElapsed(0);
    setOutElapsed(0);
    setBlowLevel(0);
    setStage('idle');
  }, [clearTimers]);

  const leave = useCallback(() => navigate('/games'), [navigate]);

  const showLetter = stage === 'reading' || stage === 'finale';

  return createPortal(
    <div className="bday">
      <Canvas
        className="bday__canvas"
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        camera={{ position: [0, 1.35, 4.2], fov: 55, near: 0.1, far: 140 }}
      >
        {/* La escena carga fuentes (el texto de la torta) y texturas (los
            tulipanes), y ambas cosas suspenden. El EffectComposer tiene que
            quedar FUERA de ese Suspense: si suspende con él dentro, se monta
            con el renderer todavía sin inicializar y el canvas se queda negro. */}
        <Suspense fallback={null}>
          <BirthdayScene
            stage={stage}
            isMobile={isMobile}
            candleCount={candleCount}
            risingElapsed={risingElapsed}
            outElapsed={outElapsed}
            blowLevel={blowLevel}
            dogProgress={dogProgress}
            onLetterArrived={handleLetterArrived}
            onLetterOpened={handleLetterOpened}
          />
        </Suspense>
        <EffectComposer>
          {/* Umbral alto a propósito: solo deben brillar las llamas y la
              carta. Con un umbral bajo, el glaseado claro de la torta también
              entra en el bloom y el texto de encima se vuelve ilegible. */}
          <Bloom intensity={0.5} luminanceThreshold={0.82} luminanceSmoothing={0.2} mipmapBlur />
        </EffectComposer>
      </Canvas>

      <button className="bday__back" onClick={leave}>← {UI_TEXT.backToGames}</button>

      {stage === 'idle' && (
        <button className="bday__start" onClick={start}>
          <span className="bday__start-icon" aria-hidden="true">🎁</span>
          <span>Abrir mi regalo</span>
        </button>
      )}

      {stage === 'intro' && (
        <motion.p
          className="bday__title"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {UI_TEXT.giftIntro}
        </motion.p>
      )}

      {stage === 'awaitBlow' && (
        <BlowControls onBlow={handleBlow} onLevel={setBlowLevel} />
      )}

      {showLetter && (
        <LetterText
          text={BIRTHDAY_MESSAGE}
          enabled
          onDone={handleReadDone}
          accent="#fbbf24"
        />
      )}

      {stage === 'finale' && (
        <div className="bday__actions">
          <button className="bday__action" onClick={replay}>{UI_TEXT.readAgain}</button>
          <button className="bday__action bday__action--primary" onClick={leave}>
            {UI_TEXT.backToGames}
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}

import { Logger } from '../../../utils/logger';
import { useState, useRef, useEffect, useMemo, useCallback, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnxiety } from '../../context/AnxietyContext';
import GroundingScene from './GroundingScene';
import type { OrbData } from './SenseOrbs';
import { useCanvasQuality } from '../../three/quality';
import './Grounding.scss';

interface Step {
  id: string;
  number: number;
  label: string;
  icon: string;
  placeholder: string;
  description: (remaining: number) => string;
}

const STEPS: Step[] = [
  {
    id: 'see', number: 5, label: 'Cosas que puedes VER', icon: '👁️',
    placeholder: 'Ej: La luz de la ventana, mi taza...',
    description: (r) => `Observa tu entorno. Te quedan ${r} por encontrar.`,
  },
  {
    id: 'touch', number: 4, label: 'Cosas que puedes TOCAR', icon: '🖐️',
    placeholder: 'Ej: La textura de mi ropa, el teclado...',
    description: (r) => `Siente las texturas a tu alcance. Te quedan ${r}.`,
  },
  {
    id: 'hear', number: 3, label: 'Cosas que puedes OÍR', icon: '👂',
    placeholder: 'Ej: El viento, mi respiración...',
    description: (r) => `Cierra los ojos. Escucha con atención. Te quedan ${r}.`,
  },
  {
    id: 'smell', number: 2, label: 'Cosas que puedes OLER', icon: '👃',
    placeholder: 'Ej: Café, aire fresco...',
    description: (r) => `Inhala profundo. ¿Qué aromas percibes? Te quedan ${r}.`,
  },
  {
    id: 'taste', number: 1, label: 'Algo que puedes SABOREAR', icon: '👅',
    placeholder: 'Ej: Menta, agua...',
    description: () => '¿Hay algún sabor en tu boca? Tómate un momento.',
  },
];

const ACCENT_COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function Grounding() {
  const navigate = useNavigate();
  const { reduceLevel } = useAnxiety();
  const quality  = useCanvasQuality();
  const isMobile = quality.isMobile;

  const [items, setItems] = useState<string[][]>(() => STEPS.map(() => []));
  const [stepIndex, setStepIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [finished, setFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Todos los temporizadores juntos: antes quedaban sueltos y al salir del
  // juego a media animación intentaban actualizar un componente ya desmontado.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const addT = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const step = STEPS[stepIndex];
  const current = items[stepIndex];
  const accent = ACCENT_COLORS[stepIndex];
  const remaining = step.number - current.length;
  const stepDone = current.length === step.number;
  const totalItems = STEPS.reduce((s, st) => s + st.number, 0);
  const doneItems = items.reduce((s, arr) => s + arr.length, 0);
  const totalPct = (doneItems / totalItems) * 100;

  /** Una luz en la escena por cada cosa anotada. */
  const orbs = useMemo<OrbData[]>(
    () => items.flatMap((arr, stepIdx) => arr.map((_, slot) => ({ step: stepIdx, slot }))),
    [items],
  );

  useEffect(() => {
    // En móvil no se enfoca solo: abrir el teclado nada más entrar tapa
    // media pantalla y la escena que acaba de aparecer.
    if (!stepDone && !isMobile) addT(() => inputRef.current?.focus(), 300);
  }, [stepIndex, stepDone, isMobile, addT]);

  const addItem = () => {
    const val = input.trim();
    if (!val) return;
    if (current.some((it) => it.toLowerCase() === val.toLowerCase())) {
      setFeedback('Ya anotaste eso, intenta con otra cosa');
      addT(() => setFeedback(''), 2000);
      return;
    }
    const newItems = [...current, val];
    setItems((prev) => prev.map((arr, i) => (i === stepIndex ? newItems : arr)));
    setInput('');
    setFeedback('');

    // Si se completó el paso actual, envía los datos al diario de Lu
    if (newItems.length === step.number) {
      Logger.logGrounding(step.label, newItems.join(' | '));
    }
  };

  /** Permite borrar algo mal escrito, que antes no se podía. */
  const removeItem = (idx: number) => {
    setItems((prev) => prev.map((arr, i) => (i === stepIndex ? arr.filter((_, j) => j !== idx) : arr)));
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addItem();
  };

  const nextStep = () => {
    setFeedback('');
    setStepIndex((prev) => prev + 1);
  };

  const finish = () => {
    reduceLevel();
    setFinished(true);
  };

  return createPortal(
    <div className="grounding">
      <Canvas
        className="grounding__canvas"
        dpr={quality.dpr}
        gl={quality.gl}
        performance={quality.performance}
        camera={{ position: [0, 1.65, 6.2], fov: 50, near: 0.1, far: 120 }}
      >
        {/* El Suspense va por dentro y el composer por fuera: si la carga de
            los perros suspendiera con el composer dentro, se montaría con el
            renderer sin inicializar y el lienzo saldría negro. */}
        <Suspense fallback={null}>
          <GroundingScene
            stepIndex={stepIndex}
            accent={accent}
            orbs={orbs}
            colors={ACCENT_COLORS}
            isMobile={isMobile}
            finished={finished}
          />
        </Suspense>
        <EffectComposer>
          <Bloom intensity={0.55} luminanceThreshold={0.55} luminanceSmoothing={0.25} mipmapBlur />
        </EffectComposer>
      </Canvas>

      <button className="grounding__back-btn" onClick={() => navigate('/games')}>
        ← Volver a juegos
      </button>

      <div className="grounding__ui">
        {finished ? (
          <motion.div
            className="grounding__completion"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="grounding__completion-star">🌟</div>
            <h3>Lo lograste</h3>
            <p>Estás aquí, en este momento. Quince cosas que sí eran reales.</p>

            <div className="grounding__summary">
              {STEPS.map((s, i) => (
                <div key={s.id} className="grounding__summary-row"
                  style={{ '--accent': ACCENT_COLORS[i] } as React.CSSProperties}>
                  <span>{s.icon}</span>
                  <span>{s.number} {s.label.toLowerCase()}</span>
                  <span className="grounding__summary-check">✓</span>
                </div>
              ))}
            </div>

            <button className="grounding__cta" onClick={() => navigate('/games')}>
              Volver a juegos
            </button>
          </motion.div>
        ) : (
          <>
            <div className="grounding__steps-row">
              {STEPS.map((s, i) => {
                const done = items[i].length === s.number;
                const active = i === stepIndex;
                return (
                  <div
                    key={s.id}
                    className={`grounding__step-dot${active ? ' grounding__step-dot--active' : ''}${done ? ' grounding__step-dot--done' : ''}`}
                    style={{ '--dot-color': ACCENT_COLORS[i] } as React.CSSProperties}
                  >
                    <span className="grounding__step-dot-icon">{s.icon}</span>
                    <span className="grounding__step-dot-num">{s.number}</span>
                  </div>
                );
              })}
            </div>

            <div className="grounding__total-bar">
              <motion.div
                className="grounding__total-fill"
                animate={{ width: `${totalPct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={stepIndex}
                className="grounding__step-card"
                style={{ '--accent': accent } as React.CSSProperties}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grounding__step-header">
                  <span className="grounding__step-icon">{step.icon}</span>
                  <div className="grounding__step-text">
                    <h3 className="grounding__step-label">{step.label}</h3>
                    <p className="grounding__step-desc">{step.description(remaining)}</p>
                  </div>
                  <span className="grounding__step-counter">{current.length}/{step.number}</span>
                </div>

                <div className="grounding__pills">
                  <AnimatePresence>
                    {current.map((item, i) => (
                      <motion.button
                        key={item + i}
                        className="grounding__pill"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                        onClick={() => removeItem(i)}
                        title="Tocar para quitar"
                      >
                        {item} <span className="grounding__pill-x">×</span>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>

                {!stepDone ? (
                  <div className="grounding__input-row">
                    <input
                      ref={inputRef}
                      className="grounding__input"
                      type="text"
                      placeholder={step.placeholder}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKey}
                      autoComplete="off"
                      enterKeyHint="done"
                    />
                    <button
                      className="grounding__add-btn"
                      onClick={addItem}
                      disabled={!input.trim()}
                      aria-label="Añadir"
                    >
                      ✚
                    </button>
                  </div>
                ) : (
                  <motion.div
                    className="grounding__step-done"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <span>✨ Paso completado</span>
                    {stepIndex < STEPS.length - 1 ? (
                      <button className="grounding__cta" onClick={nextStep}>
                        Siguiente sentido →
                      </button>
                    ) : (
                      <button className="grounding__cta" onClick={finish}>
                        🌟 Finalizar
                      </button>
                    )}
                  </motion.div>
                )}

                {feedback && <p className="grounding__feedback">{feedback}</p>}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAnxiety } from '../../context/AnxietyContext';
import { Howl } from 'howler';
import * as THREE from 'three';
import BedroomScene, { type BedroomSceneHandle } from './BedroomScene';
import { useCanvasQuality } from '../../three/quality';
import { assetUrl } from '../../../utils/assetUrl';
import './Puzzle.scss';

export type Phase = 'idle' | 'calling' | 'intro' | 'breaking' | 'puzzle' | 'complete' | 'helping';
export type DogType = 'tito' | 'lia';

const ALL_PUZZLES = [
  { name: 'Tu refugio',       src: assetUrl('/assets/img/refugio-webp/exterior-casa.webp'),    message: '🏡 Este es tu lugar seguro' },
  { name: 'Tulipanes',        src: assetUrl('/assets/img/refugio-webp/jardin-tulipanes.webp'), message: '🌷 Floreces con cada respiración' },
  { name: 'Noche estrellada', src: assetUrl('/assets/img/refugio-webp/noche-estrellas.webp'),  message: '✨ El universo conspira a tu favor' },
  { name: 'Patio',            src: assetUrl('/assets/img/refugio-webp/patio-piscina.webp'),    message: '🌊 Fluye con la calma del agua' },
  { name: 'Fuente mágica',    src: assetUrl('/assets/img/refugio-webp/fuente-colores.webp'),   message: '🌈 La magia está en ti' },
  { name: 'Interior',         src: assetUrl('/assets/img/refugio-webp/interior-sala.webp'),    message: '🛋️ Tu rincón de paz' },
];
const TOTAL = 16;

function subtitleFor(phase: Phase, dog: DogType, placed: number): string {
  const label = dog === 'tito' ? 'Tito 🦊' : 'Lia 🤍';
  switch (phase) {
    case 'idle':     return '¿A quién llamamos para romper el cuadro?';
    case 'calling':  return `Llamando a ${label}...`;
    case 'intro':    return `¡${label} viene corriendo!`;
    case 'breaking': return `¡${label} rompió el cuadro!`;
    case 'puzzle':   return `Arrastra las piezas · ${placed}/${TOTAL}`;
    case 'helping':  return `¡${label} te está ayudando!`;
    case 'complete': return '¡Lo lograste! 🎉';
    default: return '';
  }
}

/**
 * Sonidos sintetizados: el "clac" de encajar una pieza y el arpegio de victoria.
 *
 * El arpegio sustituye a magia-brillo.mp3, un archivo que se referenciaba pero
 * que no existe en public/: cada partida acababa con un 404 y sin sonido.
 * Generarlo con el oscilador cuesta cero bytes de descarga.
 */
function useSynthSfx() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ctx = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const tone = useCallback((
    c: AudioContext, type: OscillatorType,
    from: number, to: number, at: number, dur: number, vol: number,
  ) => {
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(from, c.currentTime + at);
    osc.frequency.exponentialRampToValueAtTime(to, c.currentTime + at + dur);
    gain.gain.setValueAtTime(vol, c.currentTime + at);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + at + dur);
    osc.start(c.currentTime + at);
    osc.stop(c.currentTime + at + dur);
  }, []);

  const snap = useCallback(() => {
    try { tone(ctx(), 'triangle', 1100, 340, 0, 0.1, 0.14); }
    catch { /* sin audio disponible */ }
  }, [ctx, tone]);

  const success = useCallback(() => {
    try {
      const c = ctx();
      // Do–Mi–Sol–Do: acorde mayor ascendente, se lee como "lo lograste".
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        tone(c, 'sine', f, f * 1.002, i * 0.09, 0.55, 0.11);
      });
    } catch { /* sin audio disponible */ }
  }, [ctx, tone]);

  useEffect(() => () => { ctxRef.current?.close(); }, []);

  return { snap, success };
}

export default function Puzzle() {
  const navigate       = useNavigate();
  const { reduceLevel } = useAnxiety();
  const sfxSynth       = useSynthSfx();
  const quality        = useCanvasQuality();

  const puzzlesRef = useRef([...ALL_PUZZLES].sort(() => Math.random() - 0.5).slice(0, 3));

  const [phase,     setPhase]     = useState<Phase>('idle');
  const [dogType,   setDogType]   = useState<DogType>('tito');
  const [callId,    setCallId]    = useState(0);
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [placed,    setPlaced]    = useState(0);
  const [message,   setMessage]   = useState('');
  const [completed, setCompleted] = useState(false);
  const [allDone,   setAllDone]   = useState(false);

  const puzzleFrameRef = useRef<BedroomSceneHandle>(null);
  const phaseRef = useRef<Phase>('idle');
  const dogsPresentRef = useRef(0);
  const [helpTarget, setHelpTarget] = useState<THREE.Vector3 | null>(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  
  useEffect(() => {
    if (phase === 'intro') {
      dogsPresentRef.current += 1;
    }
  }, [phase]);

  const sfx    = useRef<{ bark?: Howl }>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    sfx.current = {
      bark: new Howl({ src: [assetUrl('/assets/sounds/lia-bark.mp3')], volume: 0.32 }),
    };
    const pending = timers.current;
    return () => {
      Object.values(sfx.current).forEach(s => s?.unload());
      pending.forEach(clearTimeout);
    };
  }, []);

  const showMsg = useCallback((text: string, dur = 3000) => {
    setMessage(text);
    const t = setTimeout(() => setMessage(''), dur);
    timers.current.push(t);
  }, []);

  const callDog = (dog: DogType) => {
    setDogType(dog);
    setPhase('calling');
    const t = setTimeout(() => { setPhase('intro'); setCallId(id => id + 1); }, 700);
    timers.current.push(t);
    showMsg(`¡${dog === 'tito' ? 'Tito 🦊' : 'Lia 🤍'}, ven aquí!`, 2000);
  };

  const handleImpact = useCallback(() => {
    const p = phaseRef.current;
    if (p === 'intro') {
      setPhase('breaking');
      sfx.current.bark?.play();
    } else if (p === 'puzzle') {
      setPhase('breaking');
      setPlaced(0);
      sfx.current.bark?.play();
      showMsg('¡Volvió a romperlo! 😅', 2200);
    }
  }, [showMsg]);

  const handleTimeout = useCallback(() => {
    if (phaseRef.current !== 'puzzle') return;
    setCallId(id => id + 1);
    setPhase('intro');
    showMsg(`¡El tiempo se acabó! ${dogType === 'tito' ? '🦊 Tito' : '🤍 Lia'} volverá a romperlo.`, 2000);
  }, [dogType, showMsg]);

  const handleSettled  = useCallback(() => setPhase('puzzle'), []);

  const handleSnap = useCallback((count: number) => {
    setPlaced(count);
    sfxSynth.snap();
    if (count > 0 && count % 4 === 0 && count < TOTAL) {
      const msgs = ['¡Vas increíble! 🌟', '¡Sigue así! 💪', '¡Casi lo tienes! ✨'];
      showMsg(msgs[Math.floor(Math.random() * msgs.length)]);
    }
  }, [showMsg, sfxSynth]);

  const handleComplete = useCallback(() => {
    reduceLevel();
    sfxSynth.success();
    setCompleted(true);
    setPhase('complete');
    showMsg(puzzlesRef.current[puzzleIdx]?.message ?? '', 5000);
  }, [reduceLevel, puzzleIdx, showMsg, sfxSynth]);

  const nextPuzzle = () => {
    if (puzzleIdx >= puzzlesRef.current.length - 1) { setAllDone(true); return; }
    setPlaced(0); setCompleted(false); setMessage(''); setPhase('idle');
    setPuzzleIdx(p => p + 1);
  };

  const handleHelp = useCallback(() => {
    if (phase !== 'puzzle') return;
    if (!puzzleFrameRef.current) return;
    const pos = puzzleFrameRef.current.puzzleFrame?.getUnplacedPiecePosition();
    if (!pos) return;
    setHelpTarget(pos);
    setPhase('helping');
  }, [phase]);

  const handleHelpComplete = useCallback(() => {
    setPhase('puzzle');
    setHelpTarget(null); 
    if (puzzleFrameRef.current?.puzzleFrame) {
      puzzleFrameRef.current.puzzleFrame.placeSelectedPiece();
    }
  }, []);

  const cur      = puzzlesRef.current[puzzleIdx];
  const progress = (placed / TOTAL) * 100;

  return createPortal(
    <div className="puzzle">
      <div className="puzzle__canvas-wrap">
        <Canvas
          shadows
          camera={{ position: [0, 1.6, 4.6], fov: 58, near: 0.1, far: 60 }}
          gl={quality.gl}
          dpr={quality.dpr}
          performance={quality.performance}
          style={{ width: '100%', height: '100%', touchAction: 'none' }}
        >
          <Suspense fallback={null}>
            <BedroomScene
              ref={puzzleFrameRef}
              shadowMapSize={quality.shadowMapSize}
              phase={phase} dogType={dogType} callId={callId}
              texture={cur.src}
              onImpact={handleImpact} onSettled={handleSettled}
              onSnap={handleSnap} onComplete={handleComplete}
              onTimeout={handleTimeout}
              helpTarget={helpTarget}
              onHelpComplete={handleHelpComplete}
            />
          </Suspense>
          <EffectComposer>
            <Bloom intensity={0.3} luminanceThreshold={0.8} luminanceSmoothing={0.2} mipmapBlur />
            <Vignette eskil={false} offset={0.22} darkness={0.45} />
          </EffectComposer>
        </Canvas>

        {/* Top bar */}
        <div className="puzzle__topbar">
          <button className="puzzle__back-btn" onClick={() => navigate('/games')}>← Volver</button>
          <div className="puzzle__title-block">
            <h2 className="puzzle__title">🧩 <span className="puzzle__gradient">Rompecabezas del Refugio</span></h2>
            <p className="puzzle__subtitle">{subtitleFor(phase, dogType, placed)}</p>
          </div>
        </div>

        {/* Selector de perro */}
        <AnimatePresence>
          {phase === 'idle' && (
            <motion.div className="puzzle__dog-select"
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:10 }}>
              <p className="puzzle__dog-select-label">¿Quién rompe el cuadro hoy?</p>
              <div className="puzzle__dog-btns">
                <button className="puzzle__call-btn puzzle__call-btn--tito" onClick={() => callDog('tito')}>🦊 Llamar a Tito</button>
                <button className="puzzle__call-btn puzzle__call-btn--lia"  onClick={() => callDog('lia')}>🤍 Llamar a Lia</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === 'puzzle' && (
          <div className="puzzle__hint">
            Arrastra las piezas de los costados hacia el cuadro
          </div>
        )}

        <AnimatePresence>
          {phase === 'puzzle' && (
            <motion.div className="puzzle__help-container"
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:10 }}
            >
              <button 
                className={`puzzle__help-btn puzzle__help-btn--${dogType}`} 
                onClick={handleHelp}
              >
                {dogType === 'tito' ? '🦊 Pide ayuda a Tito' : '🤍 Pide ayuda a Lia'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {message && (
            <motion.div className="puzzle__msg" key={message}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {phase === 'puzzle' && (
          <div className="puzzle__progress">
            <motion.div className="puzzle__progress-fill"
              animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
        )}
      </div>

      {/* Victory overlay */}
      <AnimatePresence>
        {(completed || allDone) && (
          <motion.div className="puzzle__overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <motion.div className="puzzle__victory"
              initial={{ scale:0.5, y:50 }} animate={{ scale:1, y:0 }}
              transition={{ type:'spring', stiffness:200, damping:18 }}>
              <div className="puzzle__victory-emoji">{allDone ? '🏆' : '🎉'}</div>
              <h3>{allDone ? '¡Increíble!' : '¡Lo lograste!'}</h3>
              <p>{allDone ? 'Completaste todos los rompecabezas.\nEres maravillosa 🌟' : cur.message}</p>
              <div className="puzzle__victory-actions">
                {!allDone && (
                  <button className="btn-primary" onClick={nextPuzzle}>
                    {puzzleIdx < puzzlesRef.current.length - 1 ? 'Siguiente imagen →' : 'Finalizar 🌟'}
                  </button>
                )}
                <button className="btn-secondary" onClick={() => navigate('/games')}>← Volver</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}
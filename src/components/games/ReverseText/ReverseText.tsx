import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useAnxiety } from '../../context/AnxietyContext';
import ReverseScene from './ReverseScene';
import './ReverseText.scss';
import { useCanvasQuality } from '../../three/quality';

export type GamePhase =
  | 'idle' | 'fail_run' | 'fail_bounce' | 'fail_stun'
  | 'success_tito' | 'success_break' | 'lia_run' | 'lia_press'
  | 'claw_down' | 'claw_place' | 'claw_up' | 'complete';

const PHRASES = [
  { text: 'todo pasa',          color: '#06b6d4' },
  { text: 'estoy a salvo',      color: '#10b981' },
  { text: 'respira profundo',   color: '#8b5cf6' },
  { text: 'confío en mí',       color: '#f59e0b' },
  { text: 'soy suficiente',     color: '#ec4899' },
];

const T = {
  titoRun:    940,
  wordBreak:  740,
  liaRun:     900,
  liaPress:   500,
  clawDown:   1100,
  clawPlace:  650,
  clawUp:     920,
  failRun:    700,
  failBounce: 380,
  failStun:   2100,
} as const;

export default function ReverseText() {
  const quality = useCanvasQuality(false);
  const navigate = useNavigate();
  const { reduceLevel } = useAnxiety();

  const [phraseIdx, setPhraseIdx] = useState(0);
  const [phase,     setPhase]     = useState<GamePhase>('idle');
  const [answer,    setAnswer]    = useState('');
  const [feedback,  setFeedback]  = useState('');
  const [score,     setScore]     = useState(0);
  const [done,      setDone]      = useState(false);

  const ids = useRef<number[]>([]);
  const addT = useCallback((fn: () => void, delay: number) => {
    ids.current.push(window.setTimeout(fn, delay));
  }, []);
  useEffect(() => () => { ids.current.forEach(clearTimeout); }, []);

  const dropletsRef = useRef<THREE.Vector3[]>([]);
  
  // ⭐ ¡ESTA ES LA LÍNEA QUE DEBE TENER EXACTAMENTE EL CAMPO color!
  const [splashes, setSplashes] = useState<{ id: number; pos: THREE.Vector3; color: string }[]>([]);
  const splashColors = ['#897dfa', '#ff88ee', '#44aaff', '#ffee00', '#ff4499', '#33ff99', '#ff3366'];

  const handleSubmit = useCallback(() => {
    if (phase !== 'idle' || !answer.trim()) return;
    const val     = answer.trim().toLowerCase();
    const correct = PHRASES[phraseIdx].text.toLowerCase();

    if (val === correct) {
      setFeedback('✅ ¡Correcto!');
      setAnswer('');
      setScore(s => s + 1);
      setPhase('success_tito');

      const ni     = phraseIdx + 1;
      const isLast = ni >= PHRASES.length;
      let delay    = 0;

      delay += T.titoRun;     addT(() => setPhase('success_break'), delay);
      delay += T.wordBreak;   addT(() => setPhase('lia_run'),        delay);
      delay += T.liaRun;      addT(() => setPhase('lia_press'),       delay);
      delay += T.liaPress;    addT(() => setPhase('claw_down'),       delay);
      delay += T.clawDown;    addT(() => setPhase('claw_place'),      delay);
      delay += T.clawPlace;
      addT(() => {
        if (!isLast) setPhraseIdx(ni);
        setPhase('claw_up');
      }, delay);
      delay += T.clawUp;
      addT(() => {
        if (isLast) { reduceLevel(); setDone(true); setPhase('complete'); }
        else { setPhase('idle'); }
      }, delay);

    } else {
      setFeedback('❌ Inténtalo de nuevo');
      setAnswer('');
      setPhase('fail_run');

      let delay = T.failRun;
      addT(() => setPhase('fail_bounce'), delay); delay += T.failBounce;
      addT(() => setPhase('fail_stun'),   delay); delay += T.failStun;
      addT(() => setPhase('idle'),        delay);
    }

    window.setTimeout(() => setFeedback(''), 2100);
  }, [phase, answer, phraseIdx, addT, reduceLevel]);

  // ⭐ Manejo de impacto de gota en el suelo (50% de probabilidad)
  const handleDropletImpact = useCallback((position: THREE.Vector3) => {
    if (Math.random() > 0.5) return;

    const id = Date.now() + Math.random();
    const color = splashColors[Math.floor(Math.random() * splashColors.length)];
    setSplashes(prev => [...prev, { id, pos: position.clone(), color }]);
    setTimeout(() => {
      setSplashes(prev => prev.filter(s => s.id !== id));
    }, 1800);
  }, []);

  const current  = PHRASES[phraseIdx];
  const nextP    = PHRASES[Math.min(phraseIdx + 1, PHRASES.length - 1)];
  const hasNext  = phraseIdx + 1 < PHRASES.length;
  const isIdle   = phase === 'idle';

  return createPortal(
    <div className="reverse-wrap">
      <button className="reverse-back" onClick={() => navigate('/games')}>← Volver</button>

      <Canvas className="reverse-canvas"
        dpr={quality.dpr}
        gl={quality.gl}
        performance={quality.performance}
        camera={{ position: [0, 2.5, 10.5], fov: 54, near: 0.1, far: 70 }}>
        <Suspense fallback={null}>
          <ReverseScene
            phrase={current.text}
            phraseColor={current.color}
            nextPhrase={nextP.text}
            nextColor={nextP.color}
            phase={phase}
            hasNext={hasNext}
            dropletsRef={dropletsRef}
            splashes={splashes}
            onDropletImpact={handleDropletImpact}
          />
        </Suspense>
      </Canvas>

      {!done ? (
        <div className="reverse-hud">
          <div className="reverse-hud__top">
            <div className="reverse-hud__bar">
              <div className="reverse-hud__fill"
                style={{ width: `${(score / PHRASES.length) * 100}%`, background: current.color }} />
            </div>
            <span className="reverse-hud__count" style={{ color: current.color }}>
              {score} / {PHRASES.length}
            </span>
          </div>

          {feedback && (
            <p className={`reverse-hud__fb ${feedback.startsWith('✅') ? 'ok' : 'err'}`}>
              {feedback}
            </p>
          )}

          <div className="reverse-hud__row">
            <input
              className="reverse-hud__input"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Escribe la frase correcta..."
              disabled={!isIdle}
              autoComplete="off"
              autoCapitalize="none"
            />
            <button
              className="reverse-hud__btn"
              style={{ background: current.color }}
              onClick={handleSubmit}
              disabled={!answer.trim() || !isIdle}
            >✓</button>
          </div>

          {!isIdle && phase !== 'complete' && (
            <p className="reverse-hud__anim-hint">
              {phase === 'success_tito'   && '💨 ¡Tito va a por ella!'}
              {phase === 'success_break'  && '💥 ¡Destruida!'}
              {phase === 'lia_run'        && '🐾 Lia corre al botón...'}
              {phase === 'lia_press'      && '🔴 ¡Botón presionado!'}
              {phase === 'claw_down'      && '⬇️ La grúa desciende...'}
              {phase === 'claw_place'     && '📌 Colocando la siguiente...'}
              {phase === 'claw_up'        && '⬆️ La grúa sube...'}
              {phase === 'fail_run'       && '💨 ¡Tito va a por ella...!'}
              {phase === 'fail_bounce'    && '💫 ¡Boing! No era esa...'}
              {phase === 'fail_stun'      && '⭐ Tito se aturdió...'}
            </p>
          )}
        </div>
      ) : (
        <div className="reverse-done">
          <div className="reverse-done__box">
            <span>🌟</span>
            <h2>¡Todas completadas!</h2>
            <p>Llevas estas palabras dentro de ti.</p>
            <div className="reverse-done__phrases">
              {PHRASES.map((p, i) => (
                <span key={i} style={{ color: p.color }}>{p.text}</span>
              ))}
            </div>
            <button onClick={() => navigate('/games')}>← Volver a juegos</button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
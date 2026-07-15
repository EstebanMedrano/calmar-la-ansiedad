// Breathing.tsx - CORREGIDO (Usando useRef y Bloom estático)
import { Suspense, useCallback, useEffect, useRef, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { useAnxiety } from '../../context/AnxietyContext';
import BreathingScene from './BreathingScene';
import './Breathing.scss';

const PHASES = [
  { name:'Inhala', duration:4, hint:'Llena tus pulmones lentamente...', color:'#10b981' },
  { name:'Retén',  duration:7, hint:'Sostén el aire... siente la calma', color:'#8b5cf6' },
  { name:'Exhala', duration:8, hint:'Suelta todo... libera la tensión',  color:'#f59e0b' },
];
const CYCLES = 3;

const MemoizedBreathingScene = memo(BreathingScene);

export default function Breathing() {
  const navigate = useNavigate();
  const { reduceLevel } = useAnxiety();

  const [started, setStarted] = useState(false);
  const [done,    setDone]    = useState(false);
  
  // Variables para el HUD
  const [hudPhase, setHudPhase] = useState(0);
  const [cycle,    setCycle]    = useState(0);
  const [tLeft,    setTLeft]    = useState(4);

  // ⭐ Variables para el motor 3D (UseRef - NO re-renderizan React)
  const phaseRef = useRef(0);
  const progRef  = useRef(0);

  const raf  = useRef<number|null>(null);
  const ps   = useRef(0);
  const cp   = useRef(0);
  const cc   = useRef(0);

  const tick = useCallback(() => {
    const now = performance.now() / 1000;
    const el  = now - ps.current;
    const ph  = PHASES[cp.current];
    const p   = Math.min(el / ph.duration, 1);
    
    // Actualizamos el motor 3D (NO dispara re-render de React)
    phaseRef.current = cp.current;
    progRef.current  = p;
    
    // Actualizamos el HUD (Dispara re-render, pero solo del texto)
    setHudPhase(cp.current);
    setTLeft(Math.max(0, Math.ceil(ph.duration - el)));
    
    if (p >= 1) {
      const next = cp.current + 1;
      if (next >= PHASES.length) {
        cp.current = 0; ps.current = performance.now()/1000;
        const nc = cc.current + 1; cc.current = nc; setCycle(nc);
        if (nc >= CYCLES) { reduceLevel(); setDone(true); return; }
      } else { cp.current = next; ps.current = performance.now()/1000; }
    }
    raf.current = requestAnimationFrame(tick);
  }, [reduceLevel]);

  const start = () => {
    ps.current = performance.now()/1000; cp.current = 0; cc.current = 0;
    phaseRef.current = 0; progRef.current = 0;
    setStarted(true); setHudPhase(0); setCycle(0); setTLeft(4); setDone(false);
    raf.current = requestAnimationFrame(tick);
  };
  const reset = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    setStarted(false); setHudPhase(0); setCycle(0); setTLeft(4); setDone(false);
  };
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  const pd = PHASES[hudPhase] ?? PHASES[0];

  return createPortal(
    <div className="breathing-wrap">
      <button className="breathing-back" onClick={() => { reset(); navigate('/games'); }}>← Volver</button>

      <Canvas className="breathing-canvas" dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          {/* ⭐ Pasamos correctamente los Refs, no hay error de TypeScript aquí */}
          <MemoizedBreathingScene phaseRef={phaseRef} progRef={progRef} />
        </Suspense>
      </Canvas>

      {!started && !done && (
        <div className="breathing-intro">
          <h2>🌬️ Respiración 4-7-8</h2>
          <p>Completa {CYCLES} ciclos para calmar tu mente.</p>
          <div className="breathing-intro__list">
            {PHASES.map((p, i) => (
              <div key={i} className="breathing-intro__item">
                <span style={{ color: p.color, fontWeight: 700 }}>{p.name}</span>
                <span>{p.duration}s</span>
              </div>
            ))}
          </div>
          <button onClick={start}>▶ Comenzar</button>
        </div>
      )}

      {started && !done && (
        <div className="breathing-hud">
          <div className="breathing-hud__cycle">Ciclo {cycle + 1} / {CYCLES}</div>
          <div className="breathing-hud__name" style={{ color: pd.color }}>{pd.name}</div>
          <div className="breathing-hud__hint">{pd.hint}</div>
          <div className="breathing-hud__num"  style={{ color: pd.color }}>{tLeft}</div>
          <div className="breathing-hud__bar">
            <div className="breathing-hud__fill" style={{ width:`${progRef.current*100}%`, background: pd.color }} />
          </div>
        </div>
      )}

      {done && (
        <div className="breathing-done">
          <div className="breathing-done__box">
            <span>✨</span>
            <h2>¡{CYCLES} ciclos completados!</h2>
            <p>Estás más tranquila ahora.</p>
            <div>
              <button onClick={reset}>🔄 Repetir</button>
              <button onClick={() => navigate('/games')}>← Volver</button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useAnxiety } from '../../context/AnxietyContext';
import MemoramaScene from './MemoramaScene';
import type {
  IntroStage, CardState, SharkState, DogTarget, DogState, CardData, BurstData,
} from './types';
import {
  PAIRS, PAIR_COLORS, GRID_SX, GRID_SY, GAP_X, GAP_Y, CARD_COLS,
  STUN_DURATION, ATTACK_TIMEOUT, BLINK_DURATION,
} from './positions';
import './Memorama.scss';

// ── Helpers ──────────────────────────────────────────────────────────────────

const shuffle = <T,>(a: T[]): T[] => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

const createDeck = (): CardData[] =>
  shuffle(Array.from({ length: PAIRS }, (_, p) => [
    { id: p * 2, pairId: p }, { id: p * 2 + 1, pairId: p },
  ]).flat());

const getCardPos = (idx: number): [number, number, number] => [
  GRID_SX + (idx % CARD_COLS) * GAP_X,
  GRID_SY - Math.floor(idx / CARD_COLS) * GAP_Y,
  0,
];

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

// ── Componente ────────────────────────────────────────────────────────────────

export default function Memorama() {
  const navigate        = useNavigate();
  const { reduceLevel } = useAnxiety();

  // ── Game state ──────────────────────────────────────────────────────────────
  const [introStage,  setIntroStage]  = useState<IntroStage>('beach');
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [deck,        setDeck]        = useState<CardData[]>(() => createDeck());
  const [cardStates,  setCardStates]  = useState<CardState[]>(Array(PAIRS * 2).fill('hidden'));
  const [flipped,     setFlipped]     = useState<number[]>([]);
  const [locked,      setLocked]      = useState(false);
  const [matched,     setMatched]     = useState(0);
  const [moves,       setMoves]       = useState(0);
  const [elapsed,     setElapsed]     = useState(0);
  const [score,       setScore]       = useState(0);
  const [combo,       setCombo]       = useState(0);
  const [bursts,      setBursts]      = useState<BurstData[]>([]);
  const [shakeSet,    setShakeSet]    = useState(new Set<number>());
  const [completed,   setCompleted]   = useState(false);

  // Pair reveal overlay
  const [pairReveal,  setPairReveal]  = useState<{ pairId: number; points: number } | null>(null);

  // Shark / dogs
  const [sharkState,  setSharkState]  = useState<SharkState>('chasing');
  const [sharkTarget, setSharkTarget] = useState<DogTarget>('tito');
  const [titoState,   setTitoState]   = useState<DogState>('swimming');
  const [liaState,    setLiaState]    = useState<DogState>('swimming');

  // ── Refs ────────────────────────────────────────────────────────────────────
  const titoWorldPos    = useRef(new THREE.Vector3(4.5,  2.5, 0));
  const liaWorldPos     = useRef(new THREE.Vector3(4.5, -2.5, 0));
  const sharkWorldPos   = useRef(new THREE.Vector3(6.0,  0.0, 0));
  const comboRef        = useRef(0);
  const matchedRef      = useRef(0);
  const lastActionRef   = useRef(Date.now());
  const sharkStRef      = useRef<SharkState>('chasing');
  const timerRef        = useRef<number | null>(null);
  const sharkTimerRef   = useRef<number | null>(null);
  const chaseSwitchRef  = useRef<number | null>(null);
  const startRef        = useRef(Date.now());

  sharkStRef.current = sharkState;
  matchedRef.current = matched;

  // ── Timer (starts after intro) ──────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return;
    startRef.current = Date.now();
    lastActionRef.current = Date.now();
    timerRef.current = window.setInterval(
      () => setElapsed(Math.round((Date.now() - startRef.current) / 1000)), 1000
    );
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying]);

  // ── Shark attack timer (triggers after ATTACK_TIMEOUT seconds without a match) ──
  useEffect(() => {
    if (!isPlaying) return;
    sharkTimerRef.current = window.setInterval(() => {
      if (sharkStRef.current !== 'chasing' || matchedRef.current >= PAIRS) return;
      const sinceAction = (Date.now() - lastActionRef.current) / 1000;
      if (sinceAction >= ATTACK_TIMEOUT) {
        lastActionRef.current = Date.now(); // Reset timer
        setSharkState('attacking');

        // Attack the closest dog
        const titoD = titoWorldPos.current.distanceTo(sharkWorldPos.current);
        const liaD  = liaWorldPos.current.distanceTo(sharkWorldPos.current);
        const victim: DogTarget = titoD < liaD ? 'tito' : 'lia';

        // Blink effect (no lives lost — solo efecto visual)
        if (victim === 'tito') {
          setTitoState('blinking');
          setTimeout(() => setTitoState('swimming'), BLINK_DURATION * 1000);
        } else {
          setLiaState('blinking');
          setTimeout(() => setLiaState('swimming'), BLINK_DURATION * 1000);
        }

        // Shark returns to chase after 3s
        setTimeout(() => {
          setSharkState('chasing');
          setSharkTarget(Math.random() < 0.5 ? 'tito' : 'lia');
        }, 3000);
      }
    }, 500);
    return () => { if (sharkTimerRef.current) clearInterval(sharkTimerRef.current); };
  }, [isPlaying]);

  // ── Shark chase target switch (alternates between Tito and Lia during chase) ──
  useEffect(() => {
    if (!isPlaying) return;
    const switchNow = () => {
      if (sharkStRef.current === 'chasing') {
        setSharkTarget(t => t === 'tito' ? 'lia' : 'tito');
      }
      // Schedule next switch (randomized 4-8 seconds)
      chaseSwitchRef.current = window.setTimeout(switchNow, 4000 + Math.random() * 4000);
    };
    chaseSwitchRef.current = window.setTimeout(switchNow, 5000);
    return () => { if (chaseSwitchRef.current) clearTimeout(chaseSwitchRef.current); };
  }, [isPlaying]);

  // ── Stop timers on victory ──────────────────────────────────────────────────
  useEffect(() => {
    if (matched >= PAIRS && isPlaying && !pairReveal) {
      setTitoState('celebrating');
      setLiaState('celebrating');
      setSharkState('dead');
      if (timerRef.current)       clearInterval(timerRef.current);
      if (sharkTimerRef.current)  clearInterval(sharkTimerRef.current);
      if (chaseSwitchRef.current) clearTimeout(chaseSwitchRef.current);
    }
  }, [matched, isPlaying, pairReveal]);

  // ── Burst helper ────────────────────────────────────────────────────────────
  const addBurst = useCallback((idx: number) => {
    const color = PAIR_COLORS[deck[idx].pairId % PAIR_COLORS.length];
    const pos   = getCardPos(idx);
    const id    = `${Date.now()}-${idx}`;
    setBursts(b => [...b, { id, pos, color }]);
    setTimeout(() => setBursts(b => b.filter(x => x.id !== id)), 1400);
  }, [deck]);

  // ── Card click ──────────────────────────────────────────────────────────────
  const handleCardClick = useCallback((idx: number) => {
    if (locked || pairReveal || cardStates[idx] !== 'hidden' || flipped.length >= 2) return;

    const ns = [...cardStates]; ns[idx] = 'flipped';
    setCardStates(ns);
    const nf = [...flipped, idx];
    setFlipped(nf);

    if (nf.length === 2) {
      setLocked(true);
      setMoves(m => m + 1);
      const [a, b] = nf;

      if (deck[a].pairId === deck[b].pairId) {
        // ── MATCH ───────────────────────────────────────────────────────────
        const nc = comboRef.current + 1;
        comboRef.current = nc;
        setCombo(nc);
        const bonus  = Math.min(nc - 1, 5) * 60;
        const points = 100 + bonus;
        setScore(s => s + points);

        setTimeout(() => {
          const ms = [...ns]; ms[a] = 'matched'; ms[b] = 'matched';
          setCardStates(ms);
          setFlipped([]);
          // ⚠️ NO setLocked(false) — se desbloquea en handleContinue

          const nm = matchedRef.current + 1;
          setMatched(nm);
          matchedRef.current = nm;
          lastActionRef.current = Date.now(); // Resetea timer del tiburón

          // Perrito golpea al tiburón → stun
          const hitter = sharkTarget;
          if (hitter === 'tito') setTitoState('hitting');
          else setLiaState('hitting');

          setSharkState('stunned');
          setTimeout(() => {
            if (hitter === 'tito') setTitoState('fleeing');
            else setLiaState('fleeing');
            setTimeout(() => {
              if (hitter === 'tito') setTitoState('swimming');
              else setLiaState('swimming');
            }, 2000);
            setSharkState('chasing');
            setSharkTarget(Math.random() < 0.5 ? 'tito' : 'lia');
          }, STUN_DURATION * 1000);

          addBurst(a); addBurst(b);

          // Mostrar overlay de reveal (mantiene locked=true)
          setPairReveal({ pairId: deck[a].pairId, points });
        }, 460);

      } else {
        // ── NO MATCH ─────────────────────────────────────────────────────────
        comboRef.current = 0; setCombo(0);
        setShakeSet(new Set([a, b]));
        setTimeout(() => {
          const rs = [...ns]; rs[a] = 'hidden'; rs[b] = 'hidden';
          setCardStates(rs); setFlipped([]); setLocked(false); setShakeSet(new Set());
        }, 900);
      }
    }
  }, [locked, pairReveal, cardStates, flipped, deck, sharkTarget, addBurst]);

  // ── Continuar después del reveal ────────────────────────────────────────────
  const handleContinue = useCallback(() => {
    setPairReveal(null);
    setLocked(false);
    if (matchedRef.current >= PAIRS) {
      setTimeout(() => { setCompleted(true); reduceLevel(); }, 400);
    }
  }, [reduceLevel]);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setDeck(createDeck());
    setCardStates(Array(PAIRS * 2).fill('hidden'));
    setFlipped([]); setLocked(false); setMatched(0); setMoves(0);
    setElapsed(0);  setScore(0);      setCombo(0);   setBursts([]);
    setShakeSet(new Set()); setCompleted(false); setPairReveal(null);
    setSharkState('chasing'); setSharkTarget('tito');
    setTitoState('swimming'); setLiaState('swimming');
    comboRef.current = 0; matchedRef.current = 0;
    titoWorldPos.current.set(4.5,  2.5, 0);
    liaWorldPos.current.set(4.5,  -2.5, 0);
    sharkWorldPos.current.set(6.0,  0.0, 0);
    startRef.current = Date.now();
    lastActionRef.current = Date.now();
    if (timerRef.current)       clearInterval(timerRef.current);
    if (sharkTimerRef.current)  clearInterval(sharkTimerRef.current);
    if (chaseSwitchRef.current) clearTimeout(chaseSwitchRef.current);
    timerRef.current = window.setInterval(
      () => setElapsed(Math.round((Date.now() - startRef.current) / 1000)), 1000
    );
  }, []);

  const timeBonus  = Math.max(0, 500 - elapsed * 2);
  const finalScore = score + (completed ? timeBonus : 0);

  return createPortal(
    <div className="mem-wrap">
      <button className="mem-back" onClick={() => navigate('/games')}>← Volver</button>

      <Canvas
        className="mem-canvas"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 18], fov: 58, near: 0.1, far: 80 }}
      >
        <Suspense fallback={null}>
          <MemoramaScene
            introStage={introStage}   isPlaying={isPlaying}
            deck={deck}               cardStates={cardStates}
            shakeSet={shakeSet}       bursts={bursts}
            matched={matched}         sharkState={sharkState}
            sharkTarget={sharkTarget} titoState={titoState}
            liaState={liaState}       titoWorldPos={titoWorldPos}
            liaWorldPos={liaWorldPos} sharkWorldPos={sharkWorldPos}
            onCardClick={handleCardClick}
            onStageChange={setIntroStage}
            onComplete={() => setIsPlaying(true)}
          />
        </Suspense>
      </Canvas>

      {/* ── HUD ─────────────────────────────────────────────────────────── */}
      {isPlaying && !completed && (
        <div className="mem-hud">
          <div className="mem-hud__pill">🎯 <span>{moves}</span></div>
          <div className="mem-hud__pill">✅ <span>{matched}/{PAIRS}</span></div>
          <div className="mem-hud__pill">⏱ <span>{fmt(elapsed)}</span></div>
          <div className="mem-hud__score">{score.toLocaleString()} pts</div>
        </div>
      )}

      {/* Barra de progreso */}
      {isPlaying && (
        <div className="mem-progress">
          <div className="mem-progress__fill" style={{ width: `${(matched / PAIRS) * 100}%` }} />
        </div>
      )}

      {/* Shark hint */}
      {isPlaying && !completed && (
        <p className="mem-shark-hint">🦈 Encuentra pares para ahuyentar al tiburón</p>
      )}

      {/* ── Overlay de intro ─────────────────────────────────────────────── */}
      {!isPlaying && (
        <div className="mem-intro-overlay">
          <div className="mem-intro-text">
            {introStage === 'beach'   && '🌊 La playa...'}
            {introStage === 'surface' && '💧 El mar...'}
            {introStage === 'diving'  && '🫧 Sumergiéndose...'}
          </div>
        </div>
      )}

      {/* ── Pair reveal overlay (nueva funcionalidad) ────────────────────── */}
      {pairReveal && (
        <div className="mem-reveal-overlay" onClick={handleContinue}>
          <div className="mem-reveal-card" onClick={e => e.stopPropagation()}>
            <div className="mem-reveal-header">
              <span className="mem-reveal-badge">✨ ¡Par encontrado!</span>
              {combo >= 2 && (
                <span className="mem-reveal-combo">🔥 COMBO ×{combo}</span>
              )}
            </div>
            <img
              src={`/assets/img/memorama/${pairReveal.pairId + 1}.png`}
              alt="Par encontrado"
              className="mem-reveal-img"
            />
            <p className="mem-reveal-points">+{pairReveal.points} puntos</p>
            <button className="mem-continue-btn" onClick={handleContinue}>
              Seguir jugando →
            </button>
          </div>
        </div>
      )}

      {/* ── Victoria ─────────────────────────────────────────────────────── */}
      {completed && (
        <div className="mem-victory">
          <div className="mem-victory__box">
            <div className="mem-victory__emoji">🏆</div>
            <h2>¡Victoria!</h2>
            <p>¡Tito y Lia derrotaron al tiburón!</p>
            <div className="mem-victory__stats">
              <div><span>🎯</span><span>{moves} movimientos</span></div>
              <div><span>⏱</span><span>{fmt(elapsed)}</span></div>
              <div><span>⭐</span><span>{score.toLocaleString()} pts</span></div>
              <div><span>⚡</span><span>+{timeBonus} bonus tiempo</span></div>
              <div className="mem-victory__total">
                <span>🏅</span><span>{finalScore.toLocaleString()} total</span>
              </div>
            </div>
            <div className="mem-victory__btns">
              <button onClick={reset}>Jugar de nuevo</button>
              <button onClick={() => navigate('/games')}>← Volver</button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
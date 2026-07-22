import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import useBlowDetection from '../../../hooks/useBlowDetection';
import { UI_TEXT } from '../../../content/messages';

interface BlowControlsProps {
  onBlow: () => void;
  /** Informa de la fuerza actual (0-1) para que las llamas reaccionen. */
  onLevel: (level: number) => void;
}

/** Cuánto hay que mantener pulsado el botón, en ms. */
const HOLD_MS = 1200;

/**
 * Los dos caminos para apagar las velas.
 *
 * El botón de mantener pulsado está visible desde el primer momento: el
 * micrófono es un extra, nunca un requisito. Si el permiso se deniega, no se
 * vuelve a pedir y el botón sigue funcionando igual.
 */
export default function BlowControls({ onBlow, onLevel }: BlowControlsProps) {
  const [holdProgress, setHoldProgress] = useState(0);
  const [nudge, setNudge] = useState(false);
  const holdRef = useRef<number | null>(null);
  const holdStart = useRef(0);
  const firedRef = useRef(false);

  const fire = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    onBlow();
  }, [onBlow]);

  const { status, level, start: startMic } = useBlowDetection({
    enabled: true,
    onBlow: fire,
  });

  // El nivel del micrófono mueve las llamas en tiempo real: así se nota que
  // la está oyendo antes de que lleguen a apagarse.
  useEffect(() => { onLevel(level); }, [level, onLevel]);

  // Si pasa un rato sin hacer nada, el botón late suavemente.
  // Es un recordatorio amable, no una insistencia.
  useEffect(() => {
    const id = setTimeout(() => setNudge(true), 20000);
    return () => clearTimeout(id);
  }, []);

  // ── Mantener pulsado ──────────────────────────────────────────────────────
  const stopHold = useCallback(() => {
    if (holdRef.current !== null) cancelAnimationFrame(holdRef.current);
    holdRef.current = null;
    setHoldProgress(0);
    if (!firedRef.current) onLevel(0);
  }, [onLevel]);

  const beginHold = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    holdStart.current = performance.now();
    const step = () => {
      const t = Math.min(1, (performance.now() - holdStart.current) / HOLD_MS);
      setHoldProgress(t);
      // Alimenta el mismo canal que el micrófono, así las llamas se
      // comportan igual con los dos métodos.
      onLevel(t);
      if (t >= 1) {
        holdRef.current = null;
        fire();
        return;
      }
      holdRef.current = requestAnimationFrame(step);
    };
    holdRef.current = requestAnimationFrame(step);
  }, [fire, onLevel]);

  useEffect(() => () => {
    if (holdRef.current !== null) cancelAnimationFrame(holdRef.current);
  }, []);

  const micMessage =
    status === 'denied' ? UI_TEXT.blowMicDenied
    : status === 'listening' || status === 'calibrating' ? UI_TEXT.blowMicListening
    : '';

  const showMicButton = status === 'idle' || status === 'requesting';

  return (
    <div className="bday-blow">
      <p className="bday-blow__prompt">{UI_TEXT.blowPrompt}</p>

      {showMicButton && (
        <button
          className="bday-blow__mic"
          onClick={startMic}
          disabled={status === 'requesting'}
        >
          🎤 {UI_TEXT.blowMicButton}
        </button>
      )}

      {micMessage && <p className="bday-blow__status">{micMessage}</p>}

      <motion.button
        className="bday-blow__hold"
        onPointerDown={beginHold}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
        onPointerLeave={stopHold}
        animate={nudge ? { scale: [1, 1.04, 1] } : undefined}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span
          className="bday-blow__fill"
          style={{ transform: `scaleX(${holdProgress})` }}
          aria-hidden="true"
        />
        <span className="bday-blow__label">🌬️ {UI_TEXT.blowHoldButton}</span>
      </motion.button>
    </div>
  );
}

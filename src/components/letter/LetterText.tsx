import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import useTypewriter from '../../hooks/useTypewriter';
import { SIGNATURE, UI_TEXT } from '../../content/messages';
import './Letter.scss';

export interface LetterTextProps {
  text: string;
  /** El tecleo no empieza hasta que la carta terminó de abrirse. */
  enabled: boolean;
  onDone?: () => void;
  /** Color del acento (cursor, firma). */
  accent?: string;
}

/**
 * El mensaje de la carta, escribiéndose en tiempo real.
 *
 * Va en DOM y no dentro del canvas 3D a propósito: un mensaje de verdad puede
 * tener 1000 caracteres, y en DOM se ajusta solo al ancho del teléfono, se
 * puede hacer scroll y se lee con una fuente real.
 */
export default function LetterText({ text, enabled, onDone, accent = '#fbbf24' }: LetterTextProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { shown, done, skip } = useTypewriter(text, { enabled, onDone });

  // Sigue al cursor mientras escribe: si el mensaje es largo, se saldría
  // por abajo y ella tendría que perseguirlo con el dedo.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown]);

  return (
    <div className="letter-text" onPointerDown={done ? undefined : skip}>
      <motion.div
        className="letter-text__paper"
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="letter-text__scroll" ref={scrollRef}>
          <p className="letter-text__body">
            {shown}
            {!done && <span className="letter-text__caret" style={{ background: accent }} />}
          </p>

          {done && SIGNATURE && (
            <motion.p
              className="letter-text__signature"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ color: accent }}
            >
              {SIGNATURE}
            </motion.p>
          )}
        </div>

        {!done && <span className="letter-text__hint">{UI_TEXT.skipHint}</span>}
      </motion.div>
    </div>
  );
}

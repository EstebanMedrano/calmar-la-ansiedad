import { useCallback, useEffect, useRef, useState } from 'react';
import useReducedMotion from './useReducedMotion';

interface UseTypewriterOptions {
  /** El tecleo no empieza hasta que esto es true (p. ej. al abrirse la carta). */
  enabled?: boolean;
  /** Caracteres por segundo. 28 se lee cómodo sin desesperar. */
  cps?: number;
  /** Pausa extra tras un punto, exclamación o final de párrafo, en ms. */
  punctuationPause?: number;
  onDone?: () => void;
}

interface UseTypewriterResult {
  /** El texto que se muestra ahora mismo. */
  shown: string;
  done: boolean;
  /** Muestra el texto completo de golpe. Se puede llamar varias veces. */
  skip: () => void;
  /** De 0 a 1, por si quieres una barra de progreso. */
  progress: number;
}

const PAUSE_AFTER = new Set(['.', '!', '?', '…', ':']);

/**
 * Escribe un texto letra a letra, como si alguien lo estuviera tecleando.
 *
 * Usa setTimeout encadenado en vez de un bucle por frame para que la velocidad
 * sea la misma en un móvil a 30fps que en un portátil a 120fps.
 *
 * Si la persona tiene activado "reducir movimiento" en su sistema, el texto
 * aparece entero de inmediato: el mensaje es lo importante, la animación no.
 */
export function useTypewriter(
  text: string,
  { enabled = true, cps = 28, punctuationPause = 260, onDone }: UseTypewriterOptions = {},
): UseTypewriterResult {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useReducedMotion();

  // Guardar el callback en una ref evita reiniciar el tecleo cada vez que el
  // componente padre se renderiza y crea una función nueva.
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  // Se lleva aparte de `done` porque el aviso solo debe salir una vez, y una
  // función de actualización de estado tiene que ser pura: llamar ahí a
  // onDone provocaba un setState del padre durante el render del hijo.
  const doneFiredRef = useRef(false);

  const finish = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setIndex(text.length);
    setDone(true);
    if (!doneFiredRef.current) {
      doneFiredRef.current = true;
      onDoneRef.current?.();
    }
  }, [text.length]);

  // Reinicia si cambia el texto
  useEffect(() => {
    setIndex(0);
    setDone(false);
    doneFiredRef.current = false;
  }, [text]);

  useEffect(() => {
    if (!enabled) return;

    if (reducedMotion) {
      finish();
      return;
    }

    if (index >= text.length) {
      if (!done && text.length > 0) finish();
      return;
    }

    const char = text[index];
    const isParagraphBreak = char === '\n' && text[index + 1] === '\n';
    const delay =
      1000 / cps +
      (PAUSE_AFTER.has(char) || isParagraphBreak ? punctuationPause : 0);

    timerRef.current = setTimeout(() => setIndex((i) => i + 1), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, index, text, cps, punctuationPause, reducedMotion, done, finish]);

  return {
    shown: text.slice(0, index),
    done,
    skip: finish,
    progress: text.length === 0 ? 1 : index / text.length,
  };
}

export default useTypewriter;

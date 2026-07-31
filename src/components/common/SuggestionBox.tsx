import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Lightbulb, X } from 'lucide-react';
import { Logger } from '../../utils/logger';
import './SuggestionBox.scss';

type Status = 'idle' | 'sending' | 'sent' | 'queued';

const CATEGORIES = [
  { id: 'idea',    label: '💡 Una idea nueva',   hint: '¿Qué te gustaría que hubiera aquí?' },
  { id: 'juego',   label: '🎮 Sobre un juego',   hint: '¿Qué cambiarías de alguno?' },
  { id: 'fallo',   label: '🐞 Algo no funciona', hint: 'Cuéntame qué pasó y en qué parte.' },
  { id: 'sentir',  label: '💛 Cómo me sentí',    hint: 'Lo que quieras contarme.' },
] as const;

const MAX_CHARS = 600;

/**
 * Buzón de sugerencias.
 *
 * Va al mismo Google Sheets que el resto del diario, con `type: suggestion`,
 * así que aparece como una fila más en la misma hoja.
 *
 * Es un diálogo modal y no una página aparte a propósito: se abre desde
 * cualquier pantalla sin perder dónde estabas, que es justo cuando se te ocurre
 * lo que quieres decir.
 */
export default function SuggestionBox({ onClose }: { onClose: () => void }) {
  const [category, setCategory] = useState<string>(CATEGORIES[0].id);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  /*
   * El componente solo existe mientras está abierto (Footer lo monta y lo
   * desmonta). Así el formulario empieza en blanco cada vez por construcción,
   * sin un efecto que limpie el estado al cerrarse.
   */

  // El foco entra al diálogo al abrirlo: sin esto, con teclado o lector de
  // pantalla te quedas navegando por la página de detrás.
  useEffect(() => { closeBtnRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const send = useCallback(async () => {
    const value = text.trim();
    if (!value || status === 'sending') return;

    setStatus('sending');
    const label = CATEGORIES.find(c => c.id === category)?.label ?? category;
    const delivered = await Logger.logSuggestion(label, value);

    // 'queued' y no 'sent': si no había conexión el mensaje quedó guardado y se
    // enviará solo, pero decir "enviado" sería mentir.
    setStatus(delivered ? 'sent' : 'queued');
    window.setTimeout(onClose, 2200);
  }, [text, category, status, onClose]);

  const current = CATEGORIES.find(c => c.id === category) ?? CATEGORIES[0];
  const done = status === 'sent' || status === 'queued';

  return createPortal(
    <div className="suggestion" role="dialog" aria-modal="true" aria-label="Buzón de ideas">
      <button className="suggestion__backdrop" onClick={onClose} aria-label="Cerrar" />

      <div className="suggestion__panel">
        <button
          ref={closeBtnRef}
          className="suggestion__close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        {done ? (
          <div className="suggestion__done">
            <span className="suggestion__done-icon" aria-hidden="true">
              {status === 'sent' ? '💌' : '📮'}
            </span>
            <h3>{status === 'sent' ? '¡Recibido!' : 'Guardado'}</h3>
            <p>
              {status === 'sent'
                ? 'Gracias por contármelo. Lo leo todo.'
                : 'No hay conexión ahora mismo, pero se enviará solo en cuanto vuelva.'}
            </p>
          </div>
        ) : (
          <>
            <header className="suggestion__header">
              <h3 className="suggestion__title">
                <Lightbulb size={20} aria-hidden="true" />
                Tu buzón de ideas
              </h3>
              <p className="suggestion__sub">
                Esto es tuyo también. Dime qué le falta o qué le sobra.
              </p>
            </header>

            <div className="suggestion__cats" role="group" aria-label="Tipo de sugerencia">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`suggestion__cat${category === c.id ? ' suggestion__cat--on' : ''}`}
                  onClick={() => setCategory(c.id)}
                  aria-pressed={category === c.id}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <label className="suggestion__label" htmlFor="suggestion-text">
              {current.hint}
            </label>
            <textarea
              id="suggestion-text"
              ref={textareaRef}
              className="suggestion__input"
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
              rows={5}
              placeholder="Escribe aquí…"
            />

            <div className="suggestion__foot">
              <span className="suggestion__count">{text.length}/{MAX_CHARS}</span>
              <button
                className="suggestion__send"
                onClick={send}
                disabled={!text.trim() || status === 'sending'}
              >
                {status === 'sending' ? 'Enviando…' : 'Enviar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

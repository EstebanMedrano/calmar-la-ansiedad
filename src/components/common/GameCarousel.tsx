import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import GameThumb from './GameThumb';
import useReducedMotion from '../../hooks/useReducedMotion';
import './GameCarousel.scss';

interface Game {
  id: string;
  title: string;
  desc: string;
  accentColor?: string;
  /** Tarjeta visible pero no jugable (el regalo antes del cumpleaños). */
  locked?: boolean;
  /** Texto que sustituye al "Jugar →" mientras está bloqueada. */
  lockedLabel?: string;
}

interface GameCarouselProps {
  games: Game[];
}

/** Tiempo entre rotaciones. Largo a propósito: da tiempo a leer la tarjeta. */
const AUTO_INTERVAL = 5200;
/** Sobre la tarjeta del regalo (bloqueada) el carrusel se demora más para
 *  poder leer la cuenta atrás, pero NO se detiene: sigue girando. */
const LOCKED_INTERVAL = 9000;
/** Cuántas tarjetas se ven a cada lado de la central. */
const VISIBLE_SIDES = 2;

export default function GameCarousel({ games }: GameCarouselProps) {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = games.length;

  // ── auto-rotate ────────────────────────────────────────────────────────────
  // El intervalo se programa uno a uno (setTimeout encadenado) para poder
  // demorarse más en la tarjeta bloqueada sin llegar a detenerse: así el
  // carrusel nunca se "atasca" al final y el giro se siente continuo.
  const advance = useCallback(() => {
    setCurrent(prev => (prev + 1) % total);
  }, [total]);

  const stopAuto = useCallback(() => {
    if (intervalRef.current) clearTimeout(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const scheduleNext = useCallback((fromIndex: number) => {
    if (intervalRef.current) clearTimeout(intervalRef.current);
    const delay = games[fromIndex]?.locked ? LOCKED_INTERVAL : AUTO_INTERVAL;
    intervalRef.current = setTimeout(advance, delay);
  }, [advance, games]);

  const startAuto = useCallback(() => {
    scheduleNext(current);
  }, [scheduleNext, current]);

  useEffect(() => {
    // Reprograma el siguiente salto cada vez que cambia la tarjeta centrada.
    // La bloqueada solo alarga la pausa (LOCKED_INTERVAL); el giro continúa.
    scheduleNext(current);
    return () => stopAuto();
  }, [current, scheduleNext, stopAuto]);

  // ── swipe / drag ───────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    setIsDragging(false);
    // Captura el puntero para que un swipe que termina fuera del viewport
    // siga disparando onPointerUp; si no, el carrusel se quedaba colgado
    // con el autoplay parado.
    e.currentTarget.setPointerCapture?.(e.pointerId);
    stopAuto();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!e.currentTarget.hasPointerCapture?.(e.pointerId)) return;
    // Las tarjetas siguen al dedo mientras arrastra: sin esto el gesto
    // no da ninguna respuesta hasta que lo sueltas.
    setDragOffset(e.clientX - dragStartX.current);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    const delta = e.clientX - dragStartX.current;
    setDragOffset(0);
    if (Math.abs(delta) > 40) {
      setIsDragging(true);
      setCurrent(prev =>
        delta < 0 ? (prev + 1) % total : (prev - 1 + total) % total
      );
    }
    startAuto();
  };

  const handleCardClick = (index: number) => {
    if (isDragging) return;
    // Una tarjeta bloqueada se puede centrar para verla, pero no abrir.
    if (games[index].locked) {
      setCurrent(index);
      return;
    }
    if (index === current) {
      navigate(`/game/${games[index].id}`);
    } else {
      setCurrent(index);
      stopAuto();
      startAuto();
    }
  };

  /**
   * Distancia con signo desde la tarjeta centrada, por el camino más corto.
   *
   * Antes había cuatro posiciones fijas (center/left/right/hidden) y el salto
   * era brusco. Ahora cada tarjeta recibe un desplazamiento continuo, así que
   * el movimiento es un deslizamiento suave y se ven varias tarjetas a cada
   * lado en vez de solo una.
   */
  const offsetOf = (index: number) => {
    let diff = index - current;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  };

  return (
    <div className="carousel-wrap">
      <div
        className="carousel-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {games.map((game, index) => {
          const offset = offsetOf(index);
          if (Math.abs(offset) > VISIBLE_SIDES) return null;

          const isCenter = offset === 0;
          const depth = Math.abs(offset);
          // El arrastre se reparte entre las tarjetas para que acompañen
          // al dedo sin separarse unas de otras.
          const drag = dragOffset / 3;

          return (
            <div
              key={game.id}
              className={`carousel-card${isCenter ? ' carousel-card--center' : ''}${game.locked ? ' carousel-card--locked' : ''}`}
              style={{
                '--accent': game.accentColor ?? '#8b5cf6',
                // Todo el posicionamiento es una sola transformación: el
                // navegador la resuelve en la GPU y no recalcula el diseño.
                transform: `translateX(calc(-50% + ${offset * 62}% + ${drag}px)) scale(${1 - depth * 0.14}) rotateY(${offset * -14}deg)`,
                opacity: isCenter ? 1 : Math.max(0, 0.62 - (depth - 1) * 0.26),
                zIndex: 10 - depth,
                transition: isDragging || dragOffset !== 0
                  ? 'none'
                  : reducedMotion
                    ? 'opacity .2s linear'
                    : 'transform 1.1s cubic-bezier(.22,.61,.36,1), opacity 1.1s ease',
              } as React.CSSProperties}
              onClick={() => handleCardClick(index)}
              aria-disabled={game.locked || undefined}
            >
              {game.locked && (
                <span className="carousel-card__lock" aria-hidden="true">
                  <Lock size={16} />
                </span>
              )}

              <div className="carousel-card__art">
                <GameThumb id={game.id} className="carousel-card__thumb" />
              </div>

              <div className="carousel-card__body">
                <h3 className="carousel-card__title">{game.title}</h3>
                <p className="carousel-card__desc">{game.desc}</p>
                {isCenter && (
                  game.locked
                    ? <span className="carousel-card__cta carousel-card__cta--locked">
                        {game.lockedLabel ?? 'Aún no'}
                      </span>
                    : <span className="carousel-card__cta">Jugar →</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* dots */}
      <div className="carousel-dots">
        {games.map((g, i) => (
          <button
            key={g.id}
            className={`carousel-dot${i === current ? ' carousel-dot--active' : ''}`}
            onClick={() => { setCurrent(i); stopAuto(); startAuto(); }}
            aria-label={`Ir a ${g.title}`}
            aria-current={i === current || undefined}
          />
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAnxiety } from '../context/AnxietyContext';
import CountdownCard from './CountdownCard';
import useReducedMotion from '../../hooks/useReducedMotion';
import './Welcome.scss';

/**
 * Cómo se describe cada nivel.
 *
 * Se sustituyeron los emojis (😊😟😰🌋) por lenguaje. Un emoji de cara
 * asustada le pone nombre y cara a lo que siente antes de que ella lo haga, y
 * en una app para la ansiedad eso es justo lo contrario de lo que buscamos.
 * Las palabras describen sin juzgar y sin dramatizar.
 */
const LEVELS = [
  { value: 1,  label: 'En calma',      hint: 'Todo bastante tranquilo' },
  { value: 2,  label: 'Serena',        hint: 'Con algún pensamiento suelto' },
  { value: 3,  label: 'Algo inquieta', hint: 'Nada grave, pero se nota' },
  { value: 4,  label: 'Inquieta',      hint: 'Cuesta soltar la cabeza' },
  { value: 5,  label: 'Tensa',         hint: 'El cuerpo está en alerta' },
  { value: 6,  label: 'Agobiada',      hint: 'Empieza a pesar' },
  { value: 7,  label: 'Muy agobiada',  hint: 'Cuesta concentrarse' },
  { value: 8,  label: 'Angustiada',    hint: 'El pecho va apretado' },
  { value: 9,  label: 'Desbordada',    hint: 'Es demasiado ahora mismo' },
  { value: 10, label: 'Al límite',     hint: 'Necesito parar ya' },
];

/** Del verde sereno al rojo cálido, sin pasar por tonos estridentes. */
function colorFor(level: number): string {
  const stops: [number, string][] = [
    [1, '#34d399'],
    [4, '#60a5fa'],
    [7, '#c084fc'],
    [10, '#fb7185'],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i];
    const [b, cb] = stops[i + 1];
    if (level >= a && level <= b) {
      const t = (level - a) / (b - a);
      return mix(ca, cb, t);
    }
  }
  return stops[stops.length - 1][1];
}

function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export default function Welcome() {
  const { setLevel } = useAnxiety();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [selected, setSelected] = useState<number | null>(null);

  const current = selected !== null ? LEVELS[selected - 1] : null;
  const accent = colorFor(selected ?? 3);

  const handleSelect = (level: number) => {
    setSelected(level);
    setLevel(level);
  };

  return (
    <>
      <section className="mood" style={{ '--accent': accent } as React.CSSProperties}>
        <h2 className="mood__title">Hola, ¿cómo te sientes?</h2>
        <p className="mood__sub">Este es tu espacio seguro. Sin prisas. Sin juicios.</p>

        {/* Escala continua: una barra de 10 segmentos que se va llenando.
            Se lee de un vistazo mejor que diez botones sueltos. */}
        <div
          className="mood__scale"
          role="radiogroup"
          aria-label="Nivel de ansiedad"
        >
          {LEVELS.map((lvl) => {
            const isActive = selected !== null && lvl.value <= selected;
            const isCurrent = selected === lvl.value;
            return (
              <button
                key={lvl.value}
                role="radio"
                aria-checked={isCurrent}
                aria-label={`${lvl.value}. ${lvl.label}`}
                className={`mood__step${isActive ? ' mood__step--on' : ''}${isCurrent ? ' mood__step--current' : ''}`}
                style={{ '--step-color': colorFor(lvl.value) } as React.CSSProperties}
                onClick={() => handleSelect(lvl.value)}
              >
                <span className="mood__step-bar" />
                <span className="mood__step-num">{lvl.value}</span>
              </button>
            );
          })}
        </div>

        {/* Espacio reservado siempre, para que la tarjeta no dé un salto
            al aparecer el texto. */}
        <div className="mood__readout">
          {current ? (
            <motion.div
              key={current.value}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <span className="mood__label">{current.label}</span>
              <span className="mood__hint">{current.hint}</span>
            </motion.div>
          ) : (
            <span className="mood__hint">Elige el punto donde estás ahora</span>
          )}
        </div>

        <button
          className="mood__start"
          disabled={selected === null}
          onClick={() => navigate('/games')}
        >
          Comenzar
        </button>
      </section>

      <CountdownCard />
    </>
  );
}

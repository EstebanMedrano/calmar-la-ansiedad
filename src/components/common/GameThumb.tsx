/**
 * Miniaturas de los juegos, dibujadas en SVG.
 *
 * Se hacen en código y no con imágenes por tres motivos: no pesan nada, se
 * ven nítidas en cualquier pantalla, y no hay que regenerar archivos cada vez
 * que se retoca una escena. Cada una insinúa de qué va el juego con la forma,
 * no con un dibujo literal.
 *
 * Todas usan `currentColor` para el trazo, así heredan el color de acento de
 * su tarjeta sin duplicar la paleta.
 */

interface ThumbProps {
  className?: string;
}

const VB = '0 0 120 120';

/** Texto al Revés: letras reflejadas sobre un eje. */
function ReverseThumb({ className }: ThumbProps) {
  return (
    <svg className={className} viewBox={VB} fill="none" aria-hidden="true">
      <text x="60" y="52" textAnchor="middle" fontSize="30" fontWeight="700"
        fill="currentColor" opacity=".9">abc</text>
      <text x="60" y="52" textAnchor="middle" fontSize="30" fontWeight="700"
        fill="currentColor" opacity=".28" transform="translate(0,26) scale(1,-1) translate(0,-52)">abc</text>
      <line x1="24" y1="60" x2="96" y2="60" stroke="currentColor" strokeWidth="1.5" opacity=".5" />
    </svg>
  );
}

/** Respiración: círculos concéntricos que laten. */
function BreathingThumb({ className }: ThumbProps) {
  return (
    <svg className={className} viewBox={VB} fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="34" stroke="currentColor" strokeWidth="1.5" opacity=".25">
        <animate attributeName="r" values="34;40;34" dur="7s" repeatCount="indefinite" />
      </circle>
      <circle cx="60" cy="60" r="24" stroke="currentColor" strokeWidth="2" opacity=".55">
        <animate attributeName="r" values="24;32;24" dur="7s" repeatCount="indefinite" />
      </circle>
      <circle cx="60" cy="60" r="13" fill="currentColor" opacity=".8">
        <animate attributeName="r" values="13;19;13" dur="7s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/** Grounding 5-4-3-2-1: cinco puntos que van decreciendo. */
function GroundingThumb({ className }: ThumbProps) {
  return (
    <svg className={className} viewBox={VB} fill="none" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={24 + i * 18} cy="60" r={11 - i * 1.7}
          fill="currentColor" opacity={0.85 - i * 0.12} />
      ))}
      <path d="M18 82 H102" stroke="currentColor" strokeWidth="1.5" opacity=".35" />
    </svg>
  );
}

/** Memorama: cuatro cartas, una girada. */
function MemoryThumb({ className }: ThumbProps) {
  return (
    <svg className={className} viewBox={VB} fill="none" aria-hidden="true">
      {[[30, 28], [66, 28], [30, 64], [66, 64]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="24" height="30" rx="4"
          stroke="currentColor" strokeWidth="1.8"
          fill={i === 3 ? 'currentColor' : 'none'}
          opacity={i === 3 ? 0.75 : 0.5} />
      ))}
      <circle cx="42" cy="43" r="4.5" fill="currentColor" opacity=".8" />
    </svg>
  );
}

/** Huracán: espiral. */
function HurricaneThumb({ className }: ThumbProps) {
  return (
    <svg className={className} viewBox={VB} fill="none" aria-hidden="true">
      <g stroke="currentColor" fill="none" strokeLinecap="round">
        <path d="M30 34 Q60 26 90 34" strokeWidth="3" opacity=".8" />
        <path d="M36 50 Q60 43 84 50" strokeWidth="2.6" opacity=".65" />
        <path d="M42 66 Q60 60 78 66" strokeWidth="2.2" opacity=".5" />
        <path d="M48 82 Q60 77 72 82" strokeWidth="1.8" opacity=".35" />
      </g>
      <circle cx="60" cy="93" r="3" fill="currentColor" opacity=".7" />
    </svg>
  );
}

/** Lago de calma: ondas concéntricas sobre el agua. */
function WaterThumb({ className }: ThumbProps) {
  return (
    <svg className={className} viewBox={VB} fill="none" aria-hidden="true">
      <g stroke="currentColor" fill="none">
        <ellipse cx="60" cy="66" rx="12" ry="4" strokeWidth="2.4" opacity=".85" />
        <ellipse cx="60" cy="66" rx="24" ry="8" strokeWidth="1.8" opacity=".55" />
        <ellipse cx="60" cy="66" rx="36" ry="12" strokeWidth="1.4" opacity=".3" />
      </g>
      <circle cx="60" cy="34" r="4" fill="currentColor" opacity=".9" />
      <line x1="60" y1="38" x2="60" y2="60" stroke="currentColor" strokeWidth="1.2" opacity=".4" />
    </svg>
  );
}

/** Ritual de soltar: llama sobre leños. */
function RitualThumb({ className }: ThumbProps) {
  return (
    <svg className={className} viewBox={VB} fill="none" aria-hidden="true">
      <path d="M60 26 C74 44 70 50 66 58 C64 50 62 48 60 44 C58 52 52 54 52 62 C52 74 60 80 60 80 C48 78 40 70 40 60 C40 44 56 40 60 26Z"
        fill="currentColor" opacity=".8" />
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".55">
        <line x1="36" y1="88" x2="84" y2="82" />
        <line x1="36" y1="82" x2="84" y2="88" />
      </g>
    </svg>
  );
}

/** Rompecabezas: pieza clásica. */
function PuzzleThumb({ className }: ThumbProps) {
  return (
    <svg className={className} viewBox={VB} fill="none" aria-hidden="true">
      <path d="M34 34 H52 a7 7 0 0 1 14 0 H86 V52 a7 7 0 0 0 0 14 V86 H66 a7 7 0 0 0-14 0 H34 V66 a7 7 0 0 1 0-14 Z"
        stroke="currentColor" strokeWidth="2.4" fill="currentColor" fillOpacity=".18" />
    </svg>
  );
}

/** Carta: sobre con lacre. */
function CartaThumb({ className }: ThumbProps) {
  return (
    <svg className={className} viewBox={VB} fill="none" aria-hidden="true">
      <rect x="26" y="38" width="68" height="46" rx="5"
        stroke="currentColor" strokeWidth="2.2" fill="currentColor" fillOpacity=".12" />
      <path d="M26 42 L60 66 L94 42" stroke="currentColor" strokeWidth="2.2" fill="none" />
      <circle cx="60" cy="66" r="7" fill="currentColor" opacity=".85" />
    </svg>
  );
}

/** Regalo: caja con lazo. */
function GiftThumb({ className }: ThumbProps) {
  return (
    <svg className={className} viewBox={VB} fill="none" aria-hidden="true">
      <rect x="28" y="50" width="64" height="42" rx="4"
        stroke="currentColor" strokeWidth="2.2" fill="currentColor" fillOpacity=".14" />
      <rect x="24" y="40" width="72" height="14" rx="3"
        stroke="currentColor" strokeWidth="2.2" fill="currentColor" fillOpacity=".2" />
      <line x1="60" y1="40" x2="60" y2="92" stroke="currentColor" strokeWidth="2.4" />
      <path d="M60 40 C50 40 44 34 47 29 C50 24 58 30 60 40 C62 30 70 24 73 29 C76 34 70 40 60 40Z"
        fill="currentColor" opacity=".85" />
    </svg>
  );
}

const THUMBS: Record<string, (p: ThumbProps) => React.ReactElement> = {
  reverse: ReverseThumb,
  breathing: BreathingThumb,
  grounding: GroundingThumb,
  memory: MemoryThumb,
  hurricane: HurricaneThumb,
  water: WaterThumb,
  ritual: RitualThumb,
  puzzle: PuzzleThumb,
  carta: CartaThumb,
  birthday: GiftThumb,
};

export default function GameThumb({ id, className }: { id: string; className?: string }) {
  const Thumb = THUMBS[id];
  if (!Thumb) return null;
  return <Thumb className={className} />;
}

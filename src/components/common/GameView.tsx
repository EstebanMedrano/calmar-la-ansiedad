import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { useBirthday } from '../context/BirthdayContext';
import { Logger } from '../../utils/logger';
import GameErrorBoundary from './GameErrorBoundary';

const ReverseText = lazy(() => import('../games/ReverseText/ReverseText'));
const Breathing   = lazy(() => import('../games/Breathing/Breathing'));
const Grounding = lazy(() => import('../games/Grounding/Grounding'));
const Memorama = lazy(() => import('../games/Memorama/Memorama'));
const Hurricane = lazy(() => import('../games/Hurricane/Hurricane'));
const WaterCalm = lazy(() => import('../games/WaterCalm/WaterCalm'));
const RitualFire = lazy(() => import('../games/RitualFire/RitualFire'));
const Puzzle = lazy(() => import('../games/Puzzle/Puzzle'));
const Carta = lazy(() => import('../games/Carta/Carta'));
const Birthday = lazy(() => import('../games/Birthday/Birthday'));

const gameComponents: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  reverse:   ReverseText,
  breathing: Breathing,
  grounding: Grounding,
  memory: Memorama,
  hurricane: Hurricane,
  water: WaterCalm,
  ritual: RitualFire,
  puzzle: Puzzle,
  carta: Carta,
  birthday: Birthday,
};

/**
 * Escenas que se dibujan a pantalla completa con createPortal.
 * No deben llevar el botón "volver" de esta vista, porque ya traen el suyo
 * y quedaría uno flotando detrás del canvas.
 */
const FULLSCREEN_GAMES = new Set([
  'reverse', 'breathing', 'memory', 'hurricane',
  'water', 'ritual', 'puzzle', 'carta', 'birthday',
]);

/**
 * Nombres para el informe. En la hoja se lee mucho mejor "Rompecabezas" que
 * el identificador de la ruta.
 */
const GAME_LABELS: Record<string, string> = {
  reverse: 'Texto al Revés',
  breathing: 'Respiración 4-7-8',
  grounding: 'Grounding 5-4-3-2-1',
  memory: 'Memorama Calmante',
  hurricane: 'Huracán de Pensamientos',
  water: 'Lago de Calma',
  ritual: 'Ritual de Soltar',
  puzzle: 'Rompecabezas',
  carta: 'Una carta para ti',
  birthday: 'Tu regalo',
};

export default function GameView() {
  const { gameName } = useParams<{ gameName: string }>();
  const navigate = useNavigate();
  const { isUnlocked } = useBirthday();
  const startedAt = useRef(0);

  const known = gameName ? GAME_LABELS[gameName] : undefined;

  // Registra cuánto tiempo pasó en cada juego. Es lo que permite ver en la
  // hoja si algo se usó de verdad o se abrió y se cerró a los tres segundos.
  useEffect(() => {
    if (!known) return;
    startedAt.current = Date.now();
    Logger.logGameStart(known);
    return () => {
      const ms = Date.now() - startedAt.current;
      // Menos de cinco segundos es un rebote, no una partida.
      Logger.logGameEnd(known, ms, ms > 5000);
    };
  }, [known]);

  // El candado del carrusel no basta: sin esto se llega al regalo
  // escribiendo /game/birthday en la barra de direcciones.
  if (gameName === 'birthday' && !isUnlocked) {
    return <Navigate to="/games" replace />;
  }

  if (!gameName || !gameComponents[gameName]) {
    return (
      <div className="text-center">
        <h2>Juego no encontrado</h2>
        <button onClick={() => navigate('/games')}>← Volver</button>
      </div>
    );
  }

  const GameComponent = gameComponents[gameName];
  const isFullscreen = FULLSCREEN_GAMES.has(gameName);

  return (
    // key: al cambiar de juego se descarta el estado de error anterior,
    // si no, un fallo dejaría bloqueados también los demás juegos.
    <GameErrorBoundary key={gameName} onExit={() => navigate('/games')}>
      <Suspense fallback={<div className="loader">Cargando juego...</div>}>
        <div>
          {!isFullscreen && (
            <button className="btn-secondary" onClick={() => navigate('/games')} style={{ marginBottom: 20 }}>
              ← Volver a juegos
            </button>
          )}
          <GameComponent />
        </div>
      </Suspense>
    </GameErrorBoundary>
  );
}
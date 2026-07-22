import { useMemo } from 'react';
import GameCarousel from './GameCarousel';
import CountdownCard from './CountdownCard';
import { useNavigate } from 'react-router-dom';
import { useBirthday } from '../context/BirthdayContext';

// Nota: 'reverse' y 'breathing' apuntaban a /assets/img/games/*.webp, una
// carpeta que no existe: las dos tarjetas renderizaban una imagen rota.
// Se quitó el campo image hasta que estén las miniaturas.
const baseGames = [
  {
    id: 'reverse',
    title: 'Texto al Revés',
    desc: 'Descifra frases positivas',
    accentColor: '#06b6d4',
  },
  {
    id: 'breathing',
    title: 'Respiración 4-7-8',
    desc: 'Sigue el ritmo del círculo',
    accentColor: '#10b981',
  },
  { id: 'grounding', 
    title: 'Grounding 5-4-3-2-1', 
    desc: 'Vuelve al presente', 
    accentColor: '#9ab910' 
  },
  { id: 'memory', 
    title: 'Memorama Calmante', 
    desc: 'Encuentra los pares, calma tu mente', 
    accentColor: '#9575f3' 
  },
  { id: 'hurricane', 
    title: 'Huracán de Pensamientos', 
    desc: 'Destruye lo que te pesa', 
    accentColor: '#ef4444' 
  },
  { id: 'water', 
    title: 'Lago de Calma', 
    desc: 'Crea ondas y escapa de los perritos', 
    accentColor: '#03378b' 
  },
  { id: 'ritual', 
    title: 'Ritual de Soltar', 
    desc: 'Escribe, suelta, quema', 
    accentColor: '#f59e0b' 
  },
  { id: 'puzzle',
    title: 'Rompecabezas',
    desc: 'Reconstruye el refugio en 3D',
    accentColor: '#f54d0b'
  },
  { id: 'carta',
    title: 'Una carta para ti',
    desc: 'Algo que quiero decirte',
    accentColor: '#e879f9'
  },
];

export default function GamesMenu() {
  const navigate = useNavigate();
  const { isUnlocked, countdown } = useBirthday();

  const games = useMemo(() => [
    ...baseGames,
    {
      id: 'birthday',
      title: 'Tu regalo',
      desc: isUnlocked ? 'Te estaba esperando' : 'Se abre el 1 de agosto',
      accentColor: '#fbbf24',
      locked: !isUnlocked,
      lockedLabel: countdown.days > 0
        ? `faltan ${countdown.days}d ${countdown.hours}h`
        : `faltan ${countdown.hours}h ${countdown.minutes}m`,
    },
  ], [isUnlocked, countdown.days, countdown.hours, countdown.minutes]);

  return (
    <div className="games-view">
      <h2 className="text-center" style={{ marginBottom: '1rem' }}>¿Qué necesitas ahora?</h2>
      <GameCarousel games={games} />
      <CountdownCard />
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button className="btn-secondary" onClick={() => navigate('/')}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
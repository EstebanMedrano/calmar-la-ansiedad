import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isMusicEnabled, subscribeMusic, toggleMusic } from '../../audio/ambient';

/**
 * Los botones "Guía" y "Progreso" se quitaron: no hacían absolutamente nada
 * al pulsarlos. Un botón que no responde se siente como una app rota, y el
 * nivel de ansiedad (que era lo que iba a mostrar "Progreso") ya está
 * siempre visible en la cabecera.
 */
export default function Footer() {
  const [musicOn, setMusicOn] = useState(isMusicEnabled);

  // La música puede cambiarse desde otros sitios, así que el botón escucha
  // en vez de guardar su propia copia del estado.
  useEffect(() => subscribeMusic(setMusicOn), []);

  return (
    <footer className="app-footer">
      <button
        className="footer-btn"
        onClick={() => setMusicOn(toggleMusic())}
        aria-pressed={musicOn}
      >
        {musicOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        {musicOn ? 'Música' : 'Silencio'}
      </button>
    </footer>
  );
}

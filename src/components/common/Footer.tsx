import { useEffect, useState } from 'react';
import { Volume2, VolumeX, Lightbulb } from 'lucide-react';
import { isMusicEnabled, subscribeMusic, toggleMusic } from '../../audio/ambient';
import SuggestionBox from './SuggestionBox';

/**
 * Los botones "Guía" y "Progreso" se quitaron: no hacían absolutamente nada
 * al pulsarlos. Un botón que no responde se siente como una app rota, y el
 * nivel de ansiedad (que era lo que iba a mostrar "Progreso") ya está
 * siempre visible en la cabecera.
 */
export default function Footer() {
  const [musicOn, setMusicOn] = useState(isMusicEnabled);
  const [boxOpen, setBoxOpen] = useState(false);

  // La música puede cambiarse desde otros sitios, así que el botón escucha
  // en vez de guardar su propia copia del estado.
  useEffect(() => subscribeMusic(setMusicOn), []);

  return (
    <>
      <footer className="app-footer">
        <button
          className="footer-btn"
          onClick={() => setMusicOn(toggleMusic())}
          aria-pressed={musicOn}
        >
          {musicOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          {musicOn ? 'Música' : 'Silencio'}
        </button>

        <button className="footer-btn" onClick={() => setBoxOpen(true)}>
          <Lightbulb size={18} />
          Ideas
        </button>
      </footer>

      {boxOpen && <SuggestionBox onClose={() => setBoxOpen(false)} />}
    </>
  );
}

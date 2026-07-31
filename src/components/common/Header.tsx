import { useAnxiety } from '../context/AnxietyContext';
import { Wind } from 'lucide-react';

/**
 * El botón de menú de la esquina se quitó: no tenía onClick, era un
 * marcador de posición "para futuras funcionalidades". Es el mismo caso que
 * "Guía" y "Progreso" en el pie — un botón que no responde al tocarlo se
 * siente como una app rota. Además medía 31 px, por debajo de lo que se puede
 * tocar con el dedo sin fallar.
 */
export default function Header() {
  const { level } = useAnxiety();

  // Lógica para el color de la barra según el nivel
  const getBarColor = () => {
    if (level > 6) return '#e74c3c';
    if (level > 3) return '#f39c12';
    return '#2ecc71';
  };

  return (
    <header className="app-header">
      <div className="header-content">
        {/* Título con icono SVG en lugar de emoji */}
        <h1 className="app-title">
          <Wind size={28} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Espacio de Calma
        </h1>

        {/* Medidor de ansiedad (solo se muestra si level > 0) */}
        {level > 0 && (
          <div className="anxiety-meter">
            <div className="anxiety-meter__label">
              <span>Nivel de ansiedad</span>
              <span>{level}</span>
            </div>
            <div className="anxiety-meter__bar-container">
              <div
                className="anxiety-meter__bar"
                style={{
                  width: `${(level / 10) * 100}%`,
                  background: getBarColor()
                }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
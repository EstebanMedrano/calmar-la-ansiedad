import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onExit: () => void;
}

interface State {
  hasError: boolean;
}

/**
 * Red de seguridad para las escenas 3D.
 *
 * Sin esto, un fallo dentro de cualquier juego deja la pantalla en blanco y la
 * única salida es recargar. En una app a la que se entra justo cuando se está
 * mal, quedarse ante una pantalla en blanco es lo peor que puede pasar: aquí
 * al menos hay un mensaje tranquilo y un botón para volver.
 *
 * Tiene que ser una clase: los hooks no pueden capturar errores de render.
 */
export default class GameErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[juego] fallo en la escena:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="game-error">
        <p className="game-error__title">Este rincón se rompió un poquito</p>
        <p className="game-error__body">
          No es culpa tuya. Puedes volver e intentar con otro.
        </p>
        <button className="game-error__btn" onClick={this.props.onExit}>
          Volver a juegos
        </button>
      </div>
    );
  }
}

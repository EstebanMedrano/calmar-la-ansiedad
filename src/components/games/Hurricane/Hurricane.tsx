import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Howl } from 'howler';
import { useCanvasQuality } from '../../three/quality';
import { useAnxiety } from '../../context/AnxietyContext';
import HurricaneScene from './HurricaneScene';
import { assetUrl } from '../../../utils/assetUrl';
import './Hurricane.scss';

export type ThoughtType = {
  id: number;
  text: string;
  destroyed: boolean;
};

export type HurricaneStage =
  | 'intro' | 'tornado_approach' | 'tornado'
  | 'tornado_retreat'
  | 'tornado_ascend' | 'fireworks' | 'parachuting' | 'complete';

export const THOUGHTS = [
  'No puedo con esto', 'tengo miedo', 'siento preocupación', 'y si no puedo?',
  'siento pánico', 'tengo inseguridad', 'me siento triste', 'me siento culpable',
  'no soy suficiente', 'y si fracaso?', 'siento mucho dolor', 'ya estoy cansada',
  'no puedo con el estrés', 'no lo lograré', 'no estoy mejorando',
  'todo va a salir mal', 'no puedo controlarlo', '¿y si pasa algo?',
  'no merezco esto', 'no puedo respirar',
];

export const TARGET_DESTROYED = 10;

export default function Hurricane() {
  const navigate = useNavigate();
  const { reduceLevel } = useAnxiety();
  const quality  = useCanvasQuality(false);
  const isMobile = quality.isMobile;

  const [stage, setStage] = useState<HurricaneStage>('intro');
  const [destroyedCount, setDestroyedCount] = useState(0);
  const [showVictory, setShowVictory] = useState(false);
  const ids = useRef<number[]>([]);

  // ⭐ REFERENCIAS PARA LOS NUEVOS AUDIOS
  const tornadoAudio = useRef<Howl | null>(null);
  const fireworksAudio = useRef<Howl | null>(null);

  const addT = useCallback((fn: () => void, delay: number) => {
    ids.current.push(window.setTimeout(fn, delay));
  }, []);

  useEffect(() => () => { ids.current.forEach(clearTimeout); }, []);

  // ⭐ INICIALIZACIÓN DE AUDIOS (Se ejecuta una sola vez al montar el componente)
  useEffect(() => {
    tornadoAudio.current = new Howl({
      src: [assetUrl('/assets/sounds/Tornado.mp3')],
      loop: true,      // El tornado suena en bucle mientras dure
      volume: 0.75,
    });
    fireworksAudio.current = new Howl({
      src: [assetUrl('/assets/sounds/Artificiales.mp3')],
      loop: false,     // Suena una vez al explotar los pensamientos en el cielo
      volume: 0.85,
    });

    // Limpieza al desmontar el componente para que no queden sonidos colgados
    return () => {
      tornadoAudio.current?.stop();
      fireworksAudio.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (stage === 'intro') addT(() => setStage('tornado_approach'), 5500);
    if (stage === 'tornado_approach') addT(() => setStage('tornado'), 9000);
  }, [stage, addT]);

  // ⭐ CONTROL DE REPRODUCCIÓN SEGÚN LA ETAPA DEL JUEGO (CORREGIDO)
  useEffect(() => {
    if (!tornadoAudio.current || !fireworksAudio.current) return;

    // 1. Detener todo cuando el tornado desaparece (parachuting o complete)
    if (stage === 'parachuting' || stage === 'complete') {
      tornadoAudio.current.stop();
      fireworksAudio.current.stop();
      return;
    }

    // 2. Sonido del TORNADO: Comienza desde que se acerca y dura hasta que desaparece (incluye la fase de fuegos artificiales)
    const activeTornadoStages = ['tornado_approach', 'tornado', 'tornado_retreat', 'tornado_ascend', 'fireworks'];
    if (activeTornadoStages.includes(stage)) {
      if (!tornadoAudio.current.playing()) {
        tornadoAudio.current.play();
      }
    } else {
      // Seguridad: si no está en ninguna fase activa, lo detenemos
      tornadoAudio.current.stop();
    }

    // 3. Sonido de los FUEGOS ARTIFICIALES: Solo suenan en la fase EXACTA donde explotan (fireworks), no antes
    if (stage === 'fireworks') {
      if (!fireworksAudio.current.playing()) {
        fireworksAudio.current.stop(); // Reinicio limpio
        fireworksAudio.current.play();
      }
    } else {
      // Si no estamos en fireworks, nos aseguramos de que no esté sonando
      fireworksAudio.current.stop();
    }
  }, [stage]);

  const handleThoughtDestroyed = useCallback(() => {
    setDestroyedCount(prev => {
      const next = prev + 1;
      if (next >= TARGET_DESTROYED) {
        // 🛑 NUEVOS TIEMPOS CON MÁS DURACIÓN AL FINAL Y RETROCESO MÁS LEJOS
        addT(() => setStage('tornado_retreat'), 500);     // 0.5s: Retrocede hasta Z=-40
        addT(() => setStage('tornado_ascend'), 2500);     // 2.5s: Comienza a elevarse desde Z=-40 hasta Y=40
        addT(() => setStage('fireworks'),       5500);    // 5.5s: Explotan en el cielo
        addT(() => setStage('parachuting'),     8500);    // 8.5s: Caen en paracaídas
        addT(() => { 
          reduceLevel(); 
          setShowVictory(true); 
          setStage('complete'); 
        }, 13000);                                        // 13s: Final (+4.5 segundos extra)
      }
      return next;
    });
  }, [addT, reduceLevel]);

  return createPortal(
    <div className="hurricane-container">
      <button className="hurricane-back-btn" onClick={() => navigate('/games')}>← Volver</button>

      <Canvas className="hurricane-canvas"
        dpr={quality.dpr}
        gl={quality.gl}
        performance={quality.performance}
        camera={{ position: [0, 1.6, 3], fov: 75, near: 0.1, far: 400 }} shadows>
        <Suspense fallback={null}>
          <HurricaneScene stage={stage} isMobile={isMobile} onThoughtDestroyed={handleThoughtDestroyed} />
        </Suspense>
      </Canvas>

      {stage === 'intro' && (
        <p className="hurricane-hint">🐾 Jugando con Tito y Lia en el parque...</p>
      )}
      {stage === 'tornado_approach' && (
        <p className="hurricane-hint hurricane-hint--warning">⚠️ ¡Algo se aproxima desde el horizonte!</p>
      )}
      {stage === 'tornado' && (
        <div className="hurricane-progress">
          <div className="hurricane-progress__text">
            💥 Destruidos: <strong>{destroyedCount} / {TARGET_DESTROYED}</strong>
          </div>
          <div className="hurricane-progress__bg">
            <div className="hurricane-progress__fill"
              style={{ width: `${(destroyedCount / TARGET_DESTROYED) * 100}%` }} />
          </div>
          <p className="hurricane-progress__hint">👆 Toca los pensamientos para destruirlos</p>
        </div>
      )}
      {stage === 'tornado_retreat' && (
        <p className="hurricane-hint">🌪️ El tornado retrocede para revelar el espectáculo...</p>
      )}
      {stage === 'tornado_ascend' && (
        <p className="hurricane-hint">🌪️ El tornado se eleva llevándose todo...</p>
      )}
      {stage === 'fireworks' && (
        <p className="hurricane-hint">🎆 Los pensamientos explotan en el cielo...</p>
      )}
      {stage === 'parachuting' && (
        <p className="hurricane-hint">🪂 Tito y Lia regresan flotando...</p>
      )}

      {showVictory && (
        <div className="hurricane-victory">
          <div className="hurricane-victory__box">
            <div className="hurricane-victory__emoji">🌈</div>
            <h2>¡Calmaste la tormenta!</h2>
            <p>Todos los pensamientos negativos se disiparon.</p>
            <p>Respira profundo. Estás en calma. 🐾✨</p>
            <button className="hurricane-victory__btn" onClick={() => navigate('/games')}>
              ← Volver a juegos
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
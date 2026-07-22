import { useCallback, useEffect, useRef, useState } from 'react';

export type MicStatus =
  | 'idle'         // aún no se ha pedido el micrófono
  | 'requesting'   // esperando la respuesta al permiso
  | 'calibrating'  // midiendo el ruido de fondo
  | 'listening'    // escuchando de verdad
  | 'denied'       // dijo que no
  | 'unsupported'  // el navegador o el contexto no lo permiten
  | 'error';

interface UseBlowDetectionOptions {
  /** Solo escucha cuando esto es true. */
  enabled: boolean;
  /** Se llama una única vez al detectar un soplido sostenido. */
  onBlow: () => void;
  /** Cuánto hay que soplar seguido, en ms. */
  sustainMs?: number;
}

interface UseBlowDetectionResult {
  status: MicStatus;
  /** 0 a 1: fuerza del soplido detectado ahora mismo. */
  level: number;
  /** Debe llamarse desde un click; getUserMedia lo exige en iOS. */
  start: () => Promise<void>;
  stop: () => void;
}

const CALIBRATION_MS = 800;
/** Cuánto tiene que superar al ruido de fondo la banda grave (escala 0-255). */
const LOW_EXCESS_THRESHOLD = 28;
/** Un soplido tiene mucho más grave que agudo; hablar o reír, no. */
const LOW_OVER_HIGH_RATIO = 1.6;
/** Margen para no reiniciar la cuenta por un frame malo. */
const GRACE_MS = 120;

/**
 * Detecta un soplido real a través del micrófono.
 *
 * Cómo distingue un soplido de cualquier otro ruido:
 *
 * 1. Calibra 800ms el ruido de fondo. Sin esto solo funcionaría en silencio
 *    absoluto, y una fiesta de cumpleaños no es un sitio silencioso.
 * 2. Compara la energía de 60-400 Hz con la de 2-6 kHz. El aire contra el
 *    micrófono es casi todo grave; la voz y la música tienen mucho agudo.
 *    Esta relación es lo que evita que se apaguen las velas porque alguien
 *    se rió cerca del teléfono.
 * 3. Exige que la condición se mantenga 350ms seguidos.
 *
 * Importante: echoCancellation, noiseSuppression y autoGainControl van
 * DESACTIVADOS a propósito. Con los valores por defecto, Chrome clasifica el
 * soplido como ruido y lo elimina antes de que llegue al analizador.
 *
 * Esto siempre es un extra: la escena tiene además un botón de mantener
 * pulsado, y si el permiso se deniega no se vuelve a pedir nunca.
 */
export function useBlowDetection({
  enabled,
  onBlow,
  sustainMs = 350,
}: UseBlowDetectionOptions): UseBlowDetectionResult {
  const [status, setStatus] = useState<MicStatus>('idle');
  const [level, setLevel] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  const onBlowRef = useRef(onBlow);
  useEffect(() => { onBlowRef.current = onBlow; }, [onBlow]);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    // Soltar las pistas es lo que apaga el indicador de grabación del
    // teléfono. Si no se hace, parece que la app sigue escuchando.
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    analyserRef.current = null;
    setLevel(0);
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;

    // getUserMedia solo existe en contextos seguros: en http:// plano
    // ni siquiera está definido.
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      return;
    }

    setStatus('requesting');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
        },
      });
    } catch (err) {
      const name = (err as DOMException)?.name;
      setStatus(name === 'NotFoundError' || name === 'OverconstrainedError' ? 'unsupported' : 'denied');
      return;
    }

    streamRef.current = stream;

    let ctx: AudioContext;
    try {
      ctx = new AudioContext();
      // iOS arranca el contexto suspendido aunque venga de un gesto
      if (ctx.state === 'suspended') await ctx.resume();
    } catch {
      setStatus('error');
      stop();
      return;
    }
    ctxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.25;
    ctx.createMediaStreamSource(stream).connect(analyser);
    analyserRef.current = analyser;

    const bins = new Uint8Array(analyser.frequencyBinCount);
    const binHz = ctx.sampleRate / analyser.fftSize;
    // Se salta el bin 0-1 (continua y retumbe del propio teléfono)
    const lowFrom = Math.max(2, Math.ceil(60 / binHz));
    const lowTo = Math.floor(400 / binHz);
    const highFrom = Math.ceil(2000 / binHz);
    const highTo = Math.min(bins.length - 1, Math.floor(6000 / binHz));

    const mean = (from: number, to: number) => {
      let sum = 0;
      for (let i = from; i <= to; i++) sum += bins[i];
      return sum / Math.max(1, to - from + 1);
    };

    setStatus('calibrating');
    let noiseLow = 0;
    let noiseTotal = 0;
    let samples = 0;
    let heldMs = 0;
    let graceMs = 0;
    let lastTs = performance.now();
    const calibrationEnd = lastTs + CALIBRATION_MS;

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const a = analyserRef.current;
      if (!a) return;

      const now = performance.now();
      const dt = now - lastTs;
      lastTs = now;

      a.getByteFrequencyData(bins);
      const low = mean(lowFrom, lowTo);
      const high = mean(highFrom, highTo);
      const total = mean(0, bins.length - 1);

      // ── Calibración ────────────────────────────────────────────────────
      if (now < calibrationEnd) {
        noiseLow += low;
        noiseTotal += total;
        samples++;
        return;
      }
      if (samples > 0) {
        noiseLow /= samples;
        noiseTotal /= samples;
        samples = 0;
        setStatus('listening');
      }

      // ── Detección ──────────────────────────────────────────────────────
      const lowExcess = low - noiseLow;
      const isBlowing =
        lowExcess > LOW_EXCESS_THRESHOLD &&
        low > high * LOW_OVER_HIGH_RATIO &&
        total > noiseTotal + 15;

      setLevel(Math.max(0, Math.min(1, lowExcess / 70)));

      if (isBlowing) {
        heldMs += dt;
        graceMs = 0;
      } else {
        // Un frame suelto por debajo del umbral no debe reiniciar la cuenta
        graceMs += dt;
        if (graceMs > GRACE_MS) heldMs = 0;
      }

      if (heldMs >= sustainMs && !firedRef.current) {
        firedRef.current = true;
        onBlowRef.current();
        stop();
      }
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [stop, sustainMs]);

  // Deja de escuchar en cuanto deja de hacer falta, y al desmontar
  useEffect(() => {
    if (!enabled) stop();
    return () => stop();
  }, [enabled, stop]);

  return { status, level, start, stop };
}

export default useBlowDetection;

// src/utils/logger.ts
//
// Diario de Lu: envía al mismo Google Sheets de la v1 lo que pasa en la app.
//
// Qué cambia respecto de la versión anterior:
//   · Cada visita tiene un id de sesión, así en la hoja se pueden agrupar las
//     filas de una misma sesión en vez de ver eventos sueltos sin relación.
//   · Se manda el dispositivo, el navegador y la duración real, que es lo que
//     hacía falta para entender si algo se usó de verdad o se abrió y se cerró.
//   · Se registra cada juego: cuándo se abre, cuánto dura y si se completó.
//   · Si no hay conexión, el evento se guarda y se reintenta al volver. Antes
//     se perdía sin dejar rastro.
//   · El cierre de sesión se envía con sendBeacon, que sí sobrevive a cerrar
//     la pestaña; un fetch normal se cancelaba a medio camino.
//
// Todos los nombres de campo antiguos (type, date, time, initialLevel,
// finalLevel, duration, gameName, text, step, responses) se conservan tal cual
// para que el Apps Script existente siga escribiendo sus columnas de siempre.

const API_URL =
  'https://script.google.com/macros/s/AKfycbx5yyi489MxM7WmpM-4LEYRt6MvzQ4skH-cLrnF-iF7c9_VxOdUofdayP7tfAapA6Mg/exec';

const QUEUE_KEY = 'calma_log_queue';
const SESSION_KEY = 'calma_session_id';
const MAX_QUEUE = 50;

type Payload = Record<string, unknown>;

/** Id estable durante toda la pestaña; permite agrupar filas por visita. */
function sessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Marca temporal en la que arrancó la pestaña, para calcular duraciones. */
const SESSION_START = Date.now();

function detectDevice(): string {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'móvil';
  return 'escritorio';
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\//.test(ua)) return 'Opera';
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'otro';
}

function detectOS(): string {
  const ua = navigator.userAgent;
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'otro';
}

/** ¿Está abierta como app instalada o como pestaña del navegador? */
function detectInstalled(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches
    || (navigator as { standalone?: boolean }).standalone === true;
}

/** "3 min 24 s" lee mucho mejor que "204" en una celda. */
function humanDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  if (total < 60) return `${total} s`;
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return sec === 0 ? `${min} min` : `${min} min ${sec} s`;
}

// ── Cola de reintentos ────────────────────────────────────────────────────

function readQueue(): Payload[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as Payload[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: Payload[]) {
  try {
    // Se recorta por si alguien pasa semanas sin conexión: la cola no puede
    // crecer sin límite dentro de localStorage.
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-MAX_QUEUE)));
  } catch {
    // Almacenamiento lleno o bloqueado: se descarta y seguimos.
  }
}

function enqueue(payload: Payload) {
  writeQueue([...readQueue(), payload]);
}

async function post(payload: Payload): Promise<boolean> {
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });
    return true;
  } catch {
    return false;
  }
}

/** Reenvía lo que quedó pendiente de visitas anteriores. */
async function flushQueue() {
  const pending = readQueue();
  if (pending.length === 0) return;
  writeQueue([]);
  const failed: Payload[] = [];
  for (const item of pending) {
    if (!(await post(item))) failed.push(item);
  }
  if (failed.length) writeQueue([...failed, ...readQueue()]);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { void flushQueue(); });
  // Un pelín después de arrancar, para no competir con la carga de la escena.
  window.setTimeout(() => { void flushQueue(); }, 4000);
}

// ── API pública ───────────────────────────────────────────────────────────

export class Logger {
  /** Contexto común a todos los eventos. */
  private static base(type: string, data: Payload): Payload {
    const now = new Date();
    return {
      type,
      date: now.toLocaleDateString('es-ES'),
      time: now.toLocaleTimeString('es-ES'),
      timestamp: now.toISOString(),
      sessionId: sessionId(),
      sessionMinutes: +((Date.now() - SESSION_START) / 60000).toFixed(1),
      device: detectDevice(),
      os: detectOS(),
      browser: detectBrowser(),
      installed: detectInstalled() ? 'app' : 'navegador',
      screen: `${window.screen.width}x${window.screen.height}`,
      lang: navigator.language,
      ...data,
    };
  }

  private static async send(type: string, data: Payload) {
    const payload = this.base(type, data);
    if (!navigator.onLine) { enqueue(payload); return; }
    if (!(await post(payload))) enqueue(payload);
  }

  /**
   * Envío que sobrevive al cierre de la pestaña.
   *
   * fetch() se cancela cuando el documento se descarga, así que el evento de
   * "cerró la app" nunca llegaba a la hoja. sendBeacon lo entrega el navegador
   * por su cuenta después.
   */
  private static beacon(type: string, data: Payload) {
    const payload = this.base(type, data);
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: 'text/plain' });
      if (navigator.sendBeacon?.(API_URL, blob)) return;
    } catch { /* cae al camino normal */ }
    enqueue(payload);
  }

  /** Se llama cuando el usuario selecciona un nivel de ansiedad (inicio de sesión). */
  static logSession(initialLevel: number) {
    this.send('session', { initialLevel, finalLevel: null, duration: null });
  }

  /** Se llama cuando el nivel llega a 0 (fin de sesión). */
  static logSessionEnd(finalLevel: number, duration?: string) {
    this.send('session', {
      initialLevel: null,
      finalLevel,
      duration: duration ?? humanDuration(Date.now() - SESSION_START),
      outcome: 'calma alcanzada',
    });
  }

  /** El usuario abre un juego. */
  static logGameStart(gameName: string) {
    this.send('game', { gameName, event: 'inicio' });
  }

  /** El usuario termina o abandona un juego. */
  static logGameEnd(gameName: string, ms: number, completed: boolean) {
    this.send('game', {
      gameName,
      event: completed ? 'completado' : 'abandonado',
      duration: humanDuration(ms),
      durationSeconds: Math.round(ms / 1000),
    });
  }

  /** Texto escrito en Ritual de Soltar. */
  static logText(gameName: string, text: string) {
    this.send('text', {
      gameName,
      text,
      words: text.trim().split(/\s+/).filter(Boolean).length,
      chars: text.length,
    });
  }

  /** Respuestas del Grounding (un paso completo). */
  static logGrounding(step: string, responses: string) {
    this.send('grounding', { step, responses });
  }

  /** Última señal antes de cerrar: cuánto duró la visita en total. */
  static logVisitEnd(level: number) {
    this.beacon('visit', {
      finalLevel: level,
      duration: humanDuration(Date.now() - SESSION_START),
      durationSeconds: Math.round((Date.now() - SESSION_START) / 1000),
    });
  }
}

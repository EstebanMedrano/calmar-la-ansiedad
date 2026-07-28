// src/utils/logger.ts
// Logger silencioso para el Diario de Lu
// Envía datos al mismo Google Sheets de la v1

const API_URL =
  'https://script.google.com/macros/s/AKfycbx5yyi489MxM7WmpM-4LEYRt6MvzQ4skH-cLrnF-iF7c9_VxOdUofdayP7tfAapA6Mg/exec';

export class Logger {
  private static async send(type: string, data: Record<string, unknown>) {
    try {
      const now = new Date();
      const payload = {
        type,
        date: now.toLocaleDateString('es-ES'),
        time: now.toLocaleTimeString('es-ES'),
        ...data,
      };
      await fetch(API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Silencio absoluto
    }
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
      duration: duration ?? 'completado',
    });
  }

  /** Texto escrito en Ritual de Soltar. */
  static logText(gameName: string, text: string) {
    this.send('text', { gameName, text });
  }

  /** Respuestas del Grounding (un paso completo). */
  static logGrounding(step: string, responses: string) {
    this.send('grounding', { step, responses });
  }
}
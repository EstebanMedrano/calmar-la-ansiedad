import { Howl } from 'howler';
import { assetUrl } from '../utils/assetUrl';

/**
 * Música ambiente compartida por toda la app.
 *
 * Vive fuera de React porque debe sobrevivir a los cambios de pantalla: si la
 * creara un componente, cada navegación la cortaría y volvería a empezar.
 *
 * Dos reglas que no se pueden saltar:
 *
 * 1. No se crea hasta que hay un gesto de la persona. Los navegadores móviles
 *    bloquean cualquier sonido que no nazca de un toque, así que arrancarla
 *    al cargar la página no fallaba con un error: simplemente no sonaba nunca.
 *
 * 2. Siempre se puede silenciar. Es una app para la ansiedad; una música que
 *    no se puede callar es exactamente el tipo de cosa que la empeora.
 */

const STORAGE_KEY = 'lu_music_enabled';
const SRC = assetUrl('/assets/sounds/ambient-432hz.mp3');
const VOLUME = 0.2;

let howl: Howl | null = null;
let started = false;
const listeners = new Set<(enabled: boolean) => void>();

export function isMusicEnabled(): boolean {
  // Activada por defecto; solo se recuerda si la apagó.
  return localStorage.getItem(STORAGE_KEY) !== '0';
}

function emit() {
  const enabled = isMusicEnabled();
  listeners.forEach((fn) => fn(enabled));
}

export function subscribeMusic(fn: (enabled: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Arranca la música. Debe llamarse desde un gesto (un toque, un clic).
 * Llamarla varias veces no hace nada: solo la primera cuenta.
 */
export function startAmbient(): void {
  if (started || !isMusicEnabled()) return;
  started = true;
  try {
    howl = new Howl({ src: [SRC], volume: 0, loop: true, html5: false });
    howl.play();
    howl.fade(0, VOLUME, 2500);
  } catch {
    // Sin música la app funciona igual; no vale la pena romper nada por esto.
    started = false;
  }
}

export function setMusicEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  if (enabled) {
    if (howl) {
      howl.play();
      howl.fade(0, VOLUME, 800);
    } else {
      startAmbient();
    }
  } else if (howl) {
    howl.fade(howl.volume(), 0, 500);
    // Se pausa en vez de descargarse, para poder retomarla al instante.
    setTimeout(() => howl?.pause(), 520);
  }
  emit();
}

export function toggleMusic(): boolean {
  const next = !isMusicEnabled();
  setMusicEnabled(next);
  return next;
}
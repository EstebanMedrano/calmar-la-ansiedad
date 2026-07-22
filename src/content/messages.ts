/* ═══════════════════════════════════════════════════════════════════════
   ✏️  ESCRIBE AQUÍ LOS MENSAJES PARA LU
   ═══════════════════════════════════════════════════════════════════════

   Este es el ÚNICO archivo que necesitas tocar para cambiar los textos.

   Cómo escribir:
   · Cambia solo lo que está entre las comillas invertidas ( ` ).
   · Los saltos de línea se respetan tal cual los escribas.
   · Deja una línea en blanco para separar párrafos.
   · Puedes usar emojis y tildes sin problema 💛
   · No borres las comillas invertidas de arriba y de abajo.

   Los mensajes se escriben solos en pantalla, letra a letra, como si
   alguien los estuviera tecleando en ese momento.

   ═══════════════════════════════════════════════════════════════════════ */


/** Carta del carrusel. Se puede leer cualquier día del año. */
export const CARTA_MESSAGE = `
Lu,

<<< ESCRIBE AQUÍ TU MENSAJE >>>

Puedes escribir varios párrafos.
Solo deja una línea en blanco entre uno y otro.
`.trim();


/** Carta del regalo de cumpleaños. Solo aparece el 1 de agosto. */
export const BIRTHDAY_MESSAGE = `
Feliz cumpleaños, Lu.

<<< ESCRIBE AQUÍ TU MENSAJE DE CUMPLEAÑOS >>>
`.trim();


/** Firma que aparece al final de las dos cartas. Déjala vacía ('') para ocultarla. */
export const SIGNATURE = '';


/* ═══════════════════════════════════════════════════════════════════════
   Textos de la interfaz. Cámbialos solo si quieres otro tono.
   ═══════════════════════════════════════════════════════════════════════ */

export const UI_TEXT = {
  cartaHint: 'Toca para abrir la carta',
  skipHint: 'Toca para leerlo todo',
  readAgain: 'Leer de nuevo',
  backToGames: 'Volver a juegos',

  // Escena del regalo de cumpleaños
  giftIntro: 'Tito y Lia tienen algo para ti',
  blowPrompt: 'Sopla las velas',
  blowMicButton: 'Soplar con el micrófono',
  blowHoldButton: 'Mantén presionado para soplar',
  blowMicDenied: 'No pasa nada 💛 puedes soplar con el botón',
  blowMicUnsupported: '',
  blowMicListening: 'Te escucho... sopla',
} as const;

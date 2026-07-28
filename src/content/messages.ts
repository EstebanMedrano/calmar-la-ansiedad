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
"Eres como la luna"

Mi Lu
Muchas veces pareciera que la vida está en nuestra contra, por su manera tan peculiar de tratarnos y hacernos sentir, no es fácil, es bastante difícil lidiar con los desafíos que nos pone la vida, desafíos para los cuales no estamos listos muchas veces, pero tenemos que afrontarlo y tú mi Lu, eres una persona a admirar, por esa persistencia que tienes, por todas esas batallas que tienes con tus pensamientos a menudo o por las noches cuando te siente más vulnerable y sientes que no puedes con esto, las almas más bonitas florecen en medio del caos y el alma que tienes es lo que hizo que me encariñé de ti, pese a ser una niña muy preciosa y simpática, aún así es lo menos interesante de ti, sabes por qué? Porque en tu caos, yo veo magia y yo sé que pronto lo verás también, porque a parte de ser una niña inteligente, tienes esa persistencia por seguir intentando y es ahí donde la mayoría de las personas falla, pero tú no y eso te hace diferente al resto, mucho es poco para un todo como tú, eres la miedosa más valiente, la débil más fuerte, la odiosita más tierna y la insegura más resiliente, pudiste, puedes y podrás,  porque llorona si eres, pero cobarde jamás, por eso siento orgullo de ti :)
Estoy seguro que el de arriba tiene grandes planes para ti, Diosito sabe lo linda persona que eres y por eso te pone a prueba, porque sabe lo capaz que eres, sabe lo lejos que vas a llegar, además ese es el sentido de la vida, no? Si no que chiste tendría? La vida es un constante aprendizaje y ese miedo a que no salga bien las cosas es lo que hace darle un sentido a la vida, la noche es más oscura justo antes del amanecer y ya amanecerá para ti Luna.
Porque te digo luna? Porque eres como la luna, pero también eres más que solo "brillar en la oscuridad", transmites aquello que las personas suelen sentir cuando ven a la luna, elegancia, admiración, paz, tranquilidad. Así como la luna, tienes un brillo suave, no necesitas gritar para ser vista, tus palabras son  como su luz, serenas pero llenas de vida. Eres cambiante, pero siempre hermosa, como ella, misteriosa y fuerte, y aunque a veces te ocultas, se que siempre estás presente. Así como a la luna le suelen tapar las nubes, pero para ella nunca es suficiente para dejar de brillar, aunque hayan personas que quieran que dejes de brillar, nunca podrán apagar el brillo que transmites, es tu esencia y eso lo hace especial, tu eres especial.
Por eso te llamo luna, porque eres un reflejo de cosas bellas, eres la tranquilidad que no se puede encontrar viendo al abismo de un cielo oscuro, porque haces que mire al cielo, solo para buscarte y al encontrarte no puedo hacer más que contemplarte y apreciarte.
Así que no te me agaches la cabeza mi Luna, que se te cae la corona :)
Ánimos, tal vez hoy no fue un buen día, pero mejor piensa en como quieres que sean tus siguientes días y hazlos realidad, confío en ti y tu también tienes que hacerlo.
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

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import useCountdown from '../../hooks/useCountdown';
import type { Countdown } from '../../hooks/useCountdown';
import {
  getBirthdayTarget,
  isDevUnlocked,
  hasOpenedGift as readGiftOpened,
  markGiftOpened as persistGiftOpened,
} from '../../config/birthday';

interface BirthdayState {
  /** true cuando el regalo ya se puede abrir. */
  isUnlocked: boolean;
  /** true si está desbloqueado por ?unlock=1 y no porque llegó la fecha. */
  isDevUnlock: boolean;
  hasOpenedGift: boolean;
  /** true si el regalo está disponible pero no fue abierto aún. */
  hasUnopenedGift: boolean;
  markGiftOpened: () => void;
}

const BirthdayContext = createContext<BirthdayState | undefined>(undefined);

/*
 * La cuenta atrás vive en un contexto APARTE, y esto no es un capricho de
 * organización.
 *
 * useCountdown emite un valor nuevo cada segundo. Cuando eso estaba dentro del
 * mismo contexto que `isUnlocked`, el objeto del contexto cambiaba de identidad
 * cada segundo y con él se volvían a renderizar todos sus consumidores. Uno de
 * ellos es GameView, que es quien monta el juego: el resultado era que CUALQUIER
 * juego —el huracán, la carta, el rompecabezas— se re-renderizaba entero una vez
 * por segundo mientras se jugaba. Y como el <Text> de troika recompone su
 * textura de glifos en cada render, en el huracán eran veinte textos
 * regenerándose cada segundo sin que nada hubiera cambiado.
 *
 * Separados, el contexto de arriba solo cambia cuando cambia de verdad algo
 * (llega la fecha, o abre el regalo), y solo la tarjeta de la cuenta atrás se
 * suscribe al que late.
 */
const CountdownContext = createContext<Countdown | undefined>(undefined);

export function BirthdayProvider({ children }: { children: ReactNode }) {
  // La fecha se resuelve una sola vez: si se recalculara en cada render,
  // useCountdown reiniciaría su efecto continuamente.
  const target = useMemo(() => getBirthdayTarget(), []);
  const devUnlock = useMemo(() => isDevUnlocked(), []);

  const countdown = useCountdown(target);
  const [giftOpened, setGiftOpened] = useState(() => readGiftOpened());

  const markGiftOpened = useCallback(() => {
    persistGiftOpened();
    setGiftOpened(true);
  }, []);

  // Depende de isPast (un booleano), no del objeto countdown entero: así este
  // valor solo cambia una vez, en el instante exacto del desbloqueo.
  const unlocked = countdown.isPast || devUnlock;

  const value = useMemo<BirthdayState>(
    () => ({
      isUnlocked: unlocked,
      isDevUnlock: devUnlock && !countdown.isPast,
      hasOpenedGift: giftOpened,
      hasUnopenedGift: unlocked && !giftOpened,
      markGiftOpened,
    }),
    [unlocked, devUnlock, countdown.isPast, giftOpened, markGiftOpened],
  );

  return (
    <BirthdayContext.Provider value={value}>
      <CountdownContext.Provider value={countdown}>
        {children}
      </CountdownContext.Provider>
    </BirthdayContext.Provider>
  );
}

export function useBirthday() {
  const context = useContext(BirthdayContext);
  if (!context) {
    throw new Error('useBirthday debe usarse dentro de BirthdayProvider');
  }
  return context;
}

/**
 * Cuenta atrás que se actualiza cada segundo.
 *
 * Úsalo SOLO donde se muestren los números en pantalla. Cualquier componente
 * que llame a esto se va a renderizar una vez por segundo.
 */
export function useBirthdayCountdown(): Countdown {
  const context = useContext(CountdownContext);
  if (!context) {
    throw new Error('useBirthdayCountdown debe usarse dentro de BirthdayProvider');
  }
  return context;
}

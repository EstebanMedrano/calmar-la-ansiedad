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
  countdown: Countdown;
  /** true cuando el regalo ya se puede abrir. */
  isUnlocked: boolean;
  /** true si está desbloqueado por ?unlock=1 y no porque llegó la fecha. */
  isDevUnlock: boolean;
  hasOpenedGift: boolean;
  markGiftOpened: () => void;
}

const BirthdayContext = createContext<BirthdayState | undefined>(undefined);

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

  const value = useMemo<BirthdayState>(
    () => ({
      countdown,
      isUnlocked: countdown.isPast || devUnlock,
      isDevUnlock: devUnlock && !countdown.isPast,
      hasOpenedGift: giftOpened,
      markGiftOpened,
    }),
    [countdown, devUnlock, giftOpened, markGiftOpened],
  );

  return <BirthdayContext.Provider value={value}>{children}</BirthdayContext.Provider>;
}

export function useBirthday() {
  const context = useContext(BirthdayContext);
  if (!context) {
    throw new Error('useBirthday debe usarse dentro de BirthdayProvider');
  }
  return context;
}

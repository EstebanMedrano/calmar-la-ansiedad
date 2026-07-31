import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useBirthday, useBirthdayCountdown } from '../context/BirthdayContext';
import { BIRTHDAY_LABEL } from '../../config/birthday';
import useReducedMotion from '../../hooks/useReducedMotion';
import NotificationOptIn from './NotificationOptIn';
import './CountdownCard.scss';

interface UnitProps {
  value: number;
  label: string;
  /** Los segundos cambian constantemente: se muestran más apagados
      para que la tarjeta no distraiga. */
  muted?: boolean;
}

function Unit({ value, label, muted }: UnitProps) {
  const padded = String(value).padStart(2, '0');
  return (
    <div className={`cd-unit${muted ? ' cd-unit--muted' : ''}`}>
      <div className="cd-unit__value">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={padded}
            initial={{ y: '-55%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '55%', opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          >
            {padded}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="cd-unit__label">{label}</span>
    </div>
  );
}

/**
 * La "carta recordatorio" del regalo de cumpleaños.
 *
 * Aparece al terminar la intro (monta junto con Welcome, que es exactamente
 * cuando App deja de mostrar el SplashScreen) y también encima del carrusel.
 * Tiene dos estados: sobre cerrado con la cuenta atrás, y sobre abierto
 * brillando con el botón para entrar al regalo.
 */
export default function CountdownCard() {
  const { isUnlocked, hasOpenedGift } = useBirthday();
  const countdown = useBirthdayCountdown();
  const reducedMotion = useReducedMotion();
  const navigate = useNavigate();

  const { days, hours, minutes, seconds } = countdown;

  return (
    <motion.section
      className={`countdown-card${isUnlocked ? ' countdown-card--unlocked' : ''}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35, ease: [0.4, 0, 0.2, 1] }}
      aria-live="polite"
    >
      <motion.div
        className="countdown-card__envelope"
        aria-hidden="true"
        animate={
          reducedMotion
            ? undefined
            : isUnlocked
              ? { scale: [1, 1.05, 1] }
              : { scale: [1, 1.03, 1] }
        }
        transition={{ duration: isUnlocked ? 2.4 : 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="countdown-card__envelope-body">
          <div className="countdown-card__envelope-flap" />
          <div className="countdown-card__envelope-seal" />
        </div>
        {isUnlocked && <div className="countdown-card__glow" />}
      </motion.div>

      {isUnlocked ? (
        <>
          <h3 className="countdown-card__title">
            {hasOpenedGift ? 'Tu regalo sigue aquí' : 'Ya puedes abrirlo'}
          </h3>
          <p className="countdown-card__sub">
            {hasOpenedGift
              ? 'Puedes volver a verlo las veces que quieras.'
              : 'Te estaba esperando. Feliz cumpleaños.'}
          </p>
          <button className="countdown-card__cta" onClick={() => navigate('/game/birthday')}>
            {hasOpenedGift ? 'Verlo de nuevo' : 'Abrir mi regalo'}
          </button>
        </>
      ) : (
        <>
          <h3 className="countdown-card__title">Tengo algo para ti</h3>
          <p className="countdown-card__sub">Se abre el {BIRTHDAY_LABEL}</p>

          <div className="countdown-card__units">
            {days > 0 && <Unit value={days} label={days === 1 ? 'día' : 'días'} />}
            <Unit value={hours} label={hours === 1 ? 'hora' : 'horas'} />
            <Unit value={minutes} label="min" />
            <Unit value={seconds} label="seg" muted />
          </div>

          <NotificationOptIn />
        </>
      )}
    </motion.section>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import useNotifications from '../../notifications/useNotifications';
import { BIRTHDAY_LABEL } from '../../config/birthday';
import './NotificationOptIn.scss';

/**
 * Activación de las notificaciones.
 *
 * Nunca lanza el diálogo del navegador nada más entrar: primero un botón
 * discreto, luego una explicación propia de qué va a recibir exactamente, y
 * solo si dice que sí se pide el permiso del sistema. Un permiso denegado no
 * se puede volver a pedir, así que la única oportunidad hay que gastarla
 * cuando ya sabe qué le estamos ofreciendo.
 */
export default function NotificationOptIn() {
  const { permission, isSupported, needsInstall, request } = useNotifications();
  const [showModal, setShowModal] = useState(false);

  if (!isSupported) return null;

  // Ya las tiene activadas: no hay nada que mostrar
  if (permission === 'granted') return null;

  // Dijo que no. No se vuelve a preguntar nunca.
  if (permission === 'denied') {
    return <p className="notif-optin__muted">Sin notificaciones — no pasa nada</p>;
  }

  // En iOS solo funcionan desde la app instalada en la pantalla de inicio
  if (needsInstall) {
    return (
      <p className="notif-optin__muted">
        Para recibir avisos, añade el Refugio a tu pantalla de inicio
        <br />
        <span className="notif-optin__hint">Compartir → Añadir a inicio</span>
      </p>
    );
  }

  const accept = async () => {
    setShowModal(false);
    await request();
  };

  return (
    <>
      <button className="notif-optin__trigger" onClick={() => setShowModal(true)}>
        <Bell size={15} />
        Avísame cuando falte poco
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="notif-optin__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="notif-optin__modal"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="notif-optin__icon" aria-hidden="true">🔔</span>
              <h3>¿Te aviso?</h3>
              <p>
                Te avisaré cuando falten 7, 3 y 1 día, y el {BIRTHDAY_LABEL} a
                medianoche. Nada más.
              </p>
              <div className="notif-optin__actions">
                <button className="notif-optin__no" onClick={() => setShowModal(false)}>
                  Ahora no
                </button>
                <button className="notif-optin__yes" onClick={accept}>
                  Sí, avísame
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

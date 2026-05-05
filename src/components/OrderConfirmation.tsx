'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'

const FONT_SANS  = 'var(--font-montserrat-font), system-ui, sans-serif'
const FONT_SERIF = 'var(--font-playfair-display), Georgia, serif'

interface Props {
  orderId: string | number
  mesa: number
  total: number
  onDone: () => void
}

export default function OrderConfirmation({ orderId, mesa, total, onDone }: Props) {
  // Fermeture automatique après 5 secondes
  useEffect(() => {
    const timer = setTimeout(onDone, 5000)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10002,
        backgroundColor: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      {/* Icône check avec animation spring */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 16, delay: 0.1 }}
        style={{ fontSize: '4.5rem', marginBottom: '1.5rem', lineHeight: 1 }}
      >
        ✅
      </motion.div>

      {/* Titre */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        style={{
          margin: '0 0 0.5rem',
          color: '#D4A24C',
          fontFamily: FONT_SERIF,
          fontSize: 'clamp(1.5rem, 6vw, 2rem)',
          fontWeight: 400,
        }}
      >
        ¡Pedido confirmado!
      </motion.h1>

      {/* Mesa + Total */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        style={{
          margin: '0 0 1.25rem',
          color: '#9ca3af',
          fontFamily: FONT_SANS,
          fontSize: '0.9rem',
        }}
      >
        Mesa {mesa} · Total{' '}
        {total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
      </motion.p>

      {/* Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        style={{
          margin: '0 0 1rem',
          color: 'rgba(255,255,255,0.5)',
          fontFamily: FONT_SANS,
          fontSize: '0.82rem',
          lineHeight: 1.7,
          maxWidth: '300px',
        }}
      >
        Tu pedido ha sido enviado a la cocina. Te lo traerán a la mesa en unos minutos.
      </motion.p>

      {/* Numéro de commande */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
        style={{
          margin: '0 0 2.5rem',
          color: 'rgba(212, 162, 76, 0.5)',
          fontFamily: FONT_SANS,
          fontSize: '0.72rem',
          letterSpacing: '0.1em',
        }}
      >
        Pedido #{orderId}
      </motion.p>

      {/* Bouton retour à l'expérience */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
        whileTap={{ scale: 0.97 }}
        onClick={onDone}
        style={{
          padding: '0.875rem 2rem',
          background: 'linear-gradient(135deg, #C9A961 0%, #D4A24C 100%)',
          color: '#1a1a1a',
          border: 'none',
          borderRadius: '9999px',
          fontFamily: FONT_SANS,
          fontSize: '0.82rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(212, 162, 76, 0.3)',
        }}
      >
        Hacer otro pedido
      </motion.button>
    </motion.div>
  )
}

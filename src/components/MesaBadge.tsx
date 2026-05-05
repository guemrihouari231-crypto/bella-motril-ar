'use client'

import { motion } from 'framer-motion'
import { useMesa } from '@/lib/MesaContext'

export default function MesaBadge() {
  const { mesa } = useMesa()

  if (mesa === null) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: '0.45rem 1rem',
        background: 'rgba(212, 162, 76, 0.15)',
        border: '1px solid rgba(212, 162, 76, 0.5)',
        borderRadius: '2rem',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(212, 162, 76, 0.18)',
        color: 'white',
        fontFamily: 'var(--font-montserrat-font)',
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.14em',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: '0.85rem' }}>🪑</span>
      <span>MESA {mesa}</span>
    </motion.div>
  )
}

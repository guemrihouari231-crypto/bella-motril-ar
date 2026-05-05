'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/lib/CartContext'
import CartModal from './CartModal'

export default function CartIcon() {
  const { totalItems } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Bouton panier flottant — positionné sous le badge Mesa */}
      <motion.button
        key={totalItems}
        animate={totalItems > 0 ? { scale: [1, 1.18, 1] } : {}}
        transition={{ duration: 0.35 }}
        onClick={() => { if (totalItems > 0) setIsOpen(true) }}
        aria-label={`Panier — ${totalItems} article${totalItems !== 1 ? 's' : ''}`}
        style={{
          position: 'fixed',
          top: '4.5rem',
          right: '1rem',
          zIndex: 9998,
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: totalItems > 0
            ? 'rgba(212, 162, 76, 0.15)'
            : 'rgba(60, 60, 60, 0.15)',
          border: `1px solid ${totalItems > 0
            ? 'rgba(212, 162, 76, 0.5)'
            : 'rgba(100, 100, 100, 0.3)'}`,
          borderRadius: '50%',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          cursor: totalItems > 0 ? 'pointer' : 'default',
          boxShadow: totalItems > 0 ? '0 4px 20px rgba(212, 162, 76, 0.2)' : 'none',
          transition: 'background 300ms ease, border-color 300ms ease, box-shadow 300ms ease',
        }}
      >
        {/* Icône shopping bag SVG */}
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={totalItems > 0 ? '#D4A24C' : 'rgba(130,130,130,0.6)'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>

        {/* Badge rouge avec le nombre d'articles */}
        <AnimatePresence>
          {totalItems > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                width: '18px',
                height: '18px',
                background: '#ef4444',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.58rem',
                fontWeight: 700,
                color: 'white',
                fontFamily: 'system-ui, sans-serif',
                pointerEvents: 'none',
              }}
            >
              {totalItems > 9 ? '9+' : totalItems}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Modale du panier */}
      <AnimatePresence>
        {isOpen && <CartModal onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
    </>
  )
}

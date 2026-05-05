'use client'

import { motion } from 'framer-motion'
import { useCart } from '@/lib/CartContext'

const FONT_SANS = 'var(--font-montserrat-font), system-ui, sans-serif'

// Informations minimales sur la pizza passées en prop
interface PizzaInfo {
  id: string
  name: string
  price: number
}

interface Props {
  pizza: PizzaInfo
}

export default function AddToCartButton({ pizza }: Props) {
  const { addItem } = useCart()

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      whileTap={{ scale: 0.95 }}
      onClick={() => addItem(pizza)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.75rem',
        background: 'linear-gradient(135deg, #C9A961 0%, #D4A24C 100%)',
        color: '#1a1a1a',
        border: 'none',
        borderRadius: '9999px',
        fontFamily: FONT_SANS,
        fontSize: '0.82rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        cursor: 'pointer',
        boxShadow: '0 4px 24px rgba(212, 162, 76, 0.45)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>+</span>
      <span>Añadir al pedido · {pizza.price}€</span>
    </motion.button>
  )
}

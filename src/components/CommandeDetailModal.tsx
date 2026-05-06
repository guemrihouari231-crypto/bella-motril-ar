'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Commande } from '@/lib/types'

const FONT_SANS  = 'var(--font-montserrat-font), system-ui, sans-serif'
const FONT_SERIF = 'var(--font-playfair-display), Georgia, serif'

interface Props {
  commande: Commande | null
  onClose: () => void
}

// Styles des badges selon le statut
const ESTADO_BADGE: Record<Commande['estado'], { label: string; bg: string; color: string }> = {
  nuevo:      { label: '🆕 Nuevo',      bg: '#7f1d1d', color: '#fecaca' },
  preparando: { label: '🟡 Preparando', bg: '#78350f', color: '#fde68a' },
  listo:      { label: '✅ Listo',       bg: '#14532d', color: '#bbf7d0' },
}

export default function CommandeDetailModal({ commande, onClose }: Props) {
  const badge       = commande ? ESTADO_BADGE[commande.estado] : null
  const dateFormatted = commande
    ? new Intl.DateTimeFormat('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }).format(new Date(commande.created_at))
    : ''

  return (
    <AnimatePresence>
      {commande && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.75)',
              zIndex: 10000,
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />

          {/* Modale */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10001,
              width: 'min(480px, calc(100vw - 2rem))',
              maxHeight: '80vh',
              backgroundColor: '#1a1a1a',
              border: '1px solid rgba(201,169,97,0.4)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              fontFamily: FONT_SANS,
            }}
          >
            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(201,169,97,0.2)',
              flexShrink: 0,
            }}>
              <div>
                <p style={{ margin: 0, color: 'rgba(201,169,97,0.55)', fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                  Pedido #{commande.id}
                </p>
                <h2 style={{
                  margin: '3px 0 0',
                  color: '#C9A961',
                  fontFamily: FONT_SERIF,
                  fontSize: '1.5rem',
                  fontWeight: 400,
                }}>
                  Mesa {commande.mesa}
                </h2>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', fontSize: '1.2rem', padding: '0.25rem',
                }}
                aria-label="Cerrar"
              >✕</button>
            </div>

            {/* ── Contenu scrollable ─────────────────────────────────── */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '1.25rem 1.5rem',
              display: 'flex', flexDirection: 'column', gap: '1rem',
            }}>
              {/* Date + badge statut */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{dateFormatted}</span>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: badge!.bg,
                  color: badge!.color,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                }}>
                  {badge!.label}
                </span>
              </div>

              {/* Liste des items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {commande.items.map((item, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>
                      <strong style={{ color: 'white' }}>{item.quantity}×</strong> {item.name}
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: '0.82rem' }}>
                      {(item.price * item.quantity).toFixed(2)}€
                    </span>
                  </div>
                ))}
              </div>

              {/* Séparateur */}
              <div style={{ height: '1px', backgroundColor: 'rgba(201,169,97,0.18)' }} />

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>Total</span>
                <span style={{
                  color: '#C9A961',
                  fontFamily: FONT_SERIF,
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}>
                  {Number(commande.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                </span>
              </div>
            </div>

            {/* ── Footer ─────────────────────────────────────────────── */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid rgba(201,169,97,0.15)',
              flexShrink: 0,
            }}>
              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(201,169,97,0.1)',
                  border: '1px solid rgba(201,169,97,0.3)',
                  borderRadius: '8px',
                  color: '#C9A961',
                  fontFamily: FONT_SANS,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.08em',
                }}
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

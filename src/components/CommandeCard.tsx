'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Commande } from '@/lib/types'

const FONT_SANS  = 'var(--font-montserrat-font), system-ui, sans-serif'
const FONT_SERIF = 'var(--font-playfair-display), Georgia, serif'

interface Props {
  commande: Commande
  onUpdateStatus: (id: number, newStatus: 'preparando' | 'listo') => Promise<void>
}

// Calcule le temps écoulé depuis la création de la commande
function formatTimeAgo(createdAt: string): string {
  const seconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  if (seconds < 60) return `hace ${Math.max(0, seconds)} segundos`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  return `hace ${Math.floor(minutes / 60)} horas`
}

export default function CommandeCard({ commande, onUpdateStatus }: Props) {
  const [isLoading, setIsLoading] = useState(false)

  // Commande "nuevo" depuis plus de 5 minutes → alerte rouge vive
  const isLate = commande.estado === 'nuevo'
    && (Date.now() - new Date(commande.created_at).getTime()) > 5 * 60 * 1000

  // Couleur de bordure selon statut + retard
  const borderColor = commande.estado === 'nuevo'
    ? (isLate ? '#ff2020' : '#ef4444')
    : '#f59e0b'

  const handleUpdate = async (newStatus: 'preparando' | 'listo') => {
    setIsLoading(true)
    await onUpdateStatus(commande.id, newStatus)
    // Ne pas unset isLoading pour "listo" car la card disparaît via Realtime
    if (newStatus !== 'listo') setIsLoading(false)
  }

  return (
    <motion.div
      // Pulse du box-shadow pour signaler les nouvelles commandes
      animate={commande.estado === 'nuevo' ? {
        boxShadow: isLate
          ? ['0 0 0 0 rgba(255,32,32,0.5)', '0 0 0 14px rgba(255,32,32,0)', '0 0 0 0 rgba(255,32,32,0.5)']
          : ['0 0 0 0 rgba(239,68,68,0.35)', '0 0 0 10px rgba(239,68,68,0)', '0 0 0 0 rgba(239,68,68,0.35)'],
      } : { boxShadow: 'none' }}
      transition={commande.estado === 'nuevo'
        ? { duration: isLate ? 1.0 : 1.8, repeat: Infinity, ease: 'easeInOut' }
        : {}}
      style={{
        backgroundColor: '#242424',
        border: `2px solid ${borderColor}`,
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* ── En-tête : Mesa + badge + temps écoulé ──────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              color: '#C9A961',
              fontFamily: FONT_SANS,
              fontSize: '28px',
              fontWeight: 700,
              lineHeight: 1,
            }}>
              MESA {commande.mesa}
            </span>
            {isLate && <span style={{ fontSize: '20px' }}>🚨</span>}
          </div>
          <span style={{
            display: 'block',
            marginTop: '4px',
            color: '#6b7280',
            fontFamily: FONT_SANS,
            fontSize: '0.7rem',
          }}>
            {formatTimeAgo(commande.created_at)}
          </span>
        </div>

        {/* Badge estado */}
        <div style={{
          flexShrink: 0,
          padding: '4px 10px',
          borderRadius: '9999px',
          backgroundColor: commande.estado === 'nuevo' ? '#7f1d1d' : '#78350f',
          color: commande.estado === 'nuevo' ? '#fecaca' : '#fde68a',
          fontFamily: FONT_SANS,
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}>
          {commande.estado === 'nuevo' ? '🆕 NUEVO' : '🟡 EN PREPARACIÓN'}
        </div>
      </div>

      {/* ── Liste des items commandés ─────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {commande.items.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
          >
            <span style={{
              color: 'rgba(255,255,255,0.85)',
              fontFamily: FONT_SANS,
              fontSize: '0.95rem',
            }}>
              <strong style={{ color: 'white', fontSize: '1.05rem' }}>{item.quantity}×</strong>{' '}
              {item.name}
            </span>
            <span style={{ color: '#9ca3af', fontFamily: FONT_SANS, fontSize: '0.82rem', flexShrink: 0 }}>
              {(item.price * item.quantity).toFixed(2)}€
            </span>
          </div>
        ))}
      </div>

      {/* ── Séparateur gold ──────────────────────────────────────────── */}
      <div style={{ height: '1px', backgroundColor: 'rgba(201, 169, 97, 0.25)' }} />

      {/* ── Total ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ color: '#6b7280', fontFamily: FONT_SANS, fontSize: '0.75rem' }}>Total</span>
        <span style={{
          color: '#C9A961',
          fontFamily: FONT_SERIF,
          fontSize: '22px',
          fontWeight: 700,
        }}>
          {Number(commande.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
        </span>
      </div>

      {/* ── Bouton d'action (selon estado) ─────────────────────────── */}
      {commande.estado === 'nuevo' && (
        <button
          disabled={isLoading}
          onClick={() => handleUpdate('preparando')}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: isLoading ? 'rgba(245,158,11,0.35)' : '#f59e0b',
            color: isLoading ? 'rgba(255,255,255,0.4)' : '#1a1a1a',
            border: 'none',
            borderRadius: '10px',
            fontFamily: FONT_SANS,
            fontSize: '0.9rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 200ms ease',
          }}
        >
          {isLoading ? 'Actualizando...' : '▶ EN PREPARACIÓN'}
        </button>
      )}

      {commande.estado === 'preparando' && (
        <button
          disabled={isLoading}
          onClick={() => handleUpdate('listo')}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: isLoading ? 'rgba(34,197,94,0.35)' : '#22c55e',
            color: isLoading ? 'rgba(255,255,255,0.4)' : '#1a1a1a',
            border: 'none',
            borderRadius: '10px',
            fontFamily: FONT_SANS,
            fontSize: '0.9rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 200ms ease',
          }}
        >
          {isLoading ? 'Actualizando...' : '✓ LISTO'}
        </button>
      )}
    </motion.div>
  )
}

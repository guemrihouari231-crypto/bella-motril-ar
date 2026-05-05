'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useCart } from '@/lib/CartContext'
import { useMesa } from '@/lib/MesaContext'
import { supabase } from '@/lib/supabase'
import OrderConfirmation from './OrderConfirmation'

const FONT_SANS  = 'var(--font-montserrat-font), system-ui, sans-serif'
const FONT_SERIF = 'var(--font-playfair-display), Georgia, serif'

interface Props {
  onClose: () => void
}

// Résultat retourné par Supabase après insertion de la commande
interface OrderResult {
  id: string | number
  mesa: number
  total: number
}

export default function CartModal({ onClose }: Props) {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart()
  const { mesa } = useMesa()

  const [isLoading,   setIsLoading]   = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null)

  // Le bouton confirmer est actif seulement si panier non vide, mesa connu et pas en cours d'envoi
  const canConfirm = items.length > 0 && mesa !== null && !isLoading

  const handleConfirm = async () => {
    if (!canConfirm) return
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: sbError } = await supabase
        .from('commandes')
        .insert({
          mesa,
          items,         // tableau CartItem[] stocké en JSONB dans Supabase
          total: totalPrice,
          estado: 'nuevo',
        })
        .select()
        .single()

      if (sbError) throw sbError

      clearCart()
      setOrderResult({ id: data.id, mesa: data.mesa, total: data.total })
    } catch (err) {
      console.error('[CartModal] Erreur lors de l\'envoi de la commande:', err)
      setError('Error al enviar el pedido. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  // Si commande confirmée → afficher l'écran de confirmation
  if (orderResult) {
    return (
      <OrderConfirmation
        orderId={orderResult.id}
        mesa={orderResult.mesa}
        total={orderResult.total}
        onDone={onClose}
      />
    )
  }

  return (
    <>
      {/* Overlay sombre cliquable pour fermer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          zIndex: 10000,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Fenêtre modale */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 24 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10001,
          width: 'min(500px, calc(100vw - 2rem))',
          maxHeight: '82vh',
          backgroundColor: '#1a1a1a',
          border: '1px solid rgba(212, 162, 76, 0.4)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
        }}
      >
        {/* ── En-tête ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(212, 162, 76, 0.2)',
          flexShrink: 0,
        }}>
          <h2 style={{
            margin: 0,
            color: 'white',
            fontFamily: FONT_SERIF,
            fontSize: '1.25rem',
            fontWeight: 400,
          }}>
            Tu pedido
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: '1.2rem',
              lineHeight: 1,
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Liste des items (scrollable) ────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
          {items.length === 0 ? (
            /* Panier vide */
            <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛒</div>
              <p style={{
                color: '#6b7280',
                fontFamily: FONT_SANS,
                fontSize: '0.875rem',
                lineHeight: 1.7,
                maxWidth: '280px',
                margin: '0 auto',
              }}>
                Tu carrito está vacío. Apunta tu cámara hacia las pizzas para añadirlas.
              </p>
            </div>
          ) : (
            /* Liste des pizzas */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {items.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(212, 162, 76, 0.12)',
                    borderRadius: '10px',
                  }}
                >
                  {/* Nom + sous-total */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0,
                      color: 'white',
                      fontFamily: FONT_SANS,
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.name}
                    </p>
                    <p style={{
                      margin: '0.2rem 0 0',
                      color: 'rgba(212, 162, 76, 0.75)',
                      fontFamily: FONT_SANS,
                      fontSize: '0.72rem',
                    }}>
                      {item.price}€ × {item.quantity}{' '}
                      <span style={{ color: 'rgba(255,255,255,0.45)' }}>
                        = {(item.price * item.quantity).toFixed(2)}€
                      </span>
                    </p>
                  </div>

                  {/* Contrôles quantité */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Réduire quantité"
                      style={{
                        width: '28px', height: '28px',
                        borderRadius: '50%',
                        border: '1px solid rgba(212, 162, 76, 0.35)',
                        backgroundColor: 'transparent',
                        color: '#D4A24C',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        lineHeight: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >−</button>

                    <span style={{
                      color: 'white',
                      fontFamily: FONT_SANS,
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      minWidth: '1.25rem',
                      textAlign: 'center',
                    }}>
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Augmenter quantité"
                      style={{
                        width: '28px', height: '28px',
                        borderRadius: '50%',
                        border: '1px solid rgba(212, 162, 76, 0.35)',
                        backgroundColor: 'transparent',
                        color: '#D4A24C',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        lineHeight: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >+</button>
                  </div>

                  {/* Bouton supprimer */}
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label="Supprimer"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      padding: '0.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'rgba(239, 68, 68, 0.65)',
                      flexShrink: 0,
                    }}
                  >🗑️</button>
                </div>
              ))}
            </div>
          )}

          {/* Toast d'erreur Supabase */}
          {error && (
            <div style={{
              marginTop: '0.875rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#fca5a5',
              fontFamily: FONT_SANS,
              fontSize: '0.78rem',
              lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}
        </div>

        {/* ── Pied de page : total + mesa + bouton confirmer ───────────────── */}
        <div style={{
          padding: '1rem 1.5rem 1.25rem',
          borderTop: '1px solid rgba(212, 162, 76, 0.2)',
          flexShrink: 0,
          backgroundColor: 'rgba(0,0,0,0.15)',
        }}>
          {/* Total */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '0.6rem',
          }}>
            <span style={{ color: '#6b7280', fontFamily: FONT_SANS, fontSize: '0.78rem' }}>
              Total
            </span>
            <span style={{
              color: 'white',
              fontFamily: FONT_SANS,
              fontWeight: 700,
              fontSize: '1.25rem',
            }}>
              {totalPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
            </span>
          </div>

          {/* Numéro de mesa */}
          <div style={{ marginBottom: '1rem' }}>
            {mesa !== null ? (
              <span style={{ color: 'rgba(212, 162, 76, 0.75)', fontFamily: FONT_SANS, fontSize: '0.78rem' }}>
                🪑 Mesa {mesa}
              </span>
            ) : (
              <span style={{ color: '#f87171', fontFamily: FONT_SANS, fontSize: '0.78rem' }}>
                ⚠️ Mesa no detectada — escanea de nuevo el QR
              </span>
            )}
          </div>

          {/* Bouton confirmer la commande */}
          <motion.button
            whileTap={canConfirm ? { scale: 0.97 } : {}}
            onClick={handleConfirm}
            disabled={!canConfirm}
            style={{
              width: '100%',
              padding: '0.9rem',
              background: canConfirm
                ? 'linear-gradient(135deg, #C9A961 0%, #D4A24C 100%)'
                : 'rgba(70,70,70,0.5)',
              color: canConfirm ? '#1a1a1a' : '#555',
              border: 'none',
              borderRadius: '10px',
              fontFamily: FONT_SANS,
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              transition: 'background 300ms ease, color 300ms ease',
            }}
          >
            {isLoading ? 'Enviando...' : 'Confirmar pedido'}
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}

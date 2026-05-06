'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { Commande } from '@/lib/types'
import CommandeCard from '@/components/CommandeCard'

const FONT_SANS  = 'var(--font-montserrat-font), system-ui, sans-serif'
const FONT_SERIF = 'var(--font-playfair-display), Georgia, serif'
const PASSWORD   = 'cocina2026'

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

// ─── Son double-bip pour les nouvelles commandes ────────────────────────────
function playNotificationSound(): void {
  try {
    const AudioCtx = window.AudioContext
      || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    // Bip 1
    const osc1 = ctx.createOscillator(); const gain1 = ctx.createGain()
    osc1.connect(gain1); gain1.connect(ctx.destination)
    osc1.frequency.value = 880; osc1.type = 'sine'
    gain1.gain.setValueAtTime(0.3, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
    osc1.start(ctx.currentTime); osc1.stop(ctx.currentTime + 0.2)

    // Bip 2 plus aigu
    const osc2 = ctx.createOscillator(); const gain2 = ctx.createGain()
    osc2.connect(gain2); gain2.connect(ctx.destination)
    osc2.frequency.value = 1320; osc2.type = 'sine'
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.25)
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    osc2.start(ctx.currentTime + 0.25); osc2.stop(ctx.currentTime + 0.5)
  } catch (e) {
    console.warn('[Cocina] Audio non supporté:', e)
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CocinaPage() {
  const router = useRouter()
  const authAttempted = useRef(false) // évite le double prompt en mode Strict

  const [isAuthed,         setIsAuthed]         = useState(false)
  const [commandes,        setCommandes]         = useState<Commande[]>([])
  const [connectionStatus, setConnectionStatus]  = useState<ConnectionStatus>('connecting')
  const [, setTick] = useState(0) // déclenche re-render toutes les 10s pour le temps écoulé

  // ── Vérification du mot de passe ──────────────────────────────────────────
  useEffect(() => {
    if (authAttempted.current) return
    authAttempted.current = true

    if (sessionStorage.getItem('cocina_auth') === 'true') {
      setIsAuthed(true)
      return
    }
    const pwd = window.prompt('Contraseña de cocina:')
    if (pwd === PASSWORD) {
      sessionStorage.setItem('cocina_auth', 'true')
      setIsAuthed(true)
    } else {
      router.push('/')
    }
  }, [router])

  // ── Chargement initial des commandes du jour ──────────────────────────────
  const fetchCommandes = useCallback(async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    try {
      const { data, error } = await supabase
        .from('commandes')
        .select('*')
        .gte('created_at', today.toISOString())
        .in('estado', ['nuevo', 'preparando'])
        .order('created_at', { ascending: true })

      if (error) throw error
      setCommandes((data ?? []) as Commande[])
    } catch (err) {
      console.error('[Cocina] Erreur chargement commandes:', err)
    }
  }, [])

  useEffect(() => {
    if (isAuthed) fetchCommandes()
  }, [isAuthed, fetchCommandes])

  // ── Subscription Realtime ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthed) return

    const channel = supabase
      .channel('commandes-cocina')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'commandes' },
        (payload) => {
          const newCommande = payload.new as unknown as Commande
          if (newCommande.estado !== 'listo') {
            setCommandes(prev => [...prev, newCommande])
            playNotificationSound()
            if (navigator.vibrate) navigator.vibrate(200)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'commandes' },
        (payload) => {
          const updated = payload.new as unknown as Commande
          if (updated.estado === 'listo') {
            // Retire après 1 seconde — AnimatePresence joue l'animation de sortie pendant ce délai
            setTimeout(() => {
              setCommandes(prev => prev.filter(c => c.id !== updated.id))
            }, 1000)
          } else {
            setCommandes(prev => prev.map(c => c.id === updated.id ? updated : c))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'commandes' },
        (payload) => {
          const deleted = payload.old as Partial<Commande>
          if (deleted.id) setCommandes(prev => prev.filter(c => c.id !== deleted.id))
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED')
          setConnectionStatus('connected')
        else if (['CLOSED', 'CHANNEL_ERROR', 'TIMED_OUT'].includes(status))
          setConnectionStatus('disconnected')
        else
          setConnectionStatus('connecting')
      })

    return () => { supabase.removeChannel(channel) }
  }, [isAuthed])

  // ── Ticker toutes les 10 secondes pour rafraîchir le temps écoulé ─────────
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000)
    return () => clearInterval(interval)
  }, [])

  // ── Mise à jour du statut d'une commande ──────────────────────────────────
  const handleUpdateStatus = useCallback(async (id: number, newStatus: 'preparando' | 'listo') => {
    try {
      const { error } = await supabase
        .from('commandes')
        .update({ estado: newStatus })
        .eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error('[Cocina] Erreur mise à jour statut:', err)
    }
  }, [])

  // Plein écran pour les tablettes en cuisine
  const handleFullscreen = () => {
    document.documentElement.requestFullscreen().catch(err => {
      console.warn('[Cocina] Plein écran non disponible:', err)
    })
  }

  const newCount = commandes.filter(c => c.estado === 'nuevo').length

  const connectionLabel: Record<ConnectionStatus, string> = {
    connected:    '🟢 En línea',
    connecting:   '🟡 Conectando...',
    disconnected: '🔴 Desconectado',
  }

  // N'affiche rien tant que l'authentification n'est pas validée
  if (!isAuthed) return null

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      fontFamily: FONT_SANS,
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Header sticky ──────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(26,26,26,0.95)',
        borderBottom: '1px solid rgba(201, 169, 97, 0.35)',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        {/* Logo cuisine — tronqué si l'écran est trop étroit */}
        <span style={{
          color: '#C9A961',
          fontWeight: 700,
          fontSize: '0.82rem',
          letterSpacing: '0.08em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minWidth: 0,
          flexShrink: 1,
        }}>
          🍕 BELLA — COCINA
        </span>

        {/* Indicateur de connexion Realtime */}
        <span style={{
          fontSize: '0.7rem',
          fontWeight: 500,
          flexShrink: 0,
          color: connectionStatus === 'connected'    ? '#4ade80'
               : connectionStatus === 'connecting'   ? '#facc15'
               : '#f87171',
        }}>
          {connectionLabel[connectionStatus]}
        </span>

        {/* Droite : compteur nouvelles commandes + plein écran */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <AnimatePresence mode="wait">
            {newCount > 0 && (
              <motion.span
                key={newCount}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ color: '#fca5a5', fontWeight: 700, fontSize: '0.85rem' }}
              >
                🔔 {newCount}
              </motion.span>
            )}
          </AnimatePresence>

          <button
            onClick={handleFullscreen}
            style={{
              background: 'rgba(201, 169, 97, 0.1)',
              border: '1px solid rgba(201, 169, 97, 0.3)',
              borderRadius: '8px',
              color: '#C9A961',
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '0.4rem 0.6rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
              fontFamily: FONT_SANS,
            }}
          >
            📺
          </button>
        </div>
      </header>

      {/* ── Contenu principal ──────────────────────────────────────────────── */}
      {commandes.length === 0 ? (

        /* ── Empty state ─────────────────────────────────────────────────── */
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: '80px', lineHeight: 1, userSelect: 'none' }}
          >
            🍕
          </motion.div>
          <h1 style={{
            margin: 0,
            color: '#C9A961',
            fontFamily: FONT_SERIF,
            fontSize: '2rem',
            fontWeight: 700,
          }}>
            Esperando pedidos...
          </h1>
          <p style={{
            margin: 0,
            color: '#6b7280',
            fontFamily: FONT_SANS,
            fontSize: '1rem',
          }}>
            Las nuevas comandas aparecerán automáticamente
          </p>
        </div>

      ) : (

        /* ── Grille des commandes ─────────────────────────────────────────── */
        <div style={{
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
          gap: '16px',
          alignItems: 'start',
        }}>
          <AnimatePresence mode="popLayout">
            {commandes.map(commande => (
              <motion.div
                key={commande.id}
                layout
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, transition: { duration: 0.4 } }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <CommandeCard
                  commande={commande}
                  onUpdateStatus={handleUpdateStatus}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      )}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { Commande } from '@/lib/types'
import CommandeDetailModal from '@/components/CommandeDetailModal'
import {
  filterByPeriod,
  getPreviousPeriodRange,
  filterByDateRange,
  calculateRevenue,
  calculateAvgTicket,
  countByStatus,
  revenueByHour,
  revenueByDay,
  daysInCurrentMonth,
  topDishes,
  formatEuros,
  formatTimeAgo,
} from '@/lib/admin-utils'

const RevenueChart = dynamic(() => import('@/components/RevenueChart'), { ssr: false })

const FONT_SANS  = 'var(--font-montserrat-font), system-ui, sans-serif'
const FONT_SERIF = 'var(--font-playfair-display), Georgia, serif'
const GOLD = '#C9A961'

type Period = 'today' | 'week' | 'month'

export default function AdminPage() {
  const authAttempted = useRef(false)
  const [authed, setAuthed]           = useState(false)
  const [commandes, setCommandes]     = useState<Commande[]>([])
  const [period, setPeriod]           = useState<Period>('today')
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null)
  const [showAll, setShowAll]         = useState(false)
  const [liveFlash, setLiveFlash]     = useState(false)

  // ── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('admin_auth') === 'ok') { setAuthed(true); return }
    if (authAttempted.current) return
    authAttempted.current = true
    const pw = window.prompt('Contraseña de acceso:')
    if (pw === 'admin2026') {
      sessionStorage.setItem('admin_auth', 'ok')
      setAuthed(true)
    } else {
      window.location.href = '/'
    }
  }, [])

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchCommandes = useCallback(async () => {
    const since = new Date()
    since.setDate(since.getDate() - 90)
    const { data } = await supabase
      .from('commandes')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
    if (data) setCommandes(data as Commande[])
  }, [])

  useEffect(() => {
    if (!authed) return
    fetchCommandes()
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'commandes' }, () => {
        setLiveFlash(true)
        setTimeout(() => setLiveFlash(false), 800)
        fetchCommandes()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'commandes' }, () => {
        fetchCommandes()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [authed, fetchCommandes])

  // ── Derived data ────────────────────────────────────────────────────────────
  const filteredCommandes = useMemo(() => filterByPeriod(commandes, period), [commandes, period])

  const prevCommandes = useMemo(() => {
    const { start, end } = getPreviousPeriodRange(period)
    return filterByDateRange(commandes, start, end)
  }, [commandes, period])

  const revenue     = useMemo(() => calculateRevenue(filteredCommandes), [filteredCommandes])
  const prevRevenue = useMemo(() => calculateRevenue(prevCommandes),     [prevCommandes])
  const avgTicket   = useMemo(() => calculateAvgTicket(filteredCommandes), [filteredCommandes])
  const prevAvgTicket = useMemo(() => calculateAvgTicket(prevCommandes),  [prevCommandes])
  const statusCounts = useMemo(() => countByStatus(filteredCommandes),   [filteredCommandes])
  const orderCount   = filteredCommandes.length
  const prevOrderCount = prevCommandes.length

  const chartData = useMemo(() => {
    const now = new Date()
    if (period === 'today') return revenueByHour(filteredCommandes)
    if (period === 'week') {
      const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0)
      return revenueByDay(filteredCommandes, start, 7)
    }
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return revenueByDay(filteredCommandes, start, daysInCurrentMonth())
  }, [filteredCommandes, period])

  const chartXKey = period === 'today' ? 'hora' : 'fecha'

  const topDishesData = useMemo(() => topDishes(filteredCommandes).slice(0, 5), [filteredCommandes])
  const maxQty = topDishesData[0]?.quantity ?? 1

  const recentOrders = useMemo(
    () => (showAll ? filteredCommandes.slice(0, 50) : filteredCommandes.slice(0, 10)),
    [filteredCommandes, showAll],
  )

  const todayLabel = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date())

  // ── Delta helper ────────────────────────────────────────────────────────────
  function delta(current: number, prev: number): { pct: string; up: boolean } | null {
    if (prev === 0) return null
    const p = ((current - prev) / prev) * 100
    return { pct: `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`, up: p >= 0 }
  }

  if (!authed) return null

  const PERIOD_LABELS: Record<Period, string> = { today: 'Hoy', week: 'Semana', month: 'Mes' }

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: '#0f0f0f',
      color: 'white',
      fontFamily: FONT_SANS,
      padding: '1.5rem',
    }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem',
        }}>
          <div>
            <p style={{ margin: 0, color: `${GOLD}88`, fontSize: '0.65rem', letterSpacing: '0.15em' }}>
              BELLA MOTRIL
            </p>
            <h1 style={{
              margin: '4px 0 2px',
              fontFamily: FONT_SERIF,
              fontSize: '1.8rem',
              fontWeight: 400,
              color: GOLD,
            }}>
              Panel de Control
            </h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.72rem', textTransform: 'capitalize' }}>
              {todayLabel}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Live indicator */}
            <motion.div
              animate={{ opacity: liveFlash ? 1 : 0.7 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '4px 10px',
                border: `1px solid ${liveFlash ? '#22c55e' : 'rgba(34,197,94,0.3)'}`,
                borderRadius: '9999px',
                fontSize: '0.65rem',
                color: '#22c55e',
                transition: 'border-color 300ms',
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                backgroundColor: '#22c55e',
                display: 'inline-block',
              }} />
              Live
            </motion.div>

            {/* Period selector */}
            <div style={{
              display: 'flex',
              border: '1px solid rgba(201,169,97,0.2)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}>
              {(['today', 'week', 'month'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '6px 14px',
                    background: period === p ? `${GOLD}22` : 'transparent',
                    border: 'none',
                    borderRight: p !== 'month' ? '1px solid rgba(201,169,97,0.2)' : 'none',
                    color: period === p ? GOLD : '#6b7280',
                    fontFamily: FONT_SANS,
                    fontSize: '0.72rem',
                    fontWeight: period === p ? 700 : 400,
                    cursor: 'pointer',
                    letterSpacing: '0.05em',
                    transition: 'all 200ms',
                  }}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          {[
            {
              label: 'Ingresos',
              value: formatEuros(revenue),
              diff: delta(revenue, prevRevenue),
              icon: '💰',
            },
            {
              label: 'Pedidos',
              value: String(orderCount),
              diff: delta(orderCount, prevOrderCount),
              icon: '🧾',
              sub: `${statusCounts.nuevo} nuevo · ${statusCounts.preparando} prep · ${statusCounts.listo} listo`,
            },
            {
              label: 'Ticket Medio',
              value: formatEuros(avgTicket),
              diff: delta(avgTicket, prevAvgTicket),
              icon: '🎯',
            },
          ].map((card, i) => {
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                whileHover={{ scale: 1.02 }}
                style={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid rgba(201,169,97,0.15)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.7rem', letterSpacing: '0.08em' }}>
                      {card.label.toUpperCase()}
                    </p>
                    <p style={{
                      margin: '6px 0 0',
                      fontFamily: FONT_SERIF,
                      fontSize: '1.75rem',
                      fontWeight: 700,
                      color: 'white',
                      lineHeight: 1,
                    }}>
                      {card.value}
                    </p>
                    {card.sub && (
                      <p style={{ margin: '6px 0 0', color: '#4b5563', fontSize: '0.65rem' }}>
                        {card.sub}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: '1.5rem', opacity: 0.6 }}>{card.icon}</span>
                </div>

                {card.diff && (
                  <div style={{
                    marginTop: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: card.diff.up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    color: card.diff.up ? '#22c55e' : '#ef4444',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                  }}>
                    {card.diff.up ? '▲' : '▼'} {card.diff.pct}
                    <span style={{ color: '#4b5563', fontWeight: 400 }}>vs período ant.</span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* ── Chart ──────────────────────────────────────────────────────── */}
        <div style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid rgba(201,169,97,0.15)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '2rem',
        }}>
          <p style={{
            margin: '0 0 1rem',
            color: `${GOLD}99`,
            fontSize: '0.68rem',
            letterSpacing: '0.1em',
          }}>
            EVOLUCIÓN DE INGRESOS
          </p>
          <RevenueChart data={chartData} xKey={chartXKey} />
        </div>

        {/* ── Top dishes + Recent orders (2 columns on wide screens) ─────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          {/* Top dishes */}
          <div style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(201,169,97,0.15)',
            borderRadius: '12px',
            padding: '1.25rem',
          }}>
            <p style={{
              margin: '0 0 1rem',
              color: `${GOLD}99`,
              fontSize: '0.68rem',
              letterSpacing: '0.1em',
            }}>
              TOP 5 PLATOS
            </p>
            {topDishesData.length === 0 ? (
              <p style={{ color: '#4b5563', fontSize: '0.8rem', margin: 0 }}>Sin datos para este período</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {topDishesData.map((dish, i) => (
                  <motion.div
                    key={dish.name}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                  >
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem' }}>
                        {dish.name}
                      </span>
                      <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        {dish.quantity} uds · {formatEuros(dish.revenue)}
                      </span>
                    </div>
                    <div style={{
                      height: '4px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                    }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(dish.quantity / maxQty) * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] }}
                        style={{
                          height: '100%',
                          backgroundColor: i === 0 ? GOLD : `${GOLD}66`,
                          borderRadius: '9999px',
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Recent orders */}
          <div style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(201,169,97,0.15)',
            borderRadius: '12px',
            padding: '1.25rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p style={{
                margin: 0,
                color: `${GOLD}99`,
                fontSize: '0.68rem',
                letterSpacing: '0.1em',
              }}>
                PEDIDOS RECIENTES
              </p>
              {filteredCommandes.length > 10 && (
                <button
                  onClick={() => setShowAll(v => !v)}
                  style={{
                    background: 'none', border: 'none',
                    color: `${GOLD}88`, cursor: 'pointer',
                    fontSize: '0.65rem', letterSpacing: '0.08em',
                  }}
                >
                  {showAll ? 'Ver menos' : `Ver todos (${filteredCommandes.length})`}
                </button>
              )}
            </div>

            {recentOrders.length === 0 ? (
              <p style={{ color: '#4b5563', fontSize: '0.8rem', margin: 0 }}>Sin pedidos para este período</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <AnimatePresence initial={false}>
                  {recentOrders.map(c => {
                    const BADGE: Record<Commande['estado'], { label: string; color: string }> = {
                      nuevo:      { label: 'Nuevo',      color: '#fca5a5' },
                      preparando: { label: 'Prep.',      color: '#fde68a' },
                      listo:      { label: 'Listo',      color: '#86efac' },
                    }
                    const badge = BADGE[c.estado]
                    return (
                      <motion.button
                        key={c.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedCommande(c)}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '8px 10px',
                          background: 'none',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 150ms',
                          width: '100%',
                        }}
                        whileHover={{ backgroundColor: 'rgba(201,169,97,0.06)' }}
                      >
                        <div>
                          <span style={{ color: 'white', fontSize: '0.82rem' }}>
                            Mesa {c.mesa}
                          </span>
                          <span style={{ color: '#4b5563', fontSize: '0.72rem', marginLeft: '8px' }}>
                            #{c.id}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: badge.color, fontSize: '0.65rem', fontWeight: 700 }}>
                            {badge.label}
                          </span>
                          <span style={{ color: GOLD, fontSize: '0.8rem', fontWeight: 600 }}>
                            {Number(c.total).toFixed(2)}€
                          </span>
                          <span style={{ color: '#4b5563', fontSize: '0.65rem' }}>
                            {formatTimeAgo(c.created_at)}
                          </span>
                        </div>
                      </motion.button>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      <CommandeDetailModal
        commande={selectedCommande}
        onClose={() => setSelectedCommande(null)}
      />
    </div>
  )
}

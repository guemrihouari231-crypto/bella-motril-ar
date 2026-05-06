import type { Commande } from './types'

// ── Noms des jours en espagnol ────────────────────────────────────────────────
const DAY_NAMES_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// ── Filtre les commandes selon la période sélectionnée ───────────────────────
export function filterByPeriod(
  commandes: Commande[],
  period: 'today' | 'week' | 'month'
): Commande[] {
  const now = new Date()
  let startDate: Date

  if (period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  } else if (period === 'week') {
    startDate = new Date(now)
    startDate.setDate(now.getDate() - 6)
    startDate.setHours(0, 0, 0, 0)
  } else {
    // Mois courant depuis le 1er
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  }

  return commandes.filter(c => new Date(c.created_at) >= startDate)
}

// ── Range de la période précédente (pour comparaison KPI) ────────────────────
export function getPreviousPeriodRange(
  period: 'today' | 'week' | 'month'
): { start: Date; end: Date } {
  const now = new Date()

  if (period === 'today') {
    const d = new Date(now)
    d.setDate(d.getDate() - 1)
    return {
      start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0),
      end:   new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59),
    }
  }

  if (period === 'week') {
    // Les 7 jours précédant la semaine actuelle
    const end = new Date(now)
    end.setDate(end.getDate() - 7)
    end.setHours(23, 59, 59)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }

  // Mois précédent
  return {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0),
    end:   new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
  }
}

// ── Filtre par plage de dates explicite ──────────────────────────────────────
export function filterByDateRange(
  commandes: Commande[],
  start: Date,
  end: Date
): Commande[] {
  return commandes.filter(c => {
    const d = new Date(c.created_at)
    return d >= start && d <= end
  })
}

// ── CA total ─────────────────────────────────────────────────────────────────
export function calculateRevenue(commandes: Commande[]): number {
  return commandes.reduce((sum, c) => sum + Number(c.total), 0)
}

// ── Ticket moyen ─────────────────────────────────────────────────────────────
export function calculateAvgTicket(commandes: Commande[]): number {
  if (commandes.length === 0) return 0
  return calculateRevenue(commandes) / commandes.length
}

// ── Comptage par statut ───────────────────────────────────────────────────────
export function countByStatus(commandes: Commande[]): {
  nuevo: number
  preparando: number
  listo: number
} {
  return {
    nuevo:      commandes.filter(c => c.estado === 'nuevo').length,
    preparando: commandes.filter(c => c.estado === 'preparando').length,
    listo:      commandes.filter(c => c.estado === 'listo').length,
  }
}

// ── Revenus par tranche horaire (pour "Hoy") ──────────────────────────────────
export function revenueByHour(
  commandes: Commande[]
): Array<{ hora: string; ingresos: number }> {
  const map = new Map<number, number>()
  for (let h = 0; h < 24; h++) map.set(h, 0)

  for (const c of commandes) {
    const h = new Date(c.created_at).getHours()
    map.set(h, (map.get(h) ?? 0) + Number(c.total))
  }

  return Array.from(map.entries()).map(([h, ingresos]) => ({
    hora: `${String(h).padStart(2, '0')}h`,
    ingresos: Math.round(ingresos * 100) / 100,
  }))
}

// ── Revenus par jour à partir d'une date de départ ───────────────────────────
export function revenueByDay(
  commandes: Commande[],
  startDate: Date,
  days: number
): Array<{ fecha: string; ingresos: number }> {
  const entries: Array<{ key: string; label: string }> = []

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    // Semaine → nom du jour, mois → numéro du jour
    entries.push({
      key,
      label: days <= 7 ? DAY_NAMES_ES[d.getDay()] : String(d.getDate()).padStart(2, '0'),
    })
  }

  const map = new Map<string, number>(entries.map(e => [e.key, 0]))
  for (const c of commandes) {
    const key = c.created_at.slice(0, 10)
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + Number(c.total))
  }

  return entries.map(e => ({
    fecha: e.label,
    ingresos: Math.round((map.get(e.key) ?? 0) * 100) / 100,
  }))
}

// ── Nombre de jours dans le mois courant ─────────────────────────────────────
export function daysInCurrentMonth(): number {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
}

// ── Top des plats vendus (trié par quantité décroissante) ────────────────────
export function topDishes(commandes: Commande[]): Array<{
  name: string
  quantity: number
  revenue: number
}> {
  const map = new Map<string, { quantity: number; revenue: number }>()

  for (const c of commandes) {
    for (const item of c.items) {
      const prev = map.get(item.name) ?? { quantity: 0, revenue: 0 }
      map.set(item.name, {
        quantity: prev.quantity + item.quantity,
        revenue:  prev.revenue + item.price * item.quantity,
      })
    }
  }

  return Array.from(map.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.quantity - a.quantity)
}

// ── Format montant en euros (style espagnol) ──────────────────────────────────
export function formatEuros(n: number): string {
  return n.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €'
}

// ── Format temps écoulé court (pour listes) ───────────────────────────────────
export function formatTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60)         return `hace ${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60)         return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)           return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

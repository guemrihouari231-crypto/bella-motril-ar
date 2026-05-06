'use client'

// Recharts utilise des APIs DOM — ce composant est chargé dynamiquement (ssr: false)
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface Props {
  data: Record<string, string | number>[]
  xKey: string
}

export default function RevenueChart({ data, xKey }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(201,169,97,0.07)"
          vertical={false}
        />
        <XAxis
          dataKey={xKey}
          stroke="transparent"
          tick={{ fill: 'rgba(201,169,97,0.45)', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="transparent"
          tick={{ fill: 'rgba(201,169,97,0.45)', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => v > 0 ? `${v}€` : ''}
          width={40}
        />
        <Tooltip
          cursor={{ fill: 'rgba(201,169,97,0.06)' }}
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(201,169,97,0.35)',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'system-ui, sans-serif',
          }}
          labelStyle={{ color: '#C9A961', fontWeight: 600, marginBottom: '4px' }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [`${Number(value ?? 0).toFixed(2)} €`, 'Ingresos']}
        />
        <Bar dataKey="ingresos" fill="#C9A961" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

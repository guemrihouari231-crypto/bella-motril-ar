'use client'

import Link from 'next/link'
import { useState } from 'react'

// Lien discret vers /cocina — visible uniquement au staff
export default function CocinaLink() {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href="/cocina"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        marginTop: '0.4rem',
        color: hovered ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.28)',
        fontSize: '0.65rem',
        fontFamily: 'var(--font-montserrat-font), system-ui, sans-serif',
        textDecoration: 'none',
        letterSpacing: '0.12em',
        transition: 'color 300ms ease',
      }}
    >
      🔧 Acceso cocina
    </Link>
  )
}

import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Montserrat } from 'next/font/google'
import './globals.css'

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat-font',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Bella Motril — Menú AR',
  description: 'Experiencia de menú en realidad aumentada para Bella Motril Pizzeria',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0F0F0F',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`${playfairDisplay.variable} ${montserrat.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  )
}

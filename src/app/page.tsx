import Link from 'next/link'
import ParticlesCanvas from './ParticlesCanvas'
import MesaBadge from '@/components/MesaBadge'
import CartIcon from '@/components/CartIcon'

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

export default function Home() {
  return (
    <>
      <MesaBadge />
      <CartIcon />
      <main style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-darker)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <ParticlesCanvas />

      <div style={{ textAlign: 'center', maxWidth: '32rem', width: '100%', position: 'relative', zIndex: 1 }}>

        {/* Badge AR */}
        <div style={{
          display: 'inline-block',
          border: '1px solid rgba(212, 162, 76, 0.35)',
          padding: '5px 14px',
          marginBottom: '2rem',
          animation: `fadeIn 600ms ${EASE} 0ms both`,
        }}>
          <span style={{
            color: 'rgba(212, 162, 76, 0.65)',
            fontSize: '0.58rem',
            fontFamily: 'var(--font-montserrat-font)',
            letterSpacing: '5px',
            fontWeight: 600,
          }}>
            EXPERIENCIA AR
          </span>
        </div>

        {/* Bella */}
        <h1 style={{
          fontSize: 'clamp(3.5rem, 15vw, 6rem)',
          color: 'white',
          fontFamily: 'var(--font-playfair-display)',
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
          animation: `slideUp 700ms ${EASE} 200ms both`,
        }}>
          Bella
        </h1>

        {/* MOTRIL */}
        <h2 style={{
          fontSize: 'clamp(0.85rem, 3.5vw, 1.1rem)',
          color: 'var(--color-gold)',
          fontFamily: 'var(--font-montserrat-font)',
          letterSpacing: '0.55em',
          fontWeight: 600,
          marginTop: '0.2rem',
          marginBottom: '2rem',
          animation: `slideUp 700ms ${EASE} 400ms both`,
        }}>
          MOTRIL
        </h2>

        {/* Ornament */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '2rem',
          animation: `fadeIn 700ms ${EASE} 600ms both`,
        }}>
          <div style={{ width: '2.5rem', height: '1px', backgroundColor: 'var(--color-gold)', opacity: 0.35 }} />
          <span style={{ color: 'var(--color-gold)', opacity: 0.55, fontSize: '0.65rem' }}>✦</span>
          <div style={{ width: '2.5rem', height: '1px', backgroundColor: 'var(--color-gold)', opacity: 0.35 }} />
        </div>

        {/* Slogan */}
        <p style={{
          color: '#9ca3af',
          fontStyle: 'italic',
          fontSize: 'clamp(0.9rem, 3.5vw, 1.05rem)',
          fontFamily: 'var(--font-playfair-display)',
          marginBottom: '3.5rem',
          lineHeight: 1.7,
          animation: `fadeIn 700ms ${EASE} 800ms both`,
        }}>
          Donde la tradición italiana cobra vida
        </p>

        {/* CTA */}
        <div style={{ animation: `fadeIn 600ms ${EASE} 1000ms both` }}>
          <Link
            href="/ar"
            className="btn-cta-home"
            style={{ fontFamily: 'var(--font-montserrat-font)', fontWeight: 600 }}
          >
            INICIAR EXPERIENCIA AR
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
        left: 0,
        right: 0,
        textAlign: 'center',
        animation: `fadeIn 700ms ${EASE} 1200ms both`,
        zIndex: 1,
      }}>
        <p style={{
          color: 'white',
          opacity: 0.4,
          fontSize: '0.62rem',
          fontFamily: 'var(--font-montserrat-font)',
          letterSpacing: '0.18em',
        }}>
          Costa Tropical · Andalucía
        </p>
      </div>
    </main>
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'bella-ar-muted'

interface Props {
  onMuteChange: (muted: boolean) => void
}

export default function AudioMuteButton({ onMuteChange }: Props) {
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'true') {
      setIsMuted(true)
      onMuteChange(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    const next = !isMuted
    setIsMuted(next)
    localStorage.setItem(STORAGE_KEY, String(next))
    onMuteChange(next)
  }

  return (
    <button
      onClick={toggle}
      aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '38px',
        height: '38px',
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.12)',
        color: isMuted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)',
        cursor: 'pointer',
        transition: 'color 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        padding: 0,
      }}
    >
      {isMuted ? (
        /* Muted icon */
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        /* Sound on icon */
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  )
}

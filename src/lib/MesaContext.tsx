'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface MesaContextValue {
  mesa: number | null
}

const MesaContext = createContext<MesaContextValue>({ mesa: null })

const STORAGE_KEY = 'bella-mesa'

export function MesaProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const raw = searchParams.get('mesa')
  const parsed = raw !== null ? parseInt(raw, 10) : null
  const urlMesa = parsed !== null && !isNaN(parsed) ? parsed : null

  // Initialise depuis l'URL — après montage lit sessionStorage comme fallback (ex: page /ar)
  const [mesa, setMesa] = useState<number | null>(urlMesa)

  useEffect(() => {
    if (urlMesa !== null) {
      // Persiste le numéro de table pour toutes les pages de la session
      sessionStorage.setItem(STORAGE_KEY, String(urlMesa))
      setMesa(urlMesa)
    } else {
      // Pas de param dans l'URL → essaie sessionStorage (navigation interne)
      const stored = sessionStorage.getItem(STORAGE_KEY)
      setMesa(stored ? (parseInt(stored, 10) || null) : null)
    }
  }, [urlMesa])

  return (
    <MesaContext.Provider value={{ mesa }}>
      {children}
    </MesaContext.Provider>
  )
}

export function useMesa(): MesaContextValue {
  return useContext(MesaContext)
}

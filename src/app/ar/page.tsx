'use client'

import dynamic from 'next/dynamic'

// ssr:false is allowed here because this is a Client Component ('use client').
// ARScene uses Three.js + MindAR which require browser APIs.
const ARScene = dynamic(() => import('./ARScene'), { ssr: false })

export default function ARPage() {
  return <ARScene />
}

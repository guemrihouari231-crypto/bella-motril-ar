'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import Link from 'next/link'
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js'
import WhatsAppButton from './WhatsAppButton'
import AudioMuteButton from './AudioMuteButton'
import CartIcon from '@/components/CartIcon'
import AddToCartButton from '@/components/AddToCartButton'

interface PizzaConfig {
  id:           string
  name:         string
  price:        number
  file:         string
  anchorIndex:  number
  baseRotation: { x: number; y: number; z: number }
}

const PIZZAS: PizzaConfig[] = [
  { id: 'margherita',       name: 'Margherita',      price: 12, file: '/3d-models/margherita.glb',       anchorIndex: 0, baseRotation: { x: 0, y: 0, z: 0 } },
  { id: 'diavola',          name: 'Diavola',          price: 14, file: '/3d-models/diavola.glb',          anchorIndex: 1, baseRotation: { x: 0, y: 0, z: 0 } },
  { id: 'quattro-formaggi', name: 'Quattro Formaggi', price: 13, file: '/3d-models/quattro-formaggi.glb', anchorIndex: 2, baseRotation: { x: 0, y: 0, z: 0 } },
]

const BOARD_KEYWORDS = ['pala', 'board', 'wood', 'planche', 'plank', 'plate', 'tray', 'piedest', 'base_plate']
const MODEL_TARGET_SIZE = 1.0

function normalizeModel(model: THREE.Group, pizza: PizzaConfig): number {
  const allMeshes: THREE.Mesh[] = []
  model.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (mesh.isMesh) allMeshes.push(mesh)
  })
  console.log(`[AR] ── ${pizza.name} (${allMeshes.length} meshes) ───────────`)
  allMeshes.forEach((m, i) => console.log(`[AR]   [${i + 1}] "${m.name}"`))

  const boardMeshes = allMeshes.filter((m) =>
    BOARD_KEYWORDS.some((kw) => m.name.toLowerCase().includes(kw))
  )
  const visibleAfterMask = allMeshes.length - boardMeshes.length

  if (boardMeshes.length > 0 && visibleAfterMask > 0) {
    boardMeshes.forEach((m) => { m.visible = false })
    console.log(`[AR] ${pizza.name}: ${boardMeshes.length} mesh(es) masqués, ${visibleAfterMask} restant(s)`)
  } else if (boardMeshes.length === 0) {
    console.log(`[AR] ${pizza.name}: aucun mesh "planche" détecté`)
  } else {
    console.warn(`[AR] ${pizza.name}: masquer les planches cacherait TOUT — ignoré`)
  }

  model.rotation.set(pizza.baseRotation.x, pizza.baseRotation.y, pizza.baseRotation.z)

  const rawBox  = new THREE.Box3().setFromObject(model)
  const rawSize = rawBox.getSize(new THREE.Vector3())
  const maxDim  = Math.max(rawSize.x, rawSize.y, rawSize.z)
  const scale   = maxDim > 0 ? MODEL_TARGET_SIZE / maxDim : 1
  model.scale.setScalar(scale)

  const scaledBox = new THREE.Box3().setFromObject(model)
  const center    = scaledBox.getCenter(new THREE.Vector3())
  model.position.set(-center.x, 0.1, -center.z)

  console.log(`[AR] ${pizza.name} scale: ${scale.toFixed(4)}`)
  return scale
}

const FONT_SERIF = 'var(--font-playfair-display), Georgia, serif'
const FONT_SANS  = 'var(--font-montserrat-font), system-ui, sans-serif'

type ARState = 'loading' | 'permission-denied' | 'initializing' | 'ready' | 'error'

function playDing(isMuted: boolean): void {
  if (isMuted) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext
    if (!Ctor) return
    const ctx = new Ctor() as AudioContext
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4)
    gain.gain.setValueAtTime(0.22, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 1.0)
    osc.onended = () => { ctx.close() }
  } catch { /* AudioContext unavailable */ }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// ─────────────────────────────────────────────────────────────────────────────

export default function ARScene() {
  const containerRef      = useRef<HTMLDivElement>(null)
  const particlesCanvasRef = useRef<HTMLCanvasElement>(null)
  const cleanupRef        = useRef<(() => void) | null>(null)
  const activeTargets     = useRef(0)
  const isMutedRef        = useRef(false)
  const pizzaScales       = useRef<number[]>([1, 1, 1])
  const entryAnims        = useRef<Map<number, { startTime: number; targetScale: number }>>(new Map())

  const [arState,        setArState]        = useState<ARState>('loading')
  const [loadingProgress,setLoadingProgress]= useState(5)
  const [loadingMessage, setLoadingMessage] = useState('Inicializando experiencia...')
  const [loadingFading,  setLoadingFading]  = useState(false)
  const [activePizzaName,setActivePizzaName]= useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingFading,setOnboardingFading] = useState(false)
  const [errorMessage,   setErrorMessage]   = useState('')
  const [retryKey,       setRetryKey]       = useState(0)

  const handleMuteChange = useCallback((muted: boolean) => {
    isMutedRef.current = muted
  }, [])

  // ── Steam particles on pizza detection ────────────────────────────────────
  useEffect(() => {
    const canvas = particlesCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (!activePizzaName) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    interface Steam {
      x: number; y: number; size: number
      vy: number; vx: number; opacity: number; life: number
    }

    const MAX = 30
    const particles: Steam[] = []
    let animId: number
    let frames = 0
    let fpsCheckAt = performance.now()
    let enabled = true

    const spawn = (): Steam => ({
      x:       canvas.width * 0.5 + (Math.random() - 0.5) * 130,
      y:       canvas.height * 0.6,
      size:    Math.random() * 10 + 3,
      vy:      -(Math.random() * 0.75 + 0.2),
      vx:      (Math.random() - 0.5) * 0.45,
      opacity: Math.random() * 0.3 + 0.07,
      life:    1.0,
    })

    const animate = () => {
      const now = performance.now()
      frames++
      if (now - fpsCheckAt > 2000) {
        const fps = (frames * 1000) / (now - fpsCheckAt)
        if (fps < 30) enabled = false
        frames = 0
        fpsCheckAt = now
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (enabled) {
        if (particles.length < MAX && Math.random() < 0.4) particles.push(spawn())

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]
          p.x += p.vx
          p.y += p.vy
          p.life -= 0.005
          p.size += 0.06

          if (p.life <= 0) { particles.splice(i, 1); continue }

          const a = p.life * p.opacity
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
          g.addColorStop(0, `rgba(255, 242, 210, ${a})`)
          g.addColorStop(1, `rgba(255, 242, 210, 0)`)
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = g
          ctx.fill()
        }
      }

      animId = requestAnimationFrame(animate)
    }

    animate()
    return () => {
      cancelAnimationFrame(animId)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [activePizzaName])

  // ── Screen orientation lock (prevents rotation during AR) ─────────────────
  useEffect(() => {
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
    orientation?.lock?.('portrait').catch(() => { /* permission denied — ignore */ })
    return () => { (orientation as { unlock?: () => void })?.unlock?.() }
  }, [])

  // ── Main AR init ───────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true
    let onboardingTimer: ReturnType<typeof setTimeout> | undefined

    // Reset per-run state
    entryAnims.current.clear()
    pizzaScales.current = [1, 1, 1]
    activeTargets.current = 0

    let maxProgress = 0
    const setProgress = (progress: number, message: string) => {
      if (!mounted) return
      if (progress > maxProgress) {
        maxProgress = progress
        setLoadingProgress(progress)
      }
      setLoadingMessage(message)
    }

    let modelsLoaded = 0
    const pizzaModels: (THREE.Group | null)[] = [null, null, null]

    const modelsReady = (async () => {
      const loader = new GLTFLoader()
      try {
        const { MeshoptDecoder } = await import(
          /* webpackChunkName: "meshopt" */
          'three/examples/jsm/libs/meshopt_decoder.module.js'
        )
        loader.setMeshoptDecoder(MeshoptDecoder)
      } catch (e) {
        console.warn('[AR] MeshoptDecoder unavailable:', e)
      }

      return Promise.all(
        PIZZAS.map((pizza, i) =>
          new Promise<void>((resolve) => {
            loader.load(
              pizza.file,
              (gltf) => {
                const model = gltf.scene
                const scale = normalizeModel(model, pizza)
                pizzaModels[i]        = model
                pizzaScales.current[i] = scale
                modelsLoaded++
                setProgress(15 + modelsLoaded * 20, `Cargando pizzas (${modelsLoaded}/3)...`)
                resolve()
              },
              undefined,
              (err) => {
                console.error(`[AR] Failed to load ${pizza.name}:`, err)
                pizzaModels[i] = null
                modelsLoaded++
                setProgress(15 + modelsLoaded * 20, `Cargando pizzas (${modelsLoaded}/3)...`)
                resolve()
              }
            )
          })
        )
      )
    })()

    const init = async () => {
      setProgress(5, 'Inicializando experiencia...')

      if (!navigator.mediaDevices?.getUserMedia) {
        const msg = 'Tu navegador no soporta acceso a la cámara. Asegúrate de usar HTTPS.'
        if (mounted) { setErrorMessage(msg); setArState('error') }
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        stream.getTracks().forEach((t) => t.stop())
      } catch (err) {
        console.warn('[AR] Camera denied:', err)
        if (mounted) setArState('permission-denied')
        return
      }

      if (!mounted || !containerRef.current) return
      setArState('initializing')

      await modelsReady

      const anyLoaded = pizzaModels.some(Boolean)
      if (!anyLoaded) {
        if (mounted) {
          setErrorMessage('No se pudieron cargar los modelos 3D. Verifica que los archivos .glb estén en public/3d-models/')
          setArState('error')
        }
        return
      }

      setProgress(78, 'Activando cámara AR...')

      try {
        if (!mounted || !containerRef.current) return

        const mindarThree = new MindARThree({
          container:      containerRef.current,
          imageTargetSrc: '/ar-targets/targets.mind',
          maxTrack:       3,
          uiLoadingPath:  '',
          uiScanning:     false,
          uiError:        false,
        })

        const { renderer, scene, camera } = mindarThree

        // Lighting
        scene.add(new THREE.AmbientLight(0xffffff, 0.6))
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
        dirLight.position.set(0, 5, 0)
        scene.add(dirLight)
        const goldLight = new THREE.PointLight(0xD4A24C, 1.0, 10)
        goldLight.position.set(0, 3, 0)
        scene.add(goldLight)

        // Anchors + models
        PIZZAS.forEach((pizza, i) => {
          const anchor = mindarThree.addAnchor(pizza.anchorIndex)
          const model  = pizzaModels[i]
          if (model) anchor.group.add(model)

          anchor.onTargetFound = () => {
            if (!mounted) return
            activeTargets.current++
            console.log(`[AR] Found: ${pizza.name} (${activeTargets.current} active)`)
            setActivePizzaName(pizza.name)

            // Entry animation: scale from 0
            if (model) {
              model.scale.setScalar(0)
              entryAnims.current.set(i, { startTime: Date.now(), targetScale: pizzaScales.current[i] })
            }

            playDing(isMutedRef.current)
            clearTimeout(onboardingTimer)

            // Fade out onboarding if visible
            setOnboardingFading(true)
            setTimeout(() => {
              if (!mounted) return
              setShowOnboarding(false)
              setOnboardingFading(false)
            }, 300)
          }

          anchor.onTargetLost = () => {
            if (!mounted) return
            activeTargets.current = Math.max(0, activeTargets.current - 1)
            entryAnims.current.delete(i)
            console.log(`[AR] Lost: ${pizza.name} (${activeTargets.current} active)`)
            if (activeTargets.current === 0) setActivePizzaName(null)
          }
        })

        setProgress(88, 'Activando cámara AR...')
        await mindarThree.start()
        console.log('[AR] MindAR started.')
        setProgress(100, '¡Listo!')

        if (!mounted) { try { mindarThree.stop() } catch { /* */ }; return }

        // Brief pause to show "¡Listo!" then fade out loading screen
        await sleep(350)
        if (!mounted) return

        setLoadingFading(true)
        await sleep(500)
        if (!mounted) return

        setArState('ready')
        setLoadingFading(false)

        // Show onboarding overlay after 3s if no pizza detected
        onboardingTimer = setTimeout(() => {
          if (activeTargets.current === 0 && mounted) setShowOnboarding(true)
        }, 3000)

        // Render loop: rotation + entry animations + subtle pulse
        renderer.setAnimationLoop(() => {
          const now = Date.now()
          pizzaModels.forEach((model, i) => {
            if (!model) return
            model.rotation.y += 0.01

            const anim = entryAnims.current.get(i)
            if (anim) {
              const t = Math.min((now - anim.startTime) / 500, 1)
              const eased = 1 - Math.pow(1 - t, 3) // cubic ease-out
              model.scale.setScalar(anim.targetScale * eased)
              if (t >= 1) entryAnims.current.delete(i)
            } else {
              // Subtle breathing pulse after entry
              const pulse = 1 + Math.sin(now * 0.0018) * 0.012
              model.scale.setScalar(pizzaScales.current[i] * pulse)
            }
          })
          renderer.render(scene, camera)
        })

        cleanupRef.current = () => {
          clearTimeout(onboardingTimer)
          renderer.setAnimationLoop(null)
          try { mindarThree.stop() } catch { /* */ }
          pizzaModels.forEach((model) => {
            if (!model) return
            model.traverse((child) => {
              const mesh = child as THREE.Mesh
              if (!mesh.isMesh) return
              mesh.geometry?.dispose()
              const mat = mesh.material
              if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
              else mat?.dispose()
            })
          })
          renderer.dispose()
        }
      } catch (err) {
        console.error('[AR] Error:', err)
        if (mounted) {
          setErrorMessage(err instanceof Error ? err.message : String(err))
          setArState('error')
        }
      }
    }

    init()

    return () => {
      mounted = false
      clearTimeout(onboardingTimer)
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [retryKey])

  const isLoading = arState === 'loading' || arState === 'initializing'
  // Pizza actuellement trackée avec id et prix — utilisée pour AddToCartButton
  const activePizza = PIZZAS.find(p => p.name === activePizzaName) ?? null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#000',
      overflow: 'hidden',
      touchAction: 'none',
    }}>
      {/* MindAR canvas + video target */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* Steam particles overlay */}
      <canvas
        ref={particlesCanvasRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}
      />

      {/* Icône panier flottante */}
      <CartIcon />

      {/* Gold radial glow when pizza detected */}
      {activePizzaName && arState === 'ready' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 55%, rgba(212,162,76,0.09) 0%, transparent 62%)',
          pointerEvents: 'none',
          zIndex: 9,
          animation: 'fadeIn 500ms ease',
        }} />
      )}

      {/* ── Back button ─────────────────────────────────────────────────────── */}
      <Link href="/" style={{
        position: 'absolute',
        top: 'calc(1rem + env(safe-area-inset-top))',
        left: '1rem',
        zIndex: 50,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.5rem 0.875rem',
        backgroundColor: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '8px',
        color: 'rgba(255,255,255,0.9)',
        fontSize: '0.875rem',
        fontFamily: FONT_SANS,
        textDecoration: 'none',
        border: '1px solid rgba(255,255,255,0.12)',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        ← Volver
      </Link>

      {/* ── Mute button ─────────────────────────────────────────────────────── */}
      {arState === 'ready' && (
        <div style={{
          position: 'absolute',
          top: 'calc(1rem + env(safe-area-inset-top))',
          right: '1rem',
          zIndex: 50,
        }}>
          <AudioMuteButton onMuteChange={handleMuteChange} />
        </div>
      )}

      {/* ── Bouton "Añadir al pedido" — CTA principal ───────────────────────── */}
      {activePizza && arState === 'ready' && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(5.5rem + env(safe-area-inset-bottom))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
        }}>
          <AddToCartButton pizza={activePizza} />
        </div>
      )}

      {/* ── WhatsApp button — déplacé au-dessus du bouton panier ────────────── */}
      {activePizzaName && arState === 'ready' && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(9.5rem + env(safe-area-inset-bottom))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          animation: 'fadeIn 350ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <WhatsAppButton pizzaName={activePizzaName} />
        </div>
      )}

      {/* ── Loading overlay ─────────────────────────────────────────────────── */}
      {(isLoading || loadingFading) && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 40,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'var(--color-darker)',
          opacity: loadingFading ? 0 : 1,
          transition: 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem', animation: 'fadeIn 600ms ease' }}>
            <h1 style={{ fontSize: '2.75rem', color: 'white', fontFamily: FONT_SERIF, lineHeight: 1.1 }}>
              Bella
            </h1>
            <h2 style={{ fontSize: '0.85rem', color: 'var(--color-gold)', fontFamily: FONT_SANS, letterSpacing: '0.5em', fontWeight: 600, marginTop: '0.25rem' }}>
              MOTRIL
            </h2>
          </div>

          {/* Ornamental spinner */}
          <div className="ar-spinner" />

          {/* Status message */}
          <p style={{
            color: '#9ca3af',
            fontSize: '0.78rem',
            letterSpacing: '0.08em',
            fontFamily: FONT_SANS,
            marginTop: '1.5rem',
            minWidth: '16rem',
            textAlign: 'center',
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            {loadingMessage}
          </p>

          {/* Progress bar */}
          <div style={{
            position: 'absolute',
            bottom: 'calc(2.5rem + env(safe-area-inset-bottom))',
            left: '2.5rem',
            right: '2.5rem',
          }}>
            <div style={{
              width: '100%',
              height: '2px',
              backgroundColor: 'rgba(212, 162, 76, 0.12)',
              borderRadius: '1px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${loadingProgress}%`,
                backgroundColor: 'var(--color-gold)',
                borderRadius: '1px',
                transition: 'width 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 8px rgba(212, 162, 76, 0.5)',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Permission denied ───────────────────────────────────────────────── */}
      {arState === 'permission-denied' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 40,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'var(--color-darker)', padding: '2rem', textAlign: 'center',
        }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none"
            stroke="var(--color-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ marginBottom: '1.5rem' }}>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
          <h2 style={{ color: 'white', fontSize: '1.25rem', fontFamily: FONT_SERIF, marginBottom: '1rem' }}>
            Acceso a cámara denegado
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', fontFamily: FONT_SANS, lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '320px' }}>
            Para usar la experiencia AR, permite el acceso a la cámara en los ajustes de tu navegador y recarga la página.
          </p>
          <Link href="/" className="btn-gold" style={{ fontFamily: FONT_SANS }}>VOLVER AL INICIO</Link>
        </div>
      )}

      {/* ── Error state ─────────────────────────────────────────────────────── */}
      {arState === 'error' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 40,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'var(--color-darker)', padding: '2rem', textAlign: 'center',
        }}>
          <h2 style={{ color: 'white', fontSize: '1.25rem', fontFamily: FONT_SERIF, marginBottom: '1rem' }}>
            Error al iniciar AR
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', fontFamily: FONT_SANS, marginBottom: '0.75rem', maxWidth: '320px' }}>
            {errorMessage}
          </p>
          <p style={{ color: '#4b5563', fontSize: '0.75rem', fontFamily: FONT_SANS, lineHeight: 1.6, marginBottom: '2rem', maxWidth: '320px' }}>
            Verifica que los archivos .glb estén en{' '}
            <code style={{ color: 'var(--color-gold-light)' }}>public/3d-models/</code>
            {' '}y que{' '}
            <code style={{ color: 'var(--color-gold-light)' }}>targets.mind</code>
            {' '}esté en{' '}
            <code style={{ color: 'var(--color-gold-light)' }}>public/ar-targets/</code>.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="btn-gold"
              style={{ fontFamily: FONT_SANS, cursor: 'pointer' }}
              onClick={() => {
                setArState('loading')
                setErrorMessage('')
                setLoadingMessage('Inicializando experiencia...')
                setLoadingProgress(5)
                setLoadingFading(false)
                setRetryKey((k) => k + 1)
              }}
            >
              REINTENTAR
            </button>
            <Link href="/" className="btn-gold" style={{ fontFamily: FONT_SANS }}>VOLVER</Link>
          </div>
        </div>
      )}

      {/* ── Onboarding overlay ──────────────────────────────────────────────── */}
      {(showOnboarding || onboardingFading) && arState === 'ready' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 30,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.72)',
          opacity: onboardingFading ? 0 : 1,
          transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {/* Camera icon — pulse */}
          <div style={{ animation: 'pulse 2s ease-in-out infinite', marginBottom: '1.75rem' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
              stroke="var(--color-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>

          <p style={{
            color: 'white',
            fontSize: '1.75rem',
            fontFamily: FONT_SERIF,
            fontStyle: 'italic',
            textAlign: 'center',
            marginBottom: '0.75rem',
            maxWidth: '300px',
            lineHeight: 1.3,
          }}>
            Apunta tu cámara hacia el menú
          </p>

          <p style={{
            color: 'var(--color-gold)',
            fontSize: '0.875rem',
            fontFamily: FONT_SANS,
            textAlign: 'center',
            letterSpacing: '0.06em',
            marginBottom: '2.25rem',
          }}>
            Verás la pizza cobrar vida en 3D
          </p>

          {/* Blinking arrow */}
          <div style={{ animation: 'arrowBlink 1.2s ease-in-out infinite' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="rgba(212,162,76,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          </div>
        </div>
      )}

      {/* ── Pizza detected pill ─────────────────────────────────────────────── */}
      {activePizzaName && arState === 'ready' && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(2rem + env(safe-area-inset-bottom))',
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 30,
          padding: '0.4rem 1.1rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(212, 162, 76, 0.15)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(212, 162, 76, 0.35)',
          color: 'var(--color-gold)',
          fontSize: '0.75rem',
          fontFamily: FONT_SANS,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 14px rgba(212, 162, 76, 0.18)',
          animation: 'fadeIn 300ms ease',
        }}>
          ✦ {activePizzaName}
        </div>
      )}
    </div>
  )
}

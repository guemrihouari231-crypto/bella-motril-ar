# Bella Motril — AR Menu Experience

An augmented reality menu for Bella Motril pizzeria. Point your phone camera at a pizza image on the physical menu to see an interactive 3D model of the pizza float above it — with ambient sound, WhatsApp ordering, and a cinematic home screen.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Webpack) |
| 3D Rendering | Three.js 0.147 |
| AR Tracking | MindAR 1.2.5 (image tracking) |
| Styling | Tailwind CSS v4 |
| Language | TypeScript |
| Deploy | Vercel |

## Getting started locally

```bash
npm install
npm run dev
```

> **HTTPS required** — browser camera access (`getUserMedia`) is blocked on plain HTTP except on `localhost`. For testing on a real device over your local network, use a tunneling tool such as `ngrok` or run the dev server behind a self-signed certificate.

## AR targets

The file `public/ar-targets/targets.mind` contains three image targets (index 0 → Margherita, 1 → Diavola, 2 → Quattro Formaggi). Regenerate it with the [MindAR target compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile) if you update the reference images.

## Project structure

```
public/
  3d-models/        # Meshopt-compressed GLB pizza models
  ar-targets/       # Compiled MindAR target file
src/
  app/
    page.tsx        # Cinematic home screen
    ar/             # AR experience (ARScene, WhatsApp button, audio)
  types/            # Ambient declarations for MindAR & MeshoptDecoder
```

---

Built with [Claude Code](https://claude.ai/claude-code) by Houari

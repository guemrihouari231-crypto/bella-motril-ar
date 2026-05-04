// Ambient declarations — NO top-level import/export so TypeScript treats this
// as a global ambient file and registers the declare module blocks correctly.

declare module 'three/examples/jsm/libs/meshopt_decoder.module.js' {
  const MeshoptDecoder: {
    supported: boolean
    ready: Promise<void>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }
  export { MeshoptDecoder }
}

declare module 'mind-ar/dist/mindar-image-three.prod.js' {
  import type { WebGLRenderer, Scene, PerspectiveCamera, Group } from 'three'

  interface MindARThreeOptions {
    container: HTMLElement
    imageTargetSrc: string
    maxTrack?: number
    uiLoadingPath?: string | null | false
    uiScanning?: boolean | string | null
    uiError?: boolean | string | null
    filterMinCF?: number
    filterBeta?: number
    missTolerance?: number
    warmupTolerance?: number
  }

  interface MindARAnchor {
    group: Group
    onTargetFound: (() => void) | null
    onTargetLost: (() => void) | null
  }

  export class MindARThree {
    renderer: WebGLRenderer
    scene: Scene
    camera: PerspectiveCamera
    constructor(options: MindARThreeOptions)
    start(): Promise<void>
    stop(): void
    addAnchor(targetIndex: number): MindARAnchor
  }
}

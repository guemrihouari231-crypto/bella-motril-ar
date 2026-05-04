import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Webpack mode (--webpack flag in scripts) — required for mind-ar:
  // • resolve.fallback handles the dead-code `require("fs")` inside mind-ar
  // • three@0.147.0 is installed so sRGBEncoding exists (removed in r150)
  turbopack: {},

  // canvas is a native Node addon pulled in by mind-ar; it can't compile on
  // Vercel (no Cairo/Pango). We only use mind-ar in the browser, so exclude it.
  serverExternalPackages: ['canvas'],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }

    // Prevent canvas from being bundled on either side of the build
    if (!Array.isArray(config.externals)) {
      config.externals = []
    }
    config.externals.push({ canvas: 'commonjs canvas' })

    return config
  },
}

export default nextConfig

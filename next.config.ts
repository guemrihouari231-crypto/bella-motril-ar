import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Webpack mode (--webpack flag in scripts) — required for mind-ar:
  // • resolve.fallback handles the dead-code `require("fs")` inside mind-ar
  // • three@0.147.0 is installed so sRGBEncoding exists (removed in r150)
  turbopack: {},

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    return config
  },
}

export default nextConfig

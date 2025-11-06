/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Отключить иконку отладки Next.js
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  webpack: (config) => {
    // Add Privy Solana dependencies to webpack externals
    config.externals = config.externals || {}
    config.externals['@solana/kit'] = 'commonjs @solana/kit'
    config.externals['@solana-program/memo'] = 'commonjs @solana-program/memo'
    config.externals['@solana-program/system'] = 'commonjs @solana-program/system'
    config.externals['@solana-program/token'] = 'commonjs @solana-program/token'
    
    // Add fallbacks for Node.js modules
    config.resolve.fallback = config.resolve.fallback || {}
    config.resolve.fallback.fs = false
    config.resolve.fallback.net = false
    config.resolve.fallback.tls = false
    config.resolve.fallback.crypto = false
    
    return config
  },
}

export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpack Konfiguration für Web3 Kompatibilität
  webpack: (config, { isServer }) => {
    // Node.js Polyfills für Browser deaktivieren
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // WalletConnect/IndexedDB Probleme lösen
    config.externals = [...(config.externals || [])];
    
    return config;
  },

  // Experimentelle Features für App Router
  experimental: {
    // Nur noch gültige Optionen für Next.js 15
    optimizeCss: true,
  },

  // Images Konfiguration
  images: {
    domains: ['images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.ipfs.w3s.link',
        port: '',
        pathname: '/**',
      }
    ],
  },

  // Environment Variables
  env: {
    CUSTOM_KEY: 'go-ape-me',
  },

  // Build Optimierung (swcMinify ist Standard in Next.js 15)
  // swcMinify: true, // <- Diese Zeile entfernt, da es Standard ist
  
  // Output für Vercel
  output: 'standalone',

  // React Strict Mode
  reactStrictMode: true,

  // ESLint während Build ignorieren (nur für Deployment)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript Errors während Build ignorieren (falls TS verwendet wird)
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
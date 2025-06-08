/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpack Konfiguration für Web3 Kompatibilität
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },

  // Images Konfiguration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.ipfs.w3s.link',
      }
    ],
  },

  // React Strict Mode
  reactStrictMode: true,

  // ESLint während Build ignorieren
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript Errors während Build ignorieren  
  typescript: {
    ignoreBuildErrors: true,
  },

  // Turbopack deaktivieren für Kompatibilität
  experimental: {
    turbo: false,
  },
};

module.exports = nextConfig;
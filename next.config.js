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

  // Environment Variables
  env: {
    CUSTOM_KEY: 'go-ape-me',
  },

  // Output für Vercel
  output: 'standalone',

  // React Strict Mode
  reactStrictMode: true,

  // ESLint während Build ignorieren (nur für Deployment)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript Errors während Build ignorieren
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
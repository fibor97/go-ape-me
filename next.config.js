/** @type {import('next').NextConfig} */
const nextConfig = {
  // Nur essentielles für Web3
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },

  // Images unoptimized für Vercel-Kompatibilität
  images: {
    unoptimized: true,
  },

  // Errors ignorieren für Deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },

  // React Strict Mode
  reactStrictMode: false,
};

module.exports = nextConfig;
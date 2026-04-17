/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["child_process"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-only modules on client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

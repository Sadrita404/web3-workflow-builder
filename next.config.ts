import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Make solc external in server-side to avoid issues
    if (isServer) {
      config.externals = [...(config.externals || []), 'solc'];
    }

    return config;
  },
};

export default nextConfig;

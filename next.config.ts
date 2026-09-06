import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Reuse optimized variants instead of regenerating the same remote images.
    minimumCacheTTL: 60 * 60 * 24,
    // Keep a compact responsive width set to reduce image transformations.
    deviceSizes: [640, 750, 1080, 1200, 1920],
    imageSizes: [32, 64, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

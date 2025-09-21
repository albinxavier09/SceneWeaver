import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ];
  },
  // Production optimizations
  output: 'standalone',
  serverExternalPackages: ['sqlite3'],
  // Image optimization
  images: {
    unoptimized: true, // For static exports if needed
  },
  // Disable ESLint during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

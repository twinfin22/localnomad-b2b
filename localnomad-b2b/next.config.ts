import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'radix-ui', '@tanstack/react-table', 'recharts'],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/:path*',
          has: [{ type: 'host', value: 'search.visacampus.org' }],
          destination: '/xray/:path*',
        },
      ],
    };
  },
};

export default nextConfig;

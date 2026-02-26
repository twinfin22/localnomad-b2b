import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'radix-ui', '@tanstack/react-table'],
  },
};

export default nextConfig;

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // ESLint errors won't block production builds; fix them locally with `npm run lint`
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

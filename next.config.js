const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Disable ESLint during production builds
  eslint: {
    // Only run ESLint during development, not during production builds
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript checking during production builds
  typescript: {
    // Only run TypeScript checking during development, not during production builds
    ignoreBuildErrors: true,
  },

  // External image domains
  images: {
    domains: [
      'images.unsplash.com',
      'avatars.githubusercontent.com',
    ],
  },

  // Global security‑related response headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value:
              'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);

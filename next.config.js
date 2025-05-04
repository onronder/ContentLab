/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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

module.exports = nextConfig;

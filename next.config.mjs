/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  // Long-lived, immutable caching for bundled media so repeat visitors and the
  // CDN edge never re-download videos/posters/logos.
  async headers() {
    return [
      {
        source: '/videos/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/assets/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
  // Keep large/static folders out of the serverless function bundles
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        '**/.video-cache/**',
        'studio-22nd-avenue-backend/**',
        'public/videos/**',
      ],
    },
  },
};

export default nextConfig;

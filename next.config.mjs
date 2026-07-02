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
  // Exclude local caches from the serverless function bundle
  outputFileTracingExcludes: {
    '/api/video/stream': [
      '**/.video-cache/**',
      '.video-cache/**',
    ],
    '*': [
      '**/.video-cache/**',
      '.video-cache/**',
      'studio-22nd-avenue-backend/**',
    ],
  },
};

export default nextConfig;

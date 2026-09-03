/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.1.45'],
  reactStrictMode: false,
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.mapxprop.com' }],
        destination: 'https://mapxprop.com/:path*',
        permanent: true,
      },
      {
        source: '/real-estate-categories-map/all',
        destination: '/properties/map',
        permanent: true,
      },
      {
        source: '/property-home',
        destination: '/homes',
        permanent: true,
      },
      {
        source: '/real-estate',
        destination: '/homes',
        permanent: true,
      },
    ]
  },
  images: {
    qualities: [75, 78],
    minimumCacheTTL: 2678400 * 6, // 3 months
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'a0.muscache.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.gstatic.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig

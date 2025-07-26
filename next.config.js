/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  },
  env: {
    PORT: process.env.PORT || '8080'
  }
}

module.exports = nextConfig
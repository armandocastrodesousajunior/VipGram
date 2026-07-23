import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost'],
  },
  // Permite imports de módulos server-only
  serverExternalPackages: ['pg', 'node-telegram-bot-api'],
};

export default nextConfig;

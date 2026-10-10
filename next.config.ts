import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['firebase-admin'],

  // Arquivos de dados locais necessários para o servidor
  outputFileTracingIncludes: {
    '/api/**/*': ['./data/**/*'],
    '/**': ['./data/**/*'],
  },

  // Performance: compressão Gzip/Brotli nas responses
  compress: true,

  // Segurança: não expõe stack tecnológico
  poweredByHeader: false,

  // Tree-shaking otimizado para pacotes grandes (reduz bundle JS)
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Turbopack: sem configurações extras — usa .next/ local por padrão
  turbopack: {},

  // Configuração de imagens para suportar Unsplash e provedores de CDN
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.21st.dev' },
      { protocol: 'https', hostname: 'me7aitdbxq.ufs.sh' },
    ],
  },

  // Headers de cache para assets de vídeo (mp4)
  // NOTA: Não configuramos cache para /_next/static em produção aqui para
  // evitar o aviso do Next.js. Em produção, CDNs como Vercel já gerenciam
  // o cache dos assets estáticos automaticamente.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const cspProd = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.tanklotse.de",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = isProd
  ? [
      { key: 'Content-Security-Policy', value: cspProd },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
      { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
    ]
  : [];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: 'standalone',
  // Bundle-Optimierung:
  //   * productionBrowserSourceMaps=false reduziert das Bundle-Volumen auf dem
  //     CDN drastisch (Source-Maps sind Debug-Hilfen, in prod nicht noetig).
  //   * `experimental.optimizePackageImports` baumelt nur die tatsaechlich
  //     verwendeten Exports der Liste auf (Tree-Shaking auch fuer barrel-imports).
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['next/link', 'next/image'],
  },
  async headers() {
    if (!isProd) return [];
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;

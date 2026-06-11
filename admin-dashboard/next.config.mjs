/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.tanklotse.de';

// Lauter Fail-Safe: NEXT_PUBLIC_API_URL wird zur BUILD-Zeit in Bundle + CSP
// (connect-src) eingebacken. Fehlt sie, faellt alles still auf den
// Default zurueck und der Admin kann seine API nicht erreichen — das hat
// im Red-Team-Test den kompletten Login gebrochen. Deshalb unübersehbar warnen.
if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn(
    '\n⚠️  NEXT_PUBLIC_API_URL ist beim Build NICHT gesetzt.\n' +
      `   Bundle + CSP connect-src zeigen auf den Default: ${apiUrl}\n` +
      '   Fuer lokale Prod-Tests: NEXT_PUBLIC_API_URL=http://localhost:3000 npm run build\n',
  );
}

const cspProd = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiUrl}`,
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
      { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
    ]
  : [];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: 'standalone',
  // Bundle-Optimierung (Admin-spezifisch):
  //   * SWR + @tanstack/react-table + recharts sind Barrel-Imports — Tree-Shake aktivieren.
  //   * Source-Maps in prod aus (Admin ist intern, kein Debug-Use-Case auf CDN).
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['swr', '@tanstack/react-table', 'recharts'],
  },
  async headers() {
    if (!isProd) return [];
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;

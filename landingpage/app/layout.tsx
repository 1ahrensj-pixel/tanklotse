import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { SimulationBanner } from '@/components/SimulationBanner';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tanklotse.de';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'TankLotse – Spritpreise vergleichen, wirklich sparen',
    template: '%s · TankLotse',
  },
  description:
    'TankLotse zeigt nicht nur die billigste Tankstelle in der Nähe, sondern berechnet, ob sich der Umweg wirklich lohnt — mit Verbrauch, Tankmenge und Route.',
  applicationName: 'TankLotse',
  keywords: [
    'günstig tanken',
    'Spritpreise vergleichen',
    'Dieselpreis App',
    'Benzinpreis App',
    'Tankstellenpreise Deutschland',
    'Tankstelle in der Nähe',
    'lohnt sich der Umweg beim Tanken',
  ],
  authors: [{ name: 'TankLotse' }],
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: siteUrl,
    siteName: 'TankLotse',
    title: 'TankLotse – Spritpreise vergleichen, wirklich sparen',
    description:
      'Die billigste Tankstelle ist nicht immer die günstigste Entscheidung. TankLotse berechnet die echte Ersparnis.',
  },
  alternates: {
    canonical: '/',
  },
  robots: { index: true, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: 'TankLotse – Spritpreise vergleichen, wirklich sparen',
    description:
      'Die billigste Tankstelle ist nicht immer die günstigste Entscheidung. TankLotse berechnet die echte Ersparnis.',
  },
};

// Structured Data (schema.org) — verbessert Google-Listings.
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'MobileApplication',
  name: 'TankLotse',
  applicationCategory: 'TravelApplication',
  operatingSystem: 'Android, iOS',
  description:
    'TankLotse berechnet, ob sich der Weg zur günstigeren Tankstelle wirklich lohnt — inklusive Umweg-Kosten, Verbrauch, Tankmenge und Break-even-Liter-Anzeige.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
  },
  publisher: {
    '@type': 'Organization',
    name: 'TankLotse',
    url: siteUrl,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <SimulationBanner />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

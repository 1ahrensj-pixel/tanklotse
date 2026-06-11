import type { MetadataRoute } from 'next';

import { posts } from './blog/posts';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tanklotse.de';
  const paths = ['', '/funktionen', '/privat', '/firmen', '/preise', '/datenschutz', '/impressum', '/datenquelle', '/kontakt', '/app', '/blog'];
  const lastModified = new Date();
  const staticEntries: MetadataRoute.Sitemap = paths.map((p) => ({
    url: `${base}${p}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: p === '' ? 1 : 0.7,
  }));
  // PR #24 §5.4 — Blog-Artikel werden automatisch aufgenommen, sobald sie
  // in `posts.ts` deklariert sind.
  const blogEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));
  return [...staticEntries, ...blogEntries];
}

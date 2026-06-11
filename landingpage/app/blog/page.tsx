import Link from 'next/link';
import type { Metadata } from 'next';

import { posts } from './posts';

export const metadata: Metadata = {
  title: 'Blog · TankLotse',
  description:
    'Hintergrund-Wissen rund um Spritpreise, Tankstrategien und den Lohnt-sich-Check.',
};

export default function BlogIndexPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-brand-800">Blog</h1>
      <p className="mt-2 text-slate-600">
        Erklärungen, Hintergrund-Wissen, Spar-Tipps. Wir schreiben hier, was wir
        selbst beim Tanken beobachten.
      </p>
      <ul className="mt-8 space-y-6">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/blog/${p.slug}`}
              className="block rounded-lg border border-slate-200 p-5 hover:border-brand-500 hover:bg-brand-50/50 transition"
            >
              <h2 className="text-xl font-semibold text-slate-900">{p.title}</h2>
              <p className="mt-1 text-slate-600">{p.description}</p>
              <div className="mt-2 text-xs text-slate-500">
                {p.publishedAt} · {p.readingMinutes} Min. Lesezeit
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

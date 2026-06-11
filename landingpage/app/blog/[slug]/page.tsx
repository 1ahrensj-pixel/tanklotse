import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { getPost, posts } from '../posts';

export async function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: 'Artikel nicht gefunden' };
  return {
    title: `${post.title} · TankLotse Blog`,
    description: post.description,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/blog" className="text-sm text-brand-600 hover:underline">
        ← Zurück zum Blog
      </Link>
      <article className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-brand-800">{post.title}</h1>
        <div className="mt-2 text-sm text-slate-500">
          {post.publishedAt} · {post.readingMinutes} Min. Lesezeit
        </div>
        <div className="mt-8 space-y-4 text-slate-800 leading-relaxed">
          {post.content.map((block, idx) => {
            if (block.type === 'h2') {
              return (
                <h2 key={idx} className="mt-6 text-xl font-semibold text-slate-900">
                  {block.text}
                </h2>
              );
            }
            if (block.type === 'ul') {
              return (
                <ul key={idx} className="list-disc space-y-1 pl-6">
                  {block.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              );
            }
            return <p key={idx}>{block.text}</p>;
          })}
        </div>
      </article>
    </main>
  );
}

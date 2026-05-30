import Link from "next/link";
import Image from "next/image";
import { getSedifexBlogPosts } from "../../lib/sedifex-blog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDisplayDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function BlogPage() {
  const posts = await getSedifexBlogPosts();

  return (
    <>
      <section className="hero-grid">
        <div className="section py-20">
          <span className="badge">Onco-nurse Blog</span>

          <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
            Germany pathway guides for African nurses
          </h1>

          <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
            Read practical guides on Nursing Ausbildung, FSJ, BFD, Au-Pair,
            Recognition, document preparation and Student Visa readiness.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((post) => {
            const publishedAt = formatDisplayDate(post.publishedAt);

            return (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] bg-gradient-to-br from-emerald-100 via-white to-amber-100">
                  {post.imageUrl ? (
                    <Image
                      src={post.imageUrl}
                      alt={post.imageAlt || post.title}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-2xl font-black text-emerald-800">
                      {post.category || "Germany Guide"}
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
                    {post.category || "Blog"}
                  </span>

                  <h2 className="mt-4 text-xl font-black text-slate-950">
                    {post.title}
                  </h2>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                    {post.excerpt}
                  </p>

                  <div className="mt-6 flex items-center justify-between gap-4 text-sm">
                    {publishedAt && (
                      <time className="font-bold text-slate-500">
                        {publishedAt}
                      </time>
                    )}
                    <span className="font-black text-emerald-700">
                      Read article →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

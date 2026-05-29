import Link from "next/link";
import { getSedifexBlogPosts } from "../../lib/sedifex";

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
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="aspect-[16/10] bg-gradient-to-br from-emerald-100 via-white to-amber-100">
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="h-full w-full object-cover"
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

                <p className="mt-6 text-sm font-black text-emerald-700">
                  Read article →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
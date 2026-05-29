import Link from "next/link";
import { notFound } from "next/navigation";
import { getSedifexBlogPosts } from "../../../lib/sedifex";

export default async function BlogDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const posts = await getSedifexBlogPosts();
  const post = posts.find((item) => item.slug === slug);

  if (!post) notFound();

  const content = post.content || post.excerpt || "";

  return (
    <article className="section">
      <Link href="/blog" className="text-sm font-black text-emerald-700">
        ← Back to blog
      </Link>

      <div className="mt-8 max-w-4xl">
        <span className="badge">{post.category || "Blog"}</span>

        <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="mt-6 text-xl leading-9 text-slate-700">
            {post.excerpt}
          </p>
        )}

        {post.publishedAt && (
          <p className="mt-5 text-sm font-bold text-slate-500">
            Published: {post.publishedAt}
          </p>
        )}
      </div>

      <div className="mt-10 max-w-4xl rounded-[2rem] bg-white p-6 shadow-sm md:p-10">
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt={post.title}
            className="mb-8 max-h-[420px] w-full rounded-3xl object-cover"
          />
        )}

        <div className="space-y-6 text-lg leading-9 text-slate-700">
          {content.split(/\n{2,}/).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-10 rounded-3xl bg-emerald-50 p-6">
          <h2 className="text-2xl font-black text-emerald-900">
            Need personal guidance?
          </h2>
          <p className="mt-3 leading-7 text-emerald-900">
            Book a consultation so Onco-nurse can check your background,
            documents, German level and best Germany pathway.
          </p>
          <Link href="/book" className="mt-6 inline-flex btn-primary">
            Book Consultation
          </Link>
        </div>
      </div>
    </article>
  );
}
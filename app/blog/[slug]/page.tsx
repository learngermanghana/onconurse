import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getSedifexBlogPost,
  sanitizeSedifexHtml,
} from "../../../lib/sedifex-public";

function formatDisplayDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

type BlogDetailsProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: BlogDetailsProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getSedifexBlogPost(slug);

  if (!post) {
    return {
      title: "Blog post not found | Onco-nurse",
    };
  }

  return {
    title: `${post.title} | Onco-nurse Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.imageUrl ? [{ url: post.imageUrl }] : undefined,
      type: "article",
    },
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

export default async function BlogDetailsPage({ params }: BlogDetailsProps) {
  const { slug } = await params;
  const post = await getSedifexBlogPost(slug);

  if (!post) notFound();

  const htmlContent = post.contentHtml
    ? sanitizeSedifexHtml(post.contentHtml)
    : "";
  const textContent = post.content || post.excerpt || "";
  const publishedAt = formatDisplayDate(post.publishedAt);

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

        {publishedAt && (
          <p className="mt-5 text-sm font-bold text-slate-500">
            Published: {publishedAt}
          </p>
        )}
      </div>

      <div className="mt-10 max-w-4xl rounded-[2rem] bg-white p-6 shadow-sm md:p-10">
        {post.imageUrl && (
          <Image
            src={post.imageUrl}
            alt={post.imageAlt || post.title}
            width={1200}
            height={675}
            sizes="(min-width: 768px) 896px, 100vw"
            className="mb-8 max-h-[420px] w-full rounded-3xl object-cover"
          />
        )}

        {htmlContent ? (
          <div
            className="blog-content text-lg leading-9 text-slate-700"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <div className="space-y-6 text-lg leading-9 text-slate-700">
            {textContent.split(/\n{2,}/).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}

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

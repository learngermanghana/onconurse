import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getSedifexBlogPost,
  sanitizeSedifexHtml,
} from "../../../lib/sedifex-blog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

type TextBlock =
  | { type: "heading"; depth: number; content: string }
  | { type: "paragraph"; content: string }
  | { type: "blockquote"; content: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "divider" };

function cleanMarkdownLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isDivider(value: string) {
  return /^(?:[-*_]\s*){3,}$/.test(value.trim()) || /^\.{3,}$/.test(value.trim());
}

function parseRawSedifexText(value: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  const paragraphLines: string[] = [];
  let activeList: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    const content = cleanMarkdownLine(paragraphLines.join(" "));
    paragraphLines.length = 0;

    if (content) {
      blocks.push({ type: "paragraph", content });
    }
  };

  const flushList = () => {
    if (activeList?.items.length) {
      blocks.push({ type: "list", ordered: activeList.ordered, items: activeList.items });
    }

    activeList = null;
  };

  const pushStandaloneBlock = (block: TextBlock) => {
    flushParagraph();
    flushList();
    blocks.push(block);
  };

  for (const rawLine of value.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (isDivider(line)) {
      pushStandaloneBlock({ type: "divider" });
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      pushStandaloneBlock({
        type: "heading",
        depth: headingMatch[1].length,
        content: cleanMarkdownLine(headingMatch[2]),
      });
      continue;
    }

    const boldHeadingMatch = line.match(/^\*\*(.+?)\*\*:?$/);
    if (boldHeadingMatch) {
      pushStandaloneBlock({
        type: "heading",
        depth: 3,
        content: cleanMarkdownLine(boldHeadingMatch[1]),
      });
      continue;
    }

    const blockquoteMatch = line.match(/^>\s*(.+)$/);
    if (blockquoteMatch) {
      pushStandaloneBlock({
        type: "blockquote",
        content: cleanMarkdownLine(blockquoteMatch[1]),
      });
      continue;
    }

    const listMatch = line.match(/^(?:[-*+]\s+|(\d+)[.)]\s+)(.+)$/);
    if (listMatch) {
      flushParagraph();
      const ordered = Boolean(listMatch[1]);

      if (!activeList || activeList.ordered !== ordered) {
        flushList();
        activeList = { ordered, items: [] };
      }

      activeList.items.push(cleanMarkdownLine(listMatch[2]));
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

function renderInlineMarkdown(value: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(value.slice(lastIndex, match.index));
    }

    if (match[2] && match[3]) {
      nodes.push(
        <a
          key={`${match[3]}-${match.index}`}
          href={match[3]}
          className="font-black text-emerald-700 underline decoration-emerald-200 underline-offset-4"
          rel="noopener noreferrer"
          target="_blank"
        >
          {match[2]}
        </a>
      );
    } else if (match[4] || match[5]) {
      nodes.push(
        <strong key={`${match[0]}-${match.index}`} className="font-black text-slate-950">
          {match[4] || match[5]}
        </strong>
      );
    } else if (match[6]) {
      nodes.push(
        <code
          key={`${match[6]}-${match.index}`}
          className="rounded-md bg-slate-100 px-1.5 py-0.5 text-base font-bold text-slate-900"
        >
          {match[6]}
        </code>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < value.length) {
    nodes.push(value.slice(lastIndex));
  }

  return nodes;
}

function renderRawSedifexTextContent(value: string) {
  return parseRawSedifexText(value).map((block, index) => {
    if (block.type === "heading") {
      const isPrimaryHeading = block.depth <= 2;
      return (
        <section key={`${block.content}-${index}`} className="pt-2">
          <h2
            className={
              isPrimaryHeading
                ? "text-3xl font-black tracking-tight text-slate-950"
                : "text-2xl font-black tracking-tight text-emerald-950"
            }
          >
            {renderInlineMarkdown(block.content)}
          </h2>
        </section>
      );
    }

    if (block.type === "list") {
      const ListTag = block.ordered ? "ol" : "ul";
      return (
        <ListTag
          key={`list-${index}`}
          className={`space-y-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-6 pl-10 text-lg leading-8 text-slate-700 ${
            block.ordered ? "list-decimal" : "list-disc"
          }`}
        >
          {block.items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`} className="pl-1 marker:font-black marker:text-emerald-700">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ListTag>
      );
    }

    if (block.type === "blockquote") {
      return (
        <blockquote
          key={`${block.content}-${index}`}
          className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 text-lg font-bold leading-8 text-emerald-950"
        >
          {renderInlineMarkdown(block.content)}
        </blockquote>
      );
    }

    if (block.type === "divider") {
      return <hr key={`divider-${index}`} className="border-slate-200" />;
    }

    const calloutMatch = block.content.match(/^(Disclaimer|Note|Tip|Important|Need personal guidance)\s*:\s*(.+)$/i);

    if (calloutMatch) {
      return (
        <aside
          key={`${block.content}-${index}`}
          className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6 text-lg leading-8 text-emerald-950"
        >
          <strong className="block font-black text-emerald-900">
            {calloutMatch[1]}:
          </strong>
          <span className="mt-2 block">{renderInlineMarkdown(calloutMatch[2])}</span>
        </aside>
      );
    }

    return (
      <p key={`${block.content}-${index}`} className="text-lg leading-9 text-slate-700">
        {renderInlineMarkdown(block.content)}
      </p>
    );
  });
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
          <div className="space-y-7">
            {renderRawSedifexTextContent(textContent)}
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

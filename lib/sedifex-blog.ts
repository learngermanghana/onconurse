import { unstable_cache } from "next/cache";
import { fallbackBlogPosts } from "./site";
import {
  sanitizeSedifexHtml,
  slugify,
  type SedifexBlogPost,
} from "./sedifex";

export { sanitizeSedifexHtml };

const ONCO_NURSE_STORE_ID = "YvRddOFEYlhYoNrwqSyHwShPioR2";
const BLOG_REVALIDATE_SECONDS = 15 * 60;

const SEDIFEX_PUBLIC_API_BASE_URL =
  process.env.SEDIFEX_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_SEDIFEX_PUBLIC_API_BASE_URL ||
  "https://www.sedifex.com";

const SEDIFEX_STORE_ID =
  process.env.SEDIFEX_BOOKING_TARGET_STORE_ID ||
  process.env.SEDIFEX_STORE_ID ||
  process.env.NEXT_PUBLIC_SEDIFEX_STORE_ID ||
  ONCO_NURSE_STORE_ID;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: JsonRecord, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return fallback;
}

function plainText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[#*_`>~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeExcerpt(value: string, length = 160) {
  const text = plainText(value);
  if (text.length <= length) return text;
  return `${text.slice(0, length).trim()}…`;
}

function normalizeBlogPost(raw: unknown, index: number): SedifexBlogPost {
  const record = isRecord(raw) ? raw : {};
  const title = readString(record, ["title", "postTitle", "heading", "name"], `Blog post ${index + 1}`);
  const contentHtml = readString(record, ["contentHtml", "html", "bodyHtml", "articleHtml"]);
  const content = readString(record, ["content", "body", "article", "details", "text"]) || contentHtml;
  const slug = readString(record, ["slug", "postSlug", "blogSlug", "articleSlug"], slugify(title));

  return {
    id: readString(record, ["id", "postId", "blogId", "documentId"], slug || `blog-${index + 1}`),
    slug,
    title,
    category: readString(record, ["category", "categoryName", "type", "badge", "label"], "Germany Pathway"),
    excerpt: readString(record, ["excerpt", "summary", "subtitle", "description", "metaDescription"], makeExcerpt(content)),
    content,
    contentHtml,
    imageUrl: readString(record, [
      "imageUrl",
      "coverImageUrl",
      "bannerImageUrl",
      "thumbnailUrl",
      "photoUrl",
      "ogImage",
      "image",
      "cover",
      "thumbnail",
    ]),
    imageAlt: readString(record, ["imageAlt", "coverImageAlt", "alt"], title),
    publishedAt: readString(record, ["publishedAt", "publishDate", "createdAt", "updatedAt", "date"]),
    updatedAt: readString(record, ["updatedAt"]) || undefined,
    author: readString(record, ["author", "authorName", "createdBy"], "Onco-nurse"),
  };
}

function dedupePosts(posts: SedifexBlogPost[]) {
  const seen = new Set<string>();

  return posts.filter((post) => {
    const key = (post.slug || post.id || post.title).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackPosts() {
  return dedupePosts(
    fallbackBlogPosts
      .map(normalizeBlogPost)
      .filter((post) => post.title && post.slug)
  );
}

async function loadBlogPosts(): Promise<SedifexBlogPost[]> {
  try {
    const endpoint = new URL("/api/public-blog", SEDIFEX_PUBLIC_API_BASE_URL);
    endpoint.searchParams.set("storeId", SEDIFEX_STORE_ID);
    endpoint.searchParams.set("limit", "30");

    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      next: {
        revalidate: BLOG_REVALIDATE_SECONDS,
        tags: ["onconurse-blog"],
      },
    });

    if (!response.ok) return fallbackPosts();

    const payload: unknown = await response.json();
    const record = isRecord(payload) ? payload : {};
    const items = Array.isArray(record.items)
      ? record.items
      : Array.isArray(record.posts)
        ? record.posts
        : Array.isArray(payload)
          ? payload
          : [];

    const posts = dedupePosts(
      items
        .map(normalizeBlogPost)
        .filter((post) => post.title && post.slug)
    );

    return posts.length ? posts : fallbackPosts();
  } catch {
    return fallbackPosts();
  }
}

const getCachedBlogPosts = unstable_cache(
  loadBlogPosts,
  ["onconurse-public-blog-v3", SEDIFEX_STORE_ID],
  {
    revalidate: BLOG_REVALIDATE_SECONDS,
    tags: ["onconurse-blog"],
  }
);

export async function getSedifexBlogPosts(): Promise<SedifexBlogPost[]> {
  return getCachedBlogPosts();
}

export async function getSedifexBlogPost(slug: string): Promise<SedifexBlogPost | null> {
  const normalizedSlug = decodeURIComponent(slug).trim();
  const posts = await getCachedBlogPosts();

  return (
    posts.find(
      (post) =>
        post.slug === normalizedSlug ||
        post.id === normalizedSlug ||
        slugify(post.title) === normalizedSlug
    ) || null
  );
}

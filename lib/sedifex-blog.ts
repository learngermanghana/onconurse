import { fallbackBlogPosts } from "./site";
import {
  getSedifexBlogPost as getLegacySedifexBlogPost,
  getSedifexBlogPosts as getLegacySedifexBlogPosts,
  sanitizeSedifexHtml,
  slugify,
  type SedifexBlogPost,
} from "./sedifex";

export { sanitizeSedifexHtml };

const DEFAULT_SEDIFEX_API_BASE_URL =
  "https://us-central1-sedifex-web.cloudfunctions.net";
const ONCO_NURSE_STORE_ID = "YvRddOFEYlhYoNrwqSyHwShPioR2";

const SEDIFEX_BASE_URL =
  process.env.SEDIFEX_INTEGRATION_API_BASE_URL ||
  process.env.SEDIFEX_API_BASE_URL ||
  DEFAULT_SEDIFEX_API_BASE_URL;

const SEDIFEX_PUBLIC_API_BASE_URL =
  process.env.SEDIFEX_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_SEDIFEX_PUBLIC_API_BASE_URL ||
  "https://www.sedifex.com";

const SEDIFEX_STORE_ID =
  process.env.SEDIFEX_BOOKING_TARGET_STORE_ID ||
  process.env.SEDIFEX_STORE_ID ||
  process.env.NEXT_PUBLIC_SEDIFEX_STORE_ID ||
  ONCO_NURSE_STORE_ID;

const SEDIFEX_API_KEY =
  process.env.SEDIFEX_BOOKING_API_KEY ||
  process.env.SEDIFEX_CHECKOUT_API_KEY ||
  process.env.SEDIFEX_INTEGRATION_API_KEY ||
  process.env.SEDIFEX_INTEGRATION_KEY ||
  process.env.SEDIFEX_PRODUCTS_API_KEY ||
  "";

const SEDIFEX_CONTRACT_VERSION = process.env.SEDIFEX_CONTRACT_VERSION || "2026-04-13";

type RecordValue = Record<string, unknown>;

type BlogAttempt = {
  baseUrl: string;
  path: string;
  params: Record<string, string>;
  authenticated?: boolean;
  promo?: boolean;
};

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasValue(value?: string): boolean {
  return Boolean(value && !value.includes("PASTE_") && !value.includes("YOUR_"));
}

function readString(record: RecordValue, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);

    if (isRecord(value)) {
      const nested = readString(value, ["value", "text", "label", "name", "title", "url", "src", "href"]);
      if (nested) return nested;
    }
  }

  return fallback;
}

function normalizedKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function plainText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[#*_`>~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeExcerpt(value: string, length = 160): string {
  const text = plainText(value);
  if (text.length <= length) return text;
  return `${text.slice(0, length).trim()}…`;
}

function objectLooksLikeBlogPost(value: unknown): boolean {
  if (!isRecord(value)) return false;

  const title = readString(value, [
    "title",
    "postTitle",
    "post_title",
    "blogTitle",
    "blog_title",
    "heading",
    "name",
  ]);

  if (!title) return false;

  const marker = [
    readString(value, ["type", "kind", "contentType", "content_type", "category", "categoryName"]),
    readString(value, ["slug", "postSlug", "blogSlug", "articleSlug"]),
    readString(value, ["excerpt", "summary", "content", "body", "article", "description"]),
  ]
    .join(" ")
    .toLowerCase();

  return /blog|post|article|guide|news|story|nursing|germany|ausbildung|fsj|bfd|visa|recognition/.test(marker);
}

function collectBlogLikeObjects(payload: unknown, depth = 0, seen = new WeakSet<object>()): unknown[] {
  if (depth > 7) return [];

  if (Array.isArray(payload)) {
    const blogLike = payload.filter(objectLooksLikeBlogPost);
    if (blogLike.length) return blogLike;

    return payload.flatMap((item) => collectBlogLikeObjects(item, depth + 1, seen));
  }

  if (!isRecord(payload) || seen.has(payload)) return [];
  seen.add(payload);

  if (objectLooksLikeBlogPost(payload)) return [payload];

  const wantedArrayKeys = new Set(
    [
      "blogPosts",
      "blog_posts",
      "publicBlogPosts",
      "public_blog_posts",
      "posts",
      "publicPosts",
      "public_posts",
      "blogs",
      "publicBlogs",
      "public_blogs",
      "articles",
      "guides",
      "items",
      "data",
      "content",
      "results",
      "records",
      "docs",
      "documents",
      "rows",
      "list",
      "entries",
    ].map(normalizedKey)
  );

  const objects: unknown[] = [];

  for (const [key, value] of Object.entries(payload)) {
    if (Array.isArray(value)) {
      if (wantedArrayKeys.has(normalizedKey(key))) {
        objects.push(...value);
      } else {
        objects.push(...collectBlogLikeObjects(value, depth + 1, seen));
      }
    } else if (isRecord(value)) {
      objects.push(...collectBlogLikeObjects(value, depth + 1, seen));
    }
  }

  return objects.filter(objectLooksLikeBlogPost);
}

function normalizeBlogPost(raw: unknown, index: number): SedifexBlogPost {
  const record = isRecord(raw) ? raw : {};
  const title = readString(
    record,
    [
      "title",
      "postTitle",
      "post_title",
      "blogTitle",
      "blog_title",
      "heading",
      "promoTitle",
      "promo_title",
      "bannerTitle",
      "banner_title",
      "name",
    ],
    `Blog post ${index + 1}`
  );

  const contentHtml = readString(record, [
    "contentHtml",
    "content_html",
    "html",
    "bodyHtml",
    "body_html",
    "articleHtml",
    "article_html",
    "descriptionHtml",
    "description_html",
  ]);

  const content =
    readString(record, [
      "content",
      "body",
      "article",
      "longDescription",
      "long_description",
      "details",
      "text",
      "message",
    ]) || contentHtml;

  const excerpt =
    readString(record, [
      "excerpt",
      "summary",
      "subtitle",
      "description",
      "shortDescription",
      "short_description",
      "intro",
      "metaDescription",
      "meta_description",
    ]) || makeExcerpt(content);

  const postSlug = readString(
    record,
    ["slug", "postSlug", "post_slug", "blogSlug", "blog_slug", "articleSlug", "article_slug"],
    slugify(title)
  );

  return {
    id: readString(
      record,
      ["id", "_id", "uid", "postId", "post_id", "blogId", "blog_id", "slug", "postSlug", "post_slug", "documentId"],
      postSlug || `blog-${index + 1}`
    ),
    slug: postSlug,
    title,
    category: readString(record, ["category", "categoryName", "category_name", "type", "badge", "label"], "Germany Pathway"),
    excerpt,
    content,
    contentHtml,
    imageUrl: readString(record, [
      "imageUrl",
      "image_url",
      "coverImageUrl",
      "cover_image_url",
      "bannerImageUrl",
      "banner_image_url",
      "thumbnailUrl",
      "thumbnail_url",
      "photoUrl",
      "photo_url",
      "ogImage",
      "og_image",
      "image",
      "cover",
      "thumbnail",
    ]),
    imageAlt: readString(record, ["imageAlt", "image_alt", "coverImageAlt", "cover_image_alt", "alt"], title),
    publishedAt: readString(record, ["publishedAt", "published_at", "publishDate", "publish_date", "createdAt", "created_at", "updatedAt", "updated_at", "date"]),
    updatedAt: readString(record, ["updatedAt", "updated_at"]) || undefined,
    author: readString(record, ["author", "authorName", "author_name", "createdBy", "created_by"], "Onco-nurse"),
  };
}

function shouldShow(raw: unknown): boolean {
  if (!isRecord(raw)) return true;
  const status = readString(raw, ["status", "visibility", "publishStatus", "publish_status", "state"]).toLowerCase();

  if (/draft|hidden|disabled|deleted|archived|private/.test(status)) return false;
  return true;
}

function isBlogPromo(raw: unknown): boolean {
  if (!isRecord(raw)) return false;

  const marker = [
    readString(raw, ["type", "kind", "contentType", "content_type", "category", "categoryName"]),
    readString(raw, ["title", "heading", "name"]),
    readString(raw, ["slug", "postSlug", "blogSlug", "articleSlug"]),
  ]
    .join(" ")
    .toLowerCase();

  return /blog|post|article|guide|news|story|nursing|germany|ausbildung|fsj|bfd|visa|recognition/.test(marker);
}

function dedupePosts(posts: SedifexBlogPost[]): SedifexBlogPost[] {
  const seen = new Set<string>();

  return posts.filter((post) => {
    const key = (post.slug || post.id || post.title).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchSedifexBlog(attempt: BlogAttempt): Promise<unknown | null> {
  if (attempt.authenticated && !hasValue(SEDIFEX_API_KEY)) return null;

  try {
    const url = new URL(attempt.path, attempt.baseUrl);
    Object.entries(attempt.params).forEach(([key, value]) => {
      if (hasValue(value)) url.searchParams.set(key, value);
    });

    const response = await fetch(url, {
      cache: "no-store",
      headers: attempt.authenticated
        ? {
            "x-api-key": SEDIFEX_API_KEY,
            Authorization: `Bearer ${SEDIFEX_API_KEY}`,
            "X-Sedifex-Contract-Version": SEDIFEX_CONTRACT_VERSION,
            Accept: "application/json",
          }
        : { Accept: "application/json" },
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Sedifex blog pull failed", { path: attempt.path, error });
    return null;
  }
}

function normalizePostsFromPayload(payload: unknown, promo = false): SedifexBlogPost[] {
  return dedupePosts(
    collectBlogLikeObjects(payload)
      .filter((item) => shouldShow(item))
      .filter((item) => !promo || isBlogPromo(item))
      .map(normalizeBlogPost)
      .filter((post) => post.title && post.slug)
  );
}

function blogListAttempts(): BlogAttempt[] {
  return [
    { baseUrl: SEDIFEX_PUBLIC_API_BASE_URL, path: "/api/public-blog", params: { storeId: SEDIFEX_STORE_ID, limit: "30" } },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationBlogPosts", params: { storeId: SEDIFEX_STORE_ID, limit: "30" }, authenticated: true },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationBlogs", params: { storeId: SEDIFEX_STORE_ID, limit: "30" }, authenticated: true },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationPosts", params: { storeId: SEDIFEX_STORE_ID, limit: "30" }, authenticated: true },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationContent", params: { storeId: SEDIFEX_STORE_ID, type: "blog", limit: "30" }, authenticated: true },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationPromo", params: { storeId: SEDIFEX_STORE_ID, type: "blog", limit: "30" }, authenticated: true, promo: true },
    { baseUrl: SEDIFEX_BASE_URL, path: "/publicBlogPosts", params: { storeId: SEDIFEX_STORE_ID, limit: "30" } },
    { baseUrl: SEDIFEX_BASE_URL, path: "/publicBlogs", params: { storeId: SEDIFEX_STORE_ID, limit: "30" } },
    { baseUrl: SEDIFEX_PUBLIC_API_BASE_URL, path: "/api/public/blog", params: { storeId: SEDIFEX_STORE_ID, limit: "30" } },
    { baseUrl: SEDIFEX_PUBLIC_API_BASE_URL, path: "/api/public/posts", params: { storeId: SEDIFEX_STORE_ID, limit: "30" } },
    { baseUrl: SEDIFEX_PUBLIC_API_BASE_URL, path: "/api/public/articles", params: { storeId: SEDIFEX_STORE_ID, limit: "30" } },
  ];
}

export async function getSedifexBlogPosts(): Promise<SedifexBlogPost[]> {
  for (const attempt of blogListAttempts()) {
    const payload = await fetchSedifexBlog(attempt);
    const posts = normalizePostsFromPayload(payload, Boolean(attempt.promo));
    if (posts.length) return posts;
  }

  const legacy = await getLegacySedifexBlogPosts().catch(() => []);
  return legacy.length ? legacy : fallbackBlogPosts.map(normalizeBlogPost);
}

export async function getSedifexBlogPost(slug: string): Promise<SedifexBlogPost | null> {
  const posts = await getSedifexBlogPosts();
  const match = posts.find((post) => post.slug === slug || post.id === slug || slugify(post.title) === slug);
  if (match) return match;

  return getLegacySedifexBlogPost(slug).catch(() => null);
}

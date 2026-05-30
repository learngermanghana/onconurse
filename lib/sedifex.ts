import { fallbackBlogPosts, fallbackServices } from "./site";

const SEDIFEX_BASE_URL =
  process.env.SEDIFEX_INTEGRATION_API_BASE_URL ||
  process.env.SEDIFEX_API_BASE_URL ||
  "https://us-central1-sedifex-web.cloudfunctions.net";

const SEDIFEX_STORE_ID =
  process.env.SEDIFEX_STORE_ID ||
  process.env.SEDIFEX_BOOKING_TARGET_STORE_ID ||
  "";

const SEDIFEX_API_KEY =
  process.env.SEDIFEX_INTEGRATION_API_KEY ||
  process.env.SEDIFEX_PRODUCTS_API_KEY ||
  process.env.SEDIFEX_BOOKING_API_KEY ||
  "";

const SEDIFEX_CONTRACT_VERSION =
  process.env.SEDIFEX_CONTRACT_VERSION || "2026-04-13";

export type SedifexService = {
  id: string;
  slug?: string;
  storeId?: string;
  name: string;
  category?: string;
  description?: string;
  price?: number;
  priceMinor?: number;
  stockCount?: number | null;
  itemType?: string;
  type?: string;
  imageUrl?: string;
  imageUrls?: string[];
  imageAlt?: string;
  updatedAt?: string;
  tag?: string;
};

export type SedifexBlogPost = {
  id: string;
  slug: string;
  title: string;
  category?: string;
  excerpt?: string;
  content?: string;
  imageUrl?: string;
  publishedAt?: string;
  updatedAt?: string;
  author?: string;
};

export type SedifexHeroSlide = {
  id: string;
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
};

export type SedifexProfile = {
  displayName?: string;
  tagline?: string;
  businessDescription?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  publicPhone?: string;
  whatsappNumber?: string;
  publicEmail?: string;
  instagramHandle?: string;
};

export function isSedifexConfigured() {
  return Boolean(
    SEDIFEX_STORE_ID &&
      SEDIFEX_API_KEY &&
      !SEDIFEX_STORE_ID.includes("PASTE_") &&
      !SEDIFEX_API_KEY.includes("PASTE_")
  );
}

function sedifexHeaders(contentType = false) {
  return {
    "x-api-key": SEDIFEX_API_KEY,
    Authorization: `Bearer ${SEDIFEX_API_KEY}`,
    "X-Sedifex-Contract-Version": SEDIFEX_CONTRACT_VERSION,
    Accept: "application/json",
    ...(contentType ? { "Content-Type": "application/json" } : {}),
  };
}

async function sedifexGet<T>(
  path: string,
  params: Record<string, string> = {},
  revalidate = 60,
  silentErrors = false
): Promise<T | null> {
  if (!isSedifexConfigured()) return null;

  const url = new URL(path, SEDIFEX_BASE_URL);
  url.searchParams.set("storeId", SEDIFEX_STORE_ID);

  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: sedifexHeaders(),
    next: { revalidate },
  });

  if (!response.ok) {
    if (!silentErrors) {
      console.error("Sedifex GET failed", {
        path,
        status: response.status,
        requestId: response.headers.get("x-sedifex-request-id"),
      });
    }
    return null;
  }

  return response.json();
}

async function sedifexPost<T>(path: string, body: unknown): Promise<T> {
  if (!isSedifexConfigured()) {
    return {
      ok: true,
      demoMode: true,
      reference: "LOCAL-DEMO",
      message:
        "Sedifex is not configured yet. Add real store ID and integration key in .env.local.",
    } as T;
  }

  const url = new URL(path, SEDIFEX_BASE_URL);
  url.searchParams.set("storeId", SEDIFEX_STORE_ID);

  const response = await fetch(url, {
    method: "POST",
    headers: sedifexHeaders(true),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Sedifex POST failed: ${response.status}. ${text.slice(0, 200)}`);
  }

  return response.json();
}

export async function getSedifexServices(): Promise<SedifexService[]> {
  const payload = await sedifexGet<{
    products?: SedifexService[];
    publicServices?: SedifexService[];
  }>("/v1IntegrationProducts", {}, 30);

  const items = (payload?.publicServices?.length
    ? payload.publicServices
    : payload?.products?.length
    ? payload.products
    : fallbackServices) as SedifexService[];

  return items.filter((item) => {
    const marker = `${item.itemType || ""} ${item.type || ""}`.toLowerCase();
    return marker.includes("service");
  });
}

export async function getSedifexHeroSlides(): Promise<SedifexHeroSlide[]> {
  const payload = await sedifexGet<{ slides?: SedifexHeroSlide[] }>(
    "/v1IntegrationHeroSlides",
    { placement: "home_hero" },
    60
  );

  return payload?.slides || [];
}

export async function getSedifexSocialSettings(): Promise<{
  profile?: SedifexProfile;
} | null> {
  return sedifexGet("/v1IntegrationSocialSettings", {}, 60);
}

type SedifexRecord = Record<string, unknown>;

function isRecord(value: unknown): value is SedifexRecord {
  return typeof value === "object" && value !== null;
}

function readString(
  record: SedifexRecord,
  keys: string[],
  fallback = ""
): string {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return fallback;
}

function pickArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  const possible =
    payload.blogPosts ||
    payload.posts ||
    payload.blogs ||
    payload.articles ||
    payload.items ||
    payload.promos ||
    payload.banners ||
    payload.data ||
    payload.content;

  return Array.isArray(possible) ? possible : [];
}

function normalizeBlogPost(raw: unknown, index: number): SedifexBlogPost {
  const record = isRecord(raw) ? raw : {};
  const title = readString(
    record,
    ["title", "name", "heading", "promoTitle", "bannerTitle"],
    `Blog post ${index + 1}`
  );

  const excerpt = readString(record, [
    "excerpt",
    "summary",
    "subtitle",
    "description",
    "shortDescription",
  ]);

  const content =
    readString(record, ["content", "body", "article", "longDescription", "html"]) ||
    excerpt;

  return {
    id: readString(record, ["id", "postId", "slug"], `blog-${index + 1}`),
    slug: readString(record, ["slug"], slugify(title)),
    title,
    category: readString(
      record,
      ["category", "type", "badge"],
      "Germany Pathway"
    ),
    excerpt,
    content,
    imageUrl: readString(record, [
      "imageUrl",
      "coverImageUrl",
      "bannerImageUrl",
      "image",
    ]),
    publishedAt: readString(record, ["publishedAt", "createdAt", "updatedAt"]),
    updatedAt: readString(record, ["updatedAt"]) || undefined,
    author: readString(record, ["author", "authorName"], "Onco-nurse"),
  };
}

export async function getSedifexBlogPosts(): Promise<SedifexBlogPost[]> {
  const endpoints = [
    "/v1IntegrationBlogPosts",
    "/v1IntegrationBlogs",
    "/v1IntegrationBlog",
    "/v1IntegrationPromo",
  ];

  for (const endpoint of endpoints) {
    const payload = await sedifexGet<unknown>(endpoint, {}, 60, true);
    const items = pickArray(payload);

    if (items.length) {
      return items.map(normalizeBlogPost).filter((post) => post.title);
    }
  }

  return fallbackBlogPosts.map(normalizeBlogPost);
}

export async function createSedifexBooking(input: {
  serviceId: string;
  serviceName?: string;
  bookingDate?: string;
  bookingTime?: string;
  quantity?: number;
  customer: {
    name: string;
    email?: string;
    phone?: string;
  };
  notes?: string;
  paymentMethod?: string;
  paymentAmount?: number;
  attributes?: Record<string, unknown>;
}) {
  return sedifexPost("/v1IntegrationBookings", {
    ...input,
    quantity: input.quantity || 1,
    paymentMethod: input.paymentMethod || "manual",
    sourceChannel: "client_website",
    attributes: {
      source: "website_booking_form",
      sourceLabel: "Onco-nurse website",
      timezone: "Africa/Accra",
      locale: "en-GB",
      ...input.attributes,
    },
  });
}

export function getServiceSlug(service: Pick<SedifexService, "id" | "name" | "slug">) {
  return service.slug || service.id || slugify(service.name);
}

export function serviceHref(service: Pick<SedifexService, "id" | "name" | "slug">) {
  return `/services/${encodeURIComponent(getServiceSlug(service))}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function formatPrice(price?: number) {
  if (!price || price <= 0) return "Enquire";
  return `GHS ${new Intl.NumberFormat("en-GH", {
    maximumFractionDigits: 0,
  }).format(price)}`;
}

export function whatsappLink(phone?: string, message?: string) {
  const clean = (phone || "").replace(/[^\d]/g, "");
  const text = encodeURIComponent(
    message || "Hello Onco-nurse, I want guidance for Germany nursing pathway."
  );
  return clean ? `https://wa.me/${clean}?text=${text}` : "/contact";
}
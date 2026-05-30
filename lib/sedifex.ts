import { fallbackBlogPosts, fallbackServices } from "./site";

const SEDIFEX_BASE_URL =
  process.env.SEDIFEX_INTEGRATION_API_BASE_URL ||
  process.env.SEDIFEX_API_BASE_URL ||
  "https://us-central1-sedifex-web.cloudfunctions.net";

const SEDIFEX_PUBLIC_BLOG_URL =
  process.env.SEDIFEX_PUBLIC_BLOG_URL ||
  process.env.NEXT_PUBLIC_SEDIFEX_PUBLIC_BLOG_URL ||
  "https://www.sedifex.com/api/public-blog";

const SEDIFEX_STORE_ID =
  process.env.SEDIFEX_STORE_ID ||
  process.env.SEDIFEX_BOOKING_TARGET_STORE_ID ||
  "";

const SEDIFEX_PUBLIC_BLOG_STORE_ID =
  process.env.SEDIFEX_PUBLIC_BLOG_STORE_ID ||
  process.env.NEXT_PUBLIC_SEDIFEX_PUBLIC_BLOG_STORE_ID ||
  process.env.SEDIFEX_STORE_ID ||
  "YvRddOFEYlhYoNrwqSyHwShPioR2";

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
  contentHtml?: string;
  imageUrl?: string;
  imageAlt?: string;
  publishedAt?: string;
  updatedAt?: string;
  author?: string;
};

export type SedifexHeroSlide = {
  id: string;
  storeId?: string;
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  accent?: string;
  textColor?: string;
  overlayStyle?: string;
  layout?: string;
  priority?: number;
  updatedAt?: string;
};

export type SedifexEvent = {
  id: string;
  slug?: string;
  title: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  status?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type SedifexProfile = {
  displayName?: string;
  tagline?: string;
  businessDescription?: string;
  openingHours?: string;
  brandColor?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  socialShareImage?: string;
  publicPhone?: string;
  whatsappNumber?: string;
  telegramNumber?: string;
  publicEmail?: string;
  addressLine1?: string;
  city?: string;
  country?: string;
  websiteUrl?: string;
  instagramHandle?: string;
  facebookUrl?: string;
  tiktokHandle?: string;
  youtubeUrl?: string;
  xHandle?: string;
  linkedinUrl?: string;
  updatedAt?: string;
};

export type SedifexSocialSettings = {
  profile?: SedifexProfile;
  socialLinks?: Partial<
    Record<
      "website" | "instagram" | "facebook" | "tiktok" | "youtube" | "x" | "linkedin",
      string
    >
  >;
};

function hasUsableValue(value: string) {
  return Boolean(value && !value.includes("PASTE_") && !value.includes("YOUR_"));
}

export function isSedifexStoreConfigured() {
  return hasUsableValue(SEDIFEX_STORE_ID);
}

export function isSedifexConfigured() {
  return isSedifexStoreConfigured() && hasUsableValue(SEDIFEX_API_KEY);
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
  silentErrors = false,
  authenticated = true
): Promise<T | null> {
  if (!isSedifexStoreConfigured() || (authenticated && !isSedifexConfigured())) return null;

  const url = new URL(path, SEDIFEX_BASE_URL);
  url.searchParams.set("storeId", SEDIFEX_STORE_ID);

  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: authenticated ? sedifexHeaders() : { Accept: "application/json" },
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

async function sedifexPublicBlogGet<T>(
  params: Record<string, string> = {},
  revalidate = 60,
  silentErrors = true
): Promise<T | null> {
  if (!hasUsableValue(SEDIFEX_PUBLIC_BLOG_STORE_ID)) return null;

  const url = new URL(SEDIFEX_PUBLIC_BLOG_URL);
  if (!url.searchParams.has("storeId")) {
    url.searchParams.set("storeId", SEDIFEX_PUBLIC_BLOG_STORE_ID);
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate },
    });

    if (!response.ok) {
      if (!silentErrors) {
        console.error("Sedifex public blog GET failed", {
          url: url.toString(),
          status: response.status,
          requestId: response.headers.get("x-sedifex-request-id"),
        });
      }
      return null;
    }

    return response.json();
  } catch (error) {
    if (!silentErrors) {
      console.error("Sedifex public blog GET failed", {
        url: url.toString(),
        error,
      });
    }

    return null;
  }
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

function serviceItemsFromPayload(payload: unknown): SedifexService[] {
  if (!isRecord(payload)) return [];

  const candidates = [
    payload.products,
    payload.publicServices,
    payload.services,
    payload.items,
    payload.data,
  ];

  const items = candidates.find((value) => Array.isArray(value));
  if (!Array.isArray(items)) return [];

  return (items as SedifexService[]).filter((item) => {
    const itemType = (item.itemType || "").toLowerCase();
    const type = (item.type || "").toUpperCase();
    return itemType === "service" || type === "SERVICE";
  });
}

export async function getSedifexServices(): Promise<SedifexService[]> {
  const integrationPayload = await sedifexGet<unknown>(
    "/v1IntegrationProducts",
    {},
    30
  );
  const integrationServices = serviceItemsFromPayload(integrationPayload);

  if (integrationServices.length) return integrationServices;

  const publicPayload = await sedifexGet<unknown>(
    "/publicQuickPayCatalog",
    {},
    30,
    true,
    false
  );
  const publicServices = serviceItemsFromPayload(publicPayload);

  return publicServices.length ? publicServices : fallbackServices;
}

export async function getSedifexHeroSlides(): Promise<SedifexHeroSlide[]> {
  const payload = await sedifexGet<{ slides?: SedifexHeroSlide[] }>(
    "/v1IntegrationHeroSlides",
    { placement: "home_hero" },
    60
  );

  return payload?.slides || [];
}

export async function getSedifexSocialSettings(): Promise<SedifexSocialSettings | null> {
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

  const keys = [
    "events",
    "upcomingEvents",
    "calendarEvents",
    "eventItems",
    "blogPosts",
    "posts",
    "blogs",
    "articles",
    "items",
    "promos",
    "banners",
    "data",
    "content",
  ];

  for (const key of keys) {
    const possible = payload[key];
    if (Array.isArray(possible) && possible.length) return possible;
  }

  return [];
}

const fallbackEvents: SedifexEvent[] = [
  {
    id: "nursing-webinar",
    title: "Free Germany Nursing Webinar",
    category: "Online Event",
    description:
      "Learn about Nursing Ausbildung, recognition, documents and Germany preparation.",
    location: "Online / to be confirmed",
    status: "upcoming",
  },
  {
    id: "fsj-bfd-info",
    title: "FSJ / BFD Info Session",
    category: "Online Event",
    description:
      "Understand voluntary service options and how to prepare your application.",
    location: "Online / to be confirmed",
    status: "upcoming",
  },
  {
    id: "student-visa-qa",
    title: "Student Visa Q&A",
    category: "Online Event",
    description:
      "Ask questions about visa documents, blocked account and interview preparation.",
    location: "Online / to be confirmed",
    status: "upcoming",
  },
];

function normalizeEvent(raw: unknown, index: number): SedifexEvent {
  const record = isRecord(raw) ? raw : {};
  const title = readString(
    record,
    ["title", "name", "heading"],
    `Event ${index + 1}`
  );

  return {
    id: readString(record, ["id", "eventId", "slug"], `event-${index + 1}`),
    slug: readString(record, ["slug"]) || undefined,
    title,
    category: readString(record, ["category", "type", "badge"]) || undefined,
    description:
      readString(record, ["description", "excerpt", "summary", "subtitle"]) ||
      undefined,
    imageUrl:
      readString(record, [
        "imageUrl",
        "coverImageUrl",
        "bannerImageUrl",
        "image",
      ]) || undefined,
    startDate: readString(record, ["startDate", "date", "eventDate"]) || undefined,
    endDate: readString(record, ["endDate"]) || undefined,
    startTime: readString(record, ["startTime", "time"]) || undefined,
    endTime: readString(record, ["endTime"]) || undefined,
    location: readString(record, ["location", "venue"]) || undefined,
    status: readString(record, ["status"]) || undefined,
    ctaLabel: readString(record, ["ctaLabel", "buttonText"]) || undefined,
    ctaHref:
      readString(record, ["ctaHref", "buttonLink", "url"]) || undefined,
  };
}

function isVisibleEvent(event: SedifexEvent) {
  const status = (event.status || "").trim().toLowerCase();
  return (
    !status ||
    status.includes("active") ||
    status.includes("published") ||
    status.includes("upcoming")
  );
}

function isEventPromo(raw: unknown, event: SedifexEvent) {
  const record = isRecord(raw) ? raw : {};
  const marker = [
    event.category,
    event.title,
    readString(record, ["type"]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /event|webinar|workshop|seminar|session|info session/.test(marker);
}

export async function getSedifexEvents(): Promise<SedifexEvent[]> {
  const endpoints = [
    "/v1IntegrationEvents",
    "/v1IntegrationUpcomingEvents",
    "/v1IntegrationCalendarEvents",
    "/v1IntegrationPromo",
  ];

  for (const endpoint of endpoints) {
    const payload = await sedifexGet<unknown>(endpoint, {}, 60, true);
    const items = pickArray(payload);
    const events = items
      .map(normalizeEvent)
      .filter((event, index) => {
        if (!event.title || !isVisibleEvent(event)) return false;
        return endpoint !== "/v1IntegrationPromo" || isEventPromo(items[index], event);
      });

    if (events.length) return events;
  }

  return fallbackEvents.map(normalizeEvent);
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

  const contentHtml = readString(record, ["contentHtml", "html"]);
  const content =
    readString(record, ["content", "body", "article", "longDescription"]) ||
    contentHtml ||
    excerpt;
  const postSlug = readString(record, ["slug", "postSlug"], slugify(title));

  return {
    id: readString(
      record,
      ["id", "postId", "slug", "postSlug"],
      postSlug || `blog-${index + 1}`
    ),
    slug: postSlug,
    title,
    category: readString(
      record,
      ["category", "type", "badge"],
      "Germany Pathway"
    ),
    excerpt,
    content,
    contentHtml,
    imageUrl: readString(record, [
      "imageUrl",
      "coverImageUrl",
      "bannerImageUrl",
      "image",
    ]),
    imageAlt: readString(record, ["imageAlt", "coverImageAlt", "alt"], title),
    publishedAt: readString(record, ["publishedAt", "createdAt", "updatedAt"]),
    updatedAt: readString(record, ["updatedAt"]) || undefined,
    author: readString(record, ["author", "authorName"], "Onco-nurse"),
  };
}

export function sanitizeSedifexHtml(html: string) {
  return html
    .replace(
      /<\/?(?:script|style|iframe|object|embed|form|input|button|textarea|select|option|link|meta|base)[^>]*>/gi,
      ""
    )
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(?:srcdoc|formaction)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, "")
    .replace(/<a\b([^>]*)>/gi, (match, attrs: string) => {
      if (/\srel\s*=/.test(attrs)) return match;
      return `<a${attrs} rel="noopener noreferrer">`;
    });
}

async function getSedifexPublicBlogPosts(
  limit = "20"
): Promise<SedifexBlogPost[]> {
  const publicPayload = await sedifexPublicBlogGet<unknown>({ limit }, 60);

  return pickArray(publicPayload)
    .map(normalizeBlogPost)
    .filter((post) => post.title && post.slug);
}

export async function getSedifexBlogPosts(): Promise<SedifexBlogPost[]> {
  const publicPosts = await getSedifexPublicBlogPosts();

  if (publicPosts.length) return publicPosts;

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

export async function getSedifexBlogPost(slug: string): Promise<SedifexBlogPost | null> {
  const publicPosts = await getSedifexPublicBlogPosts("100");
  const publicPost = publicPosts.find((item) => item.slug === slug);

  if (publicPost) return publicPost;

  const posts = await getSedifexBlogPosts();
  return posts.find((item) => item.slug === slug) || null;
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
  sourceChannel?: string;
  attributes?: Record<string, unknown>;
}) {
  return sedifexPost("/v1IntegrationBookings", {
    ...input,
    quantity: input.quantity || 1,
    paymentMethod: input.paymentMethod || "manual",
    sourceChannel: input.sourceChannel || "client_website",
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
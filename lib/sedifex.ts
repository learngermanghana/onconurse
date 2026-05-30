import { fallbackBlogPosts, fallbackServices, site } from "./site";

const DEFAULT_SEDIFEX_API_BASE_URL =
  "https://us-central1-sedifex-web.cloudfunctions.net";

function getSedifexConfig() {
  const storeId =
    process.env.SEDIFEX_STORE_ID ||
    process.env.SEDIFEX_BOOKING_TARGET_STORE_ID ||
    process.env.NEXT_PUBLIC_SEDIFEX_STORE_ID ||
    "";

  const apiKey =
    process.env.SEDIFEX_INTEGRATION_API_KEY ||
    process.env.SEDIFEX_PRODUCTS_API_KEY ||
    process.env.SEDIFEX_BOOKING_API_KEY ||
    process.env.SEDIFEX_INTEGRATION_KEY ||
    "";

  return {
    baseUrl:
      process.env.SEDIFEX_INTEGRATION_API_BASE_URL ||
      process.env.SEDIFEX_API_BASE_URL ||
      DEFAULT_SEDIFEX_API_BASE_URL,
    storeId,
    apiKey,
    contractVersion: process.env.SEDIFEX_CONTRACT_VERSION || "2026-04-13",
  };
}

const SEDIFEX_CONFIG = getSedifexConfig();
const SEDIFEX_BASE_URL = SEDIFEX_CONFIG.baseUrl;

const SEDIFEX_PUBLIC_API_BASE_URL =
  process.env.SEDIFEX_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_SEDIFEX_PUBLIC_API_BASE_URL ||
  "https://sedifex.com";

const SEDIFEX_STORE_ID = SEDIFEX_CONFIG.storeId;

const SEDIFEX_STORE_SLUG =
  process.env.SEDIFEX_STORE_SLUG ||
  process.env.SEDIFEX_PUBLIC_STORE_SLUG ||
  process.env.NEXT_PUBLIC_SEDIFEX_STORE_SLUG ||
  slugify(site.name);

const SEDIFEX_API_KEY = SEDIFEX_CONFIG.apiKey;

const SEDIFEX_CONTRACT_VERSION = SEDIFEX_CONFIG.contractVersion;

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
  sortOrder?: number;
  order?: number;
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
  path: string,
  params: Record<string, string> = {},
  revalidate = 60,
  silentErrors = true
): Promise<T | null> {
  if (!hasUsableValue(SEDIFEX_STORE_SLUG)) return null;

  const url = new URL(path, SEDIFEX_PUBLIC_API_BASE_URL);
  url.searchParams.set("storeSlug", SEDIFEX_STORE_SLUG);

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
          path,
          status: response.status,
          requestId: response.headers.get("x-sedifex-request-id"),
        });
      }
      return null;
    }

    return response.json();
  } catch (error) {
    if (!silentErrors) {
      console.error("Sedifex public blog GET failed", { path, error });
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

type SedifexProductsResponse = {
  products?: unknown[];
  publicProducts?: unknown[];
  publicServices?: unknown[];
};

type SedifexPublicCatalogResponse = {
  items?: unknown[];
};

const preferredServiceNames = [
  "nursing ausbildung",
  "fsj",
  "bfd",
  "au-pair",
  "au pair",
  "recognition",
  "student visa",
  "document review",
];

function serviceItemsFromPayload(payload: unknown, publicCatalog = false): unknown[] {
  if (!isRecord(payload)) return [];

  if (publicCatalog) {
    return Array.isArray((payload as SedifexPublicCatalogResponse).items)
      ? (payload as SedifexPublicCatalogResponse).items || []
      : [];
  }

  const response = payload as SedifexProductsResponse;

  if (Array.isArray(response.publicServices) && response.publicServices.length) {
    return response.publicServices;
  }

  if (Array.isArray(response.products) && response.products.length) {
    return response.products;
  }

  if (Array.isArray(response.publicProducts) && response.publicProducts.length) {
    return response.publicProducts;
  }

  return [];
}

function isServiceItem(item: unknown) {
  if (!isRecord(item)) return false;

  const itemType = readString(item, ["itemType", "type"]).toLowerCase();
  return itemType === "service";
}

function readNumber(record: SedifexRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return undefined;
}

function readStringArray(record: SedifexRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value.filter(
        (item): item is string => typeof item === "string" && Boolean(item.trim())
      );
    }
  }

  return [];
}

function normalizeServiceDescription(description: string) {
  return description
    .split(/\r?\n/)
    .map((line) => line.replace(/\*\*/g, "").trim())
    .filter((line) => {
      if (!line) return false;
      if (/^(?:product\s*name|item\s*type|category)\s*:/i.test(line)) return false;
      if (/^not provided$/i.test(line)) return false;
      return true;
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

function normalizeCategory(category: string) {
  return /^not provided$/i.test(category.trim()) ? "" : category.trim();
}

function mapSedifexItem(raw: unknown, index: number): SedifexService {
  const record = isRecord(raw) ? raw : {};
  const name = readString(record, ["name", "serviceName", "title"], `Service ${index + 1}`);
  const imageUrls = readStringArray(record, ["imageUrls", "images"]);
  const description = normalizeServiceDescription(
    readString(record, ["description", "shortDescription", "summary", "details"])
  );
  const price = readNumber(record, ["price", "amount", "unitPrice"]);
  const priceMinor = readNumber(record, ["priceMinor", "amountMinor"]);

  return {
    id: readString(record, ["id", "productId", "itemId", "serviceId"], `service-${index + 1}`),
    slug: readString(record, ["slug"]) || undefined,
    storeId: readString(record, ["storeId"]) || undefined,
    name,
    category: normalizeCategory(readString(record, ["category", "categoryName"])),
    description,
    price,
    priceMinor,
    stockCount: readNumber(record, ["stockCount", "stock"]) ?? null,
    itemType: readString(record, ["itemType"]) || undefined,
    type: readString(record, ["type"]) || undefined,
    imageUrl: readString(record, ["imageUrl", "image", "thumbnailUrl"]) || imageUrls[0],
    imageUrls,
    imageAlt: readString(record, ["imageAlt", "alt"], name),
    updatedAt: readString(record, ["updatedAt"]) || undefined,
    tag: readString(record, ["tag", "badge", "label"]) || undefined,
    sortOrder: readNumber(record, ["sortOrder", "order", "position"]),
    order: readNumber(record, ["order"]),
  };
}

function preferredServiceIndex(service: SedifexService) {
  const searchable = `${service.name} ${service.category || ""}`.toLowerCase();
  const index = preferredServiceNames.findIndex((name) => searchable.includes(name));
  return index === -1 ? Number.POSITIVE_INFINITY : index;
}

function sortSedifexServices(services: SedifexService[]) {
  return services
    .map((service, index) => ({ service, index }))
    .sort((left, right) => {
      const preferredDelta =
        preferredServiceIndex(left.service) - preferredServiceIndex(right.service);
      if (preferredDelta) return preferredDelta;

      const leftOrder = left.service.sortOrder ?? left.service.order;
      const rightOrder = right.service.sortOrder ?? right.service.order;

      if (leftOrder !== undefined || rightOrder !== undefined) {
        return (leftOrder ?? Number.POSITIVE_INFINITY) -
          (rightOrder ?? Number.POSITIVE_INFINITY);
      }

      return left.index - right.index;
    })
    .map(({ service }) => service);
}

function fallbackServiceData() {
  return sortSedifexServices(fallbackServices.map(mapSedifexItem));
}

export async function getSedifexServices(): Promise<SedifexService[]> {
  try {
    const integrationPayload = await sedifexGet<unknown>(
      "/v1IntegrationProducts",
      {},
      30
    );
    const integrationServices = serviceItemsFromPayload(integrationPayload)
      .filter(isServiceItem)
      .map(mapSedifexItem);

    if (integrationServices.length) return sortSedifexServices(integrationServices);

    const publicPayload = await sedifexGet<unknown>(
      "/publicQuickPayCatalog",
      {},
      30,
      true,
      false
    );
    const publicServices = serviceItemsFromPayload(publicPayload, true)
      .filter(isServiceItem)
      .map(mapSedifexItem);

    return publicServices.length ? sortSedifexServices(publicServices) : fallbackServiceData();
  } catch (error) {
    console.error("Sedifex service load failed", { error });
    return fallbackServiceData();
  }
}

export const getServiceData = getSedifexServices;

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

function firstPayloadItem(payload: unknown): unknown | null {
  if (Array.isArray(payload)) return payload[0] || null;
  if (!isRecord(payload)) return null;

  const direct = payload.post || payload.blogPost || payload.item || payload.data;
  if (direct && !Array.isArray(direct)) return direct;
  if (typeof payload.title === "string") return payload;

  return pickArray(payload)[0] || null;
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

export async function getSedifexBlogPosts(): Promise<SedifexBlogPost[]> {
  const publicPayload = await sedifexPublicBlogGet<unknown>(
    "/api/public/blog",
    { limit: "20" },
    60
  );
  const publicPosts = pickArray(publicPayload)
    .map(normalizeBlogPost)
    .filter((post) => post.title && post.slug);

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
  const publicPayload = await sedifexPublicBlogGet<unknown>(
    `/api/public/blog/${encodeURIComponent(slug)}`,
    {},
    60
  );
  const publicPost = firstPayloadItem(publicPayload);

  if (publicPost) {
    const normalized = normalizeBlogPost(publicPost, 0);
    if (normalized.title) return normalized;
  }

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
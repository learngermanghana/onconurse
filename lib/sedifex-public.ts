import { fallbackBlogPosts, fallbackServices, site } from "./site";
import {
  getSedifexBlogPost as getLegacySedifexBlogPost,
  getSedifexBlogPosts as getLegacySedifexBlogPosts,
  getSedifexEvents as getLegacySedifexEvents,
  getSedifexService as getLegacySedifexService,
  getSedifexServices as getLegacySedifexServices,
  slugify,
  type SedifexBlogPost,
  type SedifexEvent,
  type SedifexService,
} from "./sedifex";

export {
  formatPrice,
  getSedifexHeroSlides,
  getSedifexSocialSettings,
  sanitizeSedifexHtml,
  serviceHref,
  whatsappLink,
} from "./sedifex";

const DEFAULT_SEDIFEX_API_BASE_URL =
  "https://us-central1-sedifex-web.cloudfunctions.net";

const SEDIFEX_BASE_URL =
  process.env.SEDIFEX_INTEGRATION_API_BASE_URL ||
  process.env.SEDIFEX_API_BASE_URL ||
  DEFAULT_SEDIFEX_API_BASE_URL;

const SEDIFEX_PUBLIC_API_BASE_URL =
  process.env.SEDIFEX_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_SEDIFEX_PUBLIC_API_BASE_URL ||
  "https://sedifex.com";

const SEDIFEX_STORE_ID =
  process.env.SEDIFEX_BOOKING_TARGET_STORE_ID ||
  process.env.SEDIFEX_STORE_ID ||
  process.env.NEXT_PUBLIC_SEDIFEX_STORE_ID ||
  "";

const SEDIFEX_STORE_SLUG =
  process.env.SEDIFEX_STORE_SLUG ||
  process.env.SEDIFEX_PUBLIC_STORE_SLUG ||
  process.env.NEXT_PUBLIC_SEDIFEX_STORE_SLUG ||
  slugify(site.name);

const SEDIFEX_API_KEY =
  process.env.SEDIFEX_BOOKING_API_KEY ||
  process.env.SEDIFEX_CHECKOUT_API_KEY ||
  process.env.SEDIFEX_INTEGRATION_API_KEY ||
  process.env.SEDIFEX_INTEGRATION_KEY ||
  process.env.SEDIFEX_PRODUCTS_API_KEY ||
  "";

const SEDIFEX_CONTRACT_VERSION = process.env.SEDIFEX_CONTRACT_VERSION || "2026-04-13";

type SedifexRecord = Record<string, unknown>;
type ContentKind = "services" | "catalog" | "blog" | "events" | "promo";
type Attempt = {
  baseUrl: string;
  path: string;
  params: Record<string, string>;
  authenticated?: boolean;
  kind: ContentKind;
  revalidate?: number;
};

function isRecord(value: unknown): value is SedifexRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function usable(value?: string): boolean {
  return Boolean(value && !value.includes("PASTE_") && !value.includes("YOUR_"));
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function readString(record: SedifexRecord, keys: string[], fallback = ""): string {
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

function readBoolean(record: SedifexRecord, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "yes", "1"].includes(normalized)) return true;
      if (["false", "no", "0"].includes(normalized)) return false;
    }
  }

  return undefined;
}

function readStringArray(record: SedifexRecord, keys: string[]): string[] {
  for (const key of keys) {
    const value = record[key];
    if (!Array.isArray(value)) continue;

    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (isRecord(item)) return readString(item, ["url", "src", "href", "imageUrl", "image_url", "image"]);
        return "";
      })
      .filter(Boolean);
  }

  return [];
}

function collectArrays(payload: unknown, keys: string[], includeDirectArray = false, depth = 0, seen = new WeakSet<object>()): unknown[][] {
  if (depth > 6) return [];
  if (Array.isArray(payload)) return includeDirectArray ? [payload] : [];
  if (!isRecord(payload) || seen.has(payload)) return [];

  seen.add(payload);
  const wanted = new Set(keys.map(normalizeKey));
  const found: unknown[][] = [];

  for (const [key, value] of Object.entries(payload)) {
    if (Array.isArray(value) && wanted.has(normalizeKey(key))) {
      found.push(value);
    } else if (isRecord(value)) {
      found.push(...collectArrays(value, keys, false, depth + 1, seen));
    }
  }

  return found;
}

async function fetchJson(attempt: Attempt): Promise<unknown | null> {
  if (attempt.authenticated && !usable(SEDIFEX_API_KEY)) return null;

  try {
    const url = new URL(attempt.path, attempt.baseUrl);
    Object.entries(attempt.params).forEach(([key, value]) => {
      if (usable(value)) url.searchParams.set(key, value);
    });

    const response = await fetch(url, {
      headers: attempt.authenticated
        ? {
            "x-api-key": SEDIFEX_API_KEY,
            Authorization: `Bearer ${SEDIFEX_API_KEY}`,
            "X-Sedifex-Contract-Version": SEDIFEX_CONTRACT_VERSION,
            Accept: "application/json",
          }
        : { Accept: "application/json" },
      next: { revalidate: attempt.revalidate ?? 60 },
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Sedifex flexible GET failed", { path: attempt.path, error });
    return null;
  }
}

function dedupeByKey<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item).toLowerCase();
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function normalizeDescription(description: string): string {
  return description
    .split(/\r?\n/)
    .map((line) => line.replace(/\*\*/g, "").trim())
    .filter((line) => line && !/^(?:product\s*name|item\s*type|category)\s*:/i.test(line))
    .filter((line) => !/^not provided$/i.test(line))
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

function normalizeCategory(category: string): string {
  return /^not provided$/i.test(category.trim()) ? "" : category.trim();
}

const preferredServiceNames = [
  "nursing ausbildung",
  "ausbildung",
  "fsj",
  "bfd",
  "au-pair",
  "au pair",
  "recognition",
  "student visa",
  "document review",
  "consultation",
];

function preferredServiceIndex(service: SedifexService): number {
  const searchable = `${service.name} ${service.category || ""}`.toLowerCase();
  const index = preferredServiceNames.findIndex((name) => searchable.includes(name));
  return index === -1 ? Number.POSITIVE_INFINITY : index;
}

function isProbablyService(raw: unknown): boolean {
  if (!isRecord(raw)) return false;

  const typeText = [
    readString(raw, ["itemType", "item_type", "type", "kind", "recordType", "contentType"]),
    readString(raw, ["category", "categoryName", "category_name"]),
  ].join(" ").toLowerCase();

  if (/service|consultation|booking|appointment/.test(typeText)) return true;
  if (/product|inventory|physical/.test(typeText)) return false;

  const explicitService = readBoolean(raw, ["isService", "is_service", "bookable", "isBookable"]);
  if (explicitService === true) return true;

  const searchable = `${readString(raw, ["name", "serviceName", "title"])} ${typeText}`.toLowerCase();
  return preferredServiceNames.some((name) => searchable.includes(name));
}

function normalizeService(raw: unknown, index: number): SedifexService {
  const record = isRecord(raw) ? raw : {};
  const imageUrls = readStringArray(record, ["imageUrls", "image_urls", "images", "gallery"]);
  const name = readString(record, ["name", "serviceName", "service_name", "title"], `Service ${index + 1}`);
  const slug = readString(record, ["slug", "serviceSlug", "service_slug", "productSlug", "product_slug"]);

  return {
    id: readString(record, ["id", "_id", "uid", "productId", "product_id", "itemId", "item_id", "serviceId", "service_id", "documentId"], slug || slugify(name) || `service-${index + 1}`),
    slug: slug || undefined,
    storeId: readString(record, ["storeId", "store_id", "merchantId", "merchant_id"]) || undefined,
    name,
    category: normalizeCategory(readString(record, ["category", "categoryName", "category_name"])),
    description: normalizeDescription(readString(record, ["description", "shortDescription", "short_description", "summary", "details", "body"])),
    price: readNumber(record, ["price", "amount", "unitPrice", "unit_price", "servicePrice", "service_price"]),
    priceMinor: readNumber(record, ["priceMinor", "price_minor", "amountMinor", "amount_minor"]),
    stockCount: readNumber(record, ["stockCount", "stock_count", "stock", "quantity"]) ?? null,
    itemType: readString(record, ["itemType", "item_type", "recordType"]) || undefined,
    type: readString(record, ["type", "kind", "contentType"]) || undefined,
    imageUrl: readString(record, ["imageUrl", "image_url", "image", "thumbnailUrl", "thumbnail_url", "coverImageUrl", "cover_image_url", "photoUrl", "photo_url"]) || imageUrls[0],
    imageUrls,
    imageAlt: readString(record, ["imageAlt", "image_alt", "alt"], name),
    updatedAt: readString(record, ["updatedAt", "updated_at"]) || undefined,
    tag: readString(record, ["tag", "badge", "badgeLabel", "badge_label", "label"]) || undefined,
    sortOrder: readNumber(record, ["sortOrder", "sort_order", "order", "position"]),
    order: readNumber(record, ["order"]),
  };
}

function sortServices(services: SedifexService[]): SedifexService[] {
  return dedupeByKey(services, (service) => service.slug || service.id || service.name)
    .map((service, index) => ({ service, index }))
    .sort((left, right) => {
      const preferredDelta = preferredServiceIndex(left.service) - preferredServiceIndex(right.service);
      if (Number.isFinite(preferredDelta) && preferredDelta !== 0) return preferredDelta;

      const leftOrder = left.service.sortOrder ?? left.service.order;
      const rightOrder = right.service.sortOrder ?? right.service.order;
      if (leftOrder !== undefined || rightOrder !== undefined) {
        return (leftOrder ?? Number.POSITIVE_INFINITY) - (rightOrder ?? Number.POSITIVE_INFINITY);
      }

      return left.index - right.index;
    })
    .map(({ service }) => service);
}

function extractServices(payload: unknown, kind: ContentKind): SedifexService[] {
  const serviceKeys = ["publicServices", "services", "serviceItems", "bookableServices", "bookingServices"];
  const catalogKeys = ["items", "products", "publicProducts", "catalog", "publicCatalog", "data", "content"];
  const direct = kind === "services" || kind === "catalog";

  const serviceItems = collectArrays(payload, serviceKeys, direct).flat();
  if (serviceItems.length) return sortServices(serviceItems.map(normalizeService).filter((item) => item.name));

  const catalogItems = collectArrays(payload, catalogKeys, direct).flat();
  const marked = catalogItems.filter(isProbablyService);
  if (marked.length) return sortServices(marked.map(normalizeService).filter((item) => item.name));

  return kind === "catalog" && catalogItems.length
    ? sortServices(catalogItems.map(normalizeService).filter((item) => item.name))
    : [];
}

export async function getSedifexServices(): Promise<SedifexService[]> {
  const attempts: Attempt[] = [
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationServices", params: { storeId: SEDIFEX_STORE_ID }, authenticated: true, kind: "services", revalidate: 30 },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationProducts", params: { storeId: SEDIFEX_STORE_ID }, authenticated: true, kind: "catalog", revalidate: 30 },
    { baseUrl: SEDIFEX_BASE_URL, path: "/publicQuickPayCatalog", params: { storeId: SEDIFEX_STORE_ID }, kind: "catalog", revalidate: 30 },
    { baseUrl: SEDIFEX_PUBLIC_API_BASE_URL, path: "/api/public/services", params: { storeSlug: SEDIFEX_STORE_SLUG, storeId: SEDIFEX_STORE_ID }, kind: "services", revalidate: 30 },
    { baseUrl: SEDIFEX_PUBLIC_API_BASE_URL, path: "/api/public/catalog", params: { storeSlug: SEDIFEX_STORE_SLUG, storeId: SEDIFEX_STORE_ID }, kind: "catalog", revalidate: 30 },
  ];

  for (const attempt of attempts) {
    const services = extractServices(await fetchJson(attempt), attempt.kind);
    if (services.length) return services;
  }

  const legacy = await getLegacySedifexServices().catch(() => []);
  return legacy.length ? legacy : sortServices(fallbackServices.map(normalizeService));
}

export async function getSedifexService(slug: string): Promise<SedifexService | null> {
  const services = await getSedifexServices();
  const match = services.find(
    (service) => service.slug === slug || service.id === slug || slugify(service.name) === slug || encodeURIComponent(service.id) === slug
  );

  if (match) return match;
  return getLegacySedifexService(slug).catch(() => null);
}

function normalizeBlogPost(raw: unknown, index: number): SedifexBlogPost {
  const record = isRecord(raw) ? raw : {};
  const title = readString(record, ["title", "name", "heading", "promoTitle", "promo_title", "bannerTitle", "banner_title"], `Blog post ${index + 1}`);
  const excerpt = readString(record, ["excerpt", "summary", "subtitle", "description", "shortDescription", "short_description"]);
  const contentHtml = readString(record, ["contentHtml", "content_html", "html", "bodyHtml", "body_html"]);
  const content = readString(record, ["content", "body", "article", "longDescription", "long_description", "text"]) || contentHtml || excerpt;
  const postSlug = readString(record, ["slug", "postSlug", "post_slug", "articleSlug", "article_slug"], slugify(title));

  return {
    id: readString(record, ["id", "_id", "uid", "postId", "post_id", "slug", "postSlug", "post_slug", "documentId"], postSlug || `blog-${index + 1}`),
    slug: postSlug,
    title,
    category: readString(record, ["category", "type", "badge", "label"], "Germany Pathway"),
    excerpt,
    content,
    contentHtml,
    imageUrl: readString(record, ["imageUrl", "image_url", "coverImageUrl", "cover_image_url", "bannerImageUrl", "banner_image_url", "image", "thumbnailUrl", "thumbnail_url"]),
    imageAlt: readString(record, ["imageAlt", "image_alt", "coverImageAlt", "cover_image_alt", "alt"], title),
    publishedAt: readString(record, ["publishedAt", "published_at", "createdAt", "created_at", "updatedAt", "updated_at"]),
    updatedAt: readString(record, ["updatedAt", "updated_at"]) || undefined,
    author: readString(record, ["author", "authorName", "author_name"], "Onco-nurse"),
  };
}

function visibleRecord(raw: unknown): boolean {
  if (!isRecord(raw)) return true;
  const status = readString(raw, ["status", "visibility", "publishStatus", "publish_status"]).toLowerCase();
  return !status || /active|published|public|visible/.test(status);
}

function isBlogPromo(raw: unknown, post: SedifexBlogPost): boolean {
  const marker = `${post.category || ""} ${post.title} ${isRecord(raw) ? readString(raw, ["type", "kind", "contentType", "content_type"]) : ""}`.toLowerCase();
  return /blog|post|article|guide|news|story/.test(marker);
}

function extractBlogPosts(payload: unknown, kind: ContentKind): SedifexBlogPost[] {
  const keys = ["blogPosts", "blog_posts", "publicBlogPosts", "public_blog_posts", "posts", "blogs", "articles", "items", "promos", "banners", "data", "content"];
  const items = collectArrays(payload, keys, kind === "blog").flat();

  return dedupeByKey(
    items
      .map((item, index) => ({ item, post: normalizeBlogPost(item, index) }))
      .filter(({ item, post }) => post.title && post.slug && visibleRecord(item))
      .filter(({ item, post }) => kind !== "promo" || isBlogPromo(item, post))
      .map(({ post }) => post),
    (post) => post.slug || post.id || post.title
  );
}

function firstBlogPayloadItem(payload: unknown): unknown | null {
  if (Array.isArray(payload)) return payload[0] || null;
  if (!isRecord(payload)) return null;

  const direct = payload.post || payload.blogPost || payload.blog_post || payload.item || payload.data || payload.content;
  if (direct && !Array.isArray(direct)) return direct;
  if (readString(payload, ["title"])) return payload;

  return collectArrays(payload, ["blogPosts", "posts", "blogs", "articles", "items", "data", "content"], false)[0]?.[0] || null;
}

export async function getSedifexBlogPosts(): Promise<SedifexBlogPost[]> {
  const attempts: Attempt[] = [
    { baseUrl: SEDIFEX_PUBLIC_API_BASE_URL, path: "/api/public/blog", params: { storeSlug: SEDIFEX_STORE_SLUG, storeId: SEDIFEX_STORE_ID, limit: "20" }, kind: "blog" },
    { baseUrl: SEDIFEX_PUBLIC_API_BASE_URL, path: "/api/public/posts", params: { storeSlug: SEDIFEX_STORE_SLUG, storeId: SEDIFEX_STORE_ID, limit: "20" }, kind: "blog" },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationBlogPosts", params: { storeId: SEDIFEX_STORE_ID }, authenticated: true, kind: "blog" },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationBlogs", params: { storeId: SEDIFEX_STORE_ID }, authenticated: true, kind: "blog" },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationPromo", params: { storeId: SEDIFEX_STORE_ID }, authenticated: true, kind: "promo" },
  ];

  for (const attempt of attempts) {
    const posts = extractBlogPosts(await fetchJson(attempt), attempt.kind);
    if (posts.length) return posts;
  }

  const legacy = await getLegacySedifexBlogPosts().catch(() => []);
  return legacy.length ? legacy : fallbackBlogPosts.map(normalizeBlogPost);
}

export async function getSedifexBlogPost(slug: string): Promise<SedifexBlogPost | null> {
  const attempts: Attempt[] = [
    { baseUrl: SEDIFEX_PUBLIC_API_BASE_URL, path: `/api/public/blog/${encodeURIComponent(slug)}`, params: { storeSlug: SEDIFEX_STORE_SLUG, storeId: SEDIFEX_STORE_ID }, kind: "blog" },
    { baseUrl: SEDIFEX_PUBLIC_API_BASE_URL, path: `/api/public/posts/${encodeURIComponent(slug)}`, params: { storeSlug: SEDIFEX_STORE_SLUG, storeId: SEDIFEX_STORE_ID }, kind: "blog" },
  ];

  for (const attempt of attempts) {
    const item = firstBlogPayloadItem(await fetchJson(attempt));
    if (!item) continue;
    const post = normalizeBlogPost(item, 0);
    if (post.title && post.slug) return post;
  }

  const posts = await getSedifexBlogPosts();
  const match = posts.find((post) => post.slug === slug || post.id === slug);
  if (match) return match;
  return getLegacySedifexBlogPost(slug).catch(() => null);
}

function rawDateValue(record: SedifexRecord): string {
  return readString(record, [
    "startDate",
    "start_date",
    "date",
    "eventDate",
    "event_date",
    "availableDate",
    "available_date",
    "slotDate",
    "slot_date",
    "startsAt",
    "starts_at",
    "startAt",
    "start_at",
    "start",
    "datetime",
    "dateTime",
    "scheduledAt",
    "scheduled_at",
  ]);
}

function rawEndDateValue(record: SedifexRecord): string {
  return readString(record, ["endDate", "end_date", "endsAt", "ends_at", "endAt", "end_at", "end", "finishAt", "finish_at"]);
}

function rawStartTimeValue(record: SedifexRecord, dateValue: string): string {
  return readString(record, ["startTime", "start_time", "time", "availableTime", "available_time", "slotTime", "slot_time", "hour"]) ||
    extractTimeFromDateTime(dateValue);
}

function rawEndTimeValue(record: SedifexRecord, endDateValue: string): string {
  return readString(record, ["endTime", "end_time", "finishTime", "finish_time"]) || extractTimeFromDateTime(endDateValue);
}

function extractTimeFromDateTime(value: string): string {
  const match = value.match(/(?:T|\s)(\d{1,2}:\d{2})(?::\d{2})?/);
  return match?.[1] || "";
}

function cleanDateValue(value: string): string {
  if (!value) return "";
  const dateOnly = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateOnly) return dateOnly[1];

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return value;
}

function cleanTimeValue(value: string): string {
  if (!value) return "";
  const match = value.match(/(\d{1,2}:\d{2})/);
  if (match) return match[1];
  return value;
}

function normalizeEventTitle(title: string, serviceName: string, itemName: string, index: number): string {
  const selected = title || serviceName || itemName || `Event ${index + 1}`;
  if (/^(?:available\s*)?(?:slot|availability|appointment|booking)$/i.test(selected.trim())) {
    return serviceName || itemName || `Available Session ${index + 1}`;
  }
  return selected;
}

function normalizeEvent(raw: unknown, index: number): SedifexEvent {
  const record = isRecord(raw) ? raw : {};
  const service = isRecord(record.service) ? record.service : {};
  const item = isRecord(record.item) ? record.item : {};
  const rawTitle = readString(record, ["title", "name", "heading", "label", "eventName", "event_name"]);
  const serviceName = readString(record, ["serviceName", "service_name", "itemName", "item_name", "productName", "product_name"]) || readString(service, ["name", "serviceName", "service_name", "title"]);
  const itemName = readString(item, ["name", "serviceName", "service_name", "title"]);
  const title = normalizeEventTitle(rawTitle, serviceName, itemName, index);
  const serviceId = readString(record, ["serviceId", "service_id", "itemId", "item_id", "productId", "product_id"]) || readString(service, ["id", "serviceId", "service_id", "itemId", "item_id"]) || readString(item, ["id", "serviceId", "service_id", "itemId", "item_id"]);
  const startDateRaw = rawDateValue(record);
  const endDateRaw = rawEndDateValue(record);
  const startTimeRaw = rawStartTimeValue(record, startDateRaw);
  const endTimeRaw = rawEndTimeValue(record, endDateRaw);
  const type = readString(record, ["category", "type", "kind", "badge", "label"]);

  return {
    id: readString(record, ["id", "_id", "uid", "eventId", "event_id", "availabilityId", "availability_id", "slotId", "slot_id", "slug", "documentId"], serviceId || slugify(`${title}-${startDateRaw}-${startTimeRaw}`) || `event-${index + 1}`),
    slug: readString(record, ["slug", "eventSlug", "event_slug"]) || undefined,
    title,
    category: /^(slot|availability|available)$/i.test(type) ? "Available Session" : type || "Upcoming Event",
    description: readString(record, ["description", "excerpt", "summary", "subtitle", "notes", "details"]) || readString(service, ["description", "summary"]) || readString(item, ["description", "summary"]) || undefined,
    imageUrl: readString(record, ["imageUrl", "image_url", "coverImageUrl", "cover_image_url", "bannerImageUrl", "banner_image_url", "image", "thumbnailUrl", "thumbnail_url"]) || readString(service, ["imageUrl", "image_url", "image"]) || readString(item, ["imageUrl", "image_url", "image"]) || undefined,
    startDate: cleanDateValue(startDateRaw) || undefined,
    endDate: cleanDateValue(endDateRaw) || undefined,
    startTime: cleanTimeValue(startTimeRaw) || undefined,
    endTime: cleanTimeValue(endTimeRaw) || undefined,
    location: readString(record, ["location", "venue", "place", "meetingLink", "meeting_link", "timezone"]) || readString(service, ["location", "venue"]) || "Online / to be confirmed",
    status: readString(record, ["status", "availabilityStatus", "availability_status", "publishStatus", "publish_status"]) || undefined,
    ctaLabel: readString(record, ["ctaLabel", "cta_label", "buttonText", "button_text"], "Register Interest") || undefined,
    ctaHref: readString(record, ["ctaHref", "cta_href", "buttonLink", "button_link", "url", "link", "href"]) || undefined,
    serviceId: serviceId || undefined,
    serviceName: serviceName || itemName || title,
    availableSlots: readNumber(record, ["availableSlots", "available_slots", "availableCount", "available_count", "remainingSlots", "remaining_slots", "slotsRemaining", "slots_remaining", "capacity", "stockCount", "stock_count"]),
  };
}

function visibleEvent(event: SedifexEvent): boolean {
  const status = (event.status || "").trim().toLowerCase();
  return !status || /active|published|upcoming|public|open|available|scheduled|confirmed/.test(status);
}

function isEventPromo(raw: unknown, event: SedifexEvent): boolean {
  const marker = `${event.category || ""} ${event.title} ${isRecord(raw) ? readString(raw, ["type", "kind", "contentType", "content_type"]) : ""}`.toLowerCase();
  return /event|webinar|workshop|seminar|session|info session|availability|slot/.test(marker);
}

function eventTimestamp(event: SedifexEvent): number {
  const parsed = Date.parse(`${event.startDate || ""} ${event.startTime || ""}`.trim());
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function sortEvents(events: SedifexEvent[]): SedifexEvent[] {
  return dedupeByKey(events, (event) => event.slug || event.id || `${event.title}-${event.startDate || ""}-${event.startTime || ""}`)
    .sort((left, right) => eventTimestamp(left) - eventTimestamp(right));
}

function extractEvents(payload: unknown, kind: ContentKind): SedifexEvent[] {
  const keys = ["availability", "availabilities", "availableSlots", "available_slots", "slots", "appointments", "bookableSlots", "bookable_slots", "events", "upcomingEvents", "upcoming_events", "calendarEvents", "calendar_events", "eventItems", "event_items", "items", "promos", "banners", "data", "content"];
  const items = collectArrays(payload, keys, kind === "events").flat();

  return sortEvents(
    items
      .map((item, index) => ({ item, event: normalizeEvent(item, index) }))
      .filter(({ event }) => event.title && visibleEvent(event))
      .filter(({ item, event }) => kind !== "promo" || isEventPromo(item, event))
      .map(({ event }) => event)
  );
}

export async function getSedifexEvents(): Promise<SedifexEvent[]> {
  const attempts: Attempt[] = [
    { baseUrl: SEDIFEX_PUBLIC_API_BASE_URL, path: "/api/public/events", params: { storeSlug: SEDIFEX_STORE_SLUG, storeId: SEDIFEX_STORE_ID }, kind: "events" },
    { baseUrl: SEDIFEX_PUBLIC_API_BASE_URL, path: "/api/public/availability", params: { storeSlug: SEDIFEX_STORE_SLUG, storeId: SEDIFEX_STORE_ID }, kind: "events" },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationAvailability", params: { storeId: SEDIFEX_STORE_ID }, authenticated: true, kind: "events" },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationAvailabilities", params: { storeId: SEDIFEX_STORE_ID }, authenticated: true, kind: "events" },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationAvailableSlots", params: { storeId: SEDIFEX_STORE_ID }, authenticated: true, kind: "events" },
    { baseUrl: SEDIFEX_BASE_URL, path: "/publicAvailability", params: { storeId: SEDIFEX_STORE_ID }, kind: "events" },
    { baseUrl: SEDIFEX_BASE_URL, path: "/publicAvailabilities", params: { storeId: SEDIFEX_STORE_ID }, kind: "events" },
    { baseUrl: SEDIFEX_BASE_URL, path: "/publicAvailableSlots", params: { storeId: SEDIFEX_STORE_ID }, kind: "events" },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationEvents", params: { storeId: SEDIFEX_STORE_ID }, authenticated: true, kind: "events" },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationUpcomingEvents", params: { storeId: SEDIFEX_STORE_ID }, authenticated: true, kind: "events" },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationPromo", params: { storeId: SEDIFEX_STORE_ID }, authenticated: true, kind: "promo" },
  ];

  for (const attempt of attempts) {
    const events = extractEvents(await fetchJson(attempt), attempt.kind);
    if (events.length) return events;
  }

  return getLegacySedifexEvents().catch(() => []);
}

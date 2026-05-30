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
type FoundArray = { key: string; items: unknown[] };

function isRecord(value: unknown): value is SedifexRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasUsableValue(value?: string) {
  return Boolean(value && !value.includes("PASTE_") && !value.includes("YOUR_"));
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function readPrimitiveString(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function readString(record: SedifexRecord, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = record[key];
    const direct = readPrimitiveString(value);
    if (direct) return direct;

    if (isRecord(value)) {
      const nested = readString(value, ["value", "text", "label", "name", "title", "url", "src", "href"]);
      if (nested) return nested;
    }
  }

  return fallback;
}

function readBoolean(record: SedifexRecord, keys: string[]) {
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

function readNumber(record: SedifexRecord, keys: string[]) {
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
    if (!Array.isArray(value)) continue;

    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (isRecord(item)) return readString(item, ["url", "src", "href", "imageUrl", "image"]);
        return "";
      })
      .filter(Boolean);
  }

  return [];
}

function findArraysByKeys(
  payload: unknown,
  keys: string[],
  includeDirectArray = false,
  depth = 0,
  seen = new WeakSet<object>()
): FoundArray[] {
  if (depth > 6) return [];
  if (Array.isArray(payload)) {
    return includeDirectArray ? [{ key: "", items: payload }] : [];
  }
  if (!isRecord(payload)) return [];
  if (seen.has(payload)) return [];

  seen.add(payload);
  const wanted = new Set(keys.map(normalizeKey));
  const found: FoundArray[] = [];

  for (const [key, value] of Object.entries(payload)) {
    const normalizedKey = normalizeKey(key);

    if (Array.isArray(value)) {
      if (wanted.has(normalizedKey)) found.push({ key, items: value });
      continue;
    }

    if (isRecord(value)) {
      found.push(...findArraysByKeys(value, keys, false, depth + 1, seen));
    }
  }

  return found;
}

async function fetchSedifexJson<T>(
  baseUrl: string,
  path: string,
  params: Record<string, string> = {},
  options: { authenticated?: boolean; revalidate?: number } = {}
): Promise<T | null> {
  if (!hasUsableValue(baseUrl)) return null;
  if (options.authenticated && !hasUsableValue(SEDIFEX_API_KEY)) return null;

  try {
    const url = new URL(path, baseUrl);

    Object.entries(params).forEach(([key, value]) => {
      if (hasUsableValue(value)) url.searchParams.set(key, value);
    });

    const response = await fetch(url, {
      headers: options.authenticated
        ? {
            "x-api-key": SEDIFEX_API_KEY,
            Authorization: `Bearer ${SEDIFEX_API_KEY}`,
            "X-Sedifex-Contract-Version": SEDIFEX_CONTRACT_VERSION,
            Accept: "application/json",
          }
        : { Accept: "application/json" },
      next: { revalidate: options.revalidate ?? 60 },
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Sedifex flexible GET failed", { path, error });
    return null;
  }
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

function normalizeDescription(description: string) {
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

function normalizeCategory(category: string) {
  return /^not provided$/i.test(category.trim()) ? "" : category.trim();
}

function isProbablyService(raw: unknown) {
  if (!isRecord(raw)) return false;

  const typeText = [
    readString(raw, ["itemType", "item_type", "type", "kind", "recordType", "contentType"]),
    readString(raw, ["category", "categoryName", "category_name"]),
  ]
    .join(" ")
    .toLowerCase();

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
  const price = readNumber(record, ["price", "amount", "unitPrice", "unit_price", "servicePrice", "service_price"]);

  return {
    id: readString(
      record,
      ["id", "_id", "uid", "productId", "product_id", "itemId", "item_id", "serviceId", "service_id", "documentId"],
      slug || slugify(name) || `service-${index + 1}`
    ),
    slug: slug || undefined,
    storeId: readString(record, ["storeId", "store_id", "merchantId", "merchant_id"]) || undefined,
    name,
    category: normalizeCategory(readString(record, ["category", "categoryName", "category_name"])),
    description: normalizeDescription(
      readString(record, ["description", "shortDescription", "short_description", "summary", "details", "body"])
    ),
    price,
    priceMinor: readNumber(record, ["priceMinor", "price_minor", "amountMinor", "amount_minor"]),
    stockCount: readNumber(record, ["stockCount", "stock_count", "stock", "quantity"]) ?? null,
    itemType: readString(record, ["itemType", "item_type", "recordType"]) || undefined,
    type: readString(record, ["type", "kind", "contentType"]) || undefined,
    imageUrl:
      readString(record, ["imageUrl", "image_url", "image", "thumbnailUrl", "thumbnail_url", "coverImageUrl", "cover_image_url", "photoUrl", "photo_url"]) ||
      imageUrls[0],
    imageUrls,
    imageAlt: readString(record, ["imageAlt", "image_alt", "alt"], name),
    updatedAt: readString(record, ["updatedAt", "updated_at"]) || undefined,
    tag: readString(record, ["tag", "badge", "badgeLabel", "badge_label", "label"]) || undefined,
    sortOrder: readNumber(record, ["sortOrder", "sort_order", "order", "position"]),
    order: readNumber(record, ["order"]),
  };
}

function dedupeByKey<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item).toLowerCase();
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function preferredServiceIndex(service: SedifexService) {
  const searchable = `${service.name} ${service.category || ""}`.toLowerCase();
  const index = preferredServiceNames.findIndex((name) => searchable.includes(name));
  return index === -1 ? Number.POSITIVE_INFINITY : index;
}

function sortServices(services: SedifexService[]) {
  return dedupeByKey(services, (service) => service.slug || service.id || service.name)
    .map((service, index) => ({ service, index }))
    .sort((left, right) => {
      const preferredDelta = preferredServiceIndex(left.service) - preferredServiceIndex(right.service);
      if (preferredDelta) return preferredDelta;

      const leftOrder = left.service.sortOrder ?? left.service.order;
      const rightOrder = right.service.sortOrder ?? right.service.order;
      if (leftOrder !== undefined || rightOrder !== undefined) {
        return (leftOrder ?? Number.POSITIVE_INFINITY) - (rightOrder ?? Number.POSITIVE_INFINITY);
      }

      return left.index - right.index;
    })
    .map(({ service }) => service);
}

const serviceArrayKeys = [
  "publicServices",
  "services",
  "serviceItems",
  "bookableServices",
  "bookingServices",
];

const catalogArrayKeys = [
  "items",
  "products",
  "publicProducts",
  "catalog",
  "publicCatalog",
  "data",
  "content",
];

function extractServices(payload: unknown, options: { serviceEndpoint?: boolean; catalogEndpoint?: boolean } = {}) {
  const fromServiceKeys = findArraysByKeys(payload, serviceArrayKeys, Boolean(options.serviceEndpoint))
    .flatMap((array) => array.items)
    .map(normalizeService)
    .filter((service) => service.name);

  if (fromServiceKeys.length) return sortServices(fromServiceKeys);

  const catalogItems = findArraysByKeys(payload, catalogArrayKeys, Boolean(options.catalogEndpoint))
    .flatMap((array) => array.items);

  const markedServices = catalogItems.filter(isProbablyService).map(normalizeService).filter((service) => service.name);
  if (markedServices.length) return sortServices(markedServices);

  if (options.catalogEndpoint && catalogItems.length) {
    return sortServices(catalogItems.map(normalizeService).filter((service) => service.name));
  }

  return [];
}

export async function getSedifexServices(): Promise<SedifexService[]> {
  const attempts = [
    {
      baseUrl: SEDIFEX_BASE_URL,
      path: "/v1IntegrationServices",
      params: { storeId: SEDIFEX_STORE_ID },
      authenticated: true,
      serviceEndpoint: true,
    },
    {
      baseUrl: SEDIFEX_BASE_URL,
      path: "/v1IntegrationProducts",
      params: { storeId: SEDIFEX_STORE_ID },
      authenticated: true,
    },
    {
      baseUrl: SEDIFEX_BASE_URL,
      path: "/publicQuickPayCatalog",
      params: { storeId: SEDIFEX_STORE_ID },
      catalogEndpoint: true,
    },
    {
      baseUrl: SEDIFEX_PUBLIC_API_BASE_URL,
      path: "/api/public/services",
      params: { storeSlug: SEDIFEX_STORE_SLUG, storeId: SEDIFEX_STORE_ID },
      serviceEndpoint: true,
    },
    {
      baseUrl: SEDIFEX_PUBLIC_API_BASE_URL,
      path: "/api/public/catalog",
      params: { storeSlug: SEDIFEX_STORE_SLUG, storeId: SEDIFEX_STORE_ID },
      catalogEndpoint: true,
    },
  ];

  for (const attempt of attempts) {
    const payload = await fetchSedifexJson<unknown>(attempt.baseUrl, attempt.path, attempt.params, {
      authenticated: attempt.authenticated,
      revalidate: 30,
    });
    const services = extractServices(payload, attempt);
    if (services.length) return services;
  }

  const legacy = await getLegacySedifexServices().catch(() => []);
  return legacy.length ? legacy : sortServices(fallbackServices.map(normalizeService));
}

export async function getSedifexService(slug: string): Promise<SedifexService | null> {
  const services = await getSedifexServices();
  const match = services.find(
    (service) =>
      service.slug === slug ||
      service.id === slug ||
      slugify(service.name) === slug ||
      encodeURIComponent(service.id) === slug
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

function isVisibleContent(record: SedifexRecord) {
  const status = readString(record, ["status", "visibility", "publishStatus", "publish_status"]).toLowerCase();
  return !status || /active|published|public|visible/.test(status);
}

function isBlogPromo(raw: unknown, post: SedifexBlogPost) {
  const record = isRecord(raw) ? raw : {};
  const marker = [post.category, post.title, readString(record, ["type", "kind", "contentType", "content_type"])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /blog|post|article|guide|news|story/.test(marker);
}

const blogArrayKeys = [
  "blogPosts",
  "blog_posts",
  "publicBlogPosts",
  "public_blog_posts",
  "posts",
  "blogs",
  "articles",
  "items",
  "promos",
  "banners",
  "data",
  "content",
];

function extractBlogPosts(payload: unknown, options: { blogEndpoint?: boolean; promoEndpoint?: boolean } = {}) {
  const items = findArraysByKeys(payload, blogArrayKeys, Boolean(options.blogEndpoint)).flatMap((array) => array.items);
  const posts = items
    .map((item, index) => ({ item, post: normalizeBlogPost(item, index) }))
    .filter(({ item, post }) => post.title && post.slug && (!isRecord(item) || isVisibleContent(item)))
    .filter(({ item, post }) => !options.promoEndpoint || isBlogPromo(item, post))
    .map(({ post }) => post);

  return dedupeByKey(posts, (post) => post.slug || post.id || post.title);
}

function firstPayloadItem(payload: unknown) {
  if (Array.isArray(payload)) return payload[0] || null;
  if (!isRecord(payload)) return null;

  const direct = payload.post || payload.blogPost || payload.blog_post || payload.item || payload.data || payload.content;
  if (direct && !Array.isArray(direct)) return direct;
  if (readString(payload, ["title"])) return payload;

  return findArraysByKeys(payload, blogArrayKeys, false)[0]?.items?.[0] || null;
}

export async function getSedifexBlogPosts(): Promise<SedifexBlogPost[]> {
  const attempts = [
    {
      baseUrl: SEDIFEX_PUBLIC_API_BASE_URL,
      path: "/api/public/blog",
      params: { storeSlug: SEDIFEX_STORE_SLUG, storeId: SEDIFEX_STORE_ID, limit: "20" },
      blogEndpoint: true,
    },
    {
      baseUrl: SEDIFEX_PUBLIC_API_BASE_URL,
      path: "/api/public/posts",
      params: { storeSlug: SEDIFEX_STORE_SLUG, storeId: SEDIFEX_STORE_ID, limit: "20" },
      blogEndpoint: true,
    },
    {
      baseUrl: SEDIFEX_BASE_URL,
      path: "/v1IntegrationBlogPosts",
      params: { storeId: SEDIFEX_STORE_ID },
      authenticated: true,
      blogEndpoint: true,
    },
    {
      baseUrl: SEDIFEX_BASE_URL,
      path: "/v1IntegrationBlogs",
      params: { storeId: SEDIFEX_STORE_ID },
      authenticated: true,
      blogEndpoint: true,
    },
    {
      baseUrl: SEDIFEX_BASE_URL,
      path: "/v1IntegrationPromo",
      params: { storeId: SEDIFEX_STORE_ID },
      authenticated: true,
      promoEndpoint: true,
    },
  ];

  for (const attempt of attempts) {
    const payload = await fetchSedifexJson<unknown>(attempt.baseUrl, attempt.path, attempt.params, {
      authenticated: attempt.authenticated,
      revalidate: 60,
    });
    const posts = extractBlogPosts(payload, attempt);
    if (posts.length) return posts;
  }

  const legacy = await getLegacySedifexBlogPosts().catch(() => []);
  return legacy.length ? legacy : fallbackBlogPosts.map(normalizeBlogPost);
}

export async function getSedifexBlogPost(slug: string): Promise<SedifexBlogPost | null> {
  const attempts = [
    {
      baseUrl: SEDIFEX_PUBLIC_API_BASE_URL,
      path: `/api/public/blog/${encodeURIComponent(slug)}`,
      params: { storeSlug: SEDIFEX_STORE_SLUG, storeId: SEDIFEX_STORE_ID },
    },
    {
      baseUrl: SEDIFEX_PUBLIC_API_BASE_URL,
      path: `/api/public/posts/${encodeURIComponent(slug)}`,
      params: { storeSlug: SEDIFEX_STORE_SLUG, storeId: SEDIFEX_STORE_ID },
    },
  ];

  for (const attempt of attempts) {
    const payload = await fetchSedifexJson<unknown>(attempt.baseUrl, attempt.path, attempt.params, { revalidate: 60 });
    const item = firstPayloadItem(payload);
    if (!item) continue;

    const post = normalizeBlogPost(item, 0);
    if (post.title && post.slug) return post;
  }

  const posts = await getSedifexBlogPosts();
  return posts.find((post) => post.slug === slug || post.id === slug) || getLegacySedifexBlogPost(slug).catch(() => null);
}

function normalizeEvent(raw: unknown, index: number): SedifexEvent {
  const record = isRecord(raw) ? raw : {};
  const service = isRecord(record.service) ? record.service : {};
  const item = isRecord(record.item) ? record.item : {};
  const title =
    readString(record, ["title", "name", "heading", "label", "eventName", "event_name"]) ||
    readString(service, ["title", "name", "serviceName", "service_name"]) ||
    readString(item, ["title", "name", "serviceName", "service_name"], `Event ${index + 1}`);

  const serviceId =
    readString(record, ["serviceId", "service_id", "itemId", "item_id", "productId", "product_id"]) ||
    readString(service, ["id", "serviceId", "service_id", "itemId", "item_id"]) ||
    readString(item, ["id", "serviceId", "service_id", "itemId", "item_id"]);

  const serviceName =
    readString(record, ["serviceName", "service_name", "itemName", "item_name", "productName", "product_name"]) ||
    readString(service, ["name", "serviceName", "service_name", "title"]) ||
    readString(item, ["name", "serviceName", "service_name", "title"]);

  return {
    id: readString(record, ["id", "_id", "uid", "eventId", "event_id", "availabilityId", "availability_id", "slotId", "slot_id", "slug", "documentId"], serviceId || slugify(title) || `event-${index + 1}`),
    slug: readString(record, ["slug", "eventSlug", "event_slug"]) || undefined,
    title,
    category: readString(record, ["category", "type", "kind", "badge", "label"], "Upcoming Event") || undefined,
    description:
      readString(record, ["description", "excerpt", "summary", "subtitle", "notes", "details"]) ||
      readString(service, ["description", "summary"]) ||
      readString(item, ["description", "summary"]) ||
      undefined,
    imageUrl:
      readString(record, ["imageUrl", "image_url", "coverImageUrl", "cover_image_url", "bannerImageUrl", "banner_image_url", "image", "thumbnailUrl", "thumbnail_url"]) ||
      readString(service, ["imageUrl", "image_url", "image"]) ||
      readString(item, ["imageUrl", "image_url", "image"]) ||
      undefined,
    startDate:
      readString(record, ["startDate", "start_date", "date", "eventDate", "event_date", "availableDate", "available_date", "slotDate", "slot_date", "startsAt", "starts_at", "startAt", "start_at"]) ||
      undefined,
    endDate: readString(record, ["endDate", "end_date", "endsAt", "ends_at", "endAt", "end_at"]) || undefined,
    startTime: readString(record, ["startTime", "start_time", "time", "availableTime", "available_time", "slotTime", "slot_time"]) || undefined,
    endTime: readString(record, ["endTime", "end_time"]) || undefined,
    location: readString(record, ["location", "venue", "place", "timezone"], "Online / to be confirmed") || undefined,
    status: readString(record, ["status", "availabilityStatus", "availability_status", "publishStatus", "publish_status"]) || undefined,
    ctaLabel: readString(record, ["ctaLabel", "cta_label", "buttonText", "button_text"], "Register Interest") || undefined,
    ctaHref: readString(record, ["ctaHref", "cta_href", "buttonLink", "button_link", "url", "link", "href"]) || undefined,
    serviceId: serviceId || undefined,
    serviceName: serviceName || title,
    availableSlots: readNumber(record, ["availableSlots", "available_slots", "availableCount", "available_count", "capacity", "stockCount", "stock_count"]),
  };
}

function isVisibleEvent(event: SedifexEvent) {
  const status = (event.status || "").trim().toLowerCase();
  return !status || /active|published|upcoming|public|open|available/.test(status);
}

function isEventPromo(raw: unknown, event: SedifexEvent) {
  const record = isRecord(raw) ? raw : {};
  const marker = [event.category, event.title, readString(record, ["type", "kind", "contentType", "content_type"])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /event|webinar|workshop|seminar|session|info session|availability|slot/.test(marker);
}

function sortEvents(events: SedifexEvent[]) {
  return dedupeByKey(events, (event) => event.slug || event.id || event.title).sort((left, right) => {
    const leftTime = Date.parse(`${left.startDate || ""} ${left.startTime || ""}`.trim());
    const rightTime = Date.parse(`${right.startDate || ""} ${right.startTime || ""}`.trim());

    if (Number.isFinite(leftTime) || Number.isFinite(rightTime)) {
      return (Number.isFinite(leftTime) ? leftTime : Number.POSITIVE_INFINITY) -
        (Number.isFinite(rightTime) ? rightTime : Number.POSITIVE_INFINITY);
    }

    return 0;
  });
}

const eventArrayKeys = [
  "availability",
  "availabilities",
  "availableSlots",
  "available_slots",
  "slots",
  "appointments",
  "bookableSlots",
  "bookable_slots",
  "events",
  "upcomingEvents",
  "upcoming_events",
  "calendarEvents",
  "calendar_events",
  "eventItems",
  "event_items",
  "items",
  "promos",
  "banners",
  "data",
  "content",
];

function extractEvents(payload: unknown, options: { eventEndpoint?: boolean; promoEndpoint?: boolean } = {}) {
  const items = findArraysByKeys(payload, eventArrayKeys, Boolean(options.eventEndpoint)).flatMap((array) => array.items);
  const events = items
    .map((item, index) => ({ item, event: normalizeEvent(item, index) }))
    .filter(({ event }) => event.title && isVisibleEvent(event))
    .filter(({ item, event }) => !options.promoEndpoint || isEventPromo(item, event))
    .map(({ event }) => event);

  return sortEvents(events);
}

export async function getSedifexEvents(): Promise<SedifexEvent[]> {
  const attempts = [
    { baseUrl: SEDIFEX_PUBLIC_API_BASE_URL, path: "/api/public/events", params: { storeSlug: SEDIFEX_STORE_SLUG, storeId: SEDIFEX_STORE_ID }, eventEndpoint: true },
    { baseUrl: SEDIFEX_PUBLIC_API_BASE_URL, path: "/api/public/availability", params: { storeSlug: SEDIFEX_STORE_SLUG, storeId: SEDIFEX_STORE_ID }, eventEndpoint: true },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationAvailability", params: { storeId: SEDIFEX_STORE_ID }, authenticated: true, eventEndpoint: true },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationAvailabilities", params: { storeId: SEDIFEX_STORE_ID }, authenticated: true, eventEndpoint: true },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationAvailableSlots", params: { storeId: SEDIFEX_STORE_ID }, authenticated: true, eventEndpoint: true },
    { baseUrl: SEDIFEX_BASE_URL, path: "/publicAvailability", params: { storeId: SEDIFEX_STORE_ID }, eventEndpoint: true },
    { baseUrl: SEDIFEX_BASE_URL, path: "/publicAvailabilities", params: { storeId: SEDIFEX_STORE_ID }, eventEndpoint: true },
    { baseUrl: SEDIFEX_BASE_URL, path: "/publicAvailableSlots", params: { storeId: SEDIFEX_STORE_ID }, eventEndpoint: true },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationEvents", params: { storeId: SEDIFEX_STORE_ID }, authenticated: true, eventEndpoint: true },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationUpcomingEvents", params: { storeId: SEDIFEX_STORE_ID }, authenticated: true, eventEndpoint: true },
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationPromo", params: { storeId: SEDIFEX_STORE_ID }, authenticated: true, promoEndpoint: true },
  ];

  for (const attempt of attempts) {
    const payload = await fetchSedifexJson<unknown>(attempt.baseUrl, attempt.path, attempt.params, {
      authenticated: attempt.authenticated,
      revalidate: 60,
    });
    const events = extractEvents(payload, attempt);
    if (events.length) return events;
  }

  return getLegacySedifexEvents().catch(() => []);
}

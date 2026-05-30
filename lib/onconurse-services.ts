import {
  getSedifexService,
  getSedifexServices,
} from "./sedifex-public";
import { slugify, type SedifexService } from "./sedifex";

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
  "onco-nurse";

const SEDIFEX_API_KEY =
  process.env.SEDIFEX_BOOKING_API_KEY ||
  process.env.SEDIFEX_CHECKOUT_API_KEY ||
  process.env.SEDIFEX_INTEGRATION_API_KEY ||
  process.env.SEDIFEX_INTEGRATION_KEY ||
  process.env.SEDIFEX_PRODUCTS_API_KEY ||
  "";

const SEDIFEX_CONTRACT_VERSION =
  process.env.SEDIFEX_CONTRACT_VERSION || "2026-04-13";

const DEFAULT_ROOT_PRODUCT_IDS = ["1EKXNNXLsBOV4lOUKvMv"];

type JsonRecord = Record<string, unknown>;

type ProductAttempt = {
  baseUrl: string;
  path: string;
  params: Record<string, string>;
  authenticated?: boolean;
};

function usable(value?: string) {
  return Boolean(value && !value.includes("PASTE_") && !value.includes("YOUR_"));
}

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

function readNumber(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return undefined;
}

function readStringArray(record: JsonRecord, keys: string[]) {
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

function serviceIdsFromEnv() {
  const configured = process.env.SEDIFEX_SERVICE_PRODUCT_IDS || "";
  const ids = configured
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return ids.length ? ids : DEFAULT_ROOT_PRODUCT_IDS;
}

async function fetchJson(attempt: ProductAttempt) {
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
      next: { revalidate: 30 },
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function firstPayloadItem(payload: unknown): unknown | null {
  if (Array.isArray(payload)) return payload[0] || null;
  if (!isRecord(payload)) return null;

  const direct =
    payload.item ||
    payload.service ||
    payload.product ||
    payload.publicProduct ||
    payload.publicService ||
    payload.data ||
    payload.content;

  if (direct && !Array.isArray(direct)) return direct;
  if (readString(payload, ["name", "title"])) return payload;

  for (const key of ["items", "products", "services", "publicProducts", "publicServices"]) {
    const value = payload[key];
    if (Array.isArray(value) && value[0]) return value[0];
  }

  return null;
}

function normalizeService(raw: unknown, index: number): SedifexService | null {
  if (!isRecord(raw)) return null;

  const name = readString(raw, ["name", "serviceName", "title"]);
  if (!name) return null;

  const imageUrls = readStringArray(raw, ["imageUrls", "image_urls", "images"]);
  const id = readString(
    raw,
    [
      "sourceProductId",
      "publicListingId",
      "productId",
      "itemId",
      "serviceId",
      "id",
      "documentId",
    ],
    slugify(name) || `service-${index + 1}`
  );

  return {
    id,
    slug: readString(raw, ["slug", "productSlug", "serviceSlug"]) || slugify(name),
    storeId: readString(raw, ["storeId"]) || SEDIFEX_STORE_ID || undefined,
    name,
    category: readString(raw, ["categoryName", "category", "categoryKey"]),
    description: readString(raw, ["description", "shortDescription", "summary", "details"]),
    price: readNumber(raw, ["price", "amount", "unitPrice", "servicePrice"]),
    priceMinor: readNumber(raw, ["priceMinor", "amountMinor"]),
    stockCount: readNumber(raw, ["stockCount", "stock", "quantity"]) ?? null,
    itemType: readString(raw, ["itemType", "listingType"]) || "service",
    type: readString(raw, ["type", "listingType", "serviceKind"]) || "service",
    imageUrl:
      readString(raw, ["imageUrl", "image", "thumbnailUrl", "coverImageUrl"]) ||
      imageUrls[0],
    imageUrls,
    imageAlt: readString(raw, ["imageAlt", "alt"], name),
    updatedAt: readString(raw, ["updatedAt", "publishedAt", "createdAt"]) || undefined,
    tag: readString(raw, ["tag", "badge", "label", "serviceKind"]) || undefined,
    sortOrder: readNumber(raw, ["sortOrder", "order", "position", "featuredRank"]),
    order: readNumber(raw, ["order"]),
  };
}

function knownProductAttempts(productId: string): ProductAttempt[] {
  return [
    {
      baseUrl: SEDIFEX_BASE_URL,
      path: "/v1IntegrationItem",
      params: { storeId: SEDIFEX_STORE_ID, itemId: productId },
      authenticated: true,
    },
    {
      baseUrl: SEDIFEX_BASE_URL,
      path: "/v1IntegrationProduct",
      params: { storeId: SEDIFEX_STORE_ID, itemId: productId },
      authenticated: true,
    },
    {
      baseUrl: SEDIFEX_BASE_URL,
      path: "/publicQuickPayItem",
      params: { storeId: SEDIFEX_STORE_ID, itemId: productId },
    },
    {
      baseUrl: SEDIFEX_PUBLIC_API_BASE_URL,
      path: `/api/public/products/${encodeURIComponent(productId)}`,
      params: { storeId: SEDIFEX_STORE_ID, storeSlug: SEDIFEX_STORE_SLUG },
    },
    {
      baseUrl: SEDIFEX_PUBLIC_API_BASE_URL,
      path: "/api/public/products",
      params: { storeId: SEDIFEX_STORE_ID, storeSlug: SEDIFEX_STORE_SLUG, itemId: productId },
    },
  ];
}

async function getKnownProductServices() {
  const services: SedifexService[] = [];

  for (const productId of serviceIdsFromEnv()) {
    for (const attempt of knownProductAttempts(productId)) {
      const service = normalizeService(firstPayloadItem(await fetchJson(attempt)), services.length);
      if (service) {
        services.push(service);
        break;
      }
    }
  }

  return services.sort((left, right) => {
    const leftOrder = left.sortOrder ?? left.order;
    const rightOrder = right.sortOrder ?? right.order;

    if (leftOrder !== undefined || rightOrder !== undefined) {
      return (leftOrder ?? Number.POSITIVE_INFINITY) -
        (rightOrder ?? Number.POSITIVE_INFINITY);
    }

    return left.name.localeCompare(right.name);
  });
}

export async function getOncoNurseServices() {
  const knownProducts = await getKnownProductServices();
  if (knownProducts.length) return knownProducts;

  return getSedifexServices();
}

export async function getOncoNurseService(slug: string) {
  const services = await getOncoNurseServices();
  const match = services.find(
    (service) =>
      service.slug === slug ||
      service.id === slug ||
      slugify(service.name) === slug ||
      encodeURIComponent(service.id) === slug
  );

  if (match) return match;
  return getSedifexService(slug);
}

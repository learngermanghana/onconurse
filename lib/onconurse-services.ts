import { fallbackServices } from "./site";
import { slugify, type SedifexService } from "./sedifex";

const DEFAULT_SEDIFEX_API_BASE_URL =
  "https://us-central1-sedifex-web.cloudfunctions.net";

const SEDIFEX_BASE_URL =
  process.env.SEDIFEX_INTEGRATION_API_BASE_URL ||
  process.env.SEDIFEX_API_BASE_URL ||
  DEFAULT_SEDIFEX_API_BASE_URL;

const SEDIFEX_STORE_ID =
  process.env.SEDIFEX_BOOKING_TARGET_STORE_ID ||
  process.env.SEDIFEX_STORE_ID ||
  process.env.NEXT_PUBLIC_SEDIFEX_STORE_ID ||
  "";

const SEDIFEX_API_KEY =
  process.env.SEDIFEX_INTEGRATION_API_KEY ||
  process.env.SEDIFEX_PRODUCTS_API_KEY ||
  process.env.SEDIFEX_BOOKING_API_KEY ||
  process.env.SEDIFEX_INTEGRATION_KEY ||
  "";

const SEDIFEX_CONTRACT_VERSION =
  process.env.SEDIFEX_CONTRACT_VERSION || "2026-04-13";

type JsonRecord = Record<string, unknown>;

type SedifexProductsResponse = {
  ok?: boolean;
  storeId?: string;
  count?: number;
  products?: unknown[];
  publicProducts?: unknown[];
  publicServices?: unknown[];
};

type SedifexCatalogResponse = {
  ok?: boolean;
  storeId?: string;
  count?: number;
  items?: unknown[];
};

function hasUsableValue(value?: string) {
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
    if (!Array.isArray(value)) continue;

    return value.filter(
      (item): item is string => typeof item === "string" && Boolean(item.trim())
    );
  }

  return [];
}

function isServiceItem(item: unknown) {
  if (!isRecord(item)) return false;
  const itemType = readString(item, ["itemType", "type"]).toLowerCase();
  return itemType === "service";
}

function cleanCategory(category: string) {
  return /^not provided$/i.test(category.trim()) ? "" : category.trim();
}

function normalizeServiceDescription(description: string) {
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

function mapSedifexItem(raw: unknown, index: number): SedifexService | null {
  if (!isRecord(raw)) return null;

  const imageUrls = readStringArray(raw, ["imageUrls"]);
  const name = readString(raw, ["name"], `Service ${index + 1}`);
  const id = readString(raw, ["id"], slugify(name) || `service-${index + 1}`);

  return {
    id,
    slug: readString(raw, ["slug"]) || slugify(name),
    storeId: readString(raw, ["storeId"]) || undefined,
    name,
    category: cleanCategory(readString(raw, ["category", "categoryName"])),
    description: normalizeServiceDescription(readString(raw, ["description"])),
    price: readNumber(raw, ["price"]),
    priceMinor: readNumber(raw, ["priceMinor"]),
    stockCount: readNumber(raw, ["stockCount"]) ?? null,
    itemType: readString(raw, ["itemType"]) || "service",
    type: readString(raw, ["type"]) || "SERVICE",
    imageUrl: readString(raw, ["imageUrl"]) || imageUrls[0],
    imageUrls,
    imageAlt: readString(raw, ["imageAlt"], name),
    updatedAt: readString(raw, ["updatedAt"]) || undefined,
    tag: readString(raw, ["tag", "badge", "label"]) || undefined,
    sortOrder: readNumber(raw, ["sortOrder"]),
    order: readNumber(raw, ["order"]),
  };
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
      if (Number.isFinite(preferredDelta) && preferredDelta !== 0) {
        return preferredDelta;
      }

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

async function fetchIntegrationProducts() {
  if (!hasUsableValue(SEDIFEX_STORE_ID) || !hasUsableValue(SEDIFEX_API_KEY)) {
    return [];
  }

  const endpoint = new URL("/v1IntegrationProducts", SEDIFEX_BASE_URL);
  endpoint.searchParams.set("storeId", SEDIFEX_STORE_ID);

  const response = await fetch(endpoint, {
    headers: {
      "x-api-key": SEDIFEX_API_KEY,
      Authorization: `Bearer ${SEDIFEX_API_KEY}`,
      "X-Sedifex-Contract-Version": SEDIFEX_CONTRACT_VERSION,
      Accept: "application/json",
    },
    next: { revalidate: 30 },
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as SedifexProductsResponse;
  const publicServices = Array.isArray(payload.publicServices)
    ? payload.publicServices
    : [];

  if (publicServices.length) {
    return publicServices
      .filter(isServiceItem)
      .map(mapSedifexItem)
      .filter((service): service is SedifexService => Boolean(service));
  }

  const products = Array.isArray(payload.products) ? payload.products : [];

  return products
    .filter(isServiceItem)
    .map(mapSedifexItem)
    .filter((service): service is SedifexService => Boolean(service));
}

async function fetchPublicQuickPayCatalog() {
  if (!hasUsableValue(SEDIFEX_STORE_ID)) return [];

  const endpoint = new URL("/publicQuickPayCatalog", SEDIFEX_BASE_URL);
  endpoint.searchParams.set("storeId", SEDIFEX_STORE_ID);

  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    next: { revalidate: 30 },
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as SedifexCatalogResponse;
  const items = Array.isArray(payload.items) ? payload.items : [];

  return items
    .filter(isServiceItem)
    .map(mapSedifexItem)
    .filter((service): service is SedifexService => Boolean(service));
}

function localFallbackServices() {
  return fallbackServices
    .map(mapSedifexItem)
    .filter((service): service is SedifexService => Boolean(service));
}

export async function getServiceData(): Promise<SedifexService[]> {
  try {
    const integrationServices = await fetchIntegrationProducts();
    if (integrationServices.length) {
      return sortSedifexServices(integrationServices);
    }

    const publicServices = await fetchPublicQuickPayCatalog();
    if (publicServices.length) {
      return sortSedifexServices(publicServices);
    }
  } catch (error) {
    console.error("Unable to fetch Sedifex services", { error });
  }

  return sortSedifexServices(localFallbackServices());
}

export async function getOncoNurseServices() {
  return getServiceData();
}

export async function getOncoNurseService(slug: string) {
  const services = await getServiceData();

  return (
    services.find(
      (service) =>
        service.slug === slug ||
        service.id === slug ||
        slugify(service.name) === slug ||
        encodeURIComponent(service.id) === slug
    ) || null
  );
}

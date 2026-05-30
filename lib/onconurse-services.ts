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
  process.env.SEDIFEX_INTEGRATION_KEY ||
  process.env.SEDIFEX_BOOKING_API_KEY ||
  "";

const SEDIFEX_CONTRACT_VERSION =
  process.env.SEDIFEX_CONTRACT_VERSION || "2026-04-13";

type JsonRecord = Record<string, unknown>;

type ProductsResponse = {
  ok?: boolean;
  storeId?: string;
  count?: number;
  products?: unknown[];
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
    if (Array.isArray(value)) {
      return value.filter(
        (item): item is string => typeof item === "string" && Boolean(item.trim())
      );
    }
  }

  return [];
}

function isServiceProduct(item: unknown) {
  if (!isRecord(item)) return false;
  return readString(item, ["itemType"]).toLowerCase() === "service";
}

function mapServiceProduct(raw: unknown, index: number): SedifexService | null {
  if (!isRecord(raw)) return null;

  const imageUrls = readStringArray(raw, ["imageUrls"]);
  const name = readString(raw, ["name"], `Service ${index + 1}`);
  const id = readString(raw, ["id"], slugify(name) || `service-${index + 1}`);

  return {
    id,
    slug: readString(raw, ["slug"]) || slugify(name),
    storeId: readString(raw, ["storeId"]) || undefined,
    name,
    category: readString(raw, ["category", "categoryName"]),
    description: readString(raw, ["description"]),
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
    sortOrder: readNumber(raw, ["sortOrder", "order", "position"]),
    order: readNumber(raw, ["order"]),
  };
}

function sortServices(services: SedifexService[]) {
  return [...services].sort((left, right) => {
    const leftOrder = left.sortOrder ?? left.order;
    const rightOrder = right.sortOrder ?? right.order;

    if (leftOrder !== undefined || rightOrder !== undefined) {
      return (leftOrder ?? Number.POSITIVE_INFINITY) -
        (rightOrder ?? Number.POSITIVE_INFINITY);
    }

    return left.name.localeCompare(right.name);
  });
}

export async function getOncoNurseServices(): Promise<SedifexService[]> {
  if (!hasUsableValue(SEDIFEX_STORE_ID) || !hasUsableValue(SEDIFEX_API_KEY)) {
    return [];
  }

  const url = new URL("/v1IntegrationProducts", SEDIFEX_BASE_URL);
  url.searchParams.set("storeId", SEDIFEX_STORE_ID);

  try {
    const response = await fetch(url, {
      headers: {
        "x-api-key": SEDIFEX_API_KEY,
        Authorization: `Bearer ${SEDIFEX_API_KEY}`,
        "X-Sedifex-Contract-Version": SEDIFEX_CONTRACT_VERSION,
        Accept: "application/json",
      },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      console.error("Sedifex service products failed", {
        status: response.status,
        requestId: response.headers.get("x-sedifex-request-id"),
      });
      return [];
    }

    const payload = (await response.json()) as ProductsResponse;
    const products = Array.isArray(payload.products) ? payload.products : [];

    return sortServices(
      products
        .filter(isServiceProduct)
        .map(mapServiceProduct)
        .filter((service): service is SedifexService => Boolean(service))
    );
  } catch (error) {
    console.error("Sedifex service products failed", { error });
    return [];
  }
}

export async function getOncoNurseService(slug: string) {
  const services = await getOncoNurseServices();

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

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function maskValue(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "***";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function safeUrl(url: URL) {
  return url.toString().replace(/(apiKey|key|token)=([^&]+)/gi, "$1=***");
}

function summarizeItem(item: unknown, index: number) {
  if (!isRecord(item)) {
    return {
      index,
      isObject: false,
      reason: "Item is not an object.",
    };
  }

  const itemType = readString(item, ["itemType", "type"]).toLowerCase();
  const name = readString(item, ["name"]);

  return {
    index,
    id: readString(item, ["id"]),
    name,
    category: readString(item, ["category", "categoryName"]),
    itemType: readString(item, ["itemType"]),
    type: readString(item, ["type"]),
    price: item.price,
    storeId: readString(item, ["storeId"]),
    isPublished: item.isPublished,
    isWebsiteVisible: item.isWebsiteVisible,
    status: readString(item, ["status"]),
    willPassServiceFilter: itemType === "service",
    reason:
      itemType === "service"
        ? "Passes service filter."
        : `Rejected because itemType/type is '${itemType || "empty"}', not 'service'.`,
  };
}

function analyzeArray(label: string, items: unknown[]) {
  const serviceItems = items.filter((item) => {
    if (!isRecord(item)) return false;
    return readString(item, ["itemType", "type"]).toLowerCase() === "service";
  });

  return {
    label,
    count: items.length,
    serviceCount: serviceItems.length,
    firstFiveItems: items.slice(0, 5).map(summarizeItem),
    firstFiveServiceItems: serviceItems.slice(0, 5).map(summarizeItem),
  };
}

async function fetchJson(url: URL, authenticated: boolean) {
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      headers: authenticated
        ? {
            "x-api-key": SEDIFEX_API_KEY,
            Authorization: `Bearer ${SEDIFEX_API_KEY}`,
            "X-Sedifex-Contract-Version": SEDIFEX_CONTRACT_VERSION,
            Accept: "application/json",
          }
        : { Accept: "application/json" },
      cache: "no-store",
    });

    const text = await response.text();
    let json: unknown = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      requestUrl: safeUrl(url),
      requestHeaders: authenticated
        ? {
            "x-api-key": maskValue(SEDIFEX_API_KEY),
            Authorization: `Bearer ${maskValue(SEDIFEX_API_KEY)}`,
            "X-Sedifex-Contract-Version": SEDIFEX_CONTRACT_VERSION,
            Accept: "application/json",
          }
        : { Accept: "application/json" },
      responseHeaders: {
        contentType: response.headers.get("content-type"),
        requestId: response.headers.get("x-sedifex-request-id"),
      },
      durationMs: Date.now() - startedAt,
      rawTextPreview: text.slice(0, 600),
      json,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: "FETCH_FAILED",
      requestUrl: safeUrl(url),
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function analyzeIntegrationPayload(json: unknown) {
  const payload = isRecord(json) ? json : {};
  const products = Array.isArray(payload.products) ? payload.products : [];
  const publicProducts = Array.isArray(payload.publicProducts)
    ? payload.publicProducts
    : [];
  const publicServices = Array.isArray(payload.publicServices)
    ? payload.publicServices
    : [];

  const publicServicesAnalysis = analyzeArray("publicServices", publicServices);
  const productsAnalysis = analyzeArray("products", products);
  const publicProductsAnalysis = analyzeArray("publicProducts", publicProducts);
  const totalServiceCount =
    publicServicesAnalysis.serviceCount +
    productsAnalysis.serviceCount +
    publicProductsAnalysis.serviceCount;

  return {
    ok: payload.ok,
    storeId: payload.storeId,
    count: payload.count,
    arrays: [publicServicesAnalysis, productsAnalysis, publicProductsAnalysis],
    totalServiceCount,
    loaderDecision:
      publicServicesAnalysis.serviceCount > 0
        ? "The loader should use publicServices."
        : productsAnalysis.serviceCount > 0
          ? "The loader should use products filtered by itemType/type === service."
          : "No service items found in publicServices or products, so the loader will try the public fallback and then local fallback.",
  };
}

function analyzePublicCatalogPayload(json: unknown) {
  const payload = isRecord(json) ? json : {};
  const items = Array.isArray(payload.items) ? payload.items : [];
  const itemsAnalysis = analyzeArray("items", items);

  return {
    ok: payload.ok,
    storeId: payload.storeId,
    count: payload.count,
    arrays: [itemsAnalysis],
    totalServiceCount: itemsAnalysis.serviceCount,
    loaderDecision:
      itemsAnalysis.serviceCount > 0
        ? "The loader should use publicQuickPayCatalog items filtered by service."
        : "No service items found in publicQuickPayCatalog either, so the site will use local fallback services.",
  };
}

function buildConclusion(
  configOk: boolean,
  integration: ReturnType<typeof analyzeIntegrationPayload> | null,
  publicCatalog: ReturnType<typeof analyzePublicCatalogPayload> | null
) {
  if (!configOk) {
    return "Sedifex is not configured correctly. Check store ID and integration API key environment variables.";
  }

  if (integration && integration.totalServiceCount > 0) {
    return "Sedifex is returning service items from /v1IntegrationProducts. If the page still shows fallback, check deployment cache or whether the page imports getServiceData/getOncoNurseServices.";
  }

  if (publicCatalog && publicCatalog.totalServiceCount > 0) {
    return "The authenticated endpoint returned no services, but publicQuickPayCatalog returned services. The site should use public fallback.";
  }

  return "Both Sedifex endpoints returned zero items that pass itemType/type === service. The site is falling back because Sedifex is not exposing services through these API responses.";
}

export async function GET() {
  const integrationUrl = new URL("/v1IntegrationProducts", SEDIFEX_BASE_URL);
  if (hasUsableValue(SEDIFEX_STORE_ID)) {
    integrationUrl.searchParams.set("storeId", SEDIFEX_STORE_ID);
  }

  const publicUrl = new URL("/publicQuickPayCatalog", SEDIFEX_BASE_URL);
  if (hasUsableValue(SEDIFEX_STORE_ID)) {
    publicUrl.searchParams.set("storeId", SEDIFEX_STORE_ID);
  }

  const config = {
    baseUrl: SEDIFEX_BASE_URL,
    storeIdPresent: hasUsableValue(SEDIFEX_STORE_ID),
    storeId: maskValue(SEDIFEX_STORE_ID),
    apiKeyPresent: hasUsableValue(SEDIFEX_API_KEY),
    apiKey: maskValue(SEDIFEX_API_KEY),
    contractVersion: SEDIFEX_CONTRACT_VERSION,
    envSourceHints: {
      hasSedifexApiBaseUrl: Boolean(process.env.SEDIFEX_API_BASE_URL),
      hasSedifexIntegrationApiBaseUrl: Boolean(process.env.SEDIFEX_INTEGRATION_API_BASE_URL),
      hasSedifexStoreId: Boolean(process.env.SEDIFEX_STORE_ID),
      hasSedifexBookingTargetStoreId: Boolean(process.env.SEDIFEX_BOOKING_TARGET_STORE_ID),
      hasNextPublicSedifexStoreId: Boolean(process.env.NEXT_PUBLIC_SEDIFEX_STORE_ID),
      hasSedifexIntegrationApiKey: Boolean(process.env.SEDIFEX_INTEGRATION_API_KEY),
      hasSedifexProductsApiKey: Boolean(process.env.SEDIFEX_PRODUCTS_API_KEY),
      hasSedifexBookingApiKey: Boolean(process.env.SEDIFEX_BOOKING_API_KEY),
      hasSedifexIntegrationKey: Boolean(process.env.SEDIFEX_INTEGRATION_KEY),
    },
  };

  const configOk = config.storeIdPresent && config.apiKeyPresent;

  const integrationFetch = configOk
    ? await fetchJson(integrationUrl, true)
    : null;
  const integrationAnalysis = integrationFetch?.json
    ? analyzeIntegrationPayload(integrationFetch.json)
    : null;

  const publicFetch = config.storeIdPresent
    ? await fetchJson(publicUrl, false)
    : null;
  const publicAnalysis = publicFetch?.json
    ? analyzePublicCatalogPayload(publicFetch.json)
    : null;

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    config,
    integrationEndpoint: {
      fetch: integrationFetch,
      analysis: integrationAnalysis,
    },
    publicFallbackEndpoint: {
      fetch: publicFetch,
      analysis: publicAnalysis,
    },
    conclusion: buildConclusion(configOk, integrationAnalysis, publicAnalysis),
  });
}

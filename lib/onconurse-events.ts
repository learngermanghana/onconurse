import { getSedifexEvents } from "./sedifex-public";

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

type JsonRecord = Record<string, unknown>;

type EventAttempt = {
  baseUrl: string;
  path: string;
  params: Record<string, string>;
  authenticated?: boolean;
};

export type OncoNurseEvent = {
  id: string;
  slotId?: string;
  title: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  displayDateText?: string;
  displayTimeText?: string;
  scheduleStatus?: string;
  isDateConfirmed?: boolean;
  isTimeConfirmed?: boolean;
  location?: string;
  status?: string;
  ctaLabel?: string;
  ctaHref?: string;
  serviceId?: string;
  serviceName?: string;
  availableSlots?: number;
  capacity?: number;
  seatsBooked?: number;
  price?: number;
  paymentAmount?: number;
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

function readBoolean(record: JsonRecord, keys: string[]) {
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

function collectArrays(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

function extractTimeFromDateTime(value: string) {
  const match = value.match(/(?:T|\s)(\d{1,2}:\d{2})(?::\d{2})?/);
  return match?.[1] || "";
}

function cleanDateValue(value: string) {
  if (!value) return "";
  const dateOnly = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateOnly) return dateOnly[1];

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);

  return value;
}

function visibleEvent(event: OncoNurseEvent) {
  const status = (event.status || "").trim().toLowerCase();
  return !status || /active|published|upcoming|public|open|available|scheduled|confirmed/.test(status);
}

function normalizeAvailability(raw: unknown, index: number): OncoNurseEvent | null {
  if (!isRecord(raw)) return null;

  const attributes = isRecord(raw.attributes) ? raw.attributes : {};
  const slotId = readString(raw, ["slotId", "slot_id", "id", "uid", "documentId"]);
  const serviceId = readString(raw, ["serviceId", "service_id", "itemId", "item_id", "productId", "product_id"]);
  const serviceName = readString(raw, ["serviceName", "service_name", "itemName", "item_name", "productName", "product_name"]);
  const title = readString(raw, ["title", "name", "eventName", "event_name", "heading"], serviceName || `Event ${index + 1}`);
  const startAt = readString(raw, ["startAt", "start_at", "startsAt", "starts_at"]);
  const endAt = readString(raw, ["endAt", "end_at", "endsAt", "ends_at"]);
  const eventDate = readString(raw, ["eventDate", "event_date", "date", "startDate", "start_date"]);
  const scheduleStatus = readString(raw, ["scheduleStatus", "schedule_status"], startAt ? "scheduled" : "date_tba");
  const displayDateText = readString(raw, ["displayDateText", "display_date_text"]);
  const displayTimeText = readString(raw, ["displayTimeText", "display_time_text"]);
  const startDate = cleanDateValue(eventDate || startAt);
  const endDate = cleanDateValue(readString(raw, ["endDate", "end_date"]) || endAt);
  const startTime = readString(raw, ["startTime", "start_time", "time"]) || extractTimeFromDateTime(startAt);
  const endTime = readString(raw, ["endTime", "end_time"]) || extractTimeFromDateTime(endAt);
  const capacity = readNumber(raw, ["capacity", "totalSlots", "total_slots"]);
  const seatsBooked = readNumber(raw, ["seatsBooked", "seats_booked", "bookedSeats", "booked_seats"]);
  const seatsRemaining = readNumber(raw, ["seatsRemaining", "seats_remaining", "availableSlots", "available_slots", "availableCount", "available_count"]);
  const price = readNumber(raw, ["paymentAmount", "payment_amount", "price", "amount", "unitPrice", "unit_price"]);

  const event: OncoNurseEvent = {
    id: slotId || serviceId || `event-${index + 1}`,
    slotId: slotId || undefined,
    title,
    category: readString(raw, ["category", "categoryName", "type", "kind"], "Upcoming Event"),
    description: readString(raw, ["description", "summary", "excerpt", "details", "notes"]) || undefined,
    imageUrl: readString(attributes, ["imageUrl", "image_url", "image", "photoUrl", "photo_url"]) || readString(raw, ["imageUrl", "image_url", "image", "coverImageUrl", "cover_image_url"]) || undefined,
    imageAlt: readString(attributes, ["imageAlt", "image_alt", "alt"], title),
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    startTime: startTime || undefined,
    endTime: endTime || undefined,
    displayDateText: displayDateText || (startDate ? undefined : "Date to be announced"),
    displayTimeText: displayTimeText || (startTime || endTime ? undefined : "Time to be announced"),
    scheduleStatus,
    isDateConfirmed: readBoolean(raw, ["isDateConfirmed", "is_date_confirmed"]),
    isTimeConfirmed: readBoolean(raw, ["isTimeConfirmed", "is_time_confirmed"]),
    location: readString(raw, ["location", "venue", "place", "meetingLink", "meeting_link", "timezone"], "Online / to be confirmed"),
    status: readString(raw, ["status", "availabilityStatus", "availability_status", "publishStatus", "publish_status"]),
    ctaLabel: /date_tba|time_tba/i.test(scheduleStatus) ? "Register Interest" : readString(raw, ["ctaLabel", "cta_label", "buttonText", "button_text"], "Register Interest"),
    ctaHref: readString(raw, ["ctaHref", "cta_href", "buttonLink", "button_link", "url", "link", "href"]) || undefined,
    serviceId: serviceId || undefined,
    serviceName: serviceName || title,
    availableSlots: seatsRemaining ?? capacity,
    capacity,
    seatsBooked,
    price,
    paymentAmount: price,
  };

  return event.title && visibleEvent(event) ? event : null;
}

async function fetchJson(attempt: EventAttempt) {
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

function sortEvents(events: OncoNurseEvent[]) {
  return events.sort((left, right) => {
    const leftTime = Date.parse(`${left.startDate || ""} ${left.startTime || ""}`.trim());
    const rightTime = Date.parse(`${right.startDate || ""} ${right.startTime || ""}`.trim());

    return (Number.isFinite(leftTime) ? leftTime : Number.POSITIVE_INFINITY) -
      (Number.isFinite(rightTime) ? rightTime : Number.POSITIVE_INFINITY);
  });
}

export async function getOncoNurseEvents(): Promise<OncoNurseEvent[]> {
  const attempts: EventAttempt[] = [
    { baseUrl: SEDIFEX_BASE_URL, path: "/v1IntegrationAvailability", params: { storeId: SEDIFEX_STORE_ID }, authenticated: true },
    { baseUrl: SEDIFEX_PUBLIC_API_BASE_URL, path: "/api/public/availability", params: { storeId: SEDIFEX_STORE_ID, storeSlug: SEDIFEX_STORE_SLUG } },
    { baseUrl: SEDIFEX_BASE_URL, path: "/publicAvailability", params: { storeId: SEDIFEX_STORE_ID } },
  ];

  for (const attempt of attempts) {
    const items = collectArrays(await fetchJson(attempt), [
      "availability",
      "availabilities",
      "availableSlots",
      "slots",
      "events",
      "items",
      "data",
      "content",
    ]);

    const events = sortEvents(
      items
        .map(normalizeAvailability)
        .filter((event): event is OncoNurseEvent => Boolean(event))
    );

    if (events.length) return events;
  }

  const legacyEvents = await getSedifexEvents().catch(() => []);

  return legacyEvents.map((event) => ({
    ...event,
    imageAlt: event.title,
    slotId: event.id,
    displayDateText: event.startDate ? undefined : "Date to be announced",
    displayTimeText: event.startTime ? undefined : "Time to be announced",
    scheduleStatus: event.startDate ? "scheduled" : "date_tba",
    price: undefined,
    paymentAmount: undefined,
  }));
}

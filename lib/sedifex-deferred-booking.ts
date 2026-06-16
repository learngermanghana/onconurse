import type { SedifexBookingInput } from "./sedifex";

const DEFAULT_SEDIFEX_API_BASE_URL =
  "https://us-central1-sedifex-web.cloudfunctions.net";

type DeferredBookingCheckoutInput = SedifexBookingInput & {
  currency?: string;
  returnUrl: string;
};

type DeferredBookingCheckoutResponse = {
  ok?: boolean;
  demoMode?: boolean;
  checkoutUrl?: string;
  authorizationUrl?: string;
  reference?: string;
  payment_reference?: string;
  message?: string;
  [key: string]: unknown;
};

function usable(value: string) {
  return Boolean(value && !value.includes("PASTE_") && !value.includes("YOUR_"));
}

function config() {
  const baseUrl =
    process.env.SEDIFEX_INTEGRATION_API_BASE_URL ||
    process.env.SEDIFEX_API_BASE_URL ||
    DEFAULT_SEDIFEX_API_BASE_URL;
  const storeId =
    process.env.SEDIFEX_BOOKING_TARGET_STORE_ID ||
    process.env.SEDIFEX_STORE_ID ||
    process.env.NEXT_PUBLIC_SEDIFEX_STORE_ID ||
    "";
  const apiKey =
    process.env.SEDIFEX_CHECKOUT_API_KEY ||
    process.env.SEDIFEX_BOOKING_API_KEY ||
    process.env.SEDIFEX_INTEGRATION_API_KEY ||
    process.env.SEDIFEX_INTEGRATION_KEY ||
    "";

  return {
    storeId,
    apiKey,
    contractVersion: process.env.SEDIFEX_CONTRACT_VERSION || "2026-04-13",
    checkoutUrl:
      process.env.SEDIFEX_INTEGRATION_CHECKOUT_CREATE_URL ||
      `${baseUrl}/integrationCheckoutCreate`,
  };
}

function newReference() {
  return `BOOKING-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)
    .toUpperCase()}`;
}

export async function createDeferredSedifexBookingCheckout(
  input: DeferredBookingCheckoutInput
): Promise<DeferredBookingCheckoutResponse> {
  const settings = config();

  if (!usable(settings.storeId) || !usable(settings.apiKey)) {
    return {
      ok: true,
      demoMode: true,
      reference: "LOCAL-DEMO",
      message:
        "Sedifex checkout is not configured yet. Add the store ID and checkout key.",
    };
  }

  const amount = input.paymentAmount || 0;
  if (amount <= 0) {
    throw new Error("A positive payment amount is required for online checkout.");
  }

  const quantity = input.quantity || 1;
  const reference = newReference();
  const sourceChannel = input.sourceChannel || "client_website";
  const sourceLabel =
    typeof input.attributes?.sourceLabel === "string"
      ? input.attributes.sourceLabel
      : "Onco-nurse website";

  const response = await fetch(settings.checkoutUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-key": settings.apiKey,
      Authorization: `Bearer ${settings.apiKey}`,
      "X-Sedifex-Contract-Version": settings.contractVersion,
    },
    body: JSON.stringify({
      storeId: settings.storeId,
      merchantId: settings.storeId,
      reference,
      clientOrderId: reference,
      orderType: "service_booking",
      sourceChannel,
      sourceLabel,
      currency: input.currency || "GHS",
      amount,
      customer: input.customer,
      items: [
        {
          id: input.serviceId,
          item_id: input.serviceId,
          serviceId: input.serviceId,
          name: input.serviceName || "Onco-nurse Consultation",
          serviceName: input.serviceName || "Onco-nurse Consultation",
          unitPrice: amount,
          price: amount,
          qty: quantity,
          quantity,
          type: "SERVICE",
          item_type: "service",
        },
      ],
      returnUrl: input.returnUrl,
      metadata: {
        channel: "client-website",
        deferBookingUntilPaid: true,
        sourceChannel,
        sourceLabel,
        bookingIntent: {
          serviceId: input.serviceId,
          serviceName: input.serviceName,
          bookingDate: input.bookingDate,
          bookingTime: input.bookingTime,
          quantity,
          customer: input.customer,
          notes: input.notes,
          paymentAmount: amount,
          paymentMethod: input.paymentMethod || "paystack_checkout",
          sourceChannel,
          sourceLabel,
          attributes: input.attributes || {},
        },
      },
    }),
  });

  const text = await response.text();
  let payload: DeferredBookingCheckoutResponse = {};

  try {
    payload = JSON.parse(text) as DeferredBookingCheckoutResponse;
  } catch {
    payload = { message: text.slice(0, 300) };
  }

  if (!response.ok) {
    throw new Error(
      `Sedifex checkout failed: ${response.status}. ${
        payload.message || text.slice(0, 200)
      }`
    );
  }

  return {
    ...payload,
    ok: payload.ok !== false,
    reference: payload.reference || payload.payment_reference || reference,
    authorizationUrl: payload.authorizationUrl || payload.checkoutUrl,
    checkoutUrl: payload.checkoutUrl || payload.authorizationUrl,
  };
}

import { NextResponse } from "next/server";
import {
  createSedifexBookingCheckout,
  getSedifexCheckoutReturnUrl,
} from "../../../lib/sedifex";

export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(record: JsonRecord, key: string) {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function getNestedRecord(record: JsonRecord, key: string) {
  const value = record[key];
  return isRecord(value) ? value : {};
}

function getNumber(record: JsonRecord, key: string) {
  const value = record[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return undefined;
}

export async function POST(request: Request) {
  try {
    const payload: unknown = await request.json();
    const body = isRecord(payload) ? payload : {};
    const customerInput = getNestedRecord(body, "customer");
    const attributesInput = getNestedRecord(body, "attributes");

    const customer = {
      name: getString(customerInput, "name"),
      email: getString(customerInput, "email"),
      phone: getString(customerInput, "phone"),
    };

    const serviceId = getString(body, "serviceId") || "pirus-consultation";
    const serviceName =
      getString(body, "serviceName") || "Pirus Consultancy Consultation";

    const country = getString(body, "country");
    const pathway = getString(body, "pathway");
    const germanLevel = getString(body, "germanLevel");
    const nursingBackground = getString(body, "nursingBackground");
    const notes = getString(body, "notes");
    const bookingDate = getString(body, "bookingDate");
    const bookingTime = getString(body, "bookingTime");

    if (!customer.name || !customer.phone) {
      return NextResponse.json(
        {
          ok: false,
          error: "Name and phone are required.",
        },
        { status: 400 }
      );
    }

    if (!bookingDate || !bookingTime) {
      return NextResponse.json(
        {
          ok: false,
          error: "Preferred date and time are required.",
        },
        { status: 400 }
      );
    }

    if (customer.email && !/^\S+@\S+\.\S+$/.test(customer.email)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Enter a valid email address or leave the email field empty.",
        },
        { status: 400 }
      );
    }

    const paymentAmount = getNumber(body, "paymentAmount") ?? 0;

    if (paymentAmount <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This service needs a Sedifex price before checkout can be created.",
        },
        { status: 400 }
      );
    }

    const requestUrl = new URL(request.url);

    const result = await createSedifexBookingCheckout({
      serviceId,
      serviceName,
      bookingDate,
      bookingTime,
      quantity: 1,
      customer,
      notes: [
        country ? `Country: ${country}` : "",
        pathway ? `Pathway: ${pathway}` : "",
        germanLevel ? `German level: ${germanLevel}` : "",
        nursingBackground
          ? `Nursing background: ${nursingBackground}`
          : "",
        notes ? `Message: ${notes}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      paymentAmount,
      sourceChannel: "client_website",
      returnUrl: getSedifexCheckoutReturnUrl(
        new URL("/payment/return", requestUrl.origin).toString()
      ),
      attributes: {
        source: "website_booking_form",
        sourceLabel: "Pirus Consultancy website",
        pageUrl: getString(attributesInput, "pageUrl"),
        timezone: getString(attributesInput, "timezone") || "Africa/Accra",
        locale: getString(attributesInput, "locale") || "en-GB",
        country,
        pathway,
        germanLevel,
        nursingBackground,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unable to submit booking.",
      },
      { status: 500 }
    );
  }
}

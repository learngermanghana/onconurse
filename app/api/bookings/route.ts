import { NextResponse } from "next/server";
import {
  createSedifexBooking,
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

  if (typeof value === "number" && Number.isFinite(value)) return value;

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

    const slotId = getString(body, "slotId");
    const serviceId = getString(body, "serviceId") || "onco-nurse-consultation";
    const serviceName = getString(body, "serviceName") || "Onco-nurse Consultation";
    const country = getString(body, "country");
    const pathway = getString(body, "pathway");
    const germanLevel = getString(body, "germanLevel");
    const nursingBackground = getString(body, "nursingBackground");
    const notes = getString(body, "notes");
    const bookingDate = getString(body, "bookingDate") || "Date to be announced";
    const bookingTime = getString(body, "bookingTime") || "Time to be announced";
    const scheduleStatus = getString(body, "scheduleStatus");

    if (!customer.name || !customer.phone) {
      return NextResponse.json(
        { ok: false, error: "Name and phone are required." },
        { status: 400 }
      );
    }

    if (customer.email && !/^\S+@\S+\.\S+$/.test(customer.email)) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid email address or leave the email field empty." },
        { status: 400 }
      );
    }

    const paymentAmount = getNumber(body, "paymentAmount") ?? 0;
    const requestUrl = new URL(request.url);
    const successUrl = new URL("/payment/success", requestUrl.origin).toString();
    const source = slotId ? "manual_upcoming_event" : "website_booking_form";
    const combinedNotes = [
      country ? `Country: ${country}` : "",
      pathway ? `Pathway: ${pathway}` : "",
      germanLevel ? `German level: ${germanLevel}` : "",
      nursingBackground ? `Nursing background: ${nursingBackground}` : "",
      scheduleStatus ? `Schedule status: ${scheduleStatus}` : "",
      slotId ? `Availability slot: ${slotId}` : "",
      notes ? `Message: ${notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const baseInput = {
      slotId: slotId || undefined,
      serviceId,
      serviceName,
      bookingDate,
      bookingTime,
      quantity: 1,
      customer,
      notes: combinedNotes,
      paymentAmount,
      sourceChannel: "client_website",
      attributes: {
        source,
        sourceLabel: "Onco-nurse website",
        pageUrl: getString(attributesInput, "pageUrl"),
        successUrl,
        scheduleStatus,
        timezone: getString(attributesInput, "timezone") || "Africa/Accra",
        locale: getString(attributesInput, "locale") || "en-GB",
        country,
        pathway,
        germanLevel,
        nursingBackground,
      },
    };

    if (paymentAmount <= 0) {
      const booking = await createSedifexBooking({
        ...(baseInput as any),
        paymentMethod: "manual",
        bookingStatus: "booked",
        paymentCollectionMode: "manual",
        paymentStatus: "not_required",
      });

      return NextResponse.json({
        ok: true,
        booking,
        reference: isRecord(booking)
          ? getString(booking, "reference") || getString(booking, "bookingId") || getString(booking, "id")
          : undefined,
        redirectUrl: "/payment/success",
      });
    }

    const result = await createSedifexBookingCheckout({
      ...(baseInput as any),
      paymentMethod: "paystack_checkout",
      returnUrl: getSedifexCheckoutReturnUrl(successUrl),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to submit booking.",
      },
      { status: 500 }
    );
  }
}

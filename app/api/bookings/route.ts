import { NextResponse } from "next/server";
import {
  isWeekendBookingDate,
  validateBookingContact,
  weekendBookingError,
} from "../../../lib/booking-validation";
import {
  createSedifexBooking,
  getSedifexCheckoutReturnUrl,
  type SedifexBookingInput,
} from "../../../lib/sedifex";
import { createDeferredSedifexBookingCheckout } from "../../../lib/sedifex-deferred-booking";

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

function getBoolean(record: JsonRecord, key: string) {
  return record[key] === true;
}

export async function POST(request: Request) {
  try {
    const payload: unknown = await request.json();
    const body = isRecord(payload) ? payload : {};
    const customerInput = getNestedRecord(body, "customer");
    const attributesInput = getNestedRecord(body, "attributes");

    const contactValidation = validateBookingContact({
      name: getString(customerInput, "name"),
      email: getString(customerInput, "email"),
      phone: getString(customerInput, "phone"),
      country: getString(body, "country"),
    });
    const customer = {
      name: contactValidation.contact.name,
      email: contactValidation.contact.email,
      phone: contactValidation.contact.phone,
    };

    const slotId = getString(body, "slotId");
    const serviceId = getString(body, "serviceId") || "onco-nurse-consultation";
    const serviceName = getString(body, "serviceName") || "Onco-nurse Consultation";
    const country = contactValidation.contact.country;
    const pathway = getString(body, "pathway");
    const germanLevel = getString(body, "germanLevel");
    const nursingBackground = getString(body, "nursingBackground");
    const notes = getString(body, "notes");
    const bookingDate = getString(body, "bookingDate") || "Date to be announced";
    const bookingTime = getString(body, "bookingTime") || "Time to be announced";
    const scheduleStatus = getString(body, "scheduleStatus");
    const isEventBooking = Boolean(slotId) || getBoolean(body, "isEvent");

    if (!contactValidation.isValid) {
      return NextResponse.json(
        {
          ok: false,
          error: "Please check your contact details before continuing.",
          fieldErrors: contactValidation.errors,
        },
        { status: 400 }
      );
    }

    if (!isEventBooking && !isWeekendBookingDate(bookingDate)) {
      return NextResponse.json(
        { ok: false, error: weekendBookingError },
        { status: 400 }
      );
    }

    const paymentAmount = getNumber(body, "paymentAmount") ?? 0;
    const requestUrl = new URL(request.url);
    const successUrl = new URL("/payment/success", requestUrl.origin).toString();
    const source = isEventBooking ? "manual_upcoming_event" : "website_booking_form";
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

    const baseInput: SedifexBookingInput & { slotId?: string } = {
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
        ...baseInput,
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

    // Paid bookings are now checkout-first. Sedifex receives the booking intent,
    // but creates the client and booking only after Paystack confirms payment.
    const result = await createDeferredSedifexBookingCheckout({
      ...baseInput,
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

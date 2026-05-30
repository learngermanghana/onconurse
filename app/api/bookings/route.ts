import { NextResponse } from "next/server";
import { createSedifexBooking } from "../../../lib/sedifex";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function getString(record: JsonRecord, key: string) {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function getNestedRecord(record: JsonRecord, key: string) {
  const value = record[key];
  return isRecord(value) ? value : {};
}

export async function POST(request: Request) {
  try {
    const payload: unknown = await request.json();
    const body = isRecord(payload) ? payload : {};
    const customerInput = getNestedRecord(body, "customer");

    const customer = {
      name: getString(customerInput, "name"),
      email: getString(customerInput, "email"),
      phone: getString(customerInput, "phone"),
    };

    const country = getString(body, "country");
    const pathway = getString(body, "pathway");
    const germanLevel = getString(body, "germanLevel");
    const nursingBackground = getString(body, "nursingBackground");
    const notes = getString(body, "notes");

    if (!customer.name || !customer.phone) {
      return NextResponse.json(
        {
          ok: false,
          error: "Name and phone are required.",
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

    const result = await createSedifexBooking({
      serviceId: getString(body, "serviceId") || "onco-nurse-consultation",
      serviceName: getString(body, "serviceName") || "Onco-nurse Consultation",
      bookingDate: getString(body, "bookingDate"),
      bookingTime: getString(body, "bookingTime"),
      quantity: 1,
      customer,
      notes: [
        country ? `Country: ${country}` : "",
        pathway ? `Pathway: ${pathway}` : "",
        germanLevel ? `German level: ${germanLevel}` : "",
        nursingBackground ? `Nursing background: ${nursingBackground}` : "",
        notes ? `Message: ${notes}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      paymentMethod: "manual",
      attributes: {
        source: "onco_nurse_website",
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

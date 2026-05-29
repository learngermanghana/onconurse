import { NextResponse } from "next/server";
import { createSedifexBooking } from "../../../lib/sedifex";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const customer = {
      name: String(body.customer?.name || "").trim(),
      email: String(body.customer?.email || "").trim(),
      phone: String(body.customer?.phone || "").trim(),
    };

    if (!customer.name || !customer.phone) {
      return NextResponse.json(
        {
          ok: false,
          error: "Name and phone are required.",
        },
        { status: 400 }
      );
    }

    const result = await createSedifexBooking({
      serviceId: String(body.serviceId || "onco-nurse-consultation"),
      serviceName: String(body.serviceName || "Onco-nurse Consultation"),
      bookingDate: String(body.bookingDate || ""),
      bookingTime: String(body.bookingTime || ""),
      quantity: 1,
      customer,
      notes: [
        body.country ? `Country: ${body.country}` : "",
        body.pathway ? `Pathway: ${body.pathway}` : "",
        body.germanLevel ? `German level: ${body.germanLevel}` : "",
        body.nursingBackground ? `Nursing background: ${body.nursingBackground}` : "",
        body.notes ? `Message: ${body.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      paymentMethod: "manual",
      attributes: {
        source: "onco_nurse_website",
        country: body.country || "",
        pathway: body.pathway || "",
        germanLevel: body.germanLevel || "",
        nursingBackground: body.nursingBackground || "",
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
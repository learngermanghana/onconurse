"use client";

import { useMemo, useState } from "react";

type BookingServiceOption = {
  id: string;
  name: string;
  priceLabel?: string;
  price?: number;
  category?: string;
  slotId?: string;
  bookingDate?: string;
  bookingTime?: string;
  scheduleStatus?: string;
  isEvent?: boolean;
};

type BookingFormProps = {
  initialServiceId?: string;
  initialServiceName?: string;
  initialSlotId?: string;
  initialBookingDate?: string;
  initialBookingTime?: string;
  initialScheduleStatus?: string;
  serviceOptions?: BookingServiceOption[];
};

export default function BookingForm({
  initialServiceId = "",
  initialServiceName = "",
  initialSlotId = "",
  initialBookingDate = "",
  initialBookingTime = "",
  initialScheduleStatus = "",
  serviceOptions = [],
}: BookingFormProps) {
  const initialService = useMemo(
    () => serviceOptions.find((service) => service.id === initialServiceId),
    [initialServiceId, serviceOptions]
  );
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fallbackInitialService = serviceOptions[0];
  const [selectedServiceId, setSelectedServiceId] = useState(
    initialService?.id || fallbackInitialService?.id || initialServiceId || "onco-nurse-consultation"
  );
  const [serviceName, setServiceName] = useState(
    initialService?.name || fallbackInitialService?.name || initialServiceName
  );
  const [slotId, setSlotId] = useState(
    initialService?.slotId || initialSlotId || ""
  );
  const [bookingDate, setBookingDate] = useState(
    initialService?.bookingDate || initialBookingDate || ""
  );
  const [bookingTime, setBookingTime] = useState(
    initialService?.bookingTime || initialBookingTime || ""
  );
  const [scheduleStatus, setScheduleStatus] = useState(
    initialService?.scheduleStatus || initialScheduleStatus || ""
  );

  const selectedService = serviceOptions.find(
    (service) => service.id === selectedServiceId
  );
  const isSelectedEvent = Boolean(slotId || selectedService?.isEvent);
  const selectedPrice = selectedService?.price || 0;

  function updateSelectedService(serviceId: string) {
    setSelectedServiceId(serviceId);

    const nextService = serviceOptions.find((service) => service.id === serviceId);
    if (!nextService) return;

    setServiceName(nextService.name);
    setSlotId(nextService.slotId || "");
    setBookingDate(nextService.bookingDate || "");
    setBookingTime(nextService.bookingTime || "");
    setScheduleStatus(nextService.scheduleStatus || "");
  }

  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    setStatus("Creating your booking before secure checkout...");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          slotId,
          serviceId: selectedServiceId || "onco-nurse-consultation",
          serviceName: form.get("serviceName"),
          customer: {
            name: form.get("name"),
            phone: form.get("phone"),
            email: form.get("email"),
          },
          country: form.get("country"),
          pathway: form.get("pathway"),
          germanLevel: form.get("germanLevel"),
          nursingBackground: form.get("nursingBackground"),
          bookingDate: form.get("bookingDate") || bookingDate || "Date to be announced",
          bookingTime: form.get("bookingTime") || bookingTime || "Time to be announced",
          scheduleStatus,
          notes: form.get("notes"),
          paymentAmount: selectedPrice,
          attributes: {
            pageUrl: window.location.href,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locale: navigator.language,
            source: isSelectedEvent ? "manual_upcoming_event" : "website_booking_form",
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json().catch(() => ({
        error: "Could not read the booking response.",
      }));

      if (response.ok) {
        if (result.checkoutUrl || result.authorizationUrl) {
          setStatus("Booking saved. Redirecting to secure Sedifex checkout...");
          window.location.assign(result.checkoutUrl || result.authorizationUrl);
          return;
        }

        if (result.redirectUrl) {
          setStatus("Booking saved. Redirecting to confirmation page...");
          window.location.assign(result.redirectUrl);
          return;
        }

        setStatus(
          result.demoMode
            ? "Demo booking received. Add Sedifex booking and checkout keys to redirect to payment."
            : `Booking received successfully${
                result.reference ? ` (${result.reference})` : ""
              }.`
        );
        event.currentTarget.reset();
        setSelectedServiceId(fallbackInitialService?.id || "onco-nurse-consultation");
        setServiceName(fallbackInitialService?.name || "");
        setSlotId(fallbackInitialService?.slotId || "");
        setBookingDate(fallbackInitialService?.bookingDate || "");
        setBookingTime(fallbackInitialService?.bookingTime || "");
        setScheduleStatus(fallbackInitialService?.scheduleStatus || "");
      } else {
        setStatus(result.error || "Could not submit booking.");
      }
    } catch {
      setStatus("Network error. Please try again or contact Onco-nurse on WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
      <div>
        <span className="badge">Book Consultation</span>

        <h1 className="section-title mt-4">Start your Germany pathway with guidance</h1>

        <p className="section-subtitle">
          Choose a Sedifex service or upcoming event, request a date and time,
          then pay through secure Sedifex checkout when payment is required.
        </p>

        <div className="mt-8 rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
            How Sedifex booking + payment works
          </p>
          <ol className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
            <li>
              <span className="font-black text-slate-950">1. Server fetch:</span>{" "}
              The page loads services and manual upcoming events from Sedifex.
            </li>
            <li>
              <span className="font-black text-slate-950">2. Manual events:</span>{" "}
              Upcoming events use the availability slot as the source of truth,
              including image, title, schedule and capacity.
            </li>
            <li>
              <span className="font-black text-slate-950">3. Slot booking:</span>{" "}
              If a selected event has a slotId, the booking sends the slotId so
              Sedifex can resolve the event and increment seats booked.
            </li>
            <li>
              <span className="font-black text-slate-950">4. Checkout:</span>{" "}
              Paid services open Sedifex checkout. Free or TBA events register
              interest and return to the success page.
            </li>
          </ol>
        </div>

        <div className="mt-8 rounded-3xl bg-slate-950 p-6 text-white">
          <p className="font-black">We can help with:</p>
          <ul className="mt-4 space-y-3 text-slate-300">
            <li>• Nursing Ausbildung</li>
            <li>• FSJ / BFD / Au-Pair</li>
            <li>• Nursing recognition</li>
            <li>• Student visa readiness</li>
            <li>• Document review</li>
          </ul>
        </div>
      </div>

      <form onSubmit={submitBooking} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl md:p-8">
        <input type="hidden" name="slotId" value={slotId} />
        <input type="hidden" name="scheduleStatus" value={scheduleStatus} />

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label">Sedifex service or upcoming event</label>
            <select
              name="serviceId"
              className="input mt-2"
              value={selectedServiceId}
              onChange={(e) => updateSelectedService(e.target.value)}
              required
            >
              <option value="onco-nurse-consultation" disabled={serviceOptions.length > 0}>
                General Onco-nurse consultation
              </option>
              {serviceOptions.map((service) => (
                <option key={`${service.id}-${service.slotId || "service"}`} value={service.id}>
                  {service.name}{service.priceLabel ? ` — ${service.priceLabel}` : ""}
                </option>
              ))}
            </select>
          </div>

          {isSelectedEvent ? (
            <div className="md:col-span-2 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-900">
              This is an upcoming event from Sedifex availability. We will send the slot ID with your booking.
            </div>
          ) : null}

          <div className="md:col-span-2">
            <label className="label">Service / Interest</label>
            <input
              name="serviceName"
              className="input mt-2"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="Nursing Ausbildung, FSJ, BFD, Au-Pair, Recognition..."
              required
            />
          </div>

          <div>
            <label className="label">Full name</label>
            <input name="name" className="input mt-2" autoComplete="name" required />
          </div>

          <div>
            <label className="label">Phone / WhatsApp</label>
            <input name="phone" className="input mt-2" autoComplete="tel" required />
          </div>

          <div>
            <label className="label">Email</label>
            <input name="email" type="email" className="input mt-2" autoComplete="email" />
          </div>

          <div>
            <label className="label">Current country</label>
            <input name="country" className="input mt-2" placeholder="Ghana" autoComplete="country-name" required />
          </div>

          <div>
            <label className="label">Pathway</label>
            <select name="pathway" className="input mt-2" required defaultValue={isSelectedEvent ? "Upcoming Event" : "Nursing Ausbildung"}>
              <option>Upcoming Event</option>
              <option>Nursing Ausbildung</option>
              <option>FSJ</option>
              <option>BFD</option>
              <option>Au-Pair</option>
              <option>Recognition</option>
              <option>Student Visa</option>
              <option>Document Review</option>
            </select>
          </div>

          <div>
            <label className="label">German level</label>
            <select name="germanLevel" className="input mt-2">
              <option>No German yet</option>
              <option>A1</option>
              <option>A2</option>
              <option>B1</option>
              <option>B2</option>
              <option>C1</option>
            </select>
          </div>

          <div>
            <label className="label">Nursing background</label>
            <select name="nursingBackground" className="input mt-2">
              <option>I am not yet a nurse</option>
              <option>I am a nursing student</option>
              <option>I am a trained nurse</option>
              <option>I work in healthcare</option>
            </select>
          </div>

          <div>
            <label className="label">Preferred date</label>
            <input
              name="bookingDate"
              type="text"
              className="input mt-2"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              placeholder="Date to be announced"
              required
            />
          </div>

          <div>
            <label className="label">Preferred time</label>
            <input
              name="bookingTime"
              type="text"
              className="input mt-2"
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
              placeholder="Time to be announced"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Message</label>
            <textarea
              name="notes"
              className="input mt-2 min-h-32"
              placeholder="Tell us your background, German level, documents or Germany goal."
            />
          </div>
        </div>

        {selectedService?.priceLabel && (
          <p className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
            {selectedPrice > 0
              ? `Checkout total: ${selectedService.priceLabel}. After payment, Sedifex will return you to the success page while final verification is completed.`
              : "No online payment is required now. Your interest will be registered for follow-up."}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-full bg-emerald-700 px-6 py-4 font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting
            ? "Creating booking..."
            : selectedPrice > 0
              ? "Book & Pay with Sedifex"
              : "Register Interest"}
        </button>

        {status && (
          <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
            {status}
          </div>
        )}
      </form>
    </section>
  );
}

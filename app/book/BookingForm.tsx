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

const timeOptions = [
  ["09:00", "9:00 AM"],
  ["10:00", "10:00 AM"],
  ["11:00", "11:00 AM"],
  ["12:00", "12:00 PM"],
  ["13:00", "1:00 PM"],
  ["14:00", "2:00 PM"],
  ["15:00", "3:00 PM"],
  ["16:00", "4:00 PM"],
  ["17:00", "5:00 PM"],
  ["18:00", "6:00 PM"],
];

function dateInputValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function timeInputValue(value: string) {
  return value.match(/\b\d{2}:\d{2}\b/)?.[0] || "";
}

function showDate(value: string) {
  if (!value) return "Date to be announced";
  if (!dateInputValue(value)) return value;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
}

function showTime(value: string) {
  const clean = timeInputValue(value);
  return timeOptions.find(([time]) => time === clean)?.[1] || value || "Time to be announced";
}

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
  const fallbackInitialService = serviceOptions[0];
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(
    initialService?.id || fallbackInitialService?.id || initialServiceId || "onco-nurse-consultation"
  );
  const [serviceName, setServiceName] = useState(
    initialService?.name || fallbackInitialService?.name || initialServiceName || "Onco-nurse Consultation"
  );
  const [slotId, setSlotId] = useState(initialService?.slotId || initialSlotId || "");
  const [bookingDate, setBookingDate] = useState(initialService?.bookingDate || initialBookingDate || "");
  const [bookingTime, setBookingTime] = useState(timeInputValue(initialService?.bookingTime || initialBookingTime || "") || initialService?.bookingTime || initialBookingTime || "");
  const [scheduleStatus, setScheduleStatus] = useState(initialService?.scheduleStatus || initialScheduleStatus || "");

  const selectedService = serviceOptions.find((service) => service.id === selectedServiceId);
  const isSelectedEvent = Boolean(slotId || selectedService?.isEvent);
  const selectedPrice = selectedService?.price || 0;

  function updateSelectedService(serviceId: string) {
    setSelectedServiceId(serviceId);
    const nextService = serviceOptions.find((service) => service.id === serviceId);
    if (!nextService) return;

    setServiceName(nextService.name);
    setSlotId(nextService.slotId || "");
    setBookingDate(nextService.bookingDate || "");
    setBookingTime(timeInputValue(nextService.bookingTime || "") || nextService.bookingTime || "");
    setScheduleStatus(nextService.scheduleStatus || "");
  }

  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("Creating your booking...");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId,
          serviceId: selectedServiceId || "onco-nurse-consultation",
          serviceName,
          customer: {
            name: form.get("name"),
            phone: form.get("phone"),
            email: form.get("email"),
          },
          country: form.get("country"),
          pathway: selectedService?.category || (isSelectedEvent ? "Upcoming Event" : "Consultation"),
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
      });

      const result = await response.json().catch(() => ({ error: "Could not read the booking response." }));

      if (response.ok) {
        if (result.checkoutUrl || result.authorizationUrl) {
          setStatus("Booking saved. Redirecting to the secure payment page...");
          window.location.assign(result.checkoutUrl || result.authorizationUrl);
          return;
        }

        if (result.redirectUrl) {
          setStatus("Booking saved. Redirecting to confirmation page...");
          window.location.assign(result.redirectUrl);
          return;
        }

        setStatus(result.demoMode ? "Booking received. Our team will contact you." : `Booking received successfully${result.reference ? ` (${result.reference})` : ""}.`);
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
          Choose the service or event you are interested in, fill in your details,
          and submit your booking.
        </p>
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
        <input type="hidden" name="serviceName" value={serviceName} />

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label">Service or upcoming event</label>
            <select name="serviceId" className="input mt-2" value={selectedServiceId} onChange={(e) => updateSelectedService(e.target.value)} required>
              <option value="onco-nurse-consultation" disabled={serviceOptions.length > 0}>General Onco-nurse consultation</option>
              {serviceOptions.map((service) => (
                <option key={`${service.id}-${service.slotId || "service"}`} value={service.id}>
                  {service.name}{service.priceLabel ? ` — ${service.priceLabel}` : ""}
                </option>
              ))}
            </select>
          </div>

          {isSelectedEvent ? (
            <div className="md:col-span-2 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-900">
              Event date and time are filled automatically.
            </div>
          ) : null}

          <div><label className="label">Full name</label><input name="name" className="input mt-2" autoComplete="name" required /></div>
          <div><label className="label">Phone / WhatsApp</label><input name="phone" className="input mt-2" autoComplete="tel" required /></div>
          <div><label className="label">Email</label><input name="email" type="email" className="input mt-2" autoComplete="email" /></div>
          <div><label className="label">Current country</label><input name="country" className="input mt-2" placeholder="Ghana" autoComplete="country-name" required /></div>

          <div>
            <label className="label">German level</label>
            <select name="germanLevel" className="input mt-2">
              <option>No German yet</option><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option>
            </select>
          </div>

          <div>
            <label className="label">Nursing background</label>
            <select name="nursingBackground" className="input mt-2">
              <option>I am not yet a nurse</option><option>I am a nursing student</option><option>I am a trained nurse</option><option>I work in healthcare</option>
            </select>
          </div>

          <div>
            <label className="label">Preferred date</label>
            {isSelectedEvent ? (
              <><input type="hidden" name="bookingDate" value={bookingDate || "Date to be announced"} /><div className="input mt-2 flex items-center bg-slate-50 text-slate-700">{showDate(bookingDate)}</div></>
            ) : (
              <input name="bookingDate" type="date" className="input mt-2" value={dateInputValue(bookingDate)} onChange={(e) => setBookingDate(e.target.value)} required />
            )}
          </div>

          <div>
            <label className="label">Preferred time</label>
            {isSelectedEvent ? (
              <><input type="hidden" name="bookingTime" value={bookingTime || "Time to be announced"} /><div className="input mt-2 flex items-center bg-slate-50 text-slate-700">{showTime(bookingTime)}</div></>
            ) : (
              <select name="bookingTime" className="input mt-2" value={timeInputValue(bookingTime)} onChange={(e) => setBookingTime(e.target.value)} required>
                <option value="">Select time</option>
                {timeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="label">Message</label>
            <textarea name="notes" className="input mt-2 min-h-32" placeholder="Tell us your background, German level, documents or Germany goal." />
          </div>
        </div>

        {selectedService?.priceLabel && (
          <p className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
            {selectedPrice > 0 ? `Checkout total: ${selectedService.priceLabel}.` : "No online payment is required now. Your interest will be registered for follow-up."}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className="mt-6 w-full rounded-full bg-emerald-700 px-6 py-4 font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400">
          {isSubmitting ? "Creating booking..." : selectedPrice > 0 ? "Book & Pay with Sedifex" : "Register Interest"}
        </button>

        {status && <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{status}</div>}
      </form>
    </section>
  );
}

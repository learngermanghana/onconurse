"use client";

import { useEffect, useState } from "react";

export default function BookPage() {
  const [status, setStatus] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [serviceId, setServiceId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setServiceId(params.get("serviceId") || "");
    setServiceName(params.get("serviceName") || "");
  }, []);

  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    setStatus("Sending...");

    const response = await fetch("/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        serviceId: serviceId || "onco-nurse-consultation",
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
        bookingDate: form.get("bookingDate"),
        bookingTime: form.get("bookingTime"),
        notes: form.get("notes"),
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (response.ok) {
      setStatus(
        result.demoMode
          ? "Demo booking received. Add Sedifex keys to send bookings into Sedifex."
          : "Booking received successfully."
      );
      event.currentTarget.reset();
    } else {
      setStatus(result.error || "Could not submit booking.");
    }
  }

  return (
    <section className="section grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
      <div>
        <span className="badge">Book Consultation</span>

        <h1 className="section-title mt-4">
          Start your Germany pathway with guidance
        </h1>

        <p className="section-subtitle">
          Submit your details and Onco-nurse will follow up. When your Sedifex
          key is added, bookings will go directly into Sedifex.
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

      <form
        onSubmit={submitBooking}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl md:p-8"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label">Service / Interest</label>
            <input
              name="serviceName"
              className="input mt-2"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="Nursing Ausbildung, FSJ, BFD, Au-Pair, Recognition..."
            />
          </div>

          <div>
            <label className="label">Full name</label>
            <input name="name" className="input mt-2" required />
          </div>

          <div>
            <label className="label">Phone / WhatsApp</label>
            <input name="phone" className="input mt-2" required />
          </div>

          <div>
            <label className="label">Email</label>
            <input name="email" type="email" className="input mt-2" />
          </div>

          <div>
            <label className="label">Current country</label>
            <input name="country" className="input mt-2" placeholder="Ghana" />
          </div>

          <div>
            <label className="label">Pathway</label>
            <select name="pathway" className="input mt-2">
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
            <input name="bookingDate" type="date" className="input mt-2" />
          </div>

          <div>
            <label className="label">Preferred time</label>
            <input name="bookingTime" type="time" className="input mt-2" />
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

        <button
          type="submit"
          className="mt-6 w-full rounded-full bg-emerald-700 px-6 py-4 font-black text-white hover:bg-emerald-800"
        >
          Submit Booking
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
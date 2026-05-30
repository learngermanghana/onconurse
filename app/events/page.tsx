import Image from "next/image";
import Link from "next/link";
import { getSedifexEvents } from "../../lib/sedifex";

export default async function EventsPage() {
  const events = await getSedifexEvents();

  return (
    <section className="section">
      <span className="badge">Upcoming Events</span>

      <h1 className="section-title mt-4">Webinars and Info Sessions</h1>

      <p className="section-subtitle">
        Events are pulled from Sedifex when the integration is configured. Local
        fallback events remain available for development and missing Sedifex keys.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {events.map((event) => {
          const href =
            event.ctaHref ||
            `/book?serviceId=${encodeURIComponent(event.id)}&serviceName=${encodeURIComponent(event.title)}`;
          const label = event.ctaLabel || "Register Interest";

          return (
            <article
              key={event.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              {event.imageUrl ? (
                <div className="relative aspect-[16/10] bg-gradient-to-br from-emerald-100 via-white to-amber-100">
                  <Image
                    src={event.imageUrl}
                    alt={event.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <div className="p-7">
                <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
                  {event.category || "Event"}
                </p>

                <h2 className="mt-3 text-2xl font-black text-slate-950">
                  {event.title}
                </h2>

                <p className="mt-3 text-slate-600">
                  {event.description ||
                    "Register your interest and Onco-nurse will share details when the event schedule is confirmed."}
                </p>

                <div className="mt-6 grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p>
                    <strong>Date:</strong> {event.startDate || "Date to be announced"}
                  </p>
                  <p>
                    <strong>Time:</strong> {event.startTime || "Time to be announced"}
                  </p>
                  <p>
                    <strong>Location:</strong>{" "}
                    {event.location || "Online / to be confirmed"}
                  </p>
                </div>

                <Link
                  href={href}
                  className="mt-6 inline-flex rounded-full bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
                >
                  {label}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

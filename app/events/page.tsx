import Image from "next/image";
import Link from "next/link";
import { getSedifexEvents } from "../../lib/sedifex-public";

function formatDisplayDate(value?: string) {
  if (!value) return "Date to be announced";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDisplayTime(start?: string, end?: string) {
  if (!start && !end) return "Time to be announced";
  if (start && end) return `${start} – ${end}`;
  return start || end || "Time to be announced";
}

function availableSlotsText(value?: number) {
  if (typeof value !== "number") return "Slots to be confirmed";
  if (value <= 0) return "Fully booked";
  if (value === 1) return "1 slot available";
  return `${value} slots available`;
}

export default async function EventsPage() {
  const events = await getSedifexEvents();

  return (
    <>
      <section className="hero-grid">
        <div className="section py-20">
          <span className="badge">Onco-nurse Events</span>

          <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
            Upcoming webinars, sessions and availability
          </h1>

          <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
            View Onco-nurse events and available Sedifex booking sessions in a
            clean schedule format.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="badge">Sedifex Schedule</span>
            <h2 className="section-title mt-4">Available Sessions</h2>
            <p className="section-subtitle">
              Dates, times and available slots are pulled from Sedifex when
              available.
            </p>
          </div>

          <Link href="/book" className="btn-secondary">
            Book Consultation
          </Link>
        </div>

        {events.length ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => {
              const href =
                event.ctaHref ||
                `/book?serviceId=${encodeURIComponent(event.serviceId || event.id)}&serviceName=${encodeURIComponent(event.serviceName || event.title)}`;
              const label = event.ctaLabel || "Register Interest";
              const date = formatDisplayDate(event.startDate);
              const time = formatDisplayTime(event.startTime, event.endTime);
              const slots = availableSlotsText(event.availableSlots);
              const isFull = typeof event.availableSlots === "number" && event.availableSlots <= 0;

              return (
                <article
                  key={`${event.id}-${event.startDate || ""}-${event.startTime || ""}`}
                  className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  {event.imageUrl ? (
                    <div className="relative aspect-[16/10] bg-gradient-to-br from-emerald-100 via-white to-amber-100">
                      <Image
                        src={event.imageUrl}
                        alt={event.title}
                        fill
                        sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="p-7">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
                        {event.category || "Event"}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {slots}
                      </span>
                    </div>

                    <h3 className="mt-4 text-2xl font-black text-slate-950">
                      {event.title}
                    </h3>

                    {event.description ? (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                        {event.description}
                      </p>
                    ) : null}

                    <div className="mt-6 grid gap-3 rounded-3xl bg-slate-50 p-5 text-sm text-slate-700">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Date
                        </p>
                        <p className="mt-1 font-bold text-slate-900">{date}</p>
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Time
                        </p>
                        <p className="mt-1 font-bold text-slate-900">{time}</p>
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Location
                        </p>
                        <p className="mt-1 font-bold text-slate-900">
                          {event.location || "Online / to be confirmed"}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={href}
                      className={`mt-6 inline-flex rounded-full px-5 py-3 text-sm font-bold text-white ${
                        isFull
                          ? "pointer-events-none bg-slate-400"
                          : "bg-emerald-700 hover:bg-emerald-800"
                      }`}
                    >
                      {isFull ? "Fully booked" : label}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-10 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="text-2xl font-black text-slate-950">
              No events available yet
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              When events or availability sessions are added in Sedifex, they
              will appear here automatically.
            </p>
            <Link href="/book" className="mt-6 inline-flex btn-primary">
              Book Consultation
            </Link>
          </div>
        )}
      </section>
    </>
  );
}

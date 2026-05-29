import Link from "next/link";

const events = [
  {
    id: "nursing-webinar",
    title: "Free Germany Nursing Webinar",
    category: "Online Event",
    description:
      "Learn about Nursing Ausbildung, recognition, documents and Germany preparation.",
  },
  {
    id: "fsj-bfd-info",
    title: "FSJ / BFD Info Session",
    category: "Online Event",
    description:
      "Understand voluntary service options and how to prepare your application.",
  },
  {
    id: "student-visa-qa",
    title: "Student Visa Q&A",
    category: "Online Event",
    description:
      "Ask questions about visa documents, blocked account and interview preparation.",
  },
];

export default function EventsPage() {
  return (
    <section className="section">
      <span className="badge">Upcoming Events</span>

      <h1 className="section-title mt-4">Webinars and Info Sessions</h1>

      <p className="section-subtitle">
        Events can later be controlled from Sedifex. For now, visitors can
        register interest even when date or time is not confirmed.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {events.map((event) => (
          <article
            key={event.id}
            className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
          >
            <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
              {event.category}
            </p>

            <h2 className="mt-3 text-2xl font-black text-slate-950">
              {event.title}
            </h2>

            <p className="mt-3 text-slate-600">{event.description}</p>

            <div className="mt-6 grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              <p>
                <strong>Date:</strong> Date to be announced
              </p>
              <p>
                <strong>Time:</strong> Time to be announced
              </p>
              <p>
                <strong>Location:</strong> Online / to be confirmed
              </p>
            </div>

            <Link
              href={`/book?serviceId=${encodeURIComponent(event.id)}&serviceName=${encodeURIComponent(event.title)}`}
              className="mt-6 inline-flex rounded-full bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
            >
              Register Interest
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
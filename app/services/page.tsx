import Link from "next/link";
import Image from "next/image";
import {
  formatPrice,
  getSedifexServices,
  serviceHref,
} from "../../lib/sedifex-public";

export default async function ServicesPage() {
  const services = await getSedifexServices();

  return (
    <>
      <section className="hero-grid">
        <div className="section py-20">
          <span className="badge">Onco-nurse Services</span>

          <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
            Germany Nursing Pathway Support for African Nurses
          </h1>

          <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
            Book guidance for Nursing Ausbildung, FSJ, BFD, Au-Pair,
            Recognition, Document Review and Student Visa preparation.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/book" className="btn-primary">
              Book Consultation
            </Link>

            <Link href="/events" className="btn-secondary">
              Upcoming Events
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <span className="badge">Sedifex Services</span>

        <h2 className="section-title mt-4">Onco-nurse Services</h2>

        <p className="section-subtitle">
          Services are Sedifex-ready, so prices and descriptions can later be
          managed from Sedifex.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[16/10] bg-gradient-to-br from-emerald-100 via-white to-amber-100">
                {service.imageUrl ? (
                  <Image
                    src={service.imageUrl}
                    alt={service.imageAlt || service.name}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-2xl font-black text-emerald-800">
                    {service.category || "Germany Pathway"}
                  </div>
                )}
              </div>

              <div className="p-6">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
                  {service.tag || service.category || "Consultation"}
                </span>

                <h3 className="mt-4 text-xl font-black text-slate-950">
                  {service.name}
                </h3>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                  {service.description || "Book a consultation with Onco-nurse."}
                </p>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <span className="font-black text-slate-950">
                    From {formatPrice(service.price)}
                  </span>

                  <Link
                    href={serviceHref(service)}
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                  >
                    View
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

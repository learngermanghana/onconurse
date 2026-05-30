import Link from "next/link";
import Image from "next/image";
import {
  formatPrice,
  getSedifexBlogPosts,
  getSedifexEvents,
  getSedifexHeroSlides,
  getSedifexServices,
  getSedifexSocialSettings,
  serviceHref,
  whatsappLink,
} from "../lib/sedifex";
import { programs, site } from "../lib/site";

export default async function HomePage() {
  const [slides, services, social, posts, events] = await Promise.all([
    getSedifexHeroSlides(),
    getSedifexServices(),
    getSedifexSocialSettings(),
    getSedifexBlogPosts(),
    getSedifexEvents(),
  ]);

  const hero = slides[0];
  const profile = social?.profile;
  const heroImageUrl = hero?.imageUrl || profile?.coverImageUrl || "";

  const whatsapp = whatsappLink(
    profile?.whatsappNumber || site.whatsapp,
    "Hello Onco-nurse, I want guidance for Germany nursing pathway."
  );

  return (
    <>
      <section className="hero-grid overflow-hidden">
        <div className="section grid min-h-[720px] items-center gap-12 md:grid-cols-2">
          <div>
            <span className="badge">
              🇩🇪 🇬🇭 Oncology Nurse • Germany Pathway
            </span>

            <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              {hero?.title || "Helping African Nurses Start Their Germany Journey"}
            </h1>

            <p className="mt-6 max-w-2xl text-xl leading-9 text-slate-700">
              {hero?.subtitle ||
                profile?.tagline ||
                "We help African nurses and applicants navigate Nursing Ausbildung, FSJ, BFD, Au-Pair, Recognition and Student Visa pathways in Germany."}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/book" className="btn-primary">
                Book Consultation
              </Link>

              <a
                href={site.mailingListUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                Join our mailing list
              </a>

              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                Chat on WhatsApp
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["Ausbildung", "Nursing training"],
                ["FSJ / BFD", "Volunteer route"],
                ["Recognition", "For trained nurses"],
              ].map(([title, text]) => (
                <div
                  key={title}
                  className="rounded-3xl border border-white bg-white/80 p-5 shadow-sm backdrop-blur"
                >
                  <p className="text-sm font-black text-slate-950">{title}</p>
                  <p className="mt-1 text-xs text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-emerald-300/40 blur-3xl" />
            <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-amber-300/40 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2.5rem] border-8 border-white bg-slate-200 shadow-2xl">
              {heroImageUrl ? (
                <Image
                  src={heroImageUrl}
                  alt="Onco-nurse Germany nursing guidance"
                  width={900}
                  height={1080}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  priority
                  className="h-[540px] w-full object-cover"
                />
              ) : (
                <div className="flex h-[540px] flex-col items-center justify-center bg-gradient-to-br from-emerald-700 via-emerald-900 to-slate-950 p-10 text-center text-white">
                  <div className="text-7xl">🩺</div>
                  <p className="mt-6 text-4xl font-black">Onco-nurse</p>
                  <p className="mt-3 text-lg font-bold text-emerald-100">
                    Germany Nursing Pathway
                  </p>
                  <p className="mt-2 text-sm text-emerald-100">
                    🇩🇪 Germany • 🇬🇭 Ghana • Africa
                  </p>
                </div>
              )}
            </div>

            <div className="absolute -bottom-6 -left-6 rounded-3xl bg-white p-6 shadow-xl">
              <p className="text-sm font-bold text-slate-500">Special focus</p>
              <p className="mt-1 text-2xl font-black text-emerald-700">
                Oncology 🩺
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="badge">Blog Highlights</span>
            <h2 className="section-title mt-4">Latest Germany pathway guides</h2>
            <p className="section-subtitle">
              Helpful articles from Onco-nurse. When Sedifex blog or promo
              content is connected, this section will update from Sedifex.
            </p>
          </div>

          <Link href="/blog" className="btn-secondary">
            View all posts
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[16/10] bg-gradient-to-br from-emerald-100 via-white to-amber-100">
                {post.imageUrl ? (
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-2xl font-black text-emerald-800">
                    {post.category || "Germany Guide"}
                  </div>
                )}
              </div>

              <div className="p-6">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
                  {post.category || "Blog"}
                </span>

                <h3 className="mt-4 text-xl font-black text-slate-950">
                  {post.title}
                </h3>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                  {post.excerpt}
                </p>

                <p className="mt-6 text-sm font-black text-emerald-700">
                  Read article →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section bg-white">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="badge">Upcoming Events</span>
            <h2 className="section-title mt-4">Webinars and info sessions</h2>
            <p className="section-subtitle">
              Upcoming events are pulled from Sedifex when available, with local
              fallback content for development.
            </p>
          </div>

          <Link href="/events" className="btn-secondary">
            View all events
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {events.slice(0, 3).map((event) => (
            <article
              key={event.id}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-7 transition hover:-translate-y-1 hover:bg-white hover:shadow-xl"
            >
              <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
                {event.category || "Event"}
              </p>

              <h3 className="mt-3 text-2xl font-black text-slate-950">
                {event.title}
              </h3>

              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                {event.description ||
                  "Register interest and we will share the confirmed event details."}
              </p>

              <div className="mt-6 grid gap-1 text-sm text-slate-700">
                <p>
                  <strong>Date:</strong> {event.startDate || "Date to be announced"}
                </p>
                <p>
                  <strong>Location:</strong>{" "}
                  {event.location || "Online / to be confirmed"}
                </p>
              </div>

              <Link
                href={
                  event.ctaHref ||
                  `/book?serviceId=${encodeURIComponent(event.id)}&serviceName=${encodeURIComponent(event.title)}`
                }
                className="mt-6 inline-flex rounded-full bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
              >
                {event.ctaLabel || "Register Interest"}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <span className="badge">Services from Sedifex</span>

        <div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h2 className="section-title">How we can help</h2>
            <p className="section-subtitle">
              Services, prices and descriptions can be managed directly from
              Sedifex without editing the website code.
            </p>
          </div>

          <Link href="/services" className="btn-secondary">
            View all services
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {services.slice(0, 3).map((service) => (
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

      <section className="bg-white">
        <div className="section">
          <span className="badge">Pathways</span>

          <h2 className="section-title mt-4">
            Germany pathways we explain clearly
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {programs.map((program) => (
              <Link
                key={program.slug}
                href={`/programs/${program.slug}`}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-7 transition hover:-translate-y-1 hover:border-emerald-600 hover:bg-white hover:shadow-xl"
              >
                <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
                  {program.eyebrow}
                </p>

                <h3 className="mt-3 text-2xl font-black text-slate-950">
                  {program.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {program.summary}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

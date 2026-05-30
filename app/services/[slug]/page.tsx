import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatPrice,
  getSedifexServices,
  getServiceSlug,
  slugify,
  whatsappLink,
} from "../../../lib/sedifex";
import { site } from "../../../lib/site";

export default async function SingleServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const services = await getSedifexServices();
  const service = services.find(
    (item) =>
      getServiceSlug(item) === slug ||
      item.id === slug ||
      slugify(item.name) === slug
  );

  if (!service) notFound();

  const whatsapp = whatsappLink(
    site.whatsapp,
    `Hello Onco-nurse, I want to ask about ${service.name}.`
  );

  return (
    <section className="section grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
      <div>
        <span className="badge">{service.tag || service.category || "Consultation"}</span>

        <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
          {service.name}
        </h1>

        <p className="mt-6 text-lg leading-9 text-slate-700">
          {service.description || "Book this Onco-nurse service."}
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            "Personal pathway guidance",
            "Document preparation advice",
            "Next-step action plan",
            "WhatsApp follow-up support",
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="font-black text-slate-950">{item}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href={`/book?serviceId=${encodeURIComponent(service.id)}&serviceName=${encodeURIComponent(service.name)}`}
            className="btn-primary"
          >
            Book this service
          </Link>

          <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-secondary">
            Ask on WhatsApp
          </a>
        </div>
      </div>

      <div className="rounded-[2rem] bg-white p-8 shadow-xl">
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-800">
          Price
        </p>
        <p className="mt-2 text-4xl font-black text-slate-950">
          From {formatPrice(service.price)}
        </p>

        <div className="mt-8 rounded-3xl bg-emerald-50 p-6">
          <p className="font-black text-emerald-900">Good for</p>
          <p className="mt-3 leading-7 text-emerald-900">
            Applicants who need clarity before applying, paying fees, booking
            embassy appointments, or submitting documents.
          </p>
        </div>
      </div>
    </section>
  );
}
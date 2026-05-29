import Link from "next/link";
import type { SedifexService } from "../lib/sedifex";
import { formatPrice, slugify } from "../lib/sedifex";

export default function ServiceCard({ service }: { service: SedifexService }) {
  const href = `/services/${slugify(service.name)}`;

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="aspect-[16/10] bg-gradient-to-br from-emerald-100 via-white to-amber-100">
        {service.imageUrl ? (
          <img
            src={service.imageUrl}
            alt={service.imageAlt || service.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-2xl font-black text-emerald-800">
            {service.category || "Germany Pathway"}
          </div>
        )}
      </div>

      <div className="p-6">
        <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
          {service.category || "Consultation"}
        </p>

        <h3 className="mt-3 text-xl font-black text-slate-950">
          {service.name}
        </h3>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
          {service.description || "Book a consultation with Onco-nurse."}
        </p>

        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="font-black text-slate-950">
            {formatPrice(service.price)}
          </span>

          <Link
            href={href}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}

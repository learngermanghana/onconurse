import Link from "next/link";
import { programs } from "../../lib/site";

export default function ProgramsPage() {
  return (
    <section className="section">
      <span className="badge">Germany Pathways</span>

      <h1 className="section-title mt-4">Programs we guide you through</h1>

      <p className="section-subtitle">
        Clear guidance for nurses and applicants who want to understand Germany
        Ausbildung, FSJ, BFD, Au-Pair, Recognition and Student Visa routes.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {programs.map((program) => (
          <Link
            key={program.slug}
            href={`/programs/${program.slug}`}
            className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-emerald-600 hover:shadow-xl"
          >
            <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
              {program.eyebrow}
            </p>

            <h2 className="mt-3 text-2xl font-black text-slate-950">
              {program.title}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {program.summary}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
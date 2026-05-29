import Link from "next/link";
import { notFound } from "next/navigation";
import { programs } from "../../../lib/site";

export default async function ProgramDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = programs.find((item) => item.slug === slug);

  if (!program) notFound();

  return (
    <section className="section">
      <span className="badge">{program.eyebrow}</span>

      <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
        {program.title}
      </h1>

      <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
        {program.summary}
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">
            What we explain
          </h2>

          <ul className="mt-6 space-y-4 text-slate-700">
            {program.points.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-1 h-5 w-5 rounded-full bg-emerald-100 text-center text-xs font-black text-emerald-700">
                  ✓
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl bg-slate-950 p-8 text-white">
          <h2 className="text-2xl font-black">Need personal guidance?</h2>

          <p className="mt-4 leading-7 text-slate-300">
            Book a consultation so we can understand your background, German
            level, documents and best pathway.
          </p>

          <Link href="/book" className="mt-8 inline-flex btn-primary">
            Book Consultation
          </Link>
        </div>
      </div>
    </section>
  );
}
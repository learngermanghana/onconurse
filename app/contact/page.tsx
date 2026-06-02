import Link from "next/link";
import { whatsappLink } from "../../lib/sedifex";
import { site } from "../../lib/site";

export default function ContactPage() {
  const phone = site.phone;
  const whatsappNumber = site.whatsapp;
  const email = site.email;

  return (
    <section className="section">
      <span className="badge">Contact</span>

      <h1 className="section-title mt-4">Talk to Onco-nurse</h1>

      <p className="section-subtitle">
        Ask about Nursing Ausbildung, FSJ, BFD, Au-Pair, Recognition or Student
        Visa guidance.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <a
          href={whatsappLink(whatsappNumber)}
          target="_blank"
          rel="noreferrer"
          className="rounded-3xl bg-emerald-700 p-7 text-white shadow-sm"
        >
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-100">
            WhatsApp
          </p>
          <p className="mt-3 text-2xl font-black">Chat now</p>
          <p className="mt-3 text-emerald-50">{whatsappNumber}</p>
        </a>

        <div className="rounded-3xl bg-white p-7 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Phone
          </p>
          <p className="mt-3 text-2xl font-black text-slate-950">{phone}</p>
        </div>

        <div className="rounded-3xl bg-white p-7 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Email
          </p>
          <p className="mt-3 break-words text-2xl font-black text-slate-950">
            {email}
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-3xl bg-slate-950 p-8 text-white">
        <h2 className="text-2xl font-black">Ready to start?</h2>
        <p className="mt-3 text-slate-300">
          Book a consultation and your request will be saved in Sedifex when
          integration keys are added.
        </p>

        <Link href="/book" className="mt-6 inline-flex btn-primary">
          Book Consultation
        </Link>
      </div>
    </section>
  );
}
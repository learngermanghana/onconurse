import type { Metadata } from "next";
import Link from "next/link";
import { site } from "../../lib/site";

export const metadata: Metadata = {
  title: "FAQ | Onco-nurse",
  description:
    "Common questions about Onco-nurse Germany pathway guidance, pricing in Ghana cedis and approximate euro equivalents.",
};

const faqs = [
  {
    question: "What does Onco-nurse help with?",
    answer:
      "We provide guidance for applicants exploring Germany pathways such as Nursing Ausbildung, FSJ, BFD, Au-Pair, nursing recognition, student visa readiness and document review.",
  },
  {
    question: "Are the prices in Ghana cedis or euros?",
    answer: `Service prices are charged in Ghana cedis (GHS). Euro amounts are shown as approximate guidance using about GHS ${site.ghsPerEuro} to €1, so the euro figure may change with the exchange rate or payment provider fees.`,
  },
  {
    question: "Do I have to be a trained nurse before booking?",
    answer:
      "No. Some services are for trained nurses, but we also support nursing students, beginners and applicants exploring FSJ, BFD, Au-Pair or Ausbildung routes.",
  },
  {
    question: "Does a consultation guarantee a visa, job or school admission?",
    answer:
      "No. Consultations provide guidance, document preparation advice and next-step planning. Final decisions are made by schools, employers, agencies, embassies and German authorities.",
  },
  {
    question: "How do I book a consultation?",
    answer:
      "Choose a service, complete the booking form and share your contact details. We will follow up by phone, WhatsApp or email with the next steps.",
  },
  {
    question: "Can I ask questions before paying?",
    answer:
      "Yes. You can contact us by WhatsApp or email if you are unsure which service fits your situation before you book.",
  },
];

export default function FaqPage() {
  return (
    <>
      <section className="hero-grid">
        <div className="section py-20">
          <span className="badge">FAQ</span>
          <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
            Common questions about your Germany pathway
          </h1>
          <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
            Clear answers about services, booking, contact options and prices in
            Ghana cedis with approximate euro guidance.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="grid gap-5">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-3xl bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">{faq.question}</h2>
              <p className="mt-4 text-lg leading-8 text-slate-700">{faq.answer}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-3xl bg-emerald-700 p-8 text-white shadow-sm">
          <h2 className="text-3xl font-black">Still have a question?</h2>
          <p className="mt-3 text-emerald-50">
            Contact Onco-nurse and we will help you choose the right next step.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/contact" className="btn-secondary bg-white text-slate-950 hover:bg-emerald-50">
              Contact us
            </Link>
            <Link href="/book" className="rounded-full bg-slate-950 px-6 py-3 font-bold text-white hover:bg-slate-800">
              Book Consultation
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

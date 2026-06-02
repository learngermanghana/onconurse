import type { Metadata } from "next";
import Link from "next/link";
import { site } from "../../lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy | Onco-nurse",
  description:
    "How Onco-nurse collects, uses and protects personal information for Germany nursing pathway guidance, bookings and follow-up.",
};

const lastUpdated = "June 2, 2026";

const privacySections = [
  {
    title: "Information we collect",
    body: [
      "When you use this site, book a consultation, join a mailing list or contact Onco-nurse, we may collect details such as your name, email address, phone or WhatsApp number, selected service, preferred appointment details, payment or checkout references, notes you submit and messages you send to us.",
      "We may also receive basic technical information such as device, browser, page and usage information that helps us operate and protect the website.",
    ],
  },
  {
    title: "How we use your information",
    body: [
      "We use your information to respond to enquiries, arrange consultations, process bookings, confirm payments, provide Germany nursing pathway guidance, send service updates and improve our website and services.",
      "We do not sell your personal information. We only use it for legitimate Onco-nurse service, support, administration, safety and legal purposes.",
    ],
  },
  {
    title: "Bookings, payments and service providers",
    body: [
      "Bookings, checkout flows, customer lists or mailing list forms may be powered by Sedifex or other trusted service providers. These providers may process the information needed to complete your booking, payment, communication or request.",
      "Payment information is handled through the checkout or payment provider shown during the transaction. Onco-nurse does not ask you to send full payment card details through public contact forms.",
    ],
  },
  {
    title: "Communication",
    body: [
      "We may contact you by email, phone, WhatsApp or another channel you provide so we can answer your questions, confirm bookings, share next steps or send updates related to your requested service.",
      "You can ask us to stop non-essential messages, but we may still send important service or booking messages when needed.",
    ],
  },
  {
    title: "Retention and protection",
    body: [
      "We keep personal information only for as long as reasonably needed for the purposes described in this policy, including service delivery, record keeping, dispute handling, security and legal obligations.",
      "We use reasonable organisational and technical safeguards to protect personal information, but no website, email, messaging app or online storage system can be guaranteed to be completely secure.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You may contact us to request access, correction, deletion or restriction of personal information that Onco-nurse controls, subject to identity checks and any legal or operational limits that apply.",
      "If you believe information we hold about you is inaccurate, please contact us with the correct details so we can review and update it.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="hero-grid">
        <div className="section py-20">
          <span className="badge">Privacy Policy</span>
          <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
            How we handle your personal information
          </h1>
          <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
            This policy explains how {site.name} collects and uses information
            when you browse the site, contact us or book Germany nursing pathway
            guidance.
          </p>
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-emerald-800">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="rounded-[2rem] bg-white p-8 shadow-sm md:p-10">
          <p className="text-lg leading-9 text-slate-700">
            This page is provided for transparency and general information. It is
            not legal advice. If you have specific privacy questions about your
            situation, please contact us or seek independent advice.
          </p>
        </div>

        <div className="mt-8 grid gap-5">
          {privacySections.map((section) => (
            <article key={section.title} className="rounded-3xl bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">
                {section.title}
              </h2>
              <div className="mt-4 grid gap-4 text-lg leading-8 text-slate-700">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
          <h2 className="text-3xl font-black">Contact us about privacy</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-300">
            For privacy questions or requests, contact {site.name} using the
            contact details on this website. Please do not send sensitive
            documents until we confirm the best channel for your request.
          </p>
          <Link href="/contact" className="mt-6 inline-flex btn-primary">
            Contact Onco-nurse
          </Link>
        </div>
      </section>
    </>
  );
}

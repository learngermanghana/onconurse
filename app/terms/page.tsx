import type { Metadata } from "next";
import Link from "next/link";
import { site } from "../../lib/site";

export const metadata: Metadata = {
  title: "Terms of Service | Onco-nurse",
  description:
    "Terms for using Onco-nurse services, booking consultations and accessing Germany nursing pathway guidance.",
};

const lastUpdated = "June 2, 2026";

const termsSections = [
  {
    title: "Using this website",
    body: [
      "By using this website, contacting Onco-nurse or booking a service, you agree to use the website lawfully, provide accurate information and avoid actions that disrupt or misuse the site, booking forms or payment flows.",
      "We may update website content, services, prices, availability and these terms from time to time. The version shown on this page applies from the last updated date above.",
    ],
  },
  {
    title: "Guidance services",
    body: [
      "Onco-nurse provides educational and pathway guidance for people exploring Germany opportunities such as Nursing Ausbildung, FSJ, BFD, Au-Pair, nursing recognition, student visa readiness and related preparation steps.",
      "Our services are guidance and support only. We do not guarantee school admission, job placement, visa approval, recognition approval, embassy decisions, agency decisions or any specific outcome.",
    ],
  },
  {
    title: "No legal, immigration or financial advice",
    body: [
      "Information on this website and in consultations is provided for general preparation and decision-making support. It should not be treated as legal, immigration, financial, medical or official government advice.",
      "You are responsible for checking official requirements with the relevant embassy, school, employer, agency, authority or qualified professional before submitting applications, paying third parties or making travel decisions.",
    ],
  },
  {
    title: "Bookings and payments",
    body: [
      "Bookings may be submitted through Sedifex-powered forms or checkout pages. You must provide accurate contact details so we can confirm your booking and follow up with next steps.",
      "Prices, currencies, payment methods and checkout instructions are shown on the website or during booking. A booking is confirmed only after the required booking information and any required payment are received or verified.",
    ],
  },
  {
    title: "Cancellations, rescheduling and refunds",
    body: [
      "If you need to cancel or reschedule, contact us as soon as possible using the contact details on this website. We will review requests based on the service booked, timing, preparation already completed and payment provider rules.",
      "Refunds are not automatic unless required by applicable law or expressly confirmed by Onco-nurse in writing. Missed appointments, inaccurate contact details or late cancellation requests may limit refund or rescheduling options.",
    ],
  },
  {
    title: "Applicant responsibility",
    body: [
      "You are responsible for the accuracy of documents, personal information and application materials you submit to schools, employers, embassies, agencies or authorities.",
      "You should never submit false documents or misleading information. If you are unsure about a requirement, ask the relevant official authority or a qualified professional before proceeding.",
    ],
  },
  {
    title: "Website content and intellectual property",
    body: [
      "The text, structure, branding, graphics and other content on this website belong to Onco-nurse or are used with permission unless otherwise stated.",
      "You may use the site for personal information and service booking, but you may not copy, resell, republish or misuse our content without permission.",
    ],
  },
  {
    title: "Limitation of liability",
    body: [
      "We work to provide helpful, practical and up-to-date guidance, but requirements and third-party decisions can change. To the extent permitted by law, Onco-nurse is not responsible for losses caused by third-party decisions, changed requirements, missed deadlines, inaccurate information provided by you or actions taken without official verification.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <section className="hero-grid">
        <div className="section py-20">
          <span className="badge">Terms of Service</span>
          <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
            Terms for using Onco-nurse services
          </h1>
          <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
            These terms explain the rules for using this website, booking
            services and receiving {site.name} Germany nursing pathway guidance.
          </p>
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-emerald-800">
            Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="rounded-[2rem] bg-white p-8 shadow-sm md:p-10">
          <p className="text-lg leading-9 text-slate-700">
            Please read these terms before booking or using our services. If you
            do not agree with these terms, do not use the website or book a
            service. These terms are provided for transparency and are not legal
            advice.
          </p>
        </div>

        <div className="mt-8 grid gap-5">
          {termsSections.map((section) => (
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

        <div className="mt-10 rounded-3xl bg-emerald-700 p-8 text-white shadow-sm">
          <h2 className="text-3xl font-black">Questions before booking?</h2>
          <p className="mt-3 max-w-3xl leading-7 text-emerald-50">
            Contact Onco-nurse if you need help understanding a service before
            booking. We can help you choose the next step that fits your
            situation.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/contact" className="btn-secondary bg-white text-slate-950 hover:bg-emerald-50">
              Contact us
            </Link>
            <Link href="/privacy" className="rounded-full bg-slate-950 px-6 py-3 font-bold text-white hover:bg-slate-800">
              Privacy Policy
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

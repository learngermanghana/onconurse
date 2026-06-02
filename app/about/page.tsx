import Link from "next/link";
import {
  getSedifexSocialSettings,
  normalizeSedifexPhoneNumber,
  whatsappLink,
} from "../../lib/sedifex";
import { site } from "../../lib/site";

export default async function AboutPage() {
  const social = await getSedifexSocialSettings();
  const profile = social?.profile;
  const phone = normalizeSedifexPhoneNumber(profile?.publicPhone);
  const whatsappNumber =
    normalizeSedifexPhoneNumber(profile?.whatsappNumber) || site.whatsapp;
  const email = profile?.publicEmail || site.email;
  const address = profile?.addressLine1 || site.address;
  const tiktok = profile?.tiktokHandle || site.tiktok;
  const aboutText =
    profile?.businessDescription ||
    "Onco-nurse helps African nurses and applicants understand Germany opportunities including Nursing Ausbildung, FSJ, BFD, Au-Pair, Recognition and Student Visa pathways. The goal is to make the process clear, realistic and well organised before applicants spend money or submit documents.";

  const contactCards = [
    {
      label: "Email",
      value: email,
      href: `mailto:${email}`,
      accent: "bg-white text-slate-950",
    },
    phone && {
      label: "Phone",
      value: phone,
      href: `tel:${phone.replace(/\s/g, "")}`,
      accent: "bg-white text-slate-950",
    },
    {
      label: "WhatsApp",
      value: whatsappNumber,
      href: whatsappLink(
        whatsappNumber,
        "Hello Onco-nurse, I want guidance for Germany nursing pathway."
      ),
      accent: "bg-emerald-700 text-white",
    },
    {
      label: "Address",
      value: address,
      href: undefined,
      accent: "bg-white text-slate-950",
    },
    {
      label: "TikTok",
      value: tiktok,
      href: social?.socialLinks?.tiktok,
      accent: "bg-white text-slate-950",
    },
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    href?: string;
    accent: string;
  }>;

  const pathwayHighlights = [
    {
      title: "Nursing Ausbildung",
      text: "Understand the route, language expectations, documents and realistic timelines before you apply.",
    },
    {
      title: "FSJ, BFD & Au-Pair",
      text: "Compare entry routes and prepare stronger applications for German volunteer and cultural exchange options.",
    },
    {
      title: "Recognition & visa readiness",
      text: "Review qualification recognition steps, document quality and interview preparation with clearer next actions.",
    },
  ];

  const values = [
    "Nursing-informed guidance",
    "Clear document checklists",
    "African applicant support",
    "Germany pathway planning",
  ];

  return (
    <>
      <section className="hero-grid overflow-hidden">
        <div className="section grid gap-10 py-16 md:grid-cols-[0.95fr_1.05fr] md:py-20">
          <div>
            <span className="badge">About Onco-nurse</span>

            <h1 className="section-title mt-4">
              Practical Germany pathway guidance rooted in nursing experience
            </h1>

            <p className="section-subtitle">
              Onco-nurse supports nurses and motivated applicants who want a
              clearer, safer and better organised path toward Germany.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/book" className="btn-primary">
                Book Consultation
              </Link>
              <a
                href={whatsappLink(whatsappNumber)}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/90 p-7 shadow-xl backdrop-blur md:p-9">
            <p className="text-lg leading-9 text-slate-700">{aboutText}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {values.map((item) => (
                <div key={item} className="rounded-2xl bg-emerald-50 p-5">
                  <p className="font-black text-emerald-800">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="grid gap-6 md:grid-cols-3">
          {pathwayHighlights.map((item) => (
            <article key={item.title} className="rounded-3xl bg-white p-7 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">
                Pathway support
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                {item.title}
              </h2>
              <p className="mt-4 leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section pt-0">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white md:p-10">
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-start">
            <div>
              <span className="badge border-emerald-400 bg-emerald-500/10 text-emerald-100">
                Contact
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                Ready to discuss your Germany plan?
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                Send a message with your current stage, preferred pathway and
                documents you already have, and Onco-nurse will guide you on the
                next practical step.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {contactCards.map((card) => {
                const content = (
                  <>
                    <p
                      className={`text-xs font-black uppercase tracking-widest ${
                        card.accent.includes("text-white")
                          ? "text-emerald-100"
                          : "text-slate-500"
                      }`}
                    >
                      {card.label}
                    </p>
                    <p className="mt-3 break-words text-xl font-black">
                      {card.value}
                    </p>
                  </>
                );

                return card.href ? (
                  <a
                    key={card.label}
                    href={card.href}
                    target={card.href.startsWith("http") ? "_blank" : undefined}
                    rel={card.href.startsWith("http") ? "noreferrer" : undefined}
                    className={`rounded-3xl p-6 shadow-sm ${card.accent}`}
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    key={card.label}
                    className={`rounded-3xl p-6 shadow-sm ${card.accent}`}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

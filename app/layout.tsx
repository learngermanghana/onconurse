import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "../lib/site";
import {
  getSedifexSocialSettings,
  type SedifexSocialSettings,
  normalizeSedifexPhoneNumber,
  whatsappLink,
} from "../lib/sedifex";
import "./globals.css";

export const metadata: Metadata = {
  title: "Onco-nurse | Germany Nursing Pathway Guidance",
  description:
    "Helping African nurses navigate Nursing Ausbildung in Germany, FSJ, BFD, Au-Pair, Recognition and Student Visa support.",
};

function Header({ social }: { social: SedifexSocialSettings | null }) {
  const profile = social?.profile;
  const brandName = profile?.displayName || site.name;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="flex items-center gap-3">
          {profile?.logoUrl ? (
            <Image
              src={profile.logoUrl}
              alt={`${brandName} logo`}
              width={44}
              height={44}
              className="h-11 w-11 rounded-2xl object-cover"
            />
          ) : (
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-700 text-lg font-black text-white">
              ON
            </div>
          )}

          <div>
            <p className="text-lg font-black tracking-tight text-slate-950">
              {brandName}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {profile?.tagline || "🇩🇪 🇬🇭 Oncology • Germany Nursing"}
            </p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-700 md:gap-6">
          <Link href="/">Home</Link>
          <Link href="/services">Services</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/events">Upcoming Events</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={site.mailingListUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-emerald-700 px-5 py-3 text-sm font-bold text-emerald-700 shadow-sm hover:bg-emerald-50"
          >
            Join Mailing List
          </a>

          <Link
            href="/book"
            className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-800"
          >
            Book Consultation
          </Link>
        </div>
      </div>
    </header>
  );
}

function Footer({ social }: { social: SedifexSocialSettings | null }) {
  const profile = social?.profile;
  const socialLinks = social?.socialLinks || {};
  const phone = normalizeSedifexPhoneNumber(profile?.publicPhone) || site.phone;
  const whatsapp =
    normalizeSedifexPhoneNumber(profile?.whatsappNumber) || site.whatsapp;
  const contactLines = [
    { label: "Email", value: profile?.publicEmail || site.email },
    { label: "Phone", value: phone },
    { label: "WhatsApp", value: whatsapp },
    { label: "Address", value: profile?.addressLine1 || site.address },
    { label: "TikTok", value: site.tiktok },
  ].filter(({ value }) => value);
  const renderedSocialLinks = Object.entries(socialLinks).flatMap(([key, href]) =>
    href ? [{ key, href }] : []
  );

  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-2xl font-black">{profile?.displayName || site.name}</p>
          <p className="mt-3 max-w-xl text-slate-300">
            {profile?.businessDescription ||
              "Helping African nurses navigate Nursing Ausbildung, FSJ, BFD, Au-Pair, Recognition and Student Visa pathways in Germany."}
          </p>
          {profile?.openingHours && (
            <p className="mt-4 text-sm font-semibold text-emerald-100">
              {profile.openingHours}
            </p>
          )}
        </div>

        <div>
          <p className="font-bold">Pages</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-300">
            <Link href="/services">Services</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/events">Upcoming Events</Link>
            <Link href="/faq">FAQ</Link>
            <a href={site.mailingListUrl} target="_blank" rel="noreferrer">
              Join Mailing List
            </a>
            <Link href="/book">Book Consultation</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>

        <div>
          <p className="font-bold">Contact</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-300">
            {contactLines.map(({ label, value }) => (
              <span key={label}>
                <strong className="text-white">{label}:</strong> {value}
              </span>
            ))}
            {renderedSocialLinks.map(({ key, href }) => (
              <a key={key} href={href} target="_blank" rel="noreferrer">
                {key[0].toUpperCase() + key.slice(1)}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FloatingWhatsApp({ social }: { social: SedifexSocialSettings | null }) {
  const message =
    "Hello Onco-nurse, I want guidance for Germany nursing pathway.";
  const whatsappNumber =
    normalizeSedifexPhoneNumber(social?.profile?.whatsappNumber) || site.whatsapp;

  return (
    <a
      href={whatsappLink(whatsappNumber, message)}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 rounded-full bg-emerald-700 px-5 py-4 text-sm font-black text-white shadow-2xl hover:bg-emerald-800"
    >
      WhatsApp
    </a>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const social = await getSedifexSocialSettings();

  return (
    <html lang="en">
      <body>
        <Header social={social} />
        <main>{children}</main>
        <Footer social={social} />
        <FloatingWhatsApp social={social} />
      </body>
    </html>
  );
}

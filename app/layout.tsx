import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Onco-nurse | Germany Nursing Pathway Guidance",
  description:
    "Helping African nurses navigate Nursing Ausbildung in Germany, FSJ, BFD, Au-Pair, Recognition and Student Visa support.",
};

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-700 text-lg font-black text-white">
            ON
          </div>

          <div>
            <p className="text-lg font-black tracking-tight text-slate-950">
              Onco-nurse
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              🇩🇪 🇬🇭 Oncology • Germany Nursing
            </p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-700 md:gap-6">
          <Link href="/">Home</Link>
          <Link href="/services">Services</Link>
          <Link href="/programs">Programs</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/events">Events</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>

        <Link
          href="/book"
          className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-800"
        >
          Book Consultation
        </Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-2xl font-black">Onco-nurse</p>
          <p className="mt-3 max-w-xl text-slate-300">
            Helping African nurses navigate Nursing Ausbildung, FSJ, BFD,
            Au-Pair, Recognition and Student Visa pathways in Germany.
          </p>
        </div>

        <div>
          <p className="font-bold">Pages</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-300">
            <Link href="/services">Services</Link>
            <Link href="/programs">Programs</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/events">Events</Link>
            <Link href="/book">Book Consultation</Link>
          </div>
        </div>

        <div>
          <p className="font-bold">Contact</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-300">
            <span>hello@onconurse.com</span>
            <span>+233000000000</span>
            <span>@onco_nurse</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FloatingWhatsApp() {
  const message = encodeURIComponent(
    "Hello Onco-nurse, I want guidance for Germany nursing pathway."
  );

  return (
    <a
      href={`https://wa.me/233000000000?text=${message}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 rounded-full bg-emerald-700 px-5 py-4 text-sm font-black text-white shadow-2xl hover:bg-emerald-800"
    >
      WhatsApp
    </a>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
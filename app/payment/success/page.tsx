import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <main className="section mx-auto max-w-4xl text-center">
      <span className="badge">Booking received</span>

      <h1 className="section-title mt-4">
        Thank you. Your Germany pathway booking has been received.
      </h1>

      <p className="section-subtitle mx-auto mt-4">
        Your booking and payment details have been received successfully. A
        confirmation has been sent to your email if you provided one. Our team
        will review your booking and follow up with you soon.
      </p>

      <div className="mt-10 grid gap-5 text-left md:grid-cols-3">
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
            Step 1
          </p>
          <h2 className="mt-3 text-xl font-black text-slate-950">
            Booking received
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your selected service or event, contact details, date and time have
            been submitted to Onco-nurse.
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
            Step 2
          </p>
          <h2 className="mt-3 text-xl font-black text-slate-950">
            Email confirmation
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            A booking confirmation is sent to your email when an email address is
            provided. Please also check your spam or promotions folder.
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
            Step 3
          </p>
          <h2 className="mt-3 text-xl font-black text-slate-950">
            Prepare for follow-up
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Our team will contact you through phone, WhatsApp or email. Please
            prepare your questions and any relevant documents for the discussion.
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-[2rem] bg-slate-950 p-8 text-left text-white">
        <h2 className="text-2xl font-black">Please do not submit again</h2>
        <p className="mt-3 leading-7 text-slate-300">
          If your payment has gone through, avoid creating another booking. Our
          team will use the details you submitted to confirm the next steps.
        </p>
        <p className="mt-5 text-sm font-bold text-emerald-200">
          Powered by Sedifex
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/" className="btn-secondary">
          Back Home
        </Link>
        <Link href="/contact" className="btn-primary">
          Contact Onco-nurse
        </Link>
      </div>
    </main>
  );
}

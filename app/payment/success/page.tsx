import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <main className="section mx-auto max-w-4xl text-center">
      <span className="badge">Booking submitted</span>

      <h1 className="section-title mt-4">
        Thank you. Your Germany pathway booking is being processed.
      </h1>

      <p className="section-subtitle mx-auto mt-4">
        Your Sedifex checkout return has been received. Sedifex will verify the
        payment and keep it connected to the same booking record before final
        confirmation.
      </p>

      <div className="mt-10 grid gap-5 text-left md:grid-cols-3">
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
            Step 1
          </p>
          <h2 className="mt-3 text-xl font-black text-slate-950">
            Payment verification
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Sedifex confirms the payment by webhook or order verification before
            the booking is marked as paid.
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
            Step 2
          </p>
          <h2 className="mt-3 text-xl font-black text-slate-950">
            Booking confirmation
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Onco-nurse reviews the selected service, preferred date and preferred
            time connected to your Sedifex booking.
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
            Step 3
          </p>
          <h2 className="mt-3 text-xl font-black text-slate-950">
            Team follow-up
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Our team will contact you through the phone, WhatsApp or email you
            submitted in the booking form.
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-[2rem] bg-slate-950 p-8 text-left text-white">
        <h2 className="text-2xl font-black">Please do not book again</h2>
        <p className="mt-3 leading-7 text-slate-300">
          If money has been deducted, wait for Sedifex and Onco-nurse to finish
          verification. Submitting another booking may create duplicate records.
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

export default function PaymentReturnPage() {
  return (
    <main className="section mx-auto max-w-3xl text-center">
      <span className="badge">Payment return</span>
      <h1 className="section-title mt-4">Payment is being verified</h1>
      <p className="section-subtitle mx-auto mt-4">
        We have received your checkout return and Sedifex will confirm the final
        payment status. Please do not submit another booking unless our team asks
        you to.
      </p>
      <div className="mt-8 rounded-[2rem] border border-emerald-100 bg-white p-8 text-left shadow-sm">
        <p className="font-black text-slate-950">What happens next?</p>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <li>
            • Sedifex verifies the provider payment by webhook or order status
            lookup.
          </li>
          <li>
            • Your booking is updated only after Sedifex confirms the payment.
          </li>
          <li>
            • Onco-nurse will follow up using the contact details you submitted.
          </li>
        </ul>
      </div>
    </main>
  );
}

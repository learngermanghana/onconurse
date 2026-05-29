import { getSedifexSocialSettings } from "../../lib/sedifex";

export default async function AboutPage() {
  const social = await getSedifexSocialSettings();
  const profile = social?.profile;

  return (
    <section className="section grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
      <div>
        <span className="badge">About Onco-nurse</span>

        <h1 className="section-title mt-4">
          Germany pathway guidance with nursing experience
        </h1>
      </div>

      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-lg leading-9 text-slate-700">
          {profile?.businessDescription ||
            "Onco-nurse helps African nurses and applicants understand Germany opportunities including Nursing Ausbildung, FSJ, BFD, Au-Pair, Recognition and Student Visa pathways. The goal is to make the process clear, realistic and well organised before applicants spend money or submit documents."}
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            "Oncology nursing focus",
            "African applicant support",
            "Germany document guidance",
            "Visa readiness",
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-emerald-50 p-5">
              <p className="font-black text-emerald-800">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
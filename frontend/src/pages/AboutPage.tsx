export default function AboutPage() {
  return (
    <section className="mx-auto flex w-full flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
      <div className="w-full max-w-xl space-y-6 sm:max-w-2xl md:max-w-4xl lg:max-w-5xl lg:space-y-8 xl:max-w-6xl">
      <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">About MedLens</h1>
      <div className="space-y-6 rounded-2xl p-5 text-base leading-relaxed text-slate-300 sm:p-8 sm:text-lg lg:rounded-3xl lg:p-10 lg:text-xl glass">
        <p>
          MedLens helps clinicians and researchers review published evidence. It retrieves articles from
          PubMed, applies a structured trust-scoring model, and produces downloadable reports with
          verdicts, bias notes, and contradiction summaries.
        </p>
        <h2 className="text-2xl font-semibold text-white lg:text-3xl">Trust scoring</h2>
        <p>
          Scores combine study type weighting (RCT and systematic reviews rank highest), source tier
          (PubMed and peer-reviewed journals vs blogs), sample-size signals from abstracts, and
          publication recency. Every score includes a written explanation of how it was derived.
        </p>
        <h2 className="text-2xl font-semibold text-white lg:text-3xl">How it works</h2>
        <p>
          Each search runs through literature retrieval, evidence scoring, report assembly, and optional
          PDF export. Results are intended for research review, not patient-specific decisions.
        </p>
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-base text-amber-300/90 lg:p-5 lg:text-lg">
          <strong>Important:</strong> MedLens summarizes published literature for informational use only.
          It is not a substitute for professional medical judgment, diagnosis, or treatment. Consult a
          qualified clinician for personal health decisions.
        </p>
      </div>
      </div>
    </section>
  );
}

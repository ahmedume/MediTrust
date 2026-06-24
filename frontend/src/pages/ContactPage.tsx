import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <section className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl space-y-6 sm:max-w-2xl md:max-w-3xl lg:max-w-4xl lg:space-y-8">
        <div>
          <h1 className="mb-3 text-4xl font-bold text-white sm:text-5xl lg:text-5xl">Contact</h1>
          <p className="max-w-3xl text-base leading-relaxed text-slate-400 sm:text-lg lg:text-lg">
            Questions about MediTrust, partnership inquiries, or product feedback.
          </p>
        </div>
        <div className="space-y-6 rounded-2xl p-5 sm:p-8 lg:rounded-3xl lg:p-8 glass">
          <div className="grid gap-3 text-base text-slate-400 sm:grid-cols-2 lg:text-base">
            <p>
              Email: <span className="text-white">ahmedumeranwer@gmail.com</span>
            </p>
            <p>
              GitHub:{" "}
              <a href="https://github.com" className="text-accent-soft hover:underline">
                github.com/ahmedume
              </a>
            </p>
          </div>
          {sent ? (
            <p className="text-base text-emerald-400">
              Thank you. We have received your message and will respond when possible.
            </p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <input
                required
                placeholder="Your email"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base outline-none focus:border-accent/50 lg:px-5 lg:py-3.5 lg:text-base"
              />
              <textarea
                required
                rows={5}
                placeholder="Feedback"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base outline-none focus:border-accent/50 lg:px-5 lg:py-3.5 lg:text-base"
              />
              <button
                type="submit"
                className="rounded-xl bg-accent px-5 py-3 text-base font-medium transition hover:bg-accent-soft lg:px-6 lg:py-3"
              >
                Send feedback
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

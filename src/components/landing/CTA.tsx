export default function CTA() {
  return (
    <section id="start-free" className="relative bg-white py-16 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0066cc] to-[#0a84ff] py-16 px-8 text-center text-white shadow-xl sm:px-16 sm:py-20 md:rounded-[32px]">

          {/* Background overlay details */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-white/5 blur-xl pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-3xl">
            {/* Title Copy */}
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl leading-tight">
              Ready to launch your first agent?
            </h2>

            {/* Paragraph Subcopy */}
            <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-white/80 leading-relaxed">
              Join over 50,000 developers building the future of autonomous intelligence on the Wytnet Kernel.
              No credit card required to start.
            </p>

            {/* Dual CTA buttons */}
            <div className="mt-10 flex flex-wrap justify-center items-center gap-4">
              <a
                href="#portal"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-wytnet-blue shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow-lg hover:-translate-y-[1px] active:translate-y-0"
              >
                Create Account
              </a>
              <a
                href="#sales"
                className="inline-flex items-center justify-center rounded-full border border-white/40 bg-transparent px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10 hover:border-white"
              >
                Talk to Sales
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

import { ArrowRight, Lock } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#fafbfe] py-20 lg:py-28 text-center">
      {/* Background Radial Glow Elements */}
      <div className="absolute top-[10%] left-[15%] h-[400px] w-[400px] rounded-full bg-wytnet-blue/5 glow-blur animate-pulse-glow" />
      <div className="absolute top-[20%] right-[10%] h-[350px] w-[350px] rounded-full bg-purple-500/5 glow-blur animate-pulse-glow" style={{ animationDelay: '-3s' }} />

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* Live Version Tag Pill */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-wytnet-blue/20 bg-wytnet-blue/5 px-4 py-1.5 text-xs font-semibold text-wytnet-blue">
            <svg
              className="h-3 w-3 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>WYTNET OS v1.0.15 LIVE</span>
          </div>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl font-extrabold tracking-tight text-wytnet-dark sm:text-5xl md:text-6xl lg:text-[64px] lg:leading-[1.1]">
          The Identity Layer for <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-wytnet-blue via-wytnet-blue-light to-purple-600 bg-clip-text text-transparent">
            Connected Digital Ecosystem
          </span>
        </h1>

        {/* Hero Paragraph */}
        <p className="mx-auto mt-6 max-w-2xl text-base text-wytnet-body sm:text-lg md:text-[19px] leading-relaxed">
          Deploy, orchestrate, and scale autonomous AI agents across your online infrastructure.
          One unified kernel for the next generation of intelligent software.
        </p>

        {/* Action CTA Buttons */}
        <div className="mt-10 flex flex-wrap justify-center items-center gap-4">
          {/* Explore Tools Button */}
          <a
            href="#portal"
            className="group inline-flex items-center gap-2 rounded-full bg-wytnet-blue px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-wytnet-blue/95 hover:shadow-lg hover:-translate-y-[1px] active:translate-y-0"
          >
            Explore Tools
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </a>

          {/* Documentation Button */}
          <a
            href="#documentation"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-wytnet-dark shadow-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow"
          >
            Documentation
            <Lock className="h-3.5 w-3.5 text-slate-400" />
          </a>
        </div>
      </div>
    </section>
  );
}

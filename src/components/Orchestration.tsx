import { CheckCircle2, Server, Database, MessageSquare } from 'lucide-react';

export default function Orchestration() {
  return (
    <section id="features" className="relative bg-[#fafbfe] py-24 px-6 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-[20%] left-[-10%] h-[450px] w-[450px] rounded-full bg-purple-500/5 glow-blur" />

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12">

          {/* Left Column: Flow Diagram Animation */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md rounded-3xl border border-wytnet-border bg-white p-8 shadow-sm flex flex-col items-center justify-center relative min-h-[380px] overflow-hidden">

              {/* Animated Glowing Connection SVG Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 380">
                {/* Paths connecting top center node to bottom nodes */}
                {/* Left Branch */}
                <path d="M200 130 C200 190 100 190 100 250" stroke="#0066cc" strokeWidth="1.5" strokeDasharray="5,5" fill="none" opacity="0.3" />
                <path d="M200 130 C200 190 100 190 100 250" stroke="#0066cc" strokeWidth="1.5" fill="none" className="animate-flow" strokeDasharray="8,24" />

                {/* Middle Branch */}
                <path d="M200 130 C200 195 200 195 200 250" stroke="#0066cc" strokeWidth="1.5" strokeDasharray="5,5" fill="none" opacity="0.3" />
                <path d="M200 130 C200 195 200 195 200 250" stroke="#0066cc" strokeWidth="1.5" fill="none" className="animate-flow" strokeDasharray="8,24" style={{ animationDelay: '0.8s' }} />

                {/* Right Branch */}
                <path d="M200 130 C200 190 300 190 300 250" stroke="#0066cc" strokeWidth="1.5" strokeDasharray="5,5" fill="none" opacity="0.3" />
                <path d="M200 130 C200 190 300 190 300 250" stroke="#0066cc" strokeWidth="1.5" fill="none" className="animate-flow" strokeDasharray="8,24" style={{ animationDelay: '1.6s' }} />
              </svg>

              {/* Top Node: Core Kernel Node */}
              <div className="relative z-10 flex h-20 w-20 flex-col items-center justify-center rounded-2xl border-2 border-wytnet-blue bg-white shadow-md transition-transform duration-300 hover:scale-105">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-wytnet-blue text-white">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="M12 6v12M6 12h12" />
                  </svg>
                </div>
              </div>

              {/* Connection Spacer */}
              <div className="h-28" />

              {/* Bottom Nodes: Sub-nodes list */}
              <div className="relative z-10 flex w-full justify-between px-2 gap-4">
                {/* Sub-node 1 (Server) */}
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 text-[#2c3e50] shadow-sm transition-transform duration-300 hover:scale-110">
                  <Server className="h-5 w-5" />
                </div>

                {/* Sub-node 2 (Database) */}
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 text-[#2c3e50] shadow-sm transition-transform duration-300 hover:scale-110">
                  <Database className="h-5 w-5" />
                </div>

                {/* Sub-node 3 (Inbox) */}
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-100 bg-slate-50/50 text-[#2c3e50] shadow-sm transition-transform duration-300 hover:scale-110">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Orchestrate Copy Content */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <h2 className="text-3xl font-bold tracking-tight text-wytnet-dark sm:text-4xl">
              Orchestrate with Precision
            </h2>
            <p className="mt-4 text-base text-wytnet-body leading-relaxed max-w-lg">
              Our node-based builder allows you to drag, drop, and connect complex AI logic.
              Define triggers, actions, and autonomous loops with unparalleled clarity.
            </p>

            {/* Checkbox list elements */}
            <ul className="mt-8 space-y-4">
              {[
                'Visual Logic Orchestration',
                'Atomic Task Execution',
                'Self-Healing Infrastructure',
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-wytnet-blue flex-shrink-0" />
                  <span className="text-[15px] font-semibold text-wytnet-dark">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Try Builder button */}
            <div className="mt-10">
              <a
                href="#portal"
                className="inline-flex items-center justify-center rounded-full border border-wytnet-blue px-6 py-2.5 text-[14px] font-semibold text-wytnet-blue transition-all duration-200 hover:bg-wytnet-blue hover:text-white"
              >
                Try Builder Demo
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

import { useState, useEffect } from 'react';
import { Cpu, Zap, Wallet, BarChart3, ArrowUpRight } from 'lucide-react';

export default function Ecosystem() {
  // Local state to simulate active feed data changing for real-time analytics
  const [analyticsData, setAnalyticsData] = useState<number[]>([30, 45, 35, 60, 40, 75, 50, 90, 65, 80]);
  const [activeTab, setActiveTab] = useState<'live' | 'preview'>('live');

  useEffect(() => {
    if (activeTab === 'preview') return;
    const interval = setInterval(() => {
      setAnalyticsData((prev) => {
        const next = [...prev.slice(1), Math.floor(Math.random() * 50) + 40];
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <section id="ecosystem" className="relative bg-white py-24 px-6 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[40%] right-[-10%] h-[500px] w-[500px] rounded-full bg-wytnet-blue/5 glow-blur" />

      <div className="mx-auto max-w-7xl relative z-10">
        
        {/* Header Content */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-wytnet-dark sm:text-4xl">
            Explore the Ecosystem
          </h2>
          <p className="mt-4 text-[16px] text-wytnet-body leading-relaxed">
            Modular components designed for seamless integration into any decentralized AI workflow.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          
          {/* Card 1: AI Core Neural Engine (Wider Card: 7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between overflow-hidden rounded-3xl border border-wytnet-border bg-slate-50/40 glassmorphism p-8 hover:shadow-[0_20px_50px_rgba(0,102,204,0.04)] hover:border-wytnet-blue/10 transition-all duration-300 group min-h-[380px]">
            <div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-wytnet-blue/10 text-wytnet-blue">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-wytnet-dark">AI Core Neural Engine</h3>
              <p className="mt-2 text-sm text-wytnet-body max-w-md leading-relaxed">
                The high-throughput backbone for agent cognition and large-scale model deployment.
              </p>
            </div>

            {/* Neural Net Visual - Glowing fibers radiating upwards */}
            <div className="relative mt-6 -mx-8 -mb-8 h-40 overflow-hidden flex justify-center items-end bg-gradient-to-t from-slate-100/50 to-transparent">
              <svg className="w-full h-full max-w-lg opacity-80" viewBox="0 0 400 150" fill="none">
                {/* Connecting Fan Lines */}
                {Array.from({ length: 9 }).map((_, i) => {
                  const xEnd = 40 + i * 40;
                  return (
                    <path
                      key={i}
                      d={`M200 150 Q200 100 ${xEnd} 30`}
                      stroke="url(#line-grad)"
                      strokeWidth="1.5"
                      className="animate-flow"
                      style={{
                        animationDelay: `${i * 0.25}s`,
                        strokeDasharray: '4,4',
                      }}
                    />
                  );
                })}

                {/* Radiating Dots */}
                {Array.from({ length: 9 }).map((_, i) => {
                  const xEnd = 40 + i * 40;
                  return (
                    <circle
                      key={i}
                      cx={xEnd}
                      cy="30"
                      r="4"
                      className="fill-wytnet-blue shadow-lg"
                      style={{
                        filter: 'drop-shadow(0 0 4px #0066cc)',
                      }}
                    />
                  );
                })}

                {/* Center Core Node */}
                <circle cx="200" cy="145" r="10" className="fill-wytnet-blue/80 stroke-white stroke-2" />
                <circle cx="200" cy="145" r="18" className="stroke-wytnet-blue/20 stroke-1 animate-ping" />

                {/* Gradients */}
                <defs>
                  <linearGradient id="line-grad" x1="200" y1="150" x2="200" y2="30" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0066cc" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0a84ff" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Card 2: Automation Flux (Narrower Card: 5 cols) */}
          <div className="md:col-span-5 flex flex-col justify-between rounded-3xl border border-wytnet-border bg-slate-50/40 glassmorphism p-8 hover:shadow-[0_20px_50px_rgba(0,102,204,0.04)] hover:border-wytnet-blue/10 transition-all duration-300 group min-h-[380px]">
            <div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-wytnet-blue/10 text-wytnet-blue">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-wytnet-dark">Automation Flux</h3>
              <p className="mt-2 text-sm text-wytnet-body leading-relaxed">
                Low-latency task distribution across global node clusters.
              </p>
            </div>

            {/* Content Graphic / Link */}
            <div className="mt-8">
              <a
                href="#optimized"
                className="group/link inline-flex items-center gap-1 text-sm font-semibold text-wytnet-blue transition-colors hover:text-wytnet-blue-light"
              >
                Throughput optimized
                <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
              </a>

              {/* Minimalist Tech Lines Visual */}
              <div className="mt-6 flex gap-1 h-12 items-end">
                {Array.from({ length: 24 }).map((_, i) => {
                  const h = 10 + Math.sin(i * 0.5) * 20 + Math.random() * 15;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-wytnet-blue/60 to-wytnet-blue-light/20 transition-all duration-300"
                      style={{ height: `${h}px` }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 3: Agent Wallets (Narrower Card: 5 cols) */}
          <div className="md:col-span-5 flex flex-col justify-between rounded-3xl border border-wytnet-border bg-slate-50/40 glassmorphism p-8 hover:shadow-[0_20px_50px_rgba(0,102,204,0.04)] hover:border-wytnet-blue/10 transition-all duration-300 group min-h-[350px]">
            <div>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-wytnet-blue/10 text-wytnet-blue">
                <Wallet className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-wytnet-dark">Agent Wallets</h3>
              <p className="mt-2 text-sm text-wytnet-body leading-relaxed">
                Autonomous financial identities for on-chain resource management.
              </p>
            </div>

            {/* Overlapping Circles graphic */}
            <div className="mt-8 flex items-center justify-start py-4">
              <div className="flex -space-x-4">
                <div className="h-12 w-12 rounded-full border-4 border-white bg-gradient-to-br from-[#0b2447] to-[#1f3e6d] shadow-sm transform transition-all group-hover:scale-105 duration-300" />
                <div className="h-12 w-12 rounded-full border-4 border-white bg-gradient-to-br from-wytnet-blue to-wytnet-blue-light shadow-sm transform transition-all group-hover:translate-x-1 group-hover:scale-105 duration-300" style={{ transitionDelay: '0.05s' }} />
                <div className="h-12 w-12 rounded-full border-4 border-white bg-gradient-to-br from-indigo-200 to-indigo-100 shadow-sm flex items-center justify-center text-wytnet-blue font-bold text-[10px] transform transition-all group-hover:translate-x-2 group-hover:scale-105 duration-300" style={{ transitionDelay: '0.1s' }}>
                  AI
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Real-time Analytics (Wider Card: 7 cols) */}
          <div className="md:col-span-7 flex flex-col sm:flex-row justify-between items-stretch rounded-3xl border border-wytnet-border bg-slate-50/40 glassmorphism p-8 hover:shadow-[0_20px_50px_rgba(0,102,204,0.04)] hover:border-wytnet-blue/10 transition-all duration-300 group min-h-[350px] gap-6">
            
            {/* Left Content Column */}
            <div className="flex flex-col justify-between flex-1">
              <div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-wytnet-blue/10 text-wytnet-blue">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-wytnet-dark">Real-time Analytics</h3>
                <p className="mt-2 text-sm text-wytnet-body leading-relaxed">
                  Observe agent interactions with millisecond precision and deep forensic insights.
                </p>
              </div>

              {/* Interaction Buttons */}
              <div className="mt-8 flex gap-2.5">
                <button
                  onClick={() => setActiveTab('live')}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                    activeTab === 'live'
                      ? 'bg-wytnet-blue text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full bg-emerald-400 ${activeTab === 'live' ? 'animate-ping' : ''}`}></span>
                  Live Feed
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                    activeTab === 'preview'
                      ? 'bg-wytnet-blue text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {/* Right Mini Chart Column */}
            <div className="flex items-center justify-center flex-1 bg-white/50 rounded-2xl border border-wytnet-border p-4 relative overflow-hidden">
              <svg className="w-full h-36 overflow-visible" viewBox="0 0 100 50">
                {/* SVG Path line */}
                <path
                  d={`M ${analyticsData.map((val, idx) => `${idx * 11},${50 - (val / 100) * 40}`).join(' L ')}`}
                  fill="none"
                  stroke="#0066cc"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />

                {/* SVG Glowing under-gradient */}
                <path
                  d={`M 0,50 L ${analyticsData.map((val, idx) => `${idx * 11},${50 - (val / 100) * 40}`).join(' L ')} L 99,50 Z`}
                  fill="url(#chart-grad)"
                  className="transition-all duration-1000"
                />

                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0066cc" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#0066cc" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

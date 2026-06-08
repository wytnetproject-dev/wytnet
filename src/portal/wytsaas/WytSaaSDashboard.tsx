import { useState } from 'react';
import { 
  Brain, 
  BarChart3, 
  Terminal, 
  Lock, 
  Activity, 
  Code2, 
  ArrowRight, 
  Star, 
  Cpu, 
  Shield, 
  Globe, 
  Share2, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { Card, CardContent } from '@mui/material';

export default function WytSaaSDashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Featured AI Solutions list
  const featuredSolutions = [
    {
      id: 'wytllm-ultra-v4',
      badge: 'ENTERPRISE',
      title: 'WytLLM Ultra v4',
      desc: 'The industry-leading large language model optimized for secure enterprise orchestration, SSO, and complex logic processing.',
      rating: '4.9',
      reviews: '12k reviews',
      latency: '82ms Latency',
      icon: Brain,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50 border-blue-100',
    },
    {
      id: 'predictive-analytics',
      title: 'Predictive Analytics',
      desc: 'Real-time predictive modeling for enterprise supply chain and logistics forecasting.',
      rating: '4.8',
      icon: BarChart3,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50 border-purple-100',
    }
  ];

  // 2. Categories data
  const categories = [
    { name: 'DevOps', count: 142, icon: Terminal, color: 'text-blue-500', bg: 'bg-blue-50/50' },
    { name: 'Security', count: 89, icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50/50' },
    { name: 'Machine Learning', count: 215, icon: Brain, color: 'text-indigo-500', bg: 'bg-indigo-50/50' },
    { name: 'Marketing', count: 67, icon: TrendingUp, color: 'text-sky-500', bg: 'bg-sky-50/50' },
  ];

  // 3. Trending APIs data
  const trendingAPIs = [
    {
      title: 'Global Payments v2',
      badge: 'NEW',
      desc: 'Universal multi-currency settlement engine with zero-day compliance checks.',
      protocol: 'REST / GRPC',
      icon: Globe,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50/80 border-blue-100',
    },
    {
      title: 'Vault Auth Engine',
      desc: 'Stateless authentication service providing high-security biometric validation.',
      protocol: 'OIDC / SAML',
      icon: Lock,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-50/80 border-orange-100',
    },
    {
      title: 'Graph Network 360',
      desc: 'Massive graph data traversal API designed for rapid enterprise entity relationship mapping.',
      protocol: 'GRAPHQL',
      icon: Share2,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50/80 border-emerald-100',
    }
  ];

  return (
    <div className="flex-grow bg-[#f8fafc] overflow-y-auto px-8 py-6 select-none space-y-8 no-scrollbar">
      
      {/* ==================== 1. Discover Hero Banner ==================== */}
      <div className="relative rounded-3xl bg-[#092c5c] text-white p-8 md:p-12 overflow-hidden shadow-[0_12px_40px_rgba(9,44,92,0.15)] flex items-center">
        {/* Banner image background */}
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5MZKCv9QXFUqquvT1eHqCp3JxW7Rdr7Nsohx76sxGiAclGumHF2rsIB-JSWBxBh-NGtcuNgLgnR5J5M3XLtnfSpoLiZyHeiggcablyF0WOUlyCVenl6iNgYgXh1rblhTricI7w4nCrHr9RSLe8qh1DzP_BBuJWvEWO0HrtYwiL9GNN5bIRgM8dntNuXE2XsFuiT3oKGdWrG-osPt5wa89PtpEsFTW1AoIhdlfAsLYMW4bQi2LHxuSU2UJ7AcE4P-5zryQMUysOOPo" 
          className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-overlay pointer-events-none select-none" 
          alt="Discover Enterprise SaaS Banner"
        />

        {/* Hero Copy */}
        <div className="relative z-10 max-w-2xl space-y-5">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Discover the next generation <br />
            of Enterprise SaaS
          </h1>
          <p className="text-sm md:text-base font-medium text-white leading-relaxed">
            Unlock thousands of cloud-native solutions, managed APIs, and enterprise-grade AI models designed for high-scale performance.
          </p>
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button className="bg-wytnet-blue hover:bg-blue-600 transition-all text-xs font-bold text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl cursor-pointer">
              Explore Solutions
            </button>
            <button className="bg-white/10 hover:bg-white/15 transition-all text-xs font-bold text-white px-6 py-3 rounded-xl border border-white/20 hover:border-white/30 cursor-pointer backdrop-blur-sm">
              Read Documentation
            </button>
          </div>
        </div>
      </div>

      {/* ==================== 2. Featured AI Solutions ==================== */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-wytnet-dark">
              Featured AI Solutions
            </h2>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              High-performance generative and analytical models
            </p>
          </div>
          <a href="#ai-solutions" className="flex items-center gap-1 text-xs font-bold text-wytnet-blue hover:text-blue-700 transition-colors group">
            View all AI Solutions
            <ArrowRight className="h-3.5 w-3.5 transform transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* Grid Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Card 1: WytLLM Ultra v4 (spans 2 columns) */}
          <Card elevation={0} className="lg:col-span-2 border border-slate-100 bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.005)] hover:border-slate-200 transition-all flex flex-col justify-between">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start h-full">
              
              {/* Left Details Column */}
              <div className="md:col-span-7 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-3.5">
                  {/* Badges & Icon row */}
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl border flex items-center justify-center font-extrabold shadow-sm ${featuredSolutions[0].iconBg}`}>
                      <Brain className={`h-5 w-5 ${featuredSolutions[0].iconColor}`} />
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                        {featuredSolutions[0].badge}
                      </span>
                      <h3 className="font-extrabold text-base text-wytnet-dark">
                        {featuredSolutions[0].title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                    {featuredSolutions[0].desc}
                  </p>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-400">
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {featuredSolutions[0].rating}
                      <span className="text-slate-400 text-[10px] font-medium ml-0.5">({featuredSolutions[0].reviews})</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ZapIcon className="h-3.5 w-3.5 text-slate-400" />
                      {featuredSolutions[0].latency}
                    </span>
                  </div>
                </div>

                {/* Card CTA Buttons */}
                <div className="flex items-center gap-2.5 pt-2">
                  <button className="flex items-center gap-2 bg-wytnet-blue hover:bg-blue-600 transition-all text-xs font-bold text-white px-5 py-2.5 rounded-xl cursor-pointer shadow-md hover:shadow-lg">
                    Quick View
                  </button>
                  <button className="flex items-center gap-2 bg-white border border-slate-100 hover:border-slate-200 transition-all text-xs font-bold text-[#2c3e50] px-5 py-2.5 rounded-xl cursor-pointer shadow-sm">
                    Documentation
                  </button>
                </div>
              </div>

              {/* Right Abstract Art SVG Column */}
              <div className="md:col-span-5 h-full min-h-[160px] md:min-h-0 relative">
                <div className="absolute inset-0 bg-[#0d1e36] rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                  <svg className="w-full h-full object-cover opacity-90 scale-105" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Generative custom mesh waves matching screenshot */}
                    <rect width="100" height="100" fill="url(#bg-gradient)" />
                    {Array.from({ length: 15 }).map((_, idx) => {
                      const offset = idx * 6;
                      return (
                        <path
                          key={idx}
                          d={`M -20,${40 + offset} Q 25,${10 + offset} 50,${40 + offset} T 120,${20 + offset}`}
                          stroke="url(#wave-stroke)"
                          strokeWidth="0.8"
                          opacity={0.15 + (idx * 0.05)}
                        />
                      );
                    })}
                    <defs>
                      <linearGradient id="bg-gradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#0d1e36" />
                        <stop offset="50%" stopColor="#11294a" />
                        <stop offset="100%" stopColor="#071221" />
                      </linearGradient>
                      <linearGradient id="wave-stroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.3" />
                        <stop offset="50%" stopColor="#00f2fe" stopOpacity="1" />
                        <stop offset="100%" stopColor="#4facfe" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

            </div>
          </Card>

          {/* Card 2: Predictive Analytics (spans 1 column) */}
          <Card elevation={0} className="border border-slate-100 bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.005)] hover:border-slate-200 transition-all flex flex-col justify-between min-h-[220px]">
            <div className="space-y-4">
              {/* Icon & Title */}
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl border flex items-center justify-center font-extrabold shadow-sm ${featuredSolutions[1].iconBg}`}>
                  <CardContentIcon className={`h-5 w-5 ${featuredSolutions[1].iconColor}`} />
                </div>
                <h3 className="font-extrabold text-sm text-wytnet-dark">
                  {featuredSolutions[1].title}
                </h3>
              </div>

              {/* Copy */}
              <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                {featuredSolutions[1].desc}
              </p>

              {/* Rating */}
              <div className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-current" />
                {featuredSolutions[1].rating}
              </div>
            </div>

            {/* Install Button */}
            <div className="pt-4 border-t border-slate-50">
              <button className="w-full flex items-center justify-center bg-wytnet-blue hover:bg-blue-600 transition-all text-xs font-bold text-white py-2.5 rounded-xl cursor-pointer shadow-sm hover:shadow-md">
                Install Module
              </button>
            </div>
          </Card>

        </div>
      </div>

      {/* ==================== 3. Categories Badges ==================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <Card key={idx} elevation={0} className="border border-slate-100 bg-white shadow-sm hover:border-slate-200 transition-all rounded-2xl">
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${cat.bg}`}>
                  <Icon className={`h-4.5 w-4.5 ${cat.color}`} />
                </div>
                <div className="flex flex-col justify-start">
                  <span className="text-xs font-extrabold text-wytnet-dark">
                    {cat.name}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    {cat.count} Solutions
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ==================== 4. Trending APIs ==================== */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-wytnet-dark">
            Trending APIs
          </h2>
          <div className="flex items-center gap-1.5">
            <button className="h-8 w-8 rounded-lg bg-white border border-slate-100 hover:border-slate-200 text-slate-400 hover:text-wytnet-blue transition-all flex items-center justify-center cursor-pointer shadow-sm">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="h-8 w-8 rounded-lg bg-white border border-slate-100 hover:border-slate-200 text-slate-400 hover:text-wytnet-blue transition-all flex items-center justify-center cursor-pointer shadow-sm">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 3 cards grid list */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trendingAPIs.map((api, idx) => {
            const Icon = api.icon;
            return (
              <Card 
                key={idx} 
                elevation={0}
                className="border border-slate-100 bg-white rounded-3xl hover:border-wytnet-blue/20 hover:shadow-[0_8px_30px_rgba(0,102,204,0.015)] transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.003)] flex flex-col justify-between min-h-[180px]"
              >
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  
                  {/* Top: Icon & Title & Badges */}
                  <div>
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg border flex items-center justify-center font-extrabold shadow-sm ${api.iconBg}`}>
                        <Icon className={`h-4.5 w-4.5 ${api.iconColor}`} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-wytnet-dark hover:text-wytnet-blue">
                          {api.title}
                        </span>
                        {api.badge && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[8px] font-bold text-wytnet-blue">
                            {api.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] font-semibold text-slate-400 leading-relaxed mt-3.5">
                      {api.desc}
                    </p>
                  </div>

                  {/* Bottom details & CTA */}
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 pt-2.5 border-t border-slate-50 mt-auto">
                    <span>{api.protocol}</span>
                    <span className="flex items-center gap-0.5 text-wytnet-blue group hover:text-blue-700">
                      View Docs
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// Rename helper function icon to not clash
function CardContentIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

// Inline helper components
function ZapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

import { useState } from 'react';
import { FileText, ExternalLink, Zap, Play, Search, Settings, Plus, Link2, Code2, Terminal } from 'lucide-react';
import { Card, CardContent } from '@mui/material';

interface DashboardProps {
  user?: { email: string; name: string; role: string } | null;
}

export default function WytPassDashboard({ user }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('sso');
  const [activeSubMenu, setActiveSubMenu] = useState('providers');

  // SSO cards details data
  const ssoCards = [
    {
      id: 'providers',
      badge: 'P',
      badgeBg: 'bg-purple-50 text-purple-600 border-purple-100',
      title: 'Providers',
      desc: 'Connected identity providers — SAML, OIDC, social, and enterprise directories.',
      itemsCount: '12 items',
      updated: 'updated 2m ago',
    },
    {
      id: 'saml',
      badge: 'S',
      badgeBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      title: 'SAML',
      desc: 'SAML 2.0 endpoints, certificates, and tenant metadata.',
      itemsCount: '39 items',
      updated: 'updated 5m ago',
    },
    {
      id: 'oidc',
      badge: 'O',
      badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      title: 'OIDC',
      desc: 'OpenID Connect clients, scopes, and consent flows.',
      itemsCount: '17 items',
      updated: 'updated 12m ago',
    },
    {
      id: 'discovery',
      badge: 'D',
      badgeBg: 'bg-amber-50 text-amber-600 border-amber-100',
      title: 'Discovery',
      desc: 'Auto-discovery of org domains and home-realm routing.',
      itemsCount: '92 items',
      updated: 'updated 18m ago',
    },
  ];

  return (
    <div className="flex-grow bg-[#f8fafc] overflow-y-auto px-8 py-6 select-none space-y-6">
      
      {/* 1. Header & Actions segment */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs */}
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            Products / WytPass
          </div>
          
          {/* Main Title Row */}
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-2xl font-extrabold text-wytnet-dark">
              WytPass
            </h2>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              OPERATIONAL
            </div>
          </div>
          
          <p className="text-xs font-semibold text-slate-500 mt-2">
            Identity, SSO, and access control for the entire ecosystem.
          </p>
        </div>

        {/* Header CTA Buttons */}
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-2 bg-white border border-slate-100 hover:border-slate-200 transition-all text-xs font-bold text-[#2c3e50] px-3.5 py-2 rounded-lg cursor-pointer shadow-sm">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            Docs
          </button>
          
          <button className="flex items-center gap-2 bg-white border border-slate-100 hover:border-slate-200 transition-all text-xs font-bold text-[#2c3e50] px-3.5 py-2 rounded-lg cursor-pointer shadow-sm">
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            Open app
          </button>

          <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 transition-all text-xs font-bold text-white px-4 py-2 rounded-lg cursor-pointer shadow-md hover:shadow-lg">
            <Zap className="h-3.5 w-3.5 fill-current" />
            Quick action
          </button>
        </div>
      </div>

      {/* 2. Metrics statistics row (4 KPI cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Sessions', val: '12.4M' },
          { label: 'P99 Latency', val: '82ms' },
          { label: 'Uptime - 90D', val: '99.98%' },
          { label: 'Connected Products', val: '7 / 11' },
        ].map((metric, idx) => (
          <Card key={idx} elevation={0} className="border border-slate-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.005)] rounded-2xl hover:border-slate-200 transition-all">
            <CardContent className="p-5 flex flex-col justify-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {metric.label}
              </span>
              <span className="text-xl font-extrabold text-wytnet-dark mt-1.5">
                {metric.val}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Section Tabs Row */}
      <div className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.005)]">
        {/* Horizontal Navigation tabs */}
        <div className="flex gap-4 border-b md:border-b-0 border-slate-50 pb-2.5 md:pb-0">
          {[
            { id: 'sso', label: 'SSO' },
            { id: 'users', label: 'User Management' },
            { id: 'roles', label: 'Roles & Permissions' },
            { id: 'logs', label: 'Authentication Logs' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all relative cursor-pointer ${
                  isActive
                    ? 'text-purple-600 bg-purple-50/50'
                    : 'text-slate-500 hover:text-wytnet-dark'
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-[-11px] left-0 right-0 h-[2px] bg-purple-600 rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Actions: Search & Configure */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search module"
              className="bg-[#f8fafc] border border-slate-100 text-xs font-medium pl-8 pr-3 py-1.5 rounded-lg outline-none w-36 focus:w-48 transition-all"
            />
          </div>
          
          <button className="flex items-center gap-1.5 bg-white border border-slate-100 hover:border-slate-200 transition-all text-[11px] font-bold text-[#2c3e50] px-3 py-1.5 rounded-lg cursor-pointer">
            <Settings className="h-3.5 w-3.5 text-slate-400" />
            CONFIGURE
          </button>
        </div>
      </div>

      {/* 4. Split Dashboard Workspace Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Sub-panel Menu List (3 cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-4 space-y-6 shadow-[0_2px_10px_rgba(0,0,0,0.005)]">
          {/* Section 1: SSO Sub-items */}
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-3">
              SSO
            </span>
            <div className="mt-2 space-y-1">
              {[
                { id: 'providers', label: 'Providers', count: '01' },
                { id: 'saml', label: 'SAML', count: '02' },
                { id: 'oidc', label: 'OIDC', count: '03' },
                { id: 'discovery', label: 'Discovery', count: '04' },
              ].map((item) => {
                const isActive = activeSubMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSubMenu(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-purple-50/50 text-purple-600 border-l-2 border-purple-600 rounded-l-none'
                        : 'text-slate-500 hover:text-wytnet-dark hover:bg-slate-50/50'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Resources links */}
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-3">
              Resources
            </span>
            <div className="mt-2 space-y-1">
              {(user?.role === 'developer'
                ? [
                    { label: 'Documentation', icon: Link2 },
                    { label: 'API reference', icon: Code2 },
                    { label: 'CLI guide', icon: Terminal },
                  ]
                : [
                    { label: 'User Guide', icon: Link2 },
                    { label: 'Security Policy', icon: Code2 },
                    { label: 'Helpdesk Support', icon: Terminal },
                  ]
              ).map((link, idx) => {
                const Icon = link.icon;
                return (
                  <a
                    key={idx}
                    href={`#${link.label.replace(' ', '-').toLowerCase()}`}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-purple-600 hover:bg-purple-50/20 rounded-xl transition-all"
                  >
                    <Icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-purple-600" />
                    <span>{link.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sub-panel dashboard graphs & cards (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Subheader Title & Action buttons */}
          <div className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.003)]">
            <div>
              <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase block">
                AUTH-001 / SSO / PROVIDERS
              </span>
              <h3 className="text-lg font-extrabold text-wytnet-dark mt-0.5">
                Providers
              </h3>
            </div>

            {user?.role === 'developer' && (
              <div className="flex gap-2">
                <button className="flex items-center gap-1 bg-white border border-slate-100 hover:border-slate-200 transition-all text-xs font-bold text-[#2c3e50] px-3.5 py-1.5 rounded-lg cursor-pointer">
                  <Plus className="h-3.5 w-3.5" />
                  Create
                </button>
                
                <button className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 transition-all text-xs font-bold text-white px-3.5 py-1.5 rounded-lg cursor-pointer">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Run flow
                </button>
              </div>
            )}
          </div>

          {/* Graph block: Throughput area line chart & Errors bar chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Throughput SVG area graph */}
            <Card className="border border-slate-100 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.003)]">
              <CardContent className="p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    SSO Throughput
                  </span>
                  <h4 className="text-xl font-extrabold text-wytnet-dark mt-1">
                    2.1k/s
                  </h4>
                </div>
                
                {/* SVG Area graph representation */}
                <div className="mt-4 h-24 w-full relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50">
                    <path
                      d="M 0,45 Q 15,20 30,38 T 60,15 T 90,40 T 100,28 L 100,50 L 0,50 Z"
                      fill="url(#throughput-fill)"
                    />
                    <path
                      d="M 0,45 Q 15,20 30,38 T 60,15 T 90,40 T 100,28"
                      fill="none"
                      stroke="#9333ea"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="throughput-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9333ea" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </CardContent>
            </Card>

            {/* Errors SVG Bar graph */}
            <Card className="border border-slate-100 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.003)]">
              <CardContent className="p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Errors
                  </span>
                  <h4 className="text-xl font-extrabold text-wytnet-dark mt-1">
                    0.21%
                  </h4>
                </div>
                
                {/* SVG Bar Chart Representation */}
                <div className="mt-4 h-24 w-full flex items-end justify-between px-1">
                  {[25, 45, 60, 35, 55, 75, 85, 40, 50, 70, 30, 65, 20].map((h, i) => (
                    <div
                      key={i}
                      className={`w-[6%] rounded-t transition-all duration-300 ${
                        i % 3 === 0
                          ? 'bg-purple-600/50 hover:bg-purple-600'
                          : i % 3 === 1
                          ? 'bg-purple-600/80 hover:bg-purple-600'
                          : 'bg-purple-600/30 hover:bg-purple-600'
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Grid cards: SSO sub-options panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ssoCards.slice(0, 3).map((card) => (
              <Card
                key={card.id}
                className="border border-slate-100 bg-white rounded-2xl hover:border-purple-600/20 hover:shadow-[0_8px_30px_rgba(147,51,234,0.015)] transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.003)]"
              >
                <CardContent className="p-5 flex flex-col justify-between min-h-[170px]">
                  
                  {/* Badge & Title */}
                  <div>
                    <div className="flex items-center gap-3">
                      <div className={`h-7 w-7 rounded-lg border flex items-center justify-center font-extrabold text-xs shadow-sm ${card.badgeBg}`}>
                        {card.badge}
                      </div>
                      <span className="font-extrabold text-sm text-wytnet-dark hover:text-purple-600">
                        {card.title}
                      </span>
                    </div>

                    <p className="text-[11px] font-semibold text-slate-400 leading-relaxed mt-3.5">
                      {card.desc}
                    </p>
                  </div>

                  {/* Footer data details */}
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mt-4 border-t border-slate-50 pt-2.5">
                    <span>{card.itemsCount}</span>
                    <span>{card.updated}</span>
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>

          {/* Row 2 bottom card: Discovery */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ssoCards.slice(3, 4).map((card) => (
              <Card
                key={card.id}
                className="border border-slate-100 bg-white rounded-2xl hover:border-purple-600/20 hover:shadow-[0_8px_30px_rgba(147,51,234,0.015)] transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.003)]"
              >
                <CardContent className="p-5 flex flex-col justify-between min-h-[170px]">
                  
                  {/* Badge & Title */}
                  <div>
                    <div className="flex items-center gap-3">
                      <div className={`h-7 w-7 rounded-lg border flex items-center justify-center font-extrabold text-xs shadow-sm ${card.badgeBg}`}>
                        {card.badge}
                      </div>
                      <span className="font-extrabold text-sm text-wytnet-dark hover:text-purple-600">
                        {card.title}
                      </span>
                    </div>

                    <p className="text-[11px] font-semibold text-slate-400 leading-relaxed mt-3.5">
                      {card.desc}
                    </p>
                  </div>

                  {/* Footer data details */}
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mt-4 border-t border-slate-50 pt-2.5">
                    <span>{card.itemsCount}</span>
                    <span>{card.updated}</span>
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}

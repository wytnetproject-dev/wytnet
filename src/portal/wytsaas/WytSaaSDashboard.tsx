import { useState, useEffect } from 'react';
import { Shield, Database, Key, Terminal, Cpu, RefreshCw, Copy, Check, Info, Settings, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@mui/material';

interface DashboardProps {
  user?: { email: string; name: string; role: string } | null;
}

export default function WytSaaSDashboard({ user }: DashboardProps) {
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [quota, setQuota] = useState(64000);

  // Generate a random API key
  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'wyt_saas_';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setApiKey(result);
    setCopied(false);
  };

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Simulate logs (for developers)
  useEffect(() => {
    if (user?.role !== 'developer') return;

    const initialLogs = [
      '[SYSTEM] Initializing WytSaaS container environment...',
      '[DB] Connecting to database on port 8000...',
      '[DB] PostgreSQL connection pool initialized successfully.',
      '[AUTH] JWT signature verification key sync completed.',
      '[CACHE] Redis cache cluster status: operational.',
      '[SYSTEM] Server listening on http://localhost:8000',
    ];
    setLogs(initialLogs);

    const interval = setInterval(() => {
      const randomLogMessages = [
        `[METRICS] Active DB connections checked: 3 active pools.`,
        `[ROUTER] Incoming health check request from local gateway.`,
        `[CACHE] Memory utilization check: 14.2% pool occupied.`,
        `[SYSTEM] Syncing tenant configurations... Done.`,
        `[SECURITY] Cleaned expired guest tokens database.`,
      ];
      const selected = randomLogMessages[Math.floor(Math.random() * randomLogMessages.length)];
      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev.slice(-10), `[${timestamp}] ${selected}`]);
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  const refreshSystemMetrics = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      const timestamp = new Date().toLocaleTimeString();
      if (user?.role === 'developer') {
        setLogs((prev) => [...prev, `[${timestamp}] [SYSTEM] Force refresh metrics triggered: OK.`]);
      } else {
        setQuota(Math.floor(Math.random() * 20000) + 50000);
      }
    }, 2000);
  };

  // 1. Render Customer/User View (No sidebar by default, simple overview)
  if (user?.role === 'user') {
    return (
      <div className="flex-grow bg-[#f8fafc] overflow-y-auto px-8 py-6 select-none space-y-6 no-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              Client Portal / WytSaaS
            </div>
            <h2 className="text-2xl font-extrabold text-wytnet-dark mt-1">
              Welcome to WytSaaS, {user.name}
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              View your subscriptions, consumption metrics, and settings.
            </p>
          </div>
          
          <button 
            onClick={refreshSystemMetrics}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-white border border-slate-100 hover:border-slate-200 transition-all text-xs font-bold text-[#2c3e50] px-4 py-2 rounded-xl cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Updating...' : 'Sync Consumption'}
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex gap-4 items-start shadow-sm">
          <Info className="h-5 w-5 text-wytnet-blue shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-wytnet-dark">Active Client Plan</h4>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              Your account is currently subscribed to the **Enterprise SaaS Plan**. Billing resets in 12 days. For advanced configurations, please contact your systems administrator or submit a developer ticket.
            </p>
          </div>
        </div>

        {/* User metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card elevation={0} className="border border-slate-100 bg-white p-5 rounded-2xl flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-wytnet-blue">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">API Quota Usage</span>
              <span className="text-sm font-extrabold text-wytnet-dark mt-1">{quota.toLocaleString()} / 100,000 calls</span>
            </div>
          </Card>

          <Card elevation={0} className="border border-slate-100 bg-white p-5 rounded-2xl flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Integrations</span>
              <span className="text-sm font-extrabold text-wytnet-dark mt-1">4 Active modules</span>
            </div>
          </Card>

          <Card elevation={0} className="border border-slate-100 bg-white p-5 rounded-2xl flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Support Tier</span>
              <span className="text-sm font-extrabold text-wytnet-dark mt-1">24/7 Priority Support</span>
            </div>
          </Card>
        </div>

      </div>
    );
  }

  // 2. Render Developer View (with full terminal console and generator)
  return (
    <div className="flex-grow bg-[#f8fafc] overflow-y-auto px-8 py-6 select-none space-y-6 no-scrollbar">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            Products / WytSaaS / Developer
          </div>
          
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-2xl font-extrabold text-wytnet-dark animate-fadeIn">
              WytSaaS Control Center
            </h2>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ALL SYSTEMS OPERATIONAL
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Secure developer workspace to manage environment tokens and inspect container state parameters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={refreshSystemMetrics}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-white border border-slate-100 hover:border-slate-200 transition-all text-xs font-bold text-[#2c3e50] px-4 py-2 rounded-xl cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Checking...' : 'Refresh Metrics'}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Database Status', val: 'Connected', icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'API Request Rate', val: '0 req/s', icon: Cpu, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Authentication Server', val: 'Active (Port 8000)', icon: Shield, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'System Memory', val: '14.2% Occupied', icon: Terminal, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <Card key={idx} elevation={0} className="border border-slate-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.005)] rounded-2xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${metric.bg}`}>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <div className="flex flex-col justify-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {metric.label}
                  </span>
                  <span className="text-sm font-extrabold text-wytnet-dark mt-1">
                    {metric.val}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Interactive Tools Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: API Key Generator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card elevation={0} className="border border-slate-100 bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-wytnet-dark">
                    API Credentials
                  </h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Generate temporary token key
                  </span>
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                Generate environment tokens to query the backend database or call secure endpoints. Protect this key at all times.
              </p>

              <div className="space-y-2.5 pt-2">
                {apiKey ? (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-mono font-medium text-slate-600 break-all select-all animate-fadeIn">
                    <span className="truncate pr-4">{apiKey}</span>
                    <button 
                      onClick={copyToClipboard}
                      className="text-slate-400 hover:text-wytnet-blue cursor-pointer shrink-0"
                      title="Copy Key"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs font-semibold text-slate-400 leading-relaxed">
                    No token generated yet. Click generate below.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50">
              <button 
                onClick={generateKey}
                className="w-full flex items-center justify-center bg-wytnet-blue hover:bg-blue-600 transition-all text-xs font-bold text-white py-3 rounded-xl cursor-pointer shadow-md hover:shadow-lg"
              >
                Generate API Key
              </button>
            </div>
          </Card>
        </div>

        {/* Right Side: Live Log Stream Terminal (7 cols) */}
        <div className="lg:col-span-7">
          <Card elevation={0} className="border border-slate-100 bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shadow-inner">
                  <Terminal className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-wytnet-dark">
                    WytSaaS Log Console
                  </h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Real-time container execution logs
                  </span>
                </div>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            <div className="bg-slate-950 text-slate-200 font-mono text-[10px] p-4 rounded-2xl h-48 overflow-y-auto space-y-1.5 shadow-inner">
              {logs.map((log, idx) => {
                let color = 'text-slate-300';
                if (log.includes('[DB]')) color = 'text-blue-400';
                if (log.includes('[AUTH]')) color = 'text-purple-400';
                if (log.includes('[CACHE]')) color = 'text-emerald-400';
                if (log.includes('[SYSTEM]')) color = 'text-amber-400';
                return (
                  <div key={idx} className={`${color} leading-relaxed animate-fadeIn`}>
                    {log}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
}

import { useState, useEffect } from 'react';
import { Search, Star, AppWindow } from 'lucide-react';
import type { Brand } from '../portal/wytsaas/api/brand';
import AppDetail from './AppDetail';

interface MarketplaceProps {
  currentHash: string;
}

export default function Marketplace({ currentHash }: MarketplaceProps) {
  const [apps, setApps] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedApp, setSelectedApp] = useState<Brand | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Sync selectedApp with currentHash
  useEffect(() => {
    const checkSelectedApp = async () => {
      const match = currentHash.match(/#marketplace\/app\/([^&?]+)/);
      const appSlug = match ? match[1] : null;
      if (!appSlug) {
        setSelectedApp(null);
        return;
      }

      // Find in current apps if loaded
      const app = apps.find(a => a.slug === appSlug);
      if (app) {
        try {
          const response = await fetch(`http://localhost:8000/brands/slug/${appSlug}/detail`);
          if (response.ok) {
            const data = await response.json();
            setSelectedApp(data.item || app);
          } else {
            setSelectedApp(app);
          }
        } catch (err) {
          setSelectedApp(app);
        }
      } else if (apps.length > 0) {
        setSelectedApp(null);
      } else {
        try {
          const response = await fetch(`http://localhost:8000/brands/slug/${appSlug}/detail`);
          if (response.ok) {
            const data = await response.json();
            setSelectedApp(data.item);
          }
        } catch (err) {
          // If fetch fails, selectedApp remains null
        }
      }
    };

    checkSelectedApp();
  }, [currentHash, apps]);

  // Auto-scrolling banner data
  const bannerSlides = [
    {
      title: "WhitePass SSO",
      subtitle: "Universal Identity",
      description: "Secure, decentralized single sign-on system for next-generation apps and AI agents.",
      badge: "Featured App",
      bgGradient: "from-blue-600 to-indigo-900",
      icon: "https://placehold.co/120x120/0066cc/ffffff?text=WP",
    },
    {
      title: "WytPayment SDK",
      subtitle: "Agent Micropayments",
      description: "Enable your AI agents to execute sub-cent transactions instantly with absolute security.",
      badge: "Trending",
      bgGradient: "from-purple-600 to-pink-900",
      icon: "https://placehold.co/120x120/7e22ce/ffffff?text=WP",
    },
    {
      title: "Neural Flux Engine",
      subtitle: "AI Cognition",
      description: "Low-latency decentralized task distribution across global GPU node clusters.",
      badge: "Developer Choice",
      bgGradient: "from-emerald-600 to-teal-900",
      icon: "https://placehold.co/120x120/0f766e/ffffff?text=NF",
    }
  ];

  // Auto-scroll effect for banner
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Fetch apps/brands from local storage or backend
  useEffect(() => {
    const loadApps = async () => {
      try {
        const response = await fetch('http://localhost:8000/brands/');
        if (response.ok) {
          const data = await response.json();
          setApps(data.items || []);
        } else {
          throw new Error();
        }
      } catch (err) {
        // Fallback to local storage
        const stored = localStorage.getItem('mock_brands');
        if (stored) {
          setApps(JSON.parse(stored));
        } else {
          setApps([]);
        }
      }
    };
    loadApps();
  }, []);

  // Filter apps
  const categories = ['All', 'AI & ML', 'Finance', 'Security', 'Utilities'];
  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.company_name && app.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.short_description && app.short_description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || 
      (app.brand_type && (Array.isArray(app.brand_type)
        ? app.brand_type.some(t => t.toLowerCase() === selectedCategory.toLowerCase())
        : app.brand_type.toLowerCase() === selectedCategory.toLowerCase()));

    return matchesSearch && matchesCategory;
  });

  if (selectedApp) {
    return (
      <AppDetail 
        app={selectedApp} 
        onBack={() => {
          window.location.hash = '#marketplace';
        }} 
        allApps={apps} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-6">
      <div className="mx-auto max-w-7xl">

        {/* Play Store Styled Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Wytnet <span className="text-wytnet-blue">Marketplace</span>
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
              Discover verified decentralized applications
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search apps, developers, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-wytnet-blue pl-11 pr-4 py-2.5 rounded-2xl outline-none text-sm font-semibold transition-all shadow-sm placeholder-slate-400 text-slate-700"
            />
          </div>
        </div>

        {/* Carousel Banner Slider (Play Store Banner section) */}
        <div className="relative w-full h-80 rounded-3xl overflow-hidden mb-12 shadow-lg bg-slate-900 text-white select-none">
          {bannerSlides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 w-full h-full flex flex-col md:flex-row items-center justify-between p-8 md:p-12 transition-opacity duration-700 ease-in-out bg-gradient-to-r ${slide.bgGradient} ${currentSlide === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
            >
              <div className="max-w-xl space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white">
                  {slide.badge}
                </span>
                <div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight">{slide.title}</h2>
                  <p className="text-lg font-bold text-white/80 mt-1">{slide.subtitle}</p>
                </div>
                <p className="text-sm md:text-base text-white/70 leading-relaxed font-medium">
                  {slide.description}
                </p>
              </div>

              <div className="hidden md:flex h-32 w-32 shrink-0 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-md shadow-inner border border-white/10 overflow-hidden">
                <img src={slide.icon} alt={slide.title} className="h-24 w-24 object-contain rounded-2xl" />
              </div>
            </div>
          ))}

          {/* Carousel dots indicators */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
            {bannerSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-6 bg-white' : 'w-2.5 bg-white/40'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Categories Tabs Selector */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${selectedCategory === category
                  ? 'bg-wytnet-blue text-white shadow-md shadow-blue-500/10'
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Grid App List */}
        {filteredApps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                onClick={() => {
                  window.location.hash = `#marketplace/app/${app.slug}`;
                  window.scrollTo(0, 0);
                }}
                className="group relative flex flex-col justify-between bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-[0_20px_50px_rgba(0,102,204,0.04)] hover:border-wytnet-blue/10 transition-all duration-300 cursor-pointer"
              >
                <div>
                  {/* App Icon Container */}
                  <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105">
                    {app.logo_url ? (
                      <img src={app.logo_url} alt={app.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl">
                        {app.name[0]}
                      </div>
                    )}
                  </div>

                  {/* App details */}
                  <h3 className="text-base font-bold text-slate-800 mt-4 group-hover:text-wytnet-blue transition-colors">
                    {app.name}
                  </h3>

                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mt-1">
                    {app.company_name || 'Verified Developer'}
                  </p>

                  <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                    {app.short_description || 'No short description provided.'}
                  </p>
                </div>

                {/* Bottom info section */}
                <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-6">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 uppercase tracking-wider">
                    {Array.isArray(app.brand_type)
                      ? (app.brand_type.length > 0 ? app.brand_type.join(', ') : 'General')
                      : (app.brand_type || 'General')}
                  </span>

                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    <span>
                      {app.reviews && app.reviews.length > 0
                        ? (app.reviews.reduce((acc, r) => acc + r.rating, 0) / app.reviews.length).toFixed(1)
                        : '0.0'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl">
            <AppWindow className="h-12 w-12 text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Apps Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try modifying your search or choosing another category tab.</p>
          </div>
        )}

      </div>
    </div>
  );
}

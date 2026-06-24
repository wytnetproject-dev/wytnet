import { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { RefreshCw, Search, Store, ExternalLink, ArrowRight } from 'lucide-react';
import type { Brand } from '@/api/wytsaas/brand';
import { fetchBrands } from '@/api/wytsaas/brand';
import AppDetail from '@/components/marketplace/AppDetail';

interface UserMarketplaceCardsProps {
  user?: { email: string; name: string; role: string } | null;
}

export default function UserMarketplaceCards({ user: _user }: UserMarketplaceCardsProps) {
  const [apps, setApps] = useState<Brand[]>([]);
  const [filteredApps, setFilteredApps] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Brand | null>(null);

  const loadApps = async () => {
    setIsLoading(true);
    try {
      const fetched = await fetchBrands();
      // Only display approved apps that have completed onboarding
      const approved = fetched.filter(
        (b) =>
          b.status?.toLowerCase() === 'approved' ||
          b.current_stage === 'Onboarding Completed'
      );
      setApps(approved);
    } catch (err) {
      console.warn('Failed to fetch marketplace apps from API, checking local storage fallback...', err);
      try {
        const stored = localStorage.getItem('mock_brands');
        const list: Brand[] = stored ? JSON.parse(stored) : [];
        const approved = list.filter(
          (b) =>
            b.status?.toLowerCase() === 'approved' ||
            b.current_stage === 'Onboarding Completed'
        );
        setApps(approved);
      } catch (e) {
        console.error('Failed to parse mock_brands', e);
        setApps([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  // Filter list when search query changes
  useEffect(() => {
    let list = [...apps];
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (app) =>
          app.name.toLowerCase().includes(q) ||
          (app.company_name && app.company_name.toLowerCase().includes(q)) ||
          (app.short_description && app.short_description.toLowerCase().includes(q))
      );
    }
    setFilteredApps(list);
  }, [searchQuery, apps]);

  if (selectedApp) {
    return (
      <Box className="flex-grow bg-white overflow-y-auto px-8 py-6 select-none">
        <AppDetail
          app={selectedApp}
          onBack={() => setSelectedApp(null)}
          allApps={apps}
        />
      </Box>
    );
  }

  return (
    <Box className="flex-grow bg-[#f8fafc] overflow-y-auto px-8 py-6 select-none space-y-6">
      {/* Header controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
            Products / WytSaaS / Marketplace
          </div>
          <h2 className="text-2xl font-extrabold text-wytnet-dark mt-1">
            App Marketplace
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Discover, review, and subscribe to premium digital ecosystem application nodes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-400 text-xs font-semibold pl-9 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-slate-700 shadow-sm w-48 sm:w-64"
            />
          </div>

          <button
            onClick={loadApps}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:text-wytnet-blue font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Grid of Apps */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <CircularProgress size={36} sx={{ color: '#0066cc' }} />
          <p className="text-slate-400 text-xs font-semibold mt-3">
            Loading marketplace apps...
          </p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-100 rounded-[24px] shadow-sm">
          <Store className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-slate-600 font-extrabold text-base">
            No Apps Available
          </h3>
          <p className="text-slate-400 text-xs text-center mt-1.5 max-w-sm">
            Check back later for newly approved digital ecosystem applications.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
          {filteredApps.map((brand) => (
            <div
              key={brand.id}
              className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Accent line on top */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-80" />

              <div>
                {/* Logo & Category */}
                <div className="flex items-start justify-between mb-4 mt-1">
                  <div className="h-12 w-12 rounded-xl overflow-hidden border border-slate-100 shadow-sm flex items-center justify-center bg-slate-50 shrink-0">
                    {brand.logo_url ? (
                      <img
                        src={brand.logo_url}
                        alt={`${brand.name} logo`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/80x80?text=App';
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center font-black text-white text-base bg-blue-600">
                        {brand.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <h3 className="text-sm font-extrabold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                  {brand.name}
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                  {brand.company_name || 'Savemom Private Limited'}
                </span>

                {/* External links mapping if any */}
                {brand.links && brand.links.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {brand.links.map((link, lIdx) => {
                      let badgeStyle = 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100';
                      if (link.link_type === 'play_store') {
                        badgeStyle = 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100';
                      } else if (link.link_type === 'app_store') {
                        badgeStyle = 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100';
                      } else if (link.link_type === 'github') {
                        badgeStyle = 'bg-slate-900 text-slate-100 border border-slate-800 hover:bg-slate-800';
                      } else if (link.link_type === 'website') {
                        badgeStyle = 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100';
                      }

                      return (
                        <a
                          key={lIdx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wide uppercase transition-all duration-200 no-underline ${badgeStyle}`}
                        >
                          <span>{link.title || link.link_type.replace('_', ' ')}</span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        </a>
                      );
                    })}
                  </div>
                )}

                {/* Short description */}
                <p className="text-xs font-medium text-slate-500 line-clamp-3 mt-3 leading-relaxed">
                  {brand.short_description || 'No description available for this application node.'}
                </p>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-end">
                <button
                  onClick={() => setSelectedApp(brand)}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer border-none bg-transparent outline-none"
                >
                  <span>View Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Box>
  );
}

import { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  RefreshCw,
  FolderOpen,
  ExternalLink
} from 'lucide-react';
import type { Brand } from '@/api/wytsaas/brand';

interface UserWatchlistCardsProps {
  user?: { email: string; name: string; role: string } | null;
}

interface SubscriptionItem {
  id: number;
  user_id: string;
  brand_id: number;
  plan_id: number;
  status: string;
  subscribed_at: string;
  brand?: Brand;
}

export default function UserWatchlistCards({ user: _user }: UserWatchlistCardsProps) {
  const [items, setItems] = useState<SubscriptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Toast Alerts State
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  const getAuthToken = () => {
    return localStorage.getItem('wytsaas_token') || '';
  };

  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const loadSubscriptions = async () => {
    setIsLoading(true);
    const token = getAuthToken();
    const email = _user?.email || 'guest';

    // 1. Try to fetch from the real backend endpoint if we have a valid token
    if (token && token !== 'mock-jwt-token-wytsaas' && token !== 'mock-jwt-token-xyz') {
      try {
        const response = await fetch('http://localhost:8000/brands/subscriptions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const activeOnly = (data.items || []).filter((item: any) => item.status === 'active' && item.brand);
          if (activeOnly.length > 0) {
            setItems(activeOnly);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Backend subscription fetch failed, checking fallback...', err);
      }
    }

    // 2. Fallback / Mock Mode:
    // Resolve brand details. Try to fetch all brands from the public backend endpoint first.
    let allBrands: Brand[] = [];
    try {
      const brandsResponse = await fetch('http://localhost:8000/brands/');
      if (brandsResponse.ok) {
        const brandsData = await brandsResponse.json();
        allBrands = brandsData.items || [];
      }
    } catch (err) {
      console.warn('Failed to fetch brands from public backend, falling back to local storage', err);
    }

    // Fall back to mock_brands in local storage if backend call didn't yield brands
    if (allBrands.length === 0) {
      try {
        const storedBrands = localStorage.getItem('mock_brands');
        allBrands = storedBrands ? JSON.parse(storedBrands) : [];
      } catch (e) {
        console.error('Failed to parse mock_brands', e);
      }
    }

    // Load mock user subscriptions
    try {
      const activeSubsStr = localStorage.getItem(`mock_user_subscriptions_${email}`);
      const activeSubs = activeSubsStr ? JSON.parse(activeSubsStr) : {};
      
      const subItems: SubscriptionItem[] = [];
      let idCounter = 1;

      if (Array.isArray(activeSubs)) {
        for (const brandId of activeSubs) {
          const bId = Number(brandId);
          const brand = allBrands.find(b => b.id === bId);
          if (brand) {
            subItems.push({
              id: idCounter++,
              user_id: _user?.email || 'mock-user-uuid',
              brand_id: bId,
              plan_id: 1,
              status: 'active',
              subscribed_at: new Date().toISOString(),
              brand
            });
          }
        }
      } else if (activeSubs && typeof activeSubs === 'object') {
        for (const [brandIdStr, planId] of Object.entries(activeSubs)) {
          const bId = Number(brandIdStr);
          const brand = allBrands.find(b => b.id === bId);
          if (brand) {
            subItems.push({
              id: idCounter++,
              user_id: _user?.email || 'mock-user-uuid',
              brand_id: bId,
              plan_id: Number(planId),
              status: 'active',
              subscribed_at: new Date().toISOString(),
              brand
            });
          }
        }
      }
      setItems(subItems);
    } catch (err) {
      console.error('Failed to load mock subscriptions', err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [_user]);

  return (
    <Box className="flex-grow bg-[#f8fafc] overflow-y-auto px-8 py-6 select-none space-y-6">
      {/* Toast notifications */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>

      {/* Header controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
            Products / WytSaaS / Subscriptions
          </div>
          <h2 className="text-2xl font-extrabold text-wytnet-dark mt-1">
            My Apps
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            A list of applications you have purchased or subscribed to for tracking and quick access.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadSubscriptions}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:text-wytnet-blue font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Subscriptions Cards Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <CircularProgress size={36} sx={{ color: '#01875f' }} />
          <p className="text-slate-400 text-xs font-semibold mt-3">
            Loading your subscriptions...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-100 rounded-[24px] shadow-sm">
          <FolderOpen className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-slate-600 font-extrabold text-base">
            No Subscribed Apps Found
          </h3>
          <p className="text-slate-400 text-xs text-center mt-1.5 max-w-sm">
            Visit the marketplace to discover and subscribe to applications.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
          {items.map((item) => {
            const brand = item.brand;
            if (!brand) return null;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Accent strip on top */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#01875f] to-emerald-400 opacity-80" />

                <div>
                  {/* Top row: Logo & Status Badge */}
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
                        <div className="h-full w-full flex items-center justify-center font-black text-white text-base bg-[#01875f]">
                          {brand.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      item.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>

                  {/* App Name & Company */}
                  <h3 className="text-sm font-extrabold text-slate-800 leading-snug group-hover:text-[#01875f] transition-colors">
                    {brand.name}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                    {brand.company_name || 'Savemom Private Limited'}
                  </span>

                  {/* External Links */}
                  {brand.links && brand.links.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {brand.links.map((link, lIdx) => {
                        let badgeStyle = "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100";
                        if (link.link_type === 'play_store') {
                          badgeStyle = "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100";
                        } else if (link.link_type === 'app_store') {
                          badgeStyle = "bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100";
                        } else if (link.link_type === 'github') {
                          badgeStyle = "bg-slate-900 text-slate-100 border border-slate-800 hover:bg-slate-800";
                        } else if (link.link_type === 'website') {
                          badgeStyle = "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100";
                        }

                        return (
                          <a
                            key={lIdx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wide uppercase transition-all duration-200 no-underline ${badgeStyle}`}
                          >
                            <span>{link.title || link.link_type.replace('_', ' ')}</span>
                            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                          </a>
                        );
                      })}
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-xs font-medium text-slate-500 line-clamp-3 mt-3 leading-relaxed">
                    {brand.short_description || 'No description available for this application node.'}
                  </p>
                </div>

                {/* Footer buttons */}
                <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between gap-3">
                  <div className="text-[10px] text-slate-400 font-semibold">
                    Subscribed: {new Date(item.subscribed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  {brand.slug && (
                    <a
                      href={`${window.location.origin}${window.location.pathname}#marketplace/app/${brand.slug}`}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#01875f] hover:text-emerald-700 transition-colors no-underline cursor-pointer"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>View Details</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Box>
  );
}

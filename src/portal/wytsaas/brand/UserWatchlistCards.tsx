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
  Trash2,
  ExternalLink
} from 'lucide-react';
import type { WatchlistItem } from '../api/watchlist';
import { fetchWatchlist, removeFromWatchlist } from '../api/watchlist';

interface UserWatchlistCardsProps {
  user?: { email: string; name: string; role: string } | null;
}

export default function UserWatchlistCards({ user: _user }: UserWatchlistCardsProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
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

  const loadWatchlist = async () => {
    setIsLoading(true);
    const token = getAuthToken();
    try {
      const fetched = await fetchWatchlist(token);
      setItems(fetched);
    } catch (err: any) {
      console.error('Failed to load watchlist', err);
      showToast(err.message || 'Error fetching watchlist.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const handleRemove = async (brandId: number, brandName: string) => {
    const token = getAuthToken();
    try {
      await removeFromWatchlist(brandId, token);
      setItems(items.filter((item) => item.brand_id !== brandId));
      showToast(`Successfully removed ${brandName} from watchlist`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove from watchlist.', 'error');
    }
  };

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
            Products / WytSaaS / Watchlist
          </div>
          <h2 className="text-2xl font-extrabold text-wytnet-dark mt-1">
            My Apps
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            A curated list of applications added to your personal watchlist for tracking and quick access.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadWatchlist}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:text-wytnet-blue font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Watchlist Cards Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <CircularProgress size={36} sx={{ color: '#01875f' }} />
          <p className="text-slate-400 text-xs font-semibold mt-3">
            Loading your watchlist...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-100 rounded-[24px] shadow-sm">
          <FolderOpen className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-slate-600 font-extrabold text-base">
            Your Watchlist is Empty
          </h3>
          <p className="text-slate-400 text-xs text-center mt-1.5 max-w-sm">
            Visit the marketplace to discover applications and tap the "Add to wishlist" button to save them here.
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
                  {/* Top row: Logo & Unwatch */}
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

                    <button
                      onClick={() => handleRemove(brand.id, brand.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer transition-colors border-none bg-transparent"
                      title="Remove from Watchlist"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* App Name & Company */}
                  <h3 className="text-sm font-extrabold text-slate-800 leading-snug group-hover:text-[#01875f] transition-colors">
                    {brand.name}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                    {brand.company_name || 'Savemom Private Limited'}
                  </span>

                  {/* Description */}
                  <p className="text-xs font-medium text-slate-500 line-clamp-3 mt-3 leading-relaxed">
                    {brand.short_description || 'No description available for this application node.'}
                  </p>
                </div>

                {/* Footer buttons */}
                <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between gap-3">
                  <div className="text-[10px] text-slate-400 font-semibold">
                    Added: {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
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

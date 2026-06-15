import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Alert,
  Snackbar,
  Tooltip
} from '@mui/material';
import {
  RefreshCw,
  Search,
  Trash2,
  FolderOpen,
  User,
  AppWindow
} from 'lucide-react';
import type { WatchlistItem } from '../api/watchlist';
import { fetchWatchlist, removeFromWatchlist } from '../api/watchlist';

interface WatchlistCRUDProps {
  user?: { email: string; name: string; role: string } | null;
}

export default function WatchlistCRUD({ user: _user }: WatchlistCRUDProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<WatchlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filter list when search or items updates
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setFilteredItems(items);
    } else {
      setFilteredItems(
        items.filter(
          (item) =>
            item.user_id.toLowerCase().includes(q) ||
            (item.brand && item.brand.name.toLowerCase().includes(q)) ||
            (item.brand && item.brand.slug.toLowerCase().includes(q)) ||
            item.brand_id.toString().includes(q)
        )
      );
    }
  }, [searchQuery, items]);

  const handleRemove = async (brandId: number, brandName: string) => {
    const token = getAuthToken();
    try {
      await removeFromWatchlist(brandId, token);
      setItems(items.filter((item) => item.brand_id !== brandId));
      showToast(`Successfully unwatched ${brandName}`, 'success');
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
            Products / WytSaaS / Settings / Watchlist
          </div>
          <h2 className="text-2xl font-extrabold text-wytnet-dark mt-1">
            Apps Watchlist
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Track user-watched application nodes and registered client access identifiers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outlined"
            size="medium"
            onClick={loadWatchlist}
            sx={{
              borderColor: '#e2e8f0',
              color: '#475569',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 'bold',
              bgcolor: 'white',
              '&:hover': {
                borderColor: '#cbd5e1',
                bgcolor: '#f8fafc',
              }
            }}
            startIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Table filter and list Card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '24px',
          border: '1px solid #f1f5f9',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.005)'
        }}
      >
        {/* Search header inside card */}
        <Box sx={{ p: 3, borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box className="relative flex-grow max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by app name, slug, or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-100 hover:border-slate-200 focus:border-slate-300 text-xs font-semibold pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark"
            />
          </Box>
          <Typography className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            {filteredItems.length} watched items
          </Typography>
        </Box>

        {/* Watchlist Table */}
        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={32} sx={{ color: '#0066cc' }} />
            <Typography className="text-slate-400 text-xs font-semibold mt-2.5">
              Querying watchlist database...
            </Typography>
          </Box>
        ) : filteredItems.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10 }}>
            <div className="flex flex-col items-center justify-center text-slate-400">
              <FolderOpen className="h-10 w-10 text-slate-300 mb-3" />
              <Typography className="text-slate-500 font-extrabold text-sm">
                No Watchlist Items Found
              </Typography>
              <Typography className="text-slate-400 text-xs mt-1">
                Apps added to watchlist by users will be listed here.
              </Typography>
            </div>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 520 }}>
            <Table stickyHeader size="medium">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}><User className="h-3 w-3 inline mr-1" /> User ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}><AppWindow className="h-3 w-3 inline mr-1" /> App ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>Logo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>App Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>Slug</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>Added Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase', textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: 'all 0.15s' }}
                  >
                    <TableCell sx={{ fontSize: '11.5px', fontFamily: 'monospace', color: '#475569', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Tooltip title={item.user_id}>
                        <span>{item.user_id}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>
                      {item.brand_id}
                    </TableCell>
                    <TableCell>
                      {item.brand?.logo_url ? (
                        <img
                          src={item.brand.logo_url}
                          alt={`${item.brand.name} logo`}
                          className="h-8 w-8 object-cover rounded-lg border border-slate-100 shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/80x80?text=App';
                          }}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center font-black text-white text-xs shadow-sm bg-blue-500">
                          {item.brand?.name ? item.brand.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '12.5px', color: '#1e293b' }}>
                      {item.brand?.name || 'Unknown App'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'monospace' }}>
                      {item.brand?.slug ? `/${item.brand.slug}` : '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px', fontWeight: '500', color: '#334155' }}>
                      {item.brand?.company_name || '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#64748b' }}>
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleRemove(item.brand_id, item.brand?.name || 'App')}
                        size="small"
                        sx={{
                          color: '#64748b',
                          '&:hover': {
                            color: '#ef4444',
                            bgcolor: '#fee2e2'
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}

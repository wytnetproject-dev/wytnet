import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Chip
} from '@mui/material';
import {
  Plus,
  RefreshCw,
  Search,
  Check,
  AlertTriangle,
  WifiOff,
  Sliders,
  ChevronLeft,
  KeyRound,
  CreditCard,
  Images,
  Users,
  Settings
} from 'lucide-react';
import type {
  Brand,
  BrandCreateInput,
  BrandUpdateInput
} from '@/api/wytsaas/brand';
import {
  fetchBrands,
  updateBrand,
  createBrand,
  deleteBrand
} from '@/api/wytsaas/brand';
import { createSubscriptionPlan } from '@/api/wytsaas/subscription';

// Sub-components inside the same folder
import BrandTable from './BrandTable';
import BrandForm from './BrandForm';
import BrandAssets from './BrandAssets';
import SSOIntegration from './SSOIntegration';
import PaymentIntegration from './PaymentIntegration';
import BrandSubscriptions from '@/custom-pages/subscription/BrandSubscriptions';

import BrandIntegrationSettings from './BrandIntegrationSettings';
import { fetchWatchlist, addToWatchlist, removeFromWatchlist } from '@/api/wytsaas/watchlist';

interface BrandsCRUDProps {
  user?: { email: string; name: string; role: string } | null;
  portalType: 'wytsaas' | 'wytpass';
}

const DEFAULT_MOCK_BRANDS: Brand[] = [];

export default function BrandsCRUD({ user, portalType }: BrandsCRUDProps) {
  // Theme color styles depending on portalType
  const primaryColor = portalType === 'wytsaas' ? '#0066cc' : '#9333ea';
  const primaryHoverColor = portalType === 'wytsaas' ? '#0052a3' : '#7e22ce';

  // State
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSandbox, setIsSandbox] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);

  // View State: 'list' | 'create' | 'edit' | 'details'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'details'>('list');
  const [selectedDetailBrand, setSelectedDetailBrand] = useState<Brand | null>(null);
  const [detailTab, setDetailTab] = useState<'assets' | 'subscriptions' | 'sso' | 'payment' | 'integration'>('assets');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);

  // Form Submission Error State
  const [formError, setFormError] = useState<string | null>(null);

  // Toast Alerts State
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  // Load JWT Auth token
  const getAuthToken = () => {
    return localStorage.getItem(portalType === 'wytsaas' ? 'wytsaas_token' : 'wytpass_token') || '';
  };

  // Trigger Toast helper
  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const loadWatchlistIds = async () => {
    const token = getAuthToken();
    try {
      const watchlist = await fetchWatchlist(token);
      setWatchlistIds(watchlist.map((item) => item.brand_id));
    } catch (err) {
      console.warn('Failed to load watchlist IDs', err);
    }
  };

  const handleToggleWatch = async (brandId: number) => {
    const token = getAuthToken();
    const isWatched = watchlistIds.includes(brandId);
    try {
      if (isWatched) {
        await removeFromWatchlist(brandId, token);
        setWatchlistIds(watchlistIds.filter((id) => id !== brandId));
        showToast('App removed from watchlist', 'success');
      } else {
        await addToWatchlist(brandId, token);
        setWatchlistIds([...watchlistIds, brandId]);
        showToast('App added to watchlist', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Watchlist action failed', 'error');
    }
  };

  // Fetch Brands implementation
  const loadBrands = async (forceMock = false) => {
    setIsLoading(true);
    await loadWatchlistIds();
    if (forceMock) {
      const stored = localStorage.getItem('mock_brands');
      const initial = stored ? JSON.parse(stored) : DEFAULT_MOCK_BRANDS;
      if (!stored) {
        localStorage.setItem('mock_brands', JSON.stringify(initial));
      }
      setBrands(initial);
      setIsSandbox(true);
      setIsLoading(false);
      return;
    }

    try {
      const fetched = await fetchBrands();
      setBrands(fetched);
      setIsSandbox(false);
    } catch (err) {
      console.warn('FastAPI backend connection failed. Enabling mock fallback sandbox.', err);
      const stored = localStorage.getItem('mock_brands');
      const initial = stored ? JSON.parse(stored) : DEFAULT_MOCK_BRANDS;
      if (!stored) {
        localStorage.setItem('mock_brands', JSON.stringify(initial));
      }
      setBrands(initial);
      setIsSandbox(true);
      showToast('FastAPI server offline. Switched to Mock Sandbox Mode.', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  // Filter list when search or brands updates
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setFilteredBrands(brands);
    } else {
      setFilteredBrands(
        brands.filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            b.slug.toLowerCase().includes(q) ||
            (b.company_name && b.company_name.toLowerCase().includes(q))
        )
      );
    }
  }, [searchQuery, brands]);

  // Open Dialog for Create
  const handleOpenCreate = () => {
    setEditingBrand(null);
    setFormError(null);
    setViewMode('create');
  };

  // Open Dialog for Edit
  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormError(null);
    setViewMode('edit');
  };

  // Open Details View
  const handleOpenDetails = (brand: Brand) => {
    setSelectedDetailBrand(brand);
    setDetailTab('assets');
    setViewMode('details');
  };

  // Handle submit from Drawer form
  const handleDrawerSubmit = async (brandPayload: BrandCreateInput | BrandUpdateInput) => {
    if (isSandbox) {
      // Mock Sandbox save logic
      let updatedList = [...brands];
      const nowString = new Date().toISOString();

      const mappedTags = brandPayload.tags
        ? brandPayload.tags.map((t, idx) => ({ id: idx + 1, name: t }))
        : undefined;

      if (editingBrand) {
        // Edit existing
        updatedList = updatedList.map((b) =>
          b.id === editingBrand.id
            ? {
              ...b,
              ...brandPayload,
              tags: mappedTags !== undefined ? mappedTags : b.tags,
              updated_at: nowString,
            } as Brand
            : b
        );
        showToast('App updated successfully (Sandbox)', 'success');
      } else {
        // Create new
        const newId = brands.length > 0 ? Math.max(...brands.map((b) => b.id), 0) + 1 : 1;
        const newBrand: Brand = {
          id: newId,
          ...brandPayload,
          tags: mappedTags || [],
          created_by: user?.email || 'mock-user',
          created_at: nowString,
          updated_at: nowString,
        } as Brand;
        updatedList.push(newBrand);

        // Automatically create a mock Free Plan in local storage
        try {
          const storedPlans = localStorage.getItem('mock_subscription_plans');
          const currentPlans = storedPlans ? JSON.parse(storedPlans) : [];
          const nextPlanId = currentPlans.length > 0 ? Math.max(...currentPlans.map((p: any) => p.id), 0) + 1 : 1;
          const mockFreePlan = {
            id: nextPlanId,
            brand_id: newId,
            name: 'Free Plan',
            description: 'Free basic access',
            price: 0,
            features: ['Basic features'],
            billing_cycle: 'monthly',
            external_plan_id: null,
            status: 'active',
            created_at: nowString
          };
          currentPlans.push(mockFreePlan);
          localStorage.setItem('mock_subscription_plans', JSON.stringify(currentPlans));
          showToast('App created successfully with mock Free Plan.', 'success');
        } catch (err) {
          console.warn('Failed to automatically create mock Free Plan:', err);
          showToast('App created successfully (Sandbox)', 'success');
        }
      }

      localStorage.setItem('mock_brands', JSON.stringify(updatedList));
      setBrands(updatedList);
    } else {
      // Actual backend network calls
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token missing. Please re-login.');
      }

      if (editingBrand) {
        // Update API
        const updated = await updateBrand(editingBrand.id, brandPayload as BrandUpdateInput, token);
        setBrands(brands.map((b) => (b.id === editingBrand.id ? updated : b)));
        showToast('App updated successfully.', 'success');
      } else {
        // Create API
        const created = await createBrand(brandPayload as BrandCreateInput, token);

        // Automatically create a Free Plan for the new brand on the backend
        try {
          await createSubscriptionPlan(created.id, {
            name: 'Free Plan',
            description: 'Free basic access',
            price: 0,
            billing_cycle: 'monthly',
            status: 'active',
            features: ['Basic features']
          }, token);
        } catch (planErr) {
          console.warn('Failed to automatically create Free Plan for the brand:', planErr);
        }

        setBrands([...brands, created]);
        showToast('App created successfully with Free Plan.', 'success');
      }
    }
  };

  // Open Delete confirmation
  const handleOpenDelete = (brand: Brand) => {
    setBrandToDelete(brand);
    setIsDeleteOpen(true);
  };

  // Confirm Delete operation
  const handleDeleteConfirm = async () => {
    if (!brandToDelete) return;

    if (isSandbox) {
      // Mock deletion
      const updatedList = brands.filter((b) => b.id !== brandToDelete.id);
      localStorage.setItem('mock_brands', JSON.stringify(updatedList));
      setBrands(updatedList);
      showToast('App deleted successfully (Sandbox)', 'success');
      setIsDeleteOpen(false);
      setBrandToDelete(null);
    } else {
      // Actual API deletion
      const token = getAuthToken();
      if (!token) {
        showToast('Authentication token missing.', 'error');
        return;
      }

      try {
        await deleteBrand(brandToDelete.id, token);
        setBrands(brands.filter((b) => b.id !== brandToDelete.id));
        showToast('App deleted successfully.', 'success');
        setIsDeleteOpen(false);
        setBrandToDelete(null);
      } catch (err: any) {
        showToast(err.message || 'Failed to delete app from backend.', 'error');
      }
    }
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <Box className="flex-grow overflow-hidden h-full flex flex-col relative bg-[#f8fafc]">
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

        <BrandForm
          onCancel={() => setViewMode('list')}
          onSubmit={handleDrawerSubmit}
          editingBrand={editingBrand}
          primaryColor={primaryColor}
          primaryHoverColor={primaryHoverColor}
          formError={formError}
          setFormError={setFormError}
          isSandbox={isSandbox}
        />
      </Box>
    );
  }

  if (viewMode === 'details' && selectedDetailBrand) {
    return (
      <Box className="flex-grow overflow-y-auto h-full flex flex-col relative bg-[#f8fafc] px-8 py-6 select-none space-y-6">
        {/* Header with Back button and brand info */}
        <div className="flex items-center gap-4 shrink-0">
          <Button
            variant="outlined"
            onClick={() => setViewMode('list')}
            sx={{
              borderColor: '#e2e8f0',
              color: '#475569',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 'bold',
              bgcolor: 'white',
              minWidth: 'auto',


              '&:hover': {
                borderColor: '#cbd5e1',
                bgcolor: '#f8fafc',
              }
            }}
            startIcon={<ChevronLeft className="h-4 w-4" />}
          >

          </Button>

          <div className="flex items-center gap-3">
            {selectedDetailBrand.logo_url ? (
              <img
                src={selectedDetailBrand.logo_url}
                alt={`${selectedDetailBrand.name} logo`}
                className="h-10 w-10 object-cover rounded-xl border border-slate-100 shadow-sm"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-sm" style={{ backgroundColor: primaryColor }}>
                {selectedDetailBrand.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-extrabold text-wytnet-dark flex items-center gap-2 leading-none">
                {selectedDetailBrand.name}
              </h2>
              <span className="text-[10px] font-mono text-slate-400 mt-1 block">/{selectedDetailBrand.slug}</span>
            </div>
          </div>
        </div>

        {/* Tab Selection buttons */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit shrink-0">
          <button
            onClick={() => setDetailTab('assets')}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${detailTab === 'assets' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <Images className="h-3.5 w-3.5" />
            App Assets
          </button>
          <button
            onClick={() => setDetailTab('subscriptions')}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${detailTab === 'subscriptions' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Subscription Plans
          </button>

          <button
            onClick={() => setDetailTab('integration')}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${detailTab === 'integration' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <Settings className="h-3.5 w-3.5" />
            API Integration
          </button>
          <button
            onClick={() => setDetailTab('sso')}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${detailTab === 'sso' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            SSO Integration
          </button>
          <button
            onClick={() => setDetailTab('payment')}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${detailTab === 'payment' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Payment Integration
          </button>
        </div>

        {/* Tab Workspace content */}
        <div className="bg-white rounded-2xl border border-slate-100 flex flex-col p-6 shadow-sm">
          {detailTab === 'sso' ? (
            <SSOIntegration
              user={user}
              portalType={portalType}
              brandId={selectedDetailBrand.id}
              isEmbedded={true}
            />
          ) : detailTab === 'payment' ? (
            <PaymentIntegration
              user={user}
              portalType={portalType}
              brandId={selectedDetailBrand.id}
              isEmbedded={true}
            />
          ) : detailTab === 'assets' ? (
            <BrandAssets
              user={user}
              portalType={portalType}
              brandId={selectedDetailBrand.id}
              isEmbedded={true}
            />

          ) : detailTab === 'integration' ? (
            <BrandIntegrationSettings
              brandId={selectedDetailBrand.id}
              isSandbox={isSandbox}
              portalType={portalType}
            />
          ) : (
            <BrandSubscriptions
              user={user}
              portalType={portalType}
              brandId={selectedDetailBrand.id}
              isEmbedded={true}
            />
          )}
        </div>
      </Box>
    );
  }

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
            Products / {portalType === 'wytsaas' ? 'WytSaaS' : 'WytPass'} / Settings / <Sliders className="h-3 w-3 inline" /> Developer
          </div>

          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-2xl font-extrabold text-wytnet-dark">
              Apps Registry
            </h2>
            {isSandbox ? (
              <Chip
                icon={<WifiOff className="h-3 w-3" style={{ color: '#d97706' }} />}
                label="SANDBOX MODE"
                variant="outlined"
                size="small"
                sx={{
                  borderColor: '#fef3c7',
                  bgcolor: '#fffbeb',
                  color: '#b45309',
                  fontWeight: 'bold',
                  fontSize: '10px'
                }}
              />
            ) : (
              <Chip
                icon={<Check className="h-3.5 w-3.5" style={{ color: '#059669' }} />}
                label="CONNECTED TO API"
                variant="outlined"
                size="small"
                sx={{
                  borderColor: '#d1fae5',
                  bgcolor: '#ecfdf5',
                  color: '#047857',
                  fontWeight: 'bold',
                  fontSize: '10px'
                }}
              />
            )}
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Manage product apps, integration pipelines, and white-labeling configurations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outlined"
            size="medium"
            onClick={() => loadBrands()}
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

          <Button
            variant="contained"
            size="medium"
            onClick={handleOpenCreate}
            sx={{
              bgcolor: primaryColor,
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 'bold',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: primaryHoverColor,
                boxShadow: 'none',
              }
            }}
            startIcon={<Plus className="h-4 w-4" />}
          >
            Add App
          </Button>
        </div>
      </div>

      {/* Connection Offline Status Indicator */}
      {isSandbox && (
        <Alert
          severity="info"
          icon={<WifiOff className="h-4.5 w-4.5" />}
          sx={{
            borderRadius: '16px',
            border: '1px solid #fef3c7',
            bgcolor: '#fffbeb',
            color: '#713f12',
            fontWeight: '600',
            fontSize: '11px',
            '& .MuiAlert-icon': {
              color: '#d97706'
            }
          }}
        >
          FastAPI Backend (port 8000) is currently offline. You are interacting with the client-side sandbox container. All CRUD changes will be persisted to localStorage.
        </Alert>
      )}

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
              placeholder="Search by app name, slug, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-100 hover:border-slate-200 focus:border-slate-300 text-xs font-semibold pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark"
            />
          </Box>
          <Typography className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            {filteredBrands.length} registry items
          </Typography>
        </Box>

        {/* Brand List Table sub-component */}
        <BrandTable
          brands={filteredBrands}
          isLoading={isLoading}
          primaryColor={primaryColor}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          onViewDetails={handleOpenDetails}
          watchlistIds={watchlistIds}
          onToggleWatch={handleToggleWatch}
        />
      </Paper>

      {/* DELETE DIALOG MODAL */}
      <Dialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '24px',
              p: 1
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'black', color: '#1e293b', fontSize: '16px', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          <span>Confirm Deletion</span>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.625 }}>
            Are you sure you want to delete <strong>{brandToDelete?.name}</strong>? This action will permanently wipe this registry record from the system and is irreversible.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setIsDeleteOpen(false)}
            sx={{
              color: '#64748b',
              textTransform: 'none',
              fontWeight: 'bold',
              borderRadius: '10px'
            }}
          >
            Abort
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{
              bgcolor: '#ef4444',
              color: 'white',
              textTransform: 'none',
              fontWeight: 'bold',
              borderRadius: '10px',
              px: 3,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#dc2626',
                boxShadow: 'none'
              }
            }}
          >
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

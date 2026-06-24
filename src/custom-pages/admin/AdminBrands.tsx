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
  Chip,
  TextField
} from '@mui/material';
import {
  Plus,
  RefreshCw,
  Search,
  Check,
  AlertTriangle,
  WifiOff,
  ShieldCheck
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
  deleteBrand,
  actionFinalReview
} from '@/api/wytsaas/brand';

// Reuse existing sub-components from the brand folder
import BrandTable from '@/custom-pages/brand/BrandTable';
import BrandForm from '@/custom-pages/brand/BrandForm';
import { fetchWatchlist, addToWatchlist, removeFromWatchlist } from '@/api/wytsaas/watchlist';

interface AdminBrandsProps {
  user?: { email: string; name: string; role: string } | null;
  portalType: 'wytsaas' | 'wytpass';
}

const DEFAULT_MOCK_BRANDS: Brand[] = [];

export default function AdminBrands({ user, portalType }: AdminBrandsProps) {
  const primaryColor = '#10b981'; // Sleek Emerald color for admin view
  const primaryHoverColor = '#059669';

  // State
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSandbox, setIsSandbox] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);

  // View State: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);

  const [formError, setFormError] = useState<string | null>(null);

  const [isFinalReviewOpen, setIsFinalReviewOpen] = useState(false);
  const [finalReviewBrand, setFinalReviewBrand] = useState<Brand | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Toast alerts
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  const getAuthToken = () => {
    return localStorage.getItem(portalType === 'wytsaas' ? 'wytsaas_token' : 'wytpass_token') || '';
  };

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

  // Filter list when search query or brands updates
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

  const handleOpenCreate = () => {
    setEditingBrand(null);
    setFormError(null);
    setViewMode('create');
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormError(null);
    setViewMode('edit');
  };

  const handleDrawerSubmit = async (brandPayload: BrandCreateInput | BrandUpdateInput) => {
    if (isSandbox) {
      let updatedList = [...brands];
      const nowString = new Date().toISOString();
      
      const mappedTags = brandPayload.tags 
        ? brandPayload.tags.map((t, idx) => ({ id: idx + 1, name: t })) 
        : undefined;

      if (editingBrand) {
        // Edit existing
        updatedList = updatedList.map((b) =>
          b.id === editingBrand.id
            ? ({
                ...b,
                ...brandPayload,
                tags: mappedTags !== undefined ? mappedTags : b.tags,
                updated_at: nowString,
              } as Brand)
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
        showToast('App created successfully (Sandbox)', 'success');
      }

      localStorage.setItem('mock_brands', JSON.stringify(updatedList));
      setBrands(updatedList);
    } else {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token missing. Please re-login.');
      }

      if (editingBrand) {
        const updated = await updateBrand(editingBrand.id, brandPayload as BrandUpdateInput, token);
        setBrands(brands.map((b) => (b.id === editingBrand.id ? updated : b)));
        showToast('App updated successfully.', 'success');
      } else {
        const created = await createBrand(brandPayload as BrandCreateInput, token);
        setBrands([...brands, created]);
        showToast('App created successfully.', 'success');
      }
    }
  };

  const handleOpenDelete = (brand: Brand) => {
    setBrandToDelete(brand);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!brandToDelete) return;

    if (isSandbox) {
      const updatedList = brands.filter((b) => b.id !== brandToDelete.id);
      localStorage.setItem('mock_brands', JSON.stringify(updatedList));
      setBrands(updatedList);
      showToast('App deleted successfully (Sandbox)', 'success');
      setIsDeleteOpen(false);
      setBrandToDelete(null);
    } else {
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

  const handleOpenFinalReview = (brand: Brand) => {
    setFinalReviewBrand(brand);
    setReviewNotes('');
    setIsFinalReviewOpen(true);
  };

  const handleFinalReviewAction = async (status: 'approved' | 'rejected') => {
    if (!finalReviewBrand) return;

    setIsSubmittingAction(true);
    try {
      if (isSandbox) {
        // Sandbox update
        const updatedList = brands.map((b) => {
          if (b.id === finalReviewBrand.id) {
            return {
              ...b,
              current_stage: status === 'approved' ? 'Onboarding Completed' : 'Final Review Rejected',
              status: status === 'approved' ? 'Approved' : 'Rejected',
              updated_at: new Date().toISOString()
            };
          }
          return b;
        });

        localStorage.setItem('mock_brands', JSON.stringify(updatedList));
        setBrands(updatedList);
        showToast(`Final onboarding review ${status} successfully (Sandbox)`, 'success');
      } else {
        const token = getAuthToken();
        if (!token) {
          showToast('Authentication token missing. Please log in again.', 'error');
          setIsSubmittingAction(false);
          return;
        }

        const updated = await actionFinalReview(finalReviewBrand.id, status, reviewNotes, token);

        // Update list
        setBrands(brands.map((b) => (b.id === finalReviewBrand.id ? updated : b)));
        showToast(`Final onboarding review ${status} successfully.`, 'success');
      }
      setIsFinalReviewOpen(false);
      setFinalReviewBrand(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit review action.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  if (viewMode !== 'list') {
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

  return (
    <Box className="flex-grow bg-[#f8fafc] overflow-y-auto px-8 py-6 select-none space-y-6">
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
            Products / {portalType === 'wytsaas' ? 'WytSaaS' : 'WytPass'} / Administration / <ShieldCheck className="h-3 w-3 inline" /> Admin Panel
          </div>
          
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-2xl font-extrabold text-wytnet-dark">
              Admin Apps Management
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
            Full administrative control over product app profiles, approval stages, and global metadata settings.
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
          FastAPI Backend (port 8000) is offline. Sandbox local persistence enabled. All app profile modifications will be saved to your local browser storage.
        </Alert>
      )}

      {/* Table Card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '24px',
          border: '1px solid #f1f5f9',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.005)'
        }}
      >
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
            {filteredBrands.length} global items
          </Typography>
        </Box>

        <BrandTable
          brands={filteredBrands}
          isLoading={isLoading}
          primaryColor={primaryColor}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          onApproveFinalReview={handleOpenFinalReview}
          watchlistIds={watchlistIds}
          onToggleWatch={handleToggleWatch}
        />
      </Paper>

      {/* Delete Confirmation */}
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
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1e293b', fontSize: '16px', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          <span>Confirm Administrative Deletion</span>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.625 }}>
            Are you sure you want to permanently delete <strong>{brandToDelete?.name}</strong>? As a `wytsaas_admin` user, this will completely erase the database registry record from the system.
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
            Cancel
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

      {/* FINAL REVIEW DIALOG */}
      <Dialog
        open={isFinalReviewOpen}
        onClose={() => !isSubmittingAction && setIsFinalReviewOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '24px',
              p: 1.5
            }
          }
        }}
      >
        {finalReviewBrand && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1 }}>
              {finalReviewBrand.logo_url ? (
                <img
                  src={finalReviewBrand.logo_url}
                  alt={finalReviewBrand.name}
                  className="h-10 w-10 rounded-xl border border-slate-100 object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm border border-slate-200">
                  {finalReviewBrand.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <Typography sx={{ fontWeight: 'bold', color: '#1e293b', fontSize: '16px' }}>
                  Verify Final Onboarding Approval
                </Typography>
                <Typography className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  {finalReviewBrand.name} • {finalReviewBrand.company_name || 'N/A'}
                </Typography>
              </div>
            </DialogTitle>

            <DialogContent sx={{ spaceY: 3, pt: 2 }}>
              <Box className="space-y-4">
                <Typography sx={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, mt: 1 }}>
                  Both WytPass SSO compliance and WytPayment SDK configurations have been successfully integrated and verified. Please confirm if this application is ready to complete onboarding and publish live.
                </Typography>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>SSO Verification Status</span>
                    <span className="text-emerald-600 font-extrabold uppercase">Approved</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>Payment Verification Status</span>
                    <span className="text-emerald-600 font-extrabold uppercase">Approved</span>
                  </div>
                </div>

                {/* Notes Input Field */}
                <Box className="space-y-1.5 pt-1">
                  <Typography className="text-xs font-bold text-slate-600 mb-1">
                    Auditor Review Decision Notes
                  </Typography>
                  <TextField
                    multiline
                    rows={3}
                    fullWidth
                    disabled={isSubmittingAction}
                    placeholder="Enter review decision notes, feedback, or custom audit trails..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '12px',
                        fontWeight: '600',
                        borderRadius: '12px',
                        color: '#334155',
                        '& fieldset': { borderColor: '#e2e8f0' },
                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                        '&.Mui-focused fieldset': { borderColor: primaryColor }
                      }
                    }}
                  />
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
              <Button
                disabled={isSubmittingAction}
                onClick={() => setIsFinalReviewOpen(false)}
                sx={{
                  color: '#64748b',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  borderRadius: '10px'
                }}
              >
                Close
              </Button>

              <Button
                disabled={isSubmittingAction}
                onClick={() => handleFinalReviewAction('rejected')}
                variant="outlined"
                sx={{
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  borderRadius: '10px',
                  '&:hover': {
                    borderColor: '#dc2626',
                    bgcolor: '#fef2f2'
                  }
                }}
              >
                Reject Onboarding
              </Button>

              <Button
                disabled={isSubmittingAction}
                onClick={() => handleFinalReviewAction('approved')}
                variant="contained"
                sx={{
                  bgcolor: primaryColor,
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  borderRadius: '10px',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: primaryHoverColor,
                    boxShadow: 'none'
                  }
                }}
              >
                Approve & Complete
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Snackbar,
  Chip,
  MenuItem,
  Select,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Plus,
  RefreshCw,
  Search,
  Check,
  AlertTriangle,
  WifiOff,
  CreditCard
} from 'lucide-react';
import type { Brand } from '@/api/wytsaas/brand';
import { fetchBrands, updateBrand } from '@/api/wytsaas/brand';
import type {
  BrandSubscriptionPlan,
  BrandSubscriptionPlanCreateInput,
  BrandSubscriptionPlanUpdateInput
} from '@/api/wytsaas/subscription';
import {
  fetchSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan
} from '@/api/wytsaas/subscription';

import SubscriptionTable from './SubscriptionTable';
import SubscriptionDialog from './SubscriptionDialog';

interface BrandSubscriptionsProps {
  user?: { email: string; name: string; role: string } | null;
  portalType: 'wytsaas' | 'wytpass';
  brandId?: number;
  isEmbedded?: boolean;
  onRefreshBrand?: () => void;
  readOnly?: boolean;
}

export default function BrandSubscriptions({ user: _user, portalType, brandId, isEmbedded, onRefreshBrand, readOnly = false }: BrandSubscriptionsProps) {
  const primaryColor = portalType === 'wytsaas' ? '#0066cc' : '#9333ea';
  const primaryHoverColor = portalType === 'wytsaas' ? '#0052a3' : '#7e22ce';

  // State lists
  const [brands, setBrands] = useState<Brand[]>([]);
  const [plans, setPlans] = useState<BrandSubscriptionPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<BrandSubscriptionPlan[]>([]);

  // Filtering states
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>(
    brandId ? brandId.toString() : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Status states
  const [isLoading, setIsLoading] = useState(true);
  const [isSandbox, setIsSandbox] = useState(false);

  // Modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BrandSubscriptionPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<BrandSubscriptionPlan | null>(null);

  // Toast State
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

  // Main Loader
  const loadData = async () => {
    setIsLoading(true);
    let loadedBrands: Brand[] = [];

    // 1. Fetch Brands
    try {
      loadedBrands = await fetchBrands();
      setBrands(loadedBrands);
      setIsSandbox(false);
    } catch (err) {
      console.warn('Backend API connection failed for brands. Fallback to local storage.', err);
      const stored = localStorage.getItem('mock_brands');
      loadedBrands = stored ? JSON.parse(stored) : [];
      setBrands(loadedBrands);
      setIsSandbox(true);
    }

    // 2. Fetch Subscription Plans
    try {
      if (isSandbox) {
        throw new Error('Already in sandbox mode');
      }
      const token = getAuthToken();
      const fetchedPlans = await fetchSubscriptionPlans(token);
      setPlans(fetchedPlans);
    } catch (err) {
      console.warn('Backend API connection failed for plans. Loading mock subscription plans.');
      setIsSandbox(true);
      const storedPlans = localStorage.getItem('mock_subscription_plans');
      if (storedPlans) {
        setPlans(JSON.parse(storedPlans));
      } else {
        localStorage.setItem('mock_subscription_plans', JSON.stringify([]));
        setPlans([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (brandId) {
      setSelectedBrandFilter(brandId.toString());
    }
  }, [brandId]);

  // Filter plans based on brand select and search query
  useEffect(() => {
    let list = plans;

    // Filter by brand
    if (selectedBrandFilter !== 'all') {
      const bId = parseInt(selectedBrandFilter, 10);
      list = list.filter(p => p.brand_id === bId);
    }

    // Filter by search query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(p => {
        const brandName = getBrandName(p.brand_id).toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          brandName.includes(q) ||
          (p.features && p.features.some(f => f.toLowerCase().includes(q))) ||
          (p.external_plan_id && p.external_plan_id.toLowerCase().includes(q))
        );
      });
    }

    setFilteredPlans(list);
  }, [plans, selectedBrandFilter, searchQuery]);

  // Helper: Find brand name by ID
  const getBrandName = (brandId: number): string => {
    const brand = brands.find(b => b.id === brandId);
    return brand ? brand.name : `Brand ID: ${brandId}`;
  };

  // Helper: Find brand logo or initial
  const getBrandLogo = (brandId: number) => {
    const brand = brands.find(b => b.id === brandId);
    return brand ? brand.logo_url : null;
  };

  // Open Dialog for Create
  const handleOpenCreate = () => {
    setEditingPlan(null);
    setIsDialogOpen(true);
  };

  // Open Dialog for Edit
  const handleOpenEdit = (plan: BrandSubscriptionPlan) => {
    setEditingPlan(plan);
    setIsDialogOpen(true);
  };

  // Dialog Form submit handler
  const handleDialogSubmit = async (payload: BrandSubscriptionPlanCreateInput, brandId: number) => {
    if (isSandbox) {
      // Local Storage Sandbox CRUD logic
      let updatedList = [...plans];
      const nowString = new Date().toISOString();

      if (editingPlan) {
        updatedList = updatedList.map(p =>
          p.id === editingPlan.id
            ? {
              ...p,
              brand_id: brandId,
              name: payload.name,
              description: payload.description || null,
              price: payload.price,
              features: payload.features || null,
              billing_cycle: payload.billing_cycle,
              external_plan_id: payload.external_plan_id || null,
              status: payload.status || 'active'
            }
            : p
        );
        showToast('Subscription plan updated (Sandbox)', 'success');
      } else {
        const nextId = plans.length > 0 ? Math.max(...plans.map(p => p.id)) + 1 : 1;
        const newPlan: BrandSubscriptionPlan = {
          id: nextId,
          brand_id: brandId,
          name: payload.name,
          description: payload.description || null,
          price: payload.price,
          features: payload.features || null,
          billing_cycle: payload.billing_cycle,
          external_plan_id: payload.external_plan_id || null,
          status: payload.status || 'active',
          created_at: nowString
        };
        updatedList.push(newPlan);
        showToast('Subscription plan created (Sandbox)', 'success');
      }

      localStorage.setItem('mock_subscription_plans', JSON.stringify(updatedList));
      setPlans(updatedList);
    } else {
      // Backend REST CRUD API call
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token missing. Please re-login.');
      }

      if (editingPlan) {
        const updated = await updateSubscriptionPlan(editingPlan.id, payload as BrandSubscriptionPlanUpdateInput, token);
        setPlans(plans.map(p => (p.id === editingPlan.id ? updated : p)));
        showToast('Subscription plan updated successfully.', 'success');
      } else {
        const created = await createSubscriptionPlan(brandId, payload, token);
        setPlans([...plans, created]);
        showToast('Subscription plan created successfully.', 'success');
      }
    }
  };

  // Open Delete Confirm
  const handleOpenDelete = (plan: BrandSubscriptionPlan) => {
    setPlanToDelete(plan);
    setIsDeleteOpen(true);
  };

  // Confirm Delete Plan
  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;

    if (isSandbox) {
      const updatedList = plans.filter(p => p.id !== planToDelete.id);
      localStorage.setItem('mock_subscription_plans', JSON.stringify(updatedList));
      setPlans(updatedList);
      showToast('Subscription plan deleted (Sandbox)', 'success');
      setIsDeleteOpen(false);
      setPlanToDelete(null);
    } else {
      const token = getAuthToken();
      if (!token) {
        showToast('Authentication token missing.', 'error');
        return;
      }

      try {
        await deleteSubscriptionPlan(planToDelete.id, token);
        setPlans(plans.filter(p => p.id !== planToDelete.id));
        showToast('Subscription plan deleted successfully.', 'success');
        setIsDeleteOpen(false);
        setPlanToDelete(null);
      } catch (err: any) {
        showToast(err.message || 'Failed to delete subscription plan from backend.', 'error');
      }
    }
  };

  const handleProceedToNextStage = async () => {
    if (!brandId) return;

    if (isSandbox) {
      const stored = localStorage.getItem('mock_brands');
      const mockList = stored ? JSON.parse(stored) : [];
      const updatedList = mockList.map((b: Brand) =>
        b.id === brandId
          ? {
              ...b,
              current_stage: 'API Integration',
              updated_at: new Date().toISOString()
            }
          : b
      );
      localStorage.setItem('mock_brands', JSON.stringify(updatedList));
      showToast('Subscription plans confirmed! Stage 4 unlocked: API Integration.', 'success');
      if (onRefreshBrand) {
        onRefreshBrand();
      }
    } else {
      const token = getAuthToken();
      if (!token) {
        showToast('Authentication token missing.', 'error');
        return;
      }
      try {
        await updateBrand(brandId, {
          current_stage: 'API Integration'
        }, token);
        showToast('Subscription plans confirmed! Stage 4 unlocked: API Integration.', 'success');
        if (onRefreshBrand) {
          onRefreshBrand();
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to update onboarding stage.', 'error');
      }
    }
  };

  const currentBrand = brandId ? brands.find(b => b.id === brandId) : null;

  return (
    <Box className={`select-none ${isEmbedded ? 'bg-transparent px-0 py-0 space-y-4' : 'bg-[#f8fafc] px-8 py-6 space-y-6 flex-grow overflow-y-auto h-full'}`}>
      {/* Toast SnackBar */}
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
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              Products / {portalType === 'wytsaas' ? 'WytSaaS' : 'WytPass'} / Subscriptions / <CreditCard className="h-3 w-3 inline" /> Developer
            </div>

            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-extrabold text-wytnet-dark">
                App Subscription Plans
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
              Create, configure and manage billing plans, subscription pricing and client models.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outlined"
              size="medium"
              onClick={() => loadData()}
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

            {!readOnly && (
              <Button
                variant="contained"
                size="medium"
                onClick={handleOpenCreate}
                disabled={brands.length === 0}
                sx={{
                  bgcolor: primaryColor,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: primaryHoverColor,
                    boxShadow: 'none',
                  },
                  '&:disabled': {
                    bgcolor: '#cbd5e1',
                    color: '#94a3b8'
                  }
                }}
                startIcon={<Plus className="h-4 w-4" />}
              >
                Create Plan
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Connection Offline alert */}
      {isSandbox && !isEmbedded && (
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
          FastAPI Backend (port 8000) is offline. Subscription plans are stored in local storage sandbox mode. Create an app in the Registry first before defining plans here.
        </Alert>
      )}

      {/* Main card panel */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '24px',
          border: '1px solid #f1f5f9',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.005)'
        }}
      >
        {/* Filters headers inside card */}
        <Box sx={{ p: 3, borderBottom: '1px solid #f8fafc', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, items: 'center', gap: 2 }}>
          {/* Brand select filter dropdown */}
          {!isEmbedded && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={selectedBrandFilter}
                onChange={(e) => setSelectedBrandFilter(e.target.value)}
                displayEmpty
                className="bg-white border-slate-100 font-semibold text-xs rounded-xl outline-none"
                sx={{
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#334155',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#f1f5f9'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#cbd5e1'
                  }
                }}
              >
                <MenuItem value="all" sx={{ fontSize: '11.5px', fontWeight: 'bold' }}>All Apps Registry</MenuItem>
                {brands.map(b => (
                  <MenuItem key={b.id} value={b.id.toString()} sx={{ fontSize: '11.5px', fontWeight: 'bold' }}>
                    {b.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Search plan name, desc */}
          <Box className="relative flex-grow max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by plan name, app, features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-100 hover:border-slate-200 focus:border-slate-300 text-xs font-semibold pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark"
            />
          </Box>

          <Box className="ml-auto flex items-center gap-3">
            <Typography className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              {filteredPlans.length} plans active
            </Typography>
            {isEmbedded && !readOnly && (
              <Button
                variant="contained"
                size="small"
                onClick={handleOpenCreate}
                disabled={brands.length === 0}
                sx={{
                  bgcolor: primaryColor,
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: primaryHoverColor,
                    boxShadow: 'none',
                  },
                  '&:disabled': {
                    bgcolor: '#cbd5e1',
                    color: '#94a3b8'
                  }
                }}
                startIcon={<Plus className="h-4 w-4" />}
              >
                Create Plan
              </Button>
            )}
          </Box>
        </Box>

        {/* Modularized Table View */}
        <SubscriptionTable
          plans={filteredPlans}
          isLoading={isLoading}
          primaryColor={primaryColor}
          getBrandLogo={getBrandLogo}
          getBrandName={getBrandName}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          readOnly={readOnly}
        />

        {/* Bottom Actions Panel inside Paper */}
        {isEmbedded && !readOnly && currentBrand && currentBrand.current_stage === 'Subscription Plan Configuration' && (
          <Box sx={{ p: 3, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: '#f8fafc' }}>
            <Button
              onClick={handleProceedToNextStage}
              variant="contained"
              sx={{
                bgcolor: '#10b981',
                color: 'white',
                textTransform: 'none',
                fontWeight: 'bold',
                borderRadius: '10px',
                px: 3.5,
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#059669',
                  boxShadow: 'none'
                }
              }}
              startIcon={<Check className="h-4 w-4" />}
            >
              Confirm Plans & Proceed
            </Button>
          </Box>
        )}
      </Paper>

      {/* Subscription Dialog */}
      <SubscriptionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleDialogSubmit}
        editingPlan={editingPlan}
        brands={brands}
        primaryColor={primaryColor}
        primaryHoverColor={portalType === 'wytsaas' ? '#0052a3' : '#7e22ce'}
        brandId={brandId}
      />

      {/* Delete Dialog */}
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
            Are you sure you want to delete the subscription plan <strong>{planToDelete?.name}</strong>? This action will permanently remove this pricing tier from the app registry.
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

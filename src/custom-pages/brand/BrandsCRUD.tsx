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
  Tooltip
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
  Settings,
  Lock,
  CheckCircle2,
  Trophy
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
  const [detailTab, setDetailTab] = useState<'registration' | 'assets' | 'subscriptions' | 'integration' | 'sso' | 'payment' | 'published'>('registration');
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

  const getBrandStageIndex = (brand: Brand): number => {
    const stage = brand.current_stage;
    if (!stage || stage === 'Brand Submitted' || stage === 'Brand Registration') return 0;
    if (stage === 'App Asset Submission') return 1;
    if (stage === 'Subscription Plan Configuration') return 2;
    if (stage === 'API Integration') return 3;
    if (
      stage === 'Waiting for WytPass Review' ||
      stage === 'whitepass_review' ||
      stage === 'Waiting for WytPass Review Rejected'
    ) {
      return 4;
    }
    if (stage === 'WhitePass Integration Completed') return 5;
    if (
      stage === 'Waiting for WytPayment Review' ||
      stage === 'payment_integration' ||
      stage === 'Waiting for WytPayment Review Rejected'
    ) {
      return 5;
    }
    if (stage === 'WytPayment Integration Completed' || stage === 'Onboarding Completed') return 6;
    return 0;
  };

  const STAGES = [
    { key: 'registration', label: 'Registration', icon: Users },
    { key: 'assets', label: 'App Assets', icon: Images },
    { key: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { key: 'integration', label: 'API Sync', icon: Settings },
    { key: 'sso', label: 'SSO Review', icon: KeyRound },
    { key: 'payment', label: 'Payment Review', icon: CreditCard },
    { key: 'published', label: 'Published & Live', icon: Trophy }
  ];

  // Fetch Brands implementation
  const loadBrands = async (forceMock = false) => {
    setIsLoading(true);
    await loadWatchlistIds();
    let fetchedList: Brand[] = [];
    if (forceMock || isSandbox) {
      const stored = localStorage.getItem('mock_brands');
      fetchedList = stored ? JSON.parse(stored) : DEFAULT_MOCK_BRANDS;
      if (!stored) {
        localStorage.setItem('mock_brands', JSON.stringify(fetchedList));
      }
      setBrands(fetchedList);
      setIsSandbox(true);
    } else {
      try {
        fetchedList = await fetchBrands();
        setBrands(fetchedList);
        setIsSandbox(false);
      } catch (err) {
        console.warn('FastAPI backend connection failed. Enabling mock fallback sandbox.', err);
        const stored = localStorage.getItem('mock_brands');
        fetchedList = stored ? JSON.parse(stored) : DEFAULT_MOCK_BRANDS;
        if (!stored) {
          localStorage.setItem('mock_brands', JSON.stringify(fetchedList));
        }
        setBrands(fetchedList);
        setIsSandbox(true);
        showToast('FastAPI server offline. Switched to Mock Sandbox Mode.', 'warning');
      }
    }

    // Sync selectedDetailBrand if open
    if (selectedDetailBrand) {
      const updated = fetchedList.find(b => b.id === selectedDetailBrand.id);
      if (updated) {
        setSelectedDetailBrand(updated);
      }
    }
    setIsLoading(false);
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
    const stepIdx = getBrandStageIndex(brand);
    const tabKeys: ('registration' | 'assets' | 'subscriptions' | 'integration' | 'sso' | 'payment' | 'published')[] = [
      'registration', 'assets', 'subscriptions', 'integration', 'sso', 'payment', 'published'
    ];
    setDetailTab(tabKeys[stepIdx]);
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
      <Box className="flex-grow overflow-y-auto no-scrollbar h-full flex flex-col relative px-8 py-6 select-none space-y-6">
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

        {/* Stepper progress tracker */}
        {/* Stepper progress tracker */}
        <div className="bg-white border border-slate-100 rounded-3xl p-4 md:p-6 shadow-sm">
          <div className="flex items-center gap-1 md:gap-2 overflow-x-auto pb-2 no-scrollbar min-w-0">
            <div className="flex items-center gap-1 md:gap-2 min-w-max">
              {STAGES.map((step, idx) => {
                const currentStageIndex = getBrandStageIndex(selectedDetailBrand);
                const isCompleted = idx < currentStageIndex;
                const isActive = idx === currentStageIndex;
                const isLocked = idx > currentStageIndex;

                const isStepSSO = step.key === 'sso';
                const isStepPayment = step.key === 'payment';
                const isStepRejected =
                  (isStepSSO && selectedDetailBrand.current_stage === 'Waiting for WytPass Review Rejected') ||
                  (isStepPayment && selectedDetailBrand.current_stage === 'Waiting for WytPayment Review Rejected');

                const StepIcon = step.icon;

                const stepButton = (
                  <button
                    disabled={isLocked}
                    onClick={() => setDetailTab(step.key as any)}
                    className={`flex items-center gap-2 p-2 md:p-2.5 rounded-xl md:rounded-2xl transition-all text-left relative focus:outline-none shrink-0 ${isActive
                      ? (isStepRejected ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-900 text-white shadow-md')
                      : isCompleted
                        ? 'text-slate-700 hover:bg-slate-50 cursor-pointer'
                        : 'text-slate-300 cursor-not-allowed'
                      }`}
                  >
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center font-bold text-[10px] md:text-xs shrink-0 transition-colors ${isActive
                      ? (isStepRejected ? 'bg-white text-rose-600' : 'bg-white text-slate-900')
                      : isCompleted
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-50 text-slate-400'
                      }`}>
                      {isStepRejected ? (
                        <AlertTriangle className="w-4.5 h-4.5 md:w-5 md:h-5 text-rose-600" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                      ) : isLocked ? (
                        <Lock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      ) : (
                        idx + 1
                      )}
                    </div>

                    <div className="pr-1 md:pr-2">
                      <div className={`text-[8px] md:text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-white/60' : 'text-slate-400'
                        }`}>
                        {isStepRejected ? 'REJECTED' : `Stage ${idx + 1}`}
                      </div>
                      <div className="text-[10px] md:text-xs font-black whitespace-nowrap flex items-center gap-1">
                        <StepIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        <span className="hidden sm:inline">{step.label}</span>
                        <span className="sm:hidden">{step.label.split(' ')[0]}</span>
                      </div>
                    </div>
                  </button>
                );

                const rejectReason = isStepRejected
                  ? (isStepSSO 
                      ? selectedDetailBrand.whitepass_review?.review_notes 
                      : selectedDetailBrand.wytpayment_review?.review_notes)
                  : null;

                return (
                  <div
                    key={step.key}
                    className="flex items-center shrink-0"
                  >
                    {rejectReason ? (
                      <Tooltip title={`Rejection Reason: ${rejectReason}`} arrow>
                        <span>{stepButton}</span>
                      </Tooltip>
                    ) : (
                      stepButton
                    )}

                    {idx < STAGES.length - 1 && (
                      <div className="w-4 md:w-8 lg:w-12 h-0.5 rounded-full bg-slate-100 mx-1 md:mx-2 shrink-0 relative">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                          style={{
                            width: isCompleted ? '100%' : '0%',
                            backgroundColor: '#10b981'
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>


        {/* Tab Workspace content */}
        <div className="bg-white rounded-3xl border border-slate-100 flex flex-col p-8 shadow-sm">
          {detailTab === 'registration' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <Users className="h-4.5 w-4.5 text-slate-500" />
                    <span>Brand Registration Profile</span>
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                    Your submitted primary brand registration metadata.
                  </p>
                </div>
                {/* <div>
                  {getBrandStageIndex(selectedDetailBrand) > 0 ? (
                    <Chip
                      icon={<CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#047857' }} />}
                      label="VERIFIED & APPROVED"
                      size="small"
                      sx={{ bgcolor: '#ecfdf5', color: '#047857', fontWeight: 'bold', fontSize: '10px' }}
                    />
                  ) : (
                    <Chip
                      icon={<RefreshCw className="h-3 w-3 animate-spin" />}
                      label="AWAITING ADMIN VERIFICATION"
                      size="small"
                      color="warning"
                      sx={{ fontWeight: 'bold', fontSize: '10px' }}
                    />
                  )}
                </div> */}
                {/* Direct developer transition for Stage 1 (No Admin Verification Required) */}
                {getBrandStageIndex(selectedDetailBrand) === 0 && (
                  <div className="mt-8 border-t border-slate-100 pt-6 flex justify-end">
                    <Button
                      variant="contained"
                      onClick={async () => {
                        if (isSandbox) {
                          const updatedList = brands.map(b => b.id === selectedDetailBrand.id ? {
                            ...b,
                            current_stage: 'App Asset Submission',
                            updated_at: new Date().toISOString()
                          } : b);
                          localStorage.setItem('mock_brands', JSON.stringify(updatedList));
                          await loadBrands(true);
                          setDetailTab('assets');
                          showToast('Profile confirmed! Stage 2 unlocked: App Asset Submission.', 'success');
                        } else {
                          const token = getAuthToken();
                          if (!token) {
                            showToast('Authentication token missing.', 'error');
                            return;
                          }
                          try {
                            await updateBrand(selectedDetailBrand.id, {
                              current_stage: 'App Asset Submission'
                            }, token);
                            await loadBrands();
                            setDetailTab('assets');
                            showToast('Profile confirmed! Stage 2 unlocked: App Asset Submission.', 'success');
                          } catch (err: any) {
                            showToast(err.message || 'Failed to update onboarding stage.', 'error');
                          }
                        }
                      }}
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
                      Confirm Profile & Proceed
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">App Name</span>
                    <span className="text-sm font-extrabold text-slate-700">{selectedDetailBrand.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Slug Identifier</span>
                    <span className="text-xs font-mono text-slate-500">/{selectedDetailBrand.slug}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Company Name</span>
                    <span className="text-sm font-bold text-slate-700">{selectedDetailBrand.company_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Short Summary</span>
                    <p className="text-xs font-semibold text-slate-600 mt-1">{selectedDetailBrand.short_description || 'No summary provided.'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Description</span>
                    <p className="text-xs font-semibold text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                      {selectedDetailBrand.full_description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedDetailBrand.logo_url && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Logo Image</span>
                      <img src={selectedDetailBrand.logo_url} alt="App logo" className="h-16 w-16 object-contain rounded-2xl border border-slate-100 p-1" />
                    </div>
                  )}
                  {selectedDetailBrand.banner_url && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Banner Showcase</span>
                      <img src={selectedDetailBrand.banner_url} alt="App banner" className="w-full max-h-24 object-cover rounded-2xl border border-slate-100" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">App Classifications</span>
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {(() => {
                        const types = selectedDetailBrand.brand_type
                          ? (Array.isArray(selectedDetailBrand.brand_type) ? selectedDetailBrand.brand_type : [selectedDetailBrand.brand_type])
                          : ['saas'];
                        return types.map((t, idx) => (
                          <Chip key={idx} label={t} size="small" sx={{ fontSize: '9px', height: '18px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                        ));
                      })()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Search & Tags</span>
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {selectedDetailBrand.tags && selectedDetailBrand.tags.length > 0 ? (
                        selectedDetailBrand.tags.map((tag) => (
                          <Chip key={tag.id} label={tag.name} size="small" sx={{ fontSize: '9px', height: '18px', fontWeight: 'bold', bgcolor: '#eff6ff', color: '#1d4ed8' }} />
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No tags configured</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>


            </div>
          ) : detailTab === 'assets' ? (
            <BrandAssets
              user={user}
              portalType={portalType}
              brandId={selectedDetailBrand.id}
              isEmbedded={true}
              onRefreshBrand={loadBrands}
            />
          ) : detailTab === 'subscriptions' ? (
            <BrandSubscriptions
              user={user}
              portalType={portalType}
              brandId={selectedDetailBrand.id}
              isEmbedded={true}
              onRefreshBrand={loadBrands}
            />
          ) : detailTab === 'integration' ? (
            <BrandIntegrationSettings
              brandId={selectedDetailBrand.id}
              isSandbox={isSandbox}
              portalType={portalType}
              onRefreshBrand={loadBrands}
            />
          ) : detailTab === 'sso' ? (
            <SSOIntegration
              user={user}
              portalType={portalType}
              brandId={selectedDetailBrand.id}
              isEmbedded={true}
              onRefreshBrand={loadBrands}
            />
          ) : detailTab === 'payment' ? (
            <PaymentIntegration
              user={user}
              portalType={portalType}
              brandId={selectedDetailBrand.id}
              isEmbedded={true}
              onRefreshBrand={loadBrands}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-6">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center shadow-md animate-bounce">
                <Trophy className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800">
                  Congratulations! Your App is Live!
                </h3>
                <p className="text-sm font-semibold text-slate-500 max-w-md leading-relaxed">
                  Your application has successfully completed all onboarding stages and technical reviews. It is now published live on the Wytnet Marketplace!
                </p>
              </div>

              {selectedDetailBrand.current_stage !== 'Onboarding Completed' ? (
                <div className="max-w-md w-full border border-dashed border-amber-200 bg-amber-50/20 p-5 rounded-3xl space-y-4">
                  <div className="flex items-center gap-1.5 justify-center">
                    <RefreshCw className="w-4.5 h-4.5 text-amber-600 animate-spin" />
                    <span className="text-xs font-black text-amber-800 uppercase tracking-wider">Awaiting Final Publishing Review</span>
                  </div>
                  <p className="text-[11.5px] font-semibold text-amber-700 leading-normal">
                    Both WytPass SSO and WytPayment gateway integrations have been approved. The application is pending final review and approval by administrators.
                  </p>

                  {isSandbox && (
                    <div className="pt-2 border-t border-amber-100 mt-2">
                      <Button
                        variant="contained"
                        onClick={async () => {
                          const updatedList = brands.map(b => b.id === selectedDetailBrand.id ? {
                            ...b,
                            current_stage: 'Onboarding Completed',
                            status: 'Approved'
                          } : b);
                          localStorage.setItem('mock_brands', JSON.stringify(updatedList));
                          await loadBrands(true);
                          showToast('Final onboarding review approved by admin (Sandbox)! App is now Published.', 'success');
                        }}
                        sx={{
                          bgcolor: '#db2777',
                          color: 'white',
                          textTransform: 'none',
                          fontWeight: 'bold',
                          borderRadius: '10px',
                          '&:hover': { bgcolor: '#be185d' }
                        }}
                      >
                        Mock Final Approval
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-4">
                  <Button
                    variant="contained"
                    onClick={() => {
                      window.location.hash = `#marketplace/app/${selectedDetailBrand.slug}`;
                    }}
                    sx={{
                      bgcolor: '#10b981',
                      color: 'white',
                      textTransform: 'none',
                      fontWeight: 'bold',
                      borderRadius: '12px',
                      px: 4,
                      py: 1.5,
                      '&:hover': { bgcolor: '#059669' }
                    }}
                  >
                    View on Marketplace
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Box>
    );
  }

  return (
    <Box className="flex-grow bg-[#f8fafc] overflow-y-auto no-scrollbar px-8 py-6 select-none space-y-6">
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

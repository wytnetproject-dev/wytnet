import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Snackbar,
  Alert,
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Checkbox,
  Divider,
  Card,
  TextField
} from '@mui/material';
import {
  Search,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Check,
  WifiOff,
  ShieldCheck,
  Zap
} from 'lucide-react';
import type { Brand, BrandWytPaymentReview } from '@/api/wytsaas/brand';
import { fetchBrands, fetchWytPaymentReview, submitWytPaymentReview } from '@/api/wytsaas/brand';

interface PaymentIntegrationProps {
  user?: { email: string; name: string; role: string } | null;
  portalType: 'wytsaas' | 'wytpass';
  brandId?: number;
  isEmbedded?: boolean;
}

const DEFAULT_MOCK_BRANDS: Brand[] = [];

export default function PaymentIntegration({ user: _user, portalType, brandId, isEmbedded }: PaymentIntegrationProps) {
  // Theme styling depending on portalType
  const primaryColor = portalType === 'wytsaas' ? '#0066cc' : '#9333ea';
  const primaryHoverColor = portalType === 'wytsaas' ? '#0052a3' : '#7e22ce';
  const selectionBgColor = portalType === 'wytsaas' ? '#eff6ff' : '#faf5ff';
  const selectionBorderColor = portalType === 'wytsaas' ? '#bfdbfe' : '#e9d5ff';

  // State
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSandbox, setIsSandbox] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Review & Checklist States
  const [review, setReview] = useState<BrandWytPaymentReview | null>(null);
  const [apiKeysConfigured, setApiKeysConfigured] = useState(false);
  const [webhookVerified, setWebhookVerified] = useState(false);
  const [testPaymentCompleted, setTestPaymentCompleted] = useState(false);

  // Rejection simulation state
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');

  // Toast Alerts State
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const getAuthToken = () => {
    return localStorage.getItem(portalType === 'wytsaas' ? 'wytsaas_token' : 'wytpass_token') || '';
  };

  // Fetch Brands and Review Status
  const loadBrands = async () => {
    setIsLoading(true);
    try {
      const fetched = await fetchBrands();
      setBrands(fetched);
      setIsSandbox(false);
      
      if (brandId) {
        const b = fetched.find(item => item.id === brandId);
        if (b) {
          setSelectedBrand(b);
          await loadReviewStatus(b.id, false);
        }
      } else if (selectedBrand) {
        const updatedSelected = fetched.find(b => b.id === selectedBrand.id);
        if (updatedSelected) {
          setSelectedBrand(updatedSelected);
          await loadReviewStatus(updatedSelected.id, false);
        }
      }
    } catch (err) {
      console.warn('FastAPI backend connection failed. Enabling mock fallback sandbox.', err);
      const stored = localStorage.getItem('mock_brands');
      const initial = stored ? JSON.parse(stored) : DEFAULT_MOCK_BRANDS;
      setBrands(initial);
      setIsSandbox(true);
      showToast('FastAPI server offline. Switched to Mock Sandbox Mode.', 'warning');
      
      if (brandId) {
        const b = initial.find((item: Brand) => item.id === brandId);
        if (b) {
          setSelectedBrand(b);
          await loadReviewStatus(b.id, true, initial);
        }
      } else if (selectedBrand) {
        const updatedSelected = initial.find((b: Brand) => b.id === selectedBrand.id);
        if (updatedSelected) {
          setSelectedBrand(updatedSelected);
          await loadReviewStatus(updatedSelected.id, true, initial);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadReviewStatus = async (brandId: number, forceMock: boolean, mockList?: Brand[]) => {
    if (forceMock) {
      // Sandbox mode check
      const currentList = mockList || brands;
      const brandObj = currentList.find(b => b.id === brandId);
      if (brandObj && brandObj.wytpayment_review) {
        setReview(brandObj.wytpayment_review);
        setApiKeysConfigured(brandObj.wytpayment_review.api_keys_configured);
        setWebhookVerified(brandObj.wytpayment_review.webhook_verified);
        setTestPaymentCompleted(brandObj.wytpayment_review.test_payment_completed);
      } else {
        setReview(null);
        setApiKeysConfigured(false);
        setWebhookVerified(false);
        setTestPaymentCompleted(false);
      }
    } else {
      // Actual API check
      const token = getAuthToken();
      if (!token) return;
      try {
        const revStatus = await fetchWytPaymentReview(brandId, token);
        setReview(revStatus);
        if (revStatus) {
          setApiKeysConfigured(revStatus.api_keys_configured);
          setWebhookVerified(revStatus.webhook_verified);
          setTestPaymentCompleted(revStatus.test_payment_completed);
        } else {
          setApiKeysConfigured(false);
          setWebhookVerified(false);
          setTestPaymentCompleted(false);
        }
      } catch (err) {
        console.error('Failed to load wytpayment review status from backend', err);
        setReview(null);
        setApiKeysConfigured(false);
        setWebhookVerified(false);
        setTestPaymentCompleted(false);
      }
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    if (brandId && brands.length > 0) {
      const b = brands.find(item => item.id === brandId);
      if (b) {
        setSelectedBrand(b);
        loadReviewStatus(b.id, isSandbox);
      }
    }
  }, [brandId, brands, isSandbox]);

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

  // Handle selecting a brand
  const handleSelectBrand = async (brand: Brand) => {
    setSelectedBrand(brand);
    setIsRejecting(false);
    setRejectNotes('');
    await loadReviewStatus(brand.id, isSandbox);
  };

  // Submit WytPayment Checklist for review
  const handleSubmitReview = async () => {
    if (!selectedBrand) return;

    if (isSandbox) {
      const nowString = new Date().toISOString();
      const mockReview: BrandWytPaymentReview = {
        id: 1,
        brand_id: selectedBrand.id,
        integration_status: 'pending',
        api_keys_configured: apiKeysConfigured,
        webhook_verified: webhookVerified,
        test_payment_completed: testPaymentCompleted,
        review_notes: null,
        reviewed_at: null
      };

      const updatedList = brands.map((b) =>
        b.id === selectedBrand.id
          ? {
              ...b,
              is_payment_integration_accepted: true,
              current_stage: 'Waiting for WytPayment Review',
              wytpayment_review: mockReview,
              updated_at: nowString
            }
          : b
      );

      localStorage.setItem('mock_brands', JSON.stringify(updatedList));
      setBrands(updatedList);
      setSelectedBrand(updatedList.find(b => b.id === selectedBrand.id) || null);
      setReview(mockReview);
      showToast('Applied for WytPayment Review (Sandbox).', 'success');
    } else {
      const token = getAuthToken();
      if (!token) {
        showToast('Authentication token missing. Please re-login.', 'error');
        return;
      }
      setIsLoading(true);
      try {
        const payload = {
          api_keys_configured: apiKeysConfigured,
          webhook_verified: webhookVerified,
          test_payment_completed: testPaymentCompleted
        };
        const rev = await submitWytPaymentReview(selectedBrand.id, payload, token);
        setReview(rev);
        
        // Update selection and lists
        const updatedBrand = {
          ...selectedBrand,
          is_payment_integration_accepted: true,
          current_stage: 'payment_integration',
          wytpayment_review: rev
        };
        setBrands(brands.map(b => b.id === selectedBrand.id ? updatedBrand : b));
        setSelectedBrand(updatedBrand);
        
        showToast('WytPayment Review request submitted to administrators.', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to submit review.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // MOCK ADMIN CONTROLLER (Sandbox simulator)
  const handleSandboxAdminAction = (status: 'approved' | 'rejected') => {
    if (!selectedBrand || !review) return;
    
    if (status === 'rejected' && !rejectNotes.trim()) {
      showToast('Please provide rejection notes.', 'error');
      return;
    }

    const nowString = new Date().toISOString();
    const mockReview: BrandWytPaymentReview = {
      ...review,
      integration_status: status,
      review_notes: status === 'rejected' ? rejectNotes : null,
      reviewed_at: nowString
    };

    const updatedList = brands.map((b) =>
      b.id === selectedBrand.id
        ? {
            ...b,
            current_stage: status === 'approved' ? 'WytPayment Integration Completed' : 'Waiting for WytPayment Review Rejected',
            status: status === 'approved' ? b.status : 'Rejected',
            wytpayment_review: mockReview,
            updated_at: nowString
          }
        : b
    );

    localStorage.setItem('mock_brands', JSON.stringify(updatedList));
    setBrands(updatedList);
    setSelectedBrand(updatedList.find(b => b.id === selectedBrand.id) || null);
    setReview(mockReview);
    setIsRejecting(false);
    setRejectNotes('');
    showToast(`Payment Review mock-updated to ${status.toUpperCase()}!`, 'success');
  };

  // Determine button state and check interactivity
  const isSubmissionAllowed = apiKeysConfigured && webhookVerified && testPaymentCompleted;
  const isPending = review?.integration_status === 'pending';
  const isApproved = review?.integration_status === 'approved';
  const isRejected = review?.integration_status === 'rejected';
  const isFormLocked = isPending || isApproved;

  return (
    <Box className={`flex flex-col select-none ${isEmbedded ? 'bg-transparent px-0 py-0 space-y-4' : 'bg-[#f8fafc] px-8 py-6 space-y-6 flex-grow overflow-hidden h-full'}`}>
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

      {/* Header Bar */}
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              Products / {portalType === 'wytsaas' ? 'WytSaaS' : 'WytPass'} / Payments / <CreditCard className="h-3 w-3 inline" /> Developer
            </div>
            
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-extrabold text-wytnet-dark">
                WytPayment Integration
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
              Configure webhook endpoints, track checkout checklist, and request API verification.
            </p>
          </div>

          <div>
            <Button
              variant="outlined"
              size="medium"
              onClick={loadBrands}
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
              Sync Registry
            </Button>
          </div>
        </div>
      )}

      {/* Connection Offline Status Indicator */}
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
            },
            flexShrink: 0
          }}
        >
          FastAPI Backend is currently offline. You are interacting with the client-side sandbox container. Payment integration reviews will persist in localStorage.
        </Alert>
      )}

      {/* Main Split Interface Area */}
      <Box sx={{ display: 'flex', gap: 3, flexGrow: isEmbedded ? 0 : 1, minHeight: isEmbedded ? 'auto' : 0, overflow: isEmbedded ? 'visible' : 'hidden' }}>
        
        {/* Left column: Brands List Sidebar */}
        {!isEmbedded && (
          <Paper
            elevation={0}
            sx={{
              width: 280,
              borderRadius: '20px',
              border: '1px solid #f1f5f9',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.005)'
            }}
          >
            {/* Sidebar search box */}
            <Box sx={{ p: 2, borderBottom: '1px solid #f8fafc' }}>
              <Box className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search registry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-100 hover:border-slate-200 focus:border-slate-300 text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark"
                />
              </Box>
            </Box>

            {/* Brands scroll list */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
              <List disablePadding>
                {filteredBrands.map((b) => {
                  const isSelected = selectedBrand?.id === b.id;
                  return (
                    <ListItemButton
                      key={b.id}
                      onClick={() => handleSelectBrand(b)}
                      sx={{
                        borderRadius: '12px',
                        mb: 0.5,
                        border: isSelected ? `1px solid ${selectionBorderColor}` : '1px solid transparent',
                        bgcolor: isSelected ? selectionBgColor : 'transparent',
                        '&:hover': {
                          bgcolor: isSelected ? selectionBgColor : '#f8fafc'
                        }
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 44 }}>
                        {b.logo_url ? (
                          <Avatar
                            src={b.logo_url}
                            alt={b.name}
                            variant="rounded"
                            sx={{ width: 32, height: 32, border: '1px solid #f1f5f9' }}
                          />
                        ) : (
                          <Avatar
                            variant="rounded"
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: primaryColor,
                              fontWeight: 'black',
                              fontSize: '12px'
                            }}
                          >
                            {b.name.charAt(0).toUpperCase()}
                          </Avatar>
                        )}
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontWeight: 'bold', fontSize: '12px', color: '#1e293b' }}>
                            {b.name}
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                            /{b.slug}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  );
                })}

                {filteredBrands.length === 0 && (
                  <Typography sx={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', mt: 4, fontWeight: '600' }}>
                    No Apps Registered
                  </Typography>
                )}
              </List>
            </Box>
          </Paper>
        )}

        {/* Right column: Selected Brand WytPayment Verification dashboard */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {selectedBrand ? (
            <Paper
              elevation={0}
              sx={{
                flexGrow: isEmbedded ? 0 : 1,
                borderRadius: '20px',
                border: '1px solid #f1f5f9',
                display: 'flex',
                flexDirection: 'column',
                overflow: isEmbedded ? 'visible' : 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.005)'
              }}
            >
              {/* Header Info */}
              <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9' }}>
                <Typography sx={{ fontWeight: 'black', fontSize: '15px', color: '#1e293b' }}>
                  Payment Integration Dashboard: {selectedBrand.name}
                </Typography>
                <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', mt: 0.5 }}>
                  Billing SDK Configuration Stage &bull; Current Pipeline: {selectedBrand.current_stage === 'brand_submission' ? 'APP SUBMISSION' : selectedBrand.current_stage.toUpperCase().replace('_', ' ')}
                </Typography>
              </Box>

              {/* Integration Checklists & Progress Workspace */}
              <Box sx={{ flexGrow: isEmbedded ? 0 : 1, overflowY: isEmbedded ? 'visible' : 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
                
                {/* 1. Review Status Display Banner */}
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', mb: 2, textTransform: 'uppercase' }}>
                    WytPayment Review Status
                  </Typography>

                  {isPending && (
                    <Alert
                      severity="warning"
                      icon={<AlertTriangle className="h-5 w-5 text-amber-500 animate-pulse" />}
                      sx={{ borderRadius: '16px', border: '1px solid #fde68a', bgcolor: '#fffbeb', color: '#78350f', fontWeight: '600', fontSize: '12px' }}
                    >
                      Payment Review Pending: Administrators are actively verifying your payment setup credentials and checkout parameters. Endpoint syncing configurations are locked during reviews.
                    </Alert>
                  )}

                  {isApproved && (
                    <Alert
                      severity="success"
                      icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
                      sx={{ borderRadius: '16px', border: '1px solid #a7f3d0', bgcolor: '#ecfdf5', color: '#065f46', fontWeight: '600', fontSize: '12px' }}
                    >
                      Payment Integration Approved: WytPayment verification is fully confirmed. Automated billing pipelines are live.
                    </Alert>
                  )}

                  {isRejected && (
                    <Alert
                      severity="error"
                      icon={<XCircle className="h-5 w-5 text-rose-500" />}
                      sx={{ borderRadius: '16px', border: '1px solid #fecaca', bgcolor: '#fff5f5', color: '#991b1b', fontWeight: '600', fontSize: '12px' }}
                    >
                      Payment Integration Rejected: Review Notes: {review?.review_notes || 'No notes provided by auditor.'}. Please update required parameters and re-submit.
                    </Alert>
                  )}

                  {!review && (
                    <Alert
                      severity="info"
                      icon={<HelpCircle className="h-5 w-5 text-blue-500" />}
                      sx={{ borderRadius: '16px', border: '1px solid #bfdbfe', bgcolor: '#eff6ff', color: '#1e3a8a', fontWeight: '600', fontSize: '12px' }}
                    >
                      Not Submitted: Please review the checklist below. Configure keys on your app workspace and run test payments, then apply for billing integration review.
                    </Alert>
                  )}
                </Box>

                <Divider />

                {/* 2. Developer Integration Checklist */}
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', mb: 2, textTransform: 'uppercase' }}>
                    Payment Integration Checklist
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                    {/* Item 1 */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Checkbox
                        checked={apiKeysConfigured}
                        onChange={(e) => setApiKeysConfigured(e.target.checked)}
                        disabled={isFormLocked}
                        sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor }, p: 0.5 }}
                      />
                      <Box>
                        <Typography sx={{ fontWeight: 'bold', fontSize: '12.5px', color: isFormLocked ? '#94a3b8' : '#1e293b' }}>
                          Payment API Credentials Configured
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: '#64748b', mt: 0.5, lineHeight: 1.5 }}>
                          Confirm that your payment token key parameters are successfully initialized in your environment parameters.
                        </Typography>
                      </Box>
                    </Box>

                    {/* Item 2 */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Checkbox
                        checked={webhookVerified}
                        onChange={(e) => setWebhookVerified(e.target.checked)}
                        disabled={isFormLocked}
                        sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor }, p: 0.5 }}
                      />
                      <Box>
                        <Typography sx={{ fontWeight: 'bold', fontSize: '12.5px', color: isFormLocked ? '#94a3b8' : '#1e293b' }}>
                          Sync Webhook Secret Verification Setup
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: '#64748b', mt: 0.5, lineHeight: 1.5 }}>
                          Verify that the billing webhooks are setup and signatures are successfully validated using WytPayment secret parameters.
                        </Typography>
                      </Box>
                    </Box>

                    {/* Item 3 */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Checkbox
                        checked={testPaymentCompleted}
                        onChange={(e) => setTestPaymentCompleted(e.target.checked)}
                        disabled={isFormLocked}
                        sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor }, p: 0.5 }}
                      />
                      <Box>
                        <Typography sx={{ fontWeight: 'bold', fontSize: '12.5px', color: isFormLocked ? '#94a3b8' : '#1e293b' }}>
                          Trial Mock Payment Completed
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: '#64748b', mt: 0.5, lineHeight: 1.5 }}>
                          Trigger a test purchase callback using the sandbox payment card details to verify account provisioning.
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* 3. Sandbox Admin Simulator Panel (Rendered only in Sandbox mode for developer testing!) */}
                {isSandbox && review && (
                  <>
                    <Divider />
                    <Card variant="outlined" sx={{ p: 2.5, borderColor: '#fbcfe8', bgcolor: '#fff5f7', borderRadius: '16px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Zap className="h-4.5 w-4.5 text-pink-500 animate-pulse" />
                        <Typography sx={{ fontWeight: 'black', fontSize: '12px', color: '#9d174d', textTransform: 'uppercase' }}>
                          Sandbox Simulator: WytPayment Admin Panel
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '11px', color: '#9d174d', mb: 2, lineHeight: 1.5 }}>
                        Since you are in Sandbox Mode, there are no live admin reviewers to approve this WytPayment request. Use this mock panel to update review status.
                      </Typography>

                      {!isRejecting ? (
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleSandboxAdminAction('approved')}
                            sx={{
                              bgcolor: '#db2777',
                              color: 'white',
                              borderRadius: '8px',
                              textTransform: 'none',
                              fontWeight: 'bold',
                              fontSize: '11px',
                              boxShadow: 'none',
                              '&:hover': { bgcolor: '#be185d', boxShadow: 'none' }
                            }}
                            startIcon={<ShieldCheck className="h-3.5 w-3.5" />}
                          >
                            Mock Approve Review
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setIsRejecting(true)}
                            sx={{
                              borderColor: '#fbcfe8',
                              color: '#db2777',
                              borderRadius: '8px',
                              textTransform: 'none',
                              fontWeight: 'bold',
                              fontSize: '11px',
                              '&:hover': { borderColor: '#f472b6', bgcolor: '#fff0f3' }
                            }}
                            startIcon={<XCircle className="h-3.5 w-3.5" />}
                          >
                            Mock Reject Review
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <TextField
                            label="Rejection Reason"
                            placeholder="Enter mock rejection notes..."
                            size="small"
                            fullWidth
                            value={rejectNotes}
                            onChange={(e) => setRejectNotes(e.target.value)}
                            slotProps={{
                              inputLabel: { style: { fontSize: '11px' } },
                              input: { style: { borderRadius: '8px', fontSize: '11px', backgroundColor: 'white' } }
                            }}
                          />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              size="small"
                              color="error"
                              onClick={() => handleSandboxAdminAction('rejected')}
                              sx={{ textTransform: 'none', fontWeight: 'bold', borderRadius: '8px', fontSize: '11px' }}
                            >
                              Confirm Rejection
                            </Button>
                            <Button
                              variant="text"
                              size="small"
                              onClick={() => {
                                setIsRejecting(false);
                                setRejectNotes('');
                              }}
                              sx={{ color: '#9d174d', textTransform: 'none', fontWeight: 'bold', borderRadius: '8px', fontSize: '11px' }}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Card>
                  </>
                )}
              </Box>

              {/* Bottom Footer Actions Panel */}
              <Box sx={{ p: 3, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: '#f8fafc' }}>
                <Button
                  onClick={handleSubmitReview}
                  disabled={!isSubmissionAllowed || isFormLocked}
                  variant="contained"
                  sx={{
                    bgcolor: primaryColor,
                    textTransform: 'none',
                    fontWeight: 'bold',
                    borderRadius: '10px',
                    px: 3.5,
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: primaryHoverColor,
                      boxShadow: 'none'
                    },
                    '&:disabled': {
                      bgcolor: '#cbd5e1',
                      color: '#94a3b8'
                    }
                  }}
                  startIcon={<CreditCard className="h-4 w-4" />}
                >
                  {isPending ? 'Under Admin Review' : isApproved ? 'Payment Review Approved' : 'Submit for Payment Review'}
                </Button>
              </Box>
            </Paper>
          ) : (
            <Paper
              elevation={0}
              sx={{
                flexGrow: 1,
                borderRadius: '20px',
                border: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 6,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.005)'
              }}
            >
              <Box sx={{ textAlign: 'center', maxWidth: 320 }}>
                <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <Typography sx={{ fontWeight: 'bold', color: '#475569', fontSize: '14px' }}>
                  No App Selected
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '11px', mt: 0.5, lineHeight: 1.5 }}>
                  Select one of your registered applications from the left registry panel to manage your WytPayment integration pipeline.
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}

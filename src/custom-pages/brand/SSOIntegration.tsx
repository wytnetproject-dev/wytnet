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
  KeyRound,
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
import type { Brand, BrandWhitePassReview } from '@/api/wytsaas/brand';
import { fetchBrands, fetchWhitePassReview, submitWhitePassReview } from '@/api/wytsaas/brand';

interface SSOIntegrationProps {
  user?: { email: string; name: string; role: string } | null;
  portalType: 'wytsaas' | 'wytpass';
  brandId?: number;
  isEmbedded?: boolean;
}

const DEFAULT_MOCK_BRANDS: Brand[] = [];

export default function SSOIntegration({ user: _user, portalType, brandId, isEmbedded }: SSOIntegrationProps) {
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
  const [review, setReview] = useState<BrandWhitePassReview | null>(null);
  const [sdkInstalled, setSdkInstalled] = useState(false);
  const [callbackVerified, setCallbackVerified] = useState(false);
  const [domainVerified, setDomainVerified] = useState(false);

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
      if (brandObj && brandObj.whitepass_review) {
        setReview(brandObj.whitepass_review);
        setSdkInstalled(brandObj.whitepass_review.sdk_installed);
        setCallbackVerified(brandObj.whitepass_review.callback_verified);
        setDomainVerified(brandObj.whitepass_review.domain_verified);
      } else {
        setReview(null);
        setSdkInstalled(false);
        setCallbackVerified(false);
        setDomainVerified(false);
      }
    } else {
      // Actual API check
      const token = getAuthToken();
      if (!token) return;
      try {
        const revStatus = await fetchWhitePassReview(brandId, token);
        setReview(revStatus);
        if (revStatus) {
          setSdkInstalled(revStatus.sdk_installed);
          setCallbackVerified(revStatus.callback_verified);
          setDomainVerified(revStatus.domain_verified);
        } else {
          setSdkInstalled(false);
          setCallbackVerified(false);
          setDomainVerified(false);
        }
      } catch (err) {
        console.error('Failed to load whitepass review status from backend', err);
        setReview(null);
        setSdkInstalled(false);
        setCallbackVerified(false);
        setDomainVerified(false);
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

  // Submit SSO Checklist for review
  const handleSubmitReview = async () => {
    if (!selectedBrand) return;

    if (isSandbox) {
      const nowString = new Date().toISOString();
      const mockReview: BrandWhitePassReview = {
        id: 1,
        brand_id: selectedBrand.id,
        integration_status: 'pending',
        sdk_installed: sdkInstalled,
        callback_verified: callbackVerified,
        domain_verified: domainVerified,
        review_notes: null,
        reviewed_at: null
      };

      const updatedList = brands.map((b) =>
        b.id === selectedBrand.id
          ? {
              ...b,
              is_wytpass_integration_accepted: true,
              current_stage: 'Waiting for WytPass Review',
              whitepass_review: mockReview,
              updated_at: nowString
            }
          : b
      );

      localStorage.setItem('mock_brands', JSON.stringify(updatedList));
      setBrands(updatedList);
      setSelectedBrand(updatedList.find(b => b.id === selectedBrand.id) || null);
      setReview(mockReview);
      showToast('Applied for WhitePass SSO Review (Sandbox).', 'success');
    } else {
      const token = getAuthToken();
      if (!token) {
        showToast('Authentication token missing. Please re-login.', 'error');
        return;
      }
      setIsLoading(true);
      try {
        const payload = {
          sdk_installed: sdkInstalled,
          callback_verified: callbackVerified,
          domain_verified: domainVerified
        };
        const rev = await submitWhitePassReview(selectedBrand.id, payload, token);
        setReview(rev);
        
        // Update selection and lists
        const updatedBrand = {
          ...selectedBrand,
          is_wytpass_integration_accepted: true,
          current_stage: 'whitepass_review',
          whitepass_review: rev
        };
        setBrands(brands.map(b => b.id === selectedBrand.id ? updatedBrand : b));
        setSelectedBrand(updatedBrand);
        
        showToast('WhitePass SSO Review request submitted to administrators.', 'success');
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
    const mockReview: BrandWhitePassReview = {
      ...review,
      integration_status: status,
      review_notes: status === 'rejected' ? rejectNotes : null,
      reviewed_at: nowString
    };

    const updatedList = brands.map((b) =>
      b.id === selectedBrand.id
        ? {
            ...b,
            current_stage: status === 'approved' ? 'WhitePass Integration Completed' : 'Waiting for WytPass Review Rejected',
            status: status === 'approved' ? b.status : 'Rejected',
            whitepass_review: mockReview,
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
    showToast(`SSO Review mock-updated to ${status.toUpperCase()}!`, 'success');
  };

  // Determine button state and check interactivity
  const isSubmissionAllowed = sdkInstalled && callbackVerified && domainVerified;
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
              Products / {portalType === 'wytsaas' ? 'WytSaaS' : 'WytPass'} / Authentication / <KeyRound className="h-3 w-3 inline" /> Developer
            </div>
            
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-extrabold text-wytnet-dark">
                WhitePass SSO Integration
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
              Configure single sign-on parameters, track installation checklists, and submit SSO reviews.
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
          FastAPI Backend is currently offline. You are interacting with the client-side sandbox container. SSO reviews will persist in localStorage.
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

        {/* Right column: Selected Brand SSO Verification dashboard */}
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
                  SSO Integration Dashboard: {selectedBrand.name}
                </Typography>
                <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', mt: 0.5 }}>
                  Ecosystem Integration Stage &bull; Current Pipeline: {
                    selectedBrand.current_stage === 'brand_submission'
                      ? 'APP SUBMISSION'
                      : (selectedBrand.current_stage.toLowerCase() === 'waiting for wytpass review'
                        ? 'Waiting for Review'
                        : (selectedBrand.current_stage.toLowerCase() === 'waiting for wytpass review rejected'
                          ? 'Waiting for Review Rejected'
                          : selectedBrand.current_stage)
                        ).toUpperCase().replace('_', ' ')
                  }
                </Typography>
              </Box>

              {/* Integration Checklists & Progress Workspace */}
              <Box sx={{ flexGrow: isEmbedded ? 0 : 1, overflowY: isEmbedded ? 'visible' : 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
                
                {/* 1. Review Status Display Banner */}
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', mb: 2, textTransform: 'uppercase' }}>
                    WhitePass SSO Review Status
                  </Typography>

                  {isPending && (
                    <Alert
                      severity="warning"
                      icon={<AlertTriangle className="h-5 w-5 text-amber-500 animate-pulse" />}
                      sx={{ borderRadius: '16px', border: '1px solid #fde68a', bgcolor: '#fffbeb', color: '#78350f', fontWeight: '600', fontSize: '12px' }}
                    >
                      SSO Review Pending: Administrators are actively verifying your SSO installation checklist. Access endpoints are locked while reviews are underway.
                    </Alert>
                  )}

                  {isApproved && (
                    <Alert
                      severity="success"
                      icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
                      sx={{ borderRadius: '16px', border: '1px solid #a7f3d0', bgcolor: '#ecfdf5', color: '#065f46', fontWeight: '600', fontSize: '12px' }}
                    >
                      SSO Verification Approved: WhitePass SSO verification matches all parameters. SSO is active for client logins.
                    </Alert>
                  )}

                  {isRejected && (
                    <Alert
                      severity="error"
                      icon={<XCircle className="h-5 w-5 text-rose-500" />}
                      sx={{ borderRadius: '16px', border: '1px solid #fecaca', bgcolor: '#fff5f5', color: '#991b1b', fontWeight: '600', fontSize: '12px' }}
                    >
                      SSO Verification Rejected: Rejection Notes: {review?.review_notes || 'No notes provided by auditor.'}. Please address these notes and submit a new request.
                    </Alert>
                  )}

                  {!review && (
                    <Alert
                      severity="info"
                      icon={<HelpCircle className="h-5 w-5 text-blue-500" />}
                      sx={{ borderRadius: '16px', border: '1px solid #bfdbfe', bgcolor: '#eff6ff', color: '#1e3a8a', fontWeight: '600', fontSize: '12px' }}
                    >
                      Not Submitted: Please review the checklist below. Once SSO configuration is complete on your product backend, select all items and apply for administrative approval.
                    </Alert>
                  )}
                </Box>

                <Divider />

                {/* 2. Developer Integration Checklist */}
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', mb: 2, textTransform: 'uppercase' }}>
                    SSO Integration Checklist
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                    {/* Item 1 */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Checkbox
                        checked={sdkInstalled}
                        onChange={(e) => setSdkInstalled(e.target.checked)}
                        disabled={isFormLocked}
                        sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor }, p: 0.5 }}
                      />
                      <Box>
                        <Typography sx={{ fontWeight: 'bold', fontSize: '12.5px', color: isFormLocked ? '#94a3b8' : '#1e293b' }}>
                          SSO SDK Installed in Client Application
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: '#64748b', mt: 0.5, lineHeight: 1.5 }}>
                          Confirm that your code bundle includes WytPass client headers and triggers login sessions targeting our auth server.
                        </Typography>
                      </Box>
                    </Box>

                    {/* Item 2 */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Checkbox
                        checked={callbackVerified}
                        onChange={(e) => setCallbackVerified(e.target.checked)}
                        disabled={isFormLocked}
                        sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor }, p: 0.5 }}
                      />
                      <Box>
                        <Typography sx={{ fontWeight: 'bold', fontSize: '12.5px', color: isFormLocked ? '#94a3b8' : '#1e293b' }}>
                          Callback URL Endpoint Setup & Verified
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: '#64748b', mt: 0.5, lineHeight: 1.5 }}>
                          Verify that redirect URIs correspond to approved redirect rules and return valid OAuth authentication headers during test requests.
                        </Typography>
                      </Box>
                    </Box>

                    {/* Item 3 */}
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Checkbox
                        checked={domainVerified}
                        onChange={(e) => setDomainVerified(e.target.checked)}
                        disabled={isFormLocked}
                        sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor }, p: 0.5 }}
                      />
                      <Box>
                        <Typography sx={{ fontWeight: 'bold', fontSize: '12.5px', color: isFormLocked ? '#94a3b8' : '#1e293b' }}>
                          Authorization Domains Verified
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: '#64748b', mt: 0.5, lineHeight: 1.5 }}>
                          DNS domains matching authentication callback routes are validated and verified against our whitelist records.
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
                          Sandbox Simulator: Administrator Review Console
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '11px', color: '#9d174d', mb: 2, lineHeight: 1.5 }}>
                        Since you are in Sandbox Mode, there are no live admin accounts to verify this SSO request. Use this simulator console to approve or reject the current SSO review submission.
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
                            placeholder="Enter mock rejection reasons..."
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
                  startIcon={<KeyRound className="h-4 w-4" />}
                >
                  {isPending ? 'Under Admin Review' : isApproved ? 'SSO Review Approved' : 'Submit for SSO Review'}
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
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 6,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.005)',
                bgcolor: '#fff'
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 360 }}>
                <Box sx={{ width: 64, height: 64, borderRadius: '20px', bgcolor: selectionBgColor, display: 'flex', alignItems: 'center', justifyCenter: 'center', mb: 3, pl: 2, pt: 2 }}>
                  <KeyRound className="h-7 w-7" style={{ color: primaryColor }} />
                </Box>
                <Typography sx={{ fontWeight: 'black', fontSize: '15px', color: '#1e293b', mb: 1 }}>
                  Select an App to Manage SSO
                </Typography>
                <Typography sx={{ fontSize: '12px', color: '#64748b', lineHeight: 1.625 }}>
                  Choose an app from the list on the left to display its WhitePass SSO integration checklists and review progress.
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}

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
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab
} from '@mui/material';
import {
  ClipboardCheck,
  RefreshCw,
  Search,
  Check,
  WifiOff,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  ExternalLink,
  Images,
  CreditCard,
  Settings,
  Info
} from 'lucide-react';
import type {
  Brand,
  BrandWhitePassReview
} from '@/api/wytsaas/brand';
import {
  fetchBrands,
  actionWhitePassReview
} from '@/api/wytsaas/brand';
import BrandAssets from '../brand/BrandAssets';
import BrandSubscriptions from '../subscription/BrandSubscriptions';
import BrandIntegrationSettings from '../brand/BrandIntegrationSettings';

interface WytPassApprovalsProps {
  user?: { email: string; name: string; role: string } | null;
  portalType: 'wytsaas' | 'wytpass';
}

export default function WytPassApprovals({ user: _user, portalType }: WytPassApprovalsProps) {
  const primaryColor = '#4f46e5'; // Deep Indigo for approvals/verification theme
  const primaryHoverColor = '#4338ca';

  // State
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<number>(0); // 0: Pending, 1: Approved, 2: Rejected, 3: All
  const [isLoading, setIsLoading] = useState(true);
  const [isSandbox, setIsSandbox] = useState(false);

  // Dialog State
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [dialogTab, setDialogTab] = useState<number>(0);

  // Toast
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

  const loadBrands = async () => {
    setIsLoading(true);
    try {
      const fetched = await fetchBrands();
      // Ensure local mock brands exist if connected but list is empty
      setBrands(fetched);
      setIsSandbox(false);
    } catch (err) {
      console.warn('FastAPI backend offline. Enabling mock fallback sandbox.', err);
      const stored = localStorage.getItem('mock_brands');
      let initial = stored ? JSON.parse(stored) : [];
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

  // Filter brands based on tab, search query, and whitepass_review presence
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    // Filter only brands that have WhitePass reviews requested or performed
    const withReview = brands.filter(b => b.whitepass_review !== null || b.current_stage === 'Waiting for WytPass Review' || b.current_stage === 'whitepass_review');

    let tabFiltered = withReview;
    if (activeTab === 0) {
      // Pending
      tabFiltered = withReview.filter(b => b.whitepass_review?.integration_status === 'pending' || ((b.current_stage === 'Waiting for WytPass Review' || b.current_stage === 'whitepass_review') && b.whitepass_review?.integration_status !== 'approved' && b.whitepass_review?.integration_status !== 'rejected'));
    } else if (activeTab === 1) {
      // Approved
      tabFiltered = withReview.filter(b => b.whitepass_review?.integration_status === 'approved');
    } else if (activeTab === 2) {
      // Rejected
      tabFiltered = withReview.filter(b => b.whitepass_review?.integration_status === 'rejected');
    }

    if (!q) {
      setFilteredBrands(tabFiltered);
    } else {
      setFilteredBrands(
        tabFiltered.filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            b.slug.toLowerCase().includes(q) ||
            (b.company_name && b.company_name.toLowerCase().includes(q))
        )
      );
    }
  }, [searchQuery, brands, activeTab]);

  const handleOpenReview = (brand: Brand) => {
    setSelectedBrand(brand);
    setReviewNotes(brand.whitepass_review?.review_notes || '');
    setDialogTab(0);
    setIsReviewOpen(true);
  };

  const handleReviewAction = async (status: 'approved' | 'rejected') => {
    if (!selectedBrand) return;

    setIsSubmittingAction(true);
    try {
      if (isSandbox) {
        // Sandbox update
        const updatedList = brands.map((b) => {
          if (b.id === selectedBrand.id) {
            const currentReview = b.whitepass_review || {
              id: Math.floor(Math.random() * 1000) + 200,
              brand_id: b.id,
              sdk_installed: true,
              callback_verified: true,
              domain_verified: true
            };

            return {
              ...b,
              is_wytpass_integration_accepted: status === 'approved',
              current_stage: status === 'approved' ? 'WhitePass Integration Completed' : 'Waiting for WytPass Review Rejected',
              status: status === 'approved' ? b.status : 'Rejected',
              whitepass_review: {
                ...currentReview,
                integration_status: status,
                review_notes: reviewNotes,
                reviewed_at: new Date().toISOString()
              } as BrandWhitePassReview
            };
          }
          return b;
        });

        localStorage.setItem('mock_brands', JSON.stringify(updatedList));
        setBrands(updatedList);
        showToast(`Verification ${status} successfully (Sandbox)`, 'success');
      } else {
        const token = getAuthToken();
        if (!token) {
          showToast('Authentication token missing. Please log in again.', 'error');
          setIsSubmittingAction(false);
          return;
        }

        const updatedReview = await actionWhitePassReview(selectedBrand.id, status, reviewNotes, token);

        // Refresh local brand list
        const updatedList = brands.map((b) => {
          if (b.id === selectedBrand.id) {
            return {
              ...b,
              is_wytpass_integration_accepted: status === 'approved',
              current_stage: status === 'approved' ? 'WhitePass Integration Completed' : 'Waiting for WytPass Review Rejected',
              status: status === 'approved' ? b.status : 'Rejected',
              whitepass_review: updatedReview
            };
          }
          return b;
        });
        setBrands(updatedList);
        showToast(`Verification ${status} successfully.`, 'success');
      }
      setIsReviewOpen(false);
      setSelectedBrand(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit review action.', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

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

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
            Products / {portalType === 'wytsaas' ? 'WytSaaS' : 'WytPass'} / Administration / <ClipboardCheck className="h-3 w-3 inline" /> WytPass Approvals
          </div>

          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-2xl font-extrabold text-wytnet-dark">
              WytPass Verification Approvals
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
            Review and approve developer requests to activate WytPass SSO. Verify SDK compliance, domain credentials, and callback endpoints.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            Refresh
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
          FastAPI Backend is offline. Interactive Sandbox Mode is active. Approvals or rejections will dynamically modify local browser storage values.
        </Alert>
      )}

      {/* Main filter tabs and search bar */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '24px',
          border: '1px solid #f1f5f9',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.005)'
        }}
      >
        <Box sx={{ borderBottom: '1px solid #f8fafc', px: 3, pt: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'between', gap: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              '& .MuiTabs-indicator': {
                bgcolor: primaryColor,
                height: '3px',
                borderRadius: '3px'
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '13px',
                minWidth: 'auto',
                px: 2,
                py: 2.5,
                color: '#64748b',
                '&.Mui-selected': {
                  color: primaryColor,
                }
              }
            }}
          >
            <Tab label="Pending Review" />
            <Tab label="Approved Requests" />
            <Tab label="Rejected Requests" />
            <Tab label="All Submissions" />
          </Tabs>

          <Box className="relative flex-grow max-w-sm ml-auto py-2">
            <Search className="absolute left-3 top-5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search request by brand or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-100 hover:border-slate-200 focus:border-slate-300 text-xs font-semibold pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark"
            />
          </Box>
        </Box>

        <TableContainer sx={{ borderTop: '1px solid var(--mui-palette-divider)' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 500, fontSize: '0.8125rem', letterSpacing: '0.2px', color: 'text.primary', textTransform: 'uppercase', height: 56, bgcolor: 'background.paper' }}>Brand & Company</TableCell>
                <TableCell sx={{ fontWeight: 500, fontSize: '0.8125rem', letterSpacing: '0.2px', color: 'text.primary', textTransform: 'uppercase', height: 56, bgcolor: 'background.paper' }}>SDK Installed</TableCell>
                <TableCell sx={{ fontWeight: 500, fontSize: '0.8125rem', letterSpacing: '0.2px', color: 'text.primary', textTransform: 'uppercase', height: 56, bgcolor: 'background.paper' }}>Callback Endpoint</TableCell>
                <TableCell sx={{ fontWeight: 500, fontSize: '0.8125rem', letterSpacing: '0.2px', color: 'text.primary', textTransform: 'uppercase', height: 56, bgcolor: 'background.paper' }}>Domain Verified</TableCell>
                <TableCell sx={{ fontWeight: 500, fontSize: '0.8125rem', letterSpacing: '0.2px', color: 'text.primary', textTransform: 'uppercase', height: 56, bgcolor: 'background.paper' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 500, fontSize: '0.8125rem', letterSpacing: '0.2px', color: 'text.primary', textTransform: 'uppercase', height: 56, bgcolor: 'background.paper', textAlign: 'right', pr: 4 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <RefreshCw className="h-6 w-6 text-slate-300 animate-spin mx-auto mb-2" />
                    <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', fontWeight: 500 }}>
                      Loading integration requests...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredBrands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <ClipboardCheck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', fontWeight: 500 }}>
                      No integration requests found matching this status.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBrands.map((brand) => {
                  const review = brand.whitepass_review;
                  const reviewStatus = review?.integration_status || 'pending';

                  return (
                    <TableRow
                      key={brand.id}
                      hover
                      sx={{
                        borderBottom: '1px solid var(--mui-palette-divider)',
                        '&:last-child td, &:last-child th': { border: 0 }
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <div className="flex items-center gap-3">
                          {brand.logo_url ? (
                            <img
                              src={brand.logo_url}
                              alt={brand.name}
                              className="h-[34px] w-[34px] rounded-xl border border-slate-100 object-cover"
                            />
                          ) : (
                            <div className="h-[34px] w-[34px] rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs border border-slate-200/50">
                              {brand.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: 'text.primary' }}>
                              {brand.name}
                            </Typography>
                            <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 500 }}>
                              {brand.company_name || 'N/A'}
                            </Typography>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell sx={{ py: 2 }}>
                        {review?.sdk_installed ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                            <span>Installed</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 font-medium text-xs">
                            <XCircle className="h-4.5 w-4.5 text-slate-300 shrink-0" />
                            <span>Missing</span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell sx={{ py: 2 }}>
                        {review?.callback_verified ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                            <span>Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 font-medium text-xs">
                            <XCircle className="h-4.5 w-4.5 text-slate-300 shrink-0" />
                            <span>Unverified</span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell sx={{ py: 2 }}>
                        {review?.domain_verified ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                            <span>Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 font-medium text-xs">
                            <XCircle className="h-4.5 w-4.5 text-slate-300 shrink-0" />
                            <span>Unverified</span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell sx={{ py: 2 }}>
                        {reviewStatus === 'approved' && (
                          <Chip
                            icon={<CheckCircle2 className="h-3 w-3" style={{ color: '#047857' }} />}
                            label="APPROVED"
                            size="small"
                            sx={{
                              bgcolor: '#ecfdf5',
                              color: '#047857',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              border: '1px solid #d1fae5',
                              borderRadius: '6px'
                            }}
                          />
                        )}
                        {reviewStatus === 'rejected' && (
                          <div className="flex flex-col gap-1 items-start">
                            <Chip
                              icon={<XCircle className="h-3 w-3" style={{ color: '#b91c1c' }} />}
                              label="REJECTED"
                              size="small"
                              sx={{
                                bgcolor: '#fef2f2',
                                color: '#b91c1c',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                border: '1px solid #fee2e2',
                                borderRadius: '6px'
                              }}
                            />
                            {review?.review_notes && (
                              <Typography sx={{ fontSize: '10px', color: '#b91c1c', fontWeight: 600, mt: 0.5, maxWidth: '160px', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.2 }}>
                                Reason: {review.review_notes}
                              </Typography>
                            )}
                          </div>
                        )}
                        {reviewStatus === 'pending' && (
                          <Chip
                            icon={<Clock className="h-3 w-3" style={{ color: '#d97706' }} />}
                            label="PENDING"
                            size="small"
                            sx={{
                              bgcolor: '#fffbeb',
                              color: '#b45309',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              border: '1px solid #fef3c7',
                              borderRadius: '6px'
                            }}
                          />
                        )}
                      </TableCell>

                      <TableCell align="right" sx={{ py: 2, pr: 4 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleOpenReview(brand)}
                          sx={{
                            borderColor: reviewStatus === 'pending' ? primaryColor : 'divider',
                            color: reviewStatus === 'pending' ? primaryColor : 'text.secondary',
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 'bold',
                            fontSize: '11px',
                            bgcolor: 'white',
                            '&:hover': {
                              borderColor: reviewStatus === 'pending' ? primaryHoverColor : 'divider',
                              bgcolor: 'action.hover',
                            }
                          }}
                          startIcon={<ClipboardCheck className="h-3.5 w-3.5" />}
                        >
                          {reviewStatus === 'pending' ? 'Review & Decision' : 'View Details'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Review Dialog */}
      <Dialog
        open={isReviewOpen}
        onClose={() => !isSubmittingAction && setIsReviewOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '24px',
              p: 1.5,
              maxHeight: '90vh'
            }
          }
        }}
      >
        {selectedBrand && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1 }}>
              {selectedBrand.logo_url ? (
                <img
                  src={selectedBrand.logo_url}
                  alt={selectedBrand.name}
                  className="h-10 w-10 rounded-xl border border-slate-100 object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm border border-slate-200">
                  {selectedBrand.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <Typography sx={{ fontWeight: 'bold', color: '#1e293b', fontSize: '16px' }}>
                  WytPass Integration Review
                </Typography>
                <Typography className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  {selectedBrand.name} • {selectedBrand.company_name || 'N/A'}
                </Typography>
              </div>
            </DialogTitle>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Tabs
                value={dialogTab}
                onChange={(_, val) => setDialogTab(val)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 'auto',
                  '& .MuiTabs-indicator': {
                    bgcolor: primaryColor,
                    height: '3px',
                    borderRadius: '3px'
                  },
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    minWidth: 'auto',
                    px: 2,
                    py: 1.5,
                    color: '#64748b',
                    minHeight: 'auto',
                    '&.Mui-selected': {
                      color: primaryColor,
                    }
                  }
                }}
              >
                <Tab label="Review Decision" icon={<ClipboardCheck className="h-4 w-4" />} iconPosition="start" />
                <Tab label="App Profile" icon={<Info className="h-4 w-4" />} iconPosition="start" />
                <Tab label="App Assets" icon={<Images className="h-4 w-4" />} iconPosition="start" />
                <Tab label="Subscription Plans" icon={<CreditCard className="h-4 w-4" />} iconPosition="start" />
                <Tab label="API Integration" icon={<Settings className="h-4 w-4" />} iconPosition="start" />
              </Tabs>
            </Box>

            <DialogContent sx={{ pt: 2, minHeight: 350, overflowY: 'auto' }}>
              {dialogTab === 0 && (
                <Box className="space-y-4">
                  {/* Integration Checklist Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className={`p-3.5 rounded-xl border text-center ${selectedBrand.whitepass_review?.sdk_installed ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100 bg-slate-50/50'}`}>
                      <div className="flex justify-center mb-1">
                        {selectedBrand.whitepass_review?.sdk_installed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-slate-300" />
                        )}
                      </div>
                      <div className="text-[10px] font-extrabold text-slate-500 uppercase">SDK Status</div>
                      <div className={`text-xs font-bold mt-0.5 ${selectedBrand.whitepass_review?.sdk_installed ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {selectedBrand.whitepass_review?.sdk_installed ? 'Installed' : 'Missing'}
                      </div>
                    </div>

                    <div className={`p-3.5 rounded-xl border text-center ${selectedBrand.whitepass_review?.callback_verified ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100 bg-slate-50/50'}`}>
                      <div className="flex justify-center mb-1">
                        {selectedBrand.whitepass_review?.callback_verified ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-slate-300" />
                        )}
                      </div>
                      <div className="text-[10px] font-extrabold text-slate-500 uppercase">Callback Url</div>
                      <div className={`text-xs font-bold mt-0.5 ${selectedBrand.whitepass_review?.callback_verified ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {selectedBrand.whitepass_review?.callback_verified ? 'Verified' : 'Unverified'}
                      </div>
                    </div>

                    <div className={`p-3.5 rounded-xl border text-center ${selectedBrand.whitepass_review?.domain_verified ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100 bg-slate-50/50'}`}>
                      <div className="flex justify-center mb-1">
                        {selectedBrand.whitepass_review?.domain_verified ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-slate-300" />
                        )}
                      </div>
                      <div className="text-[10px] font-extrabold text-slate-500 uppercase">Domain Check</div>
                      <div className={`text-xs font-bold mt-0.5 ${selectedBrand.whitepass_review?.domain_verified ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {selectedBrand.whitepass_review?.domain_verified ? 'Verified' : 'Unverified'}
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Integration Stage</span>
                      <span className="text-wytnet-blue capitalize">
                        {selectedBrand.current_stage.toLowerCase() === 'waiting for wytpass review'
                          ? 'Waiting for Review'
                          : (selectedBrand.current_stage.toLowerCase() === 'waiting for wytpass review rejected'
                            ? 'Waiting for Review Rejected'
                            : selectedBrand.current_stage.replace('_', ' '))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Verification Request Status</span>
                      <span className="capitalize">{selectedBrand.whitepass_review?.integration_status || 'pending'}</span>
                    </div>
                  </div>

                  {/* App Links to verify */}
                  {selectedBrand.links && selectedBrand.links.length > 0 && (
                    <Box className="space-y-1.5 pt-1">
                      <div className="text-xs font-bold text-slate-600">App Links to Verify:</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedBrand.links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-semibold transition-all border border-slate-200/50"
                          >
                            <span className="capitalize font-bold text-[9px] text-slate-400 mr-0.5">{link.link_type.replace('_', ' ')}:</span>
                            <span className="max-w-[150px] truncate">{link.title}</span>
                            <ExternalLink className="h-3 w-3 text-slate-400 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </Box>
                  )}

                  {/* Notes Input Field */}
                  <Box className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                      <MessageSquare className="h-4 w-4 text-slate-400" />
                      <span>Review Decision Notes / Rejection Reason</span>
                    </div>
                    <TextField
                      multiline
                      rows={3}
                      fullWidth
                      disabled={selectedBrand.whitepass_review?.integration_status !== 'pending'}
                      placeholder="Enter review findings, callback confirmation notes, or detailed instructions if rejecting the integration request..."
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

                  {selectedBrand.whitepass_review?.integration_status !== 'pending' && (
                    <Alert
                      severity={selectedBrand.whitepass_review?.integration_status === 'approved' ? 'success' : 'error'}
                      sx={{ borderRadius: '12px', fontSize: '11.5px', fontWeight: 'bold' }}
                    >
                      This review request has already been finalized as <strong>{selectedBrand.whitepass_review?.integration_status.toUpperCase()}</strong>.
                      {selectedBrand.whitepass_review?.integration_status === 'rejected' && selectedBrand.whitepass_review?.review_notes && (
                        <div className="mt-1 text-xs font-semibold text-red-700">
                          Rejection Reason: {selectedBrand.whitepass_review.review_notes}
                        </div>
                      )}
                    </Alert>
                  )}
                </Box>
              )}

              {dialogTab === 1 && (
                <Box className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">App Name</span>
                        <span className="text-sm font-extrabold text-slate-700">{selectedBrand.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Slug Identifier</span>
                        <span className="text-xs font-mono text-slate-500">/{selectedBrand.slug}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Company Name</span>
                        <span className="text-sm font-bold text-slate-700">{selectedBrand.company_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Short Summary</span>
                        <p className="text-xs font-semibold text-slate-600 mt-1">{selectedBrand.short_description || 'No summary provided.'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Description</span>
                        <p className="text-xs font-semibold text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                          {selectedBrand.full_description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {selectedBrand.logo_url && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Logo Image</span>
                          <img src={selectedBrand.logo_url} alt="App logo" className="h-16 w-16 object-contain rounded-2xl border border-slate-100 p-1" />
                        </div>
                      )}
                      {selectedBrand.banner_url && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Banner Showcase</span>
                          <img src={selectedBrand.banner_url} alt="App banner" className="w-full max-h-24 object-cover rounded-2xl border border-slate-100" />
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">App Classifications</span>
                        <div className="flex gap-1.5 flex-wrap mt-1">
                          {(() => {
                            const types = selectedBrand.brand_type
                              ? (Array.isArray(selectedBrand.brand_type) ? selectedBrand.brand_type : [selectedBrand.brand_type])
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
                          {selectedBrand.tags && selectedBrand.tags.length > 0 ? (
                            selectedBrand.tags.map((tag) => (
                              <Chip key={tag.id} label={tag.name} size="small" sx={{ fontSize: '9px', height: '18px', fontWeight: 'bold', bgcolor: '#eff6ff', color: '#1d4ed8' }} />
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">No tags configured</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Box>
              )}

              {dialogTab === 2 && (
                <Box sx={{ p: 0.5 }}>
                  <BrandAssets
                    portalType={portalType}
                    brandId={selectedBrand.id}
                    isEmbedded={true}
                    readOnly={true}
                  />
                </Box>
              )}

              {dialogTab === 3 && (
                <Box sx={{ p: 0.5 }}>
                  <BrandSubscriptions
                    portalType={portalType}
                    brandId={selectedBrand.id}
                    isEmbedded={true}
                    readOnly={true}
                  />
                </Box>
              )}

              {dialogTab === 4 && (
                <Box sx={{ p: 0.5 }}>
                  <BrandIntegrationSettings
                    brandId={selectedBrand.id}
                    isSandbox={isSandbox}
                    portalType={portalType}
                    readOnly={true}
                  />
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
              <Button
                disabled={isSubmittingAction}
                onClick={() => setIsReviewOpen(false)}
                sx={{
                  color: '#64748b',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  borderRadius: '10px'
                }}
              >
                Close
              </Button>

              {dialogTab === 0 && selectedBrand.whitepass_review?.integration_status === 'pending' && (
                <>
                  <Button
                    disabled={isSubmittingAction}
                    onClick={() => handleReviewAction('rejected')}
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
                    Reject Integration
                  </Button>

                  <Button
                    disabled={isSubmittingAction}
                    onClick={() => handleReviewAction('approved')}
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
                    startIcon={<Check className="h-4 w-4" />}
                  >
                    Approve & Verify
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

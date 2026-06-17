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
  CreditCard,
  ExternalLink
} from 'lucide-react';
import type {
  Brand,
  BrandWytPaymentReview
} from '@/api/wytsaas/brand';
import {
  fetchBrands,
  actionWytPaymentReview
} from '@/api/wytsaas/brand';

interface WytPaymentApprovalsProps {
  user?: { email: string; name: string; role: string } | null;
  portalType: 'wytsaas' | 'wytpass';
}

export default function WytPaymentApprovals({ user: _user, portalType }: WytPaymentApprovalsProps) {
  const primaryColor = '#9333ea'; // Purple for billing approvals
  const primaryHoverColor = '#7e22ce';

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

  // Filter brands based on tab, search query, and wytpayment_review presence
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    // Filter only brands that have WytPayment reviews requested or performed
    const withReview = brands.filter(b => b.wytpayment_review !== null || b.current_stage === 'Waiting for WytPayment Review' || b.current_stage === 'payment_integration');

    let tabFiltered = withReview;
    if (activeTab === 0) {
      // Pending
      tabFiltered = withReview.filter(b => b.wytpayment_review?.integration_status === 'pending' || ((b.current_stage === 'Waiting for WytPayment Review' || b.current_stage === 'payment_integration') && b.wytpayment_review?.integration_status !== 'approved' && b.wytpayment_review?.integration_status !== 'rejected'));
    } else if (activeTab === 1) {
      // Approved
      tabFiltered = withReview.filter(b => b.wytpayment_review?.integration_status === 'approved');
    } else if (activeTab === 2) {
      // Rejected
      tabFiltered = withReview.filter(b => b.wytpayment_review?.integration_status === 'rejected');
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
    setReviewNotes(brand.wytpayment_review?.review_notes || '');
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
            const currentReview = b.wytpayment_review || {
              id: Math.floor(Math.random() * 1000) + 200,
              brand_id: b.id,
              api_keys_configured: true,
              webhook_verified: true,
              test_payment_completed: true
            };

            return {
              ...b,
              is_payment_integration_accepted: status === 'approved',
              current_stage: status === 'approved' ? 'WytPayment Integration Completed' : 'Waiting for WytPayment Review Rejected',
              status: status === 'approved' ? b.status : 'Rejected',
              wytpayment_review: {
                ...currentReview,
                integration_status: status,
                review_notes: reviewNotes,
                reviewed_at: new Date().toISOString()
              } as BrandWytPaymentReview
            };
          }
          return b;
        });

        localStorage.setItem('mock_brands', JSON.stringify(updatedList));
        setBrands(updatedList);
        showToast(`Payment integration ${status} successfully (Sandbox)`, 'success');
      } else {
        const token = getAuthToken();
        if (!token) {
          showToast('Authentication token missing. Please log in again.', 'error');
          setIsSubmittingAction(false);
          return;
        }

        const updatedReview = await actionWytPaymentReview(selectedBrand.id, status, reviewNotes, token);

        // Refresh local brand list
        const updatedList = brands.map((b) => {
          if (b.id === selectedBrand.id) {
            return {
              ...b,
              is_payment_integration_accepted: status === 'approved',
              current_stage: status === 'approved' ? 'WytPayment Integration Completed' : 'Waiting for WytPayment Review Rejected',
              status: status === 'approved' ? b.status : 'Rejected',
              wytpayment_review: updatedReview
            };
          }
          return b;
        });
        setBrands(updatedList);
        showToast(`Payment integration ${status} successfully.`, 'success');
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
            Products / {portalType === 'wytsaas' ? 'WytSaaS' : 'WytPass'} / Administration / <ClipboardCheck className="h-3 w-3 inline" /> WytPayment Approvals
          </div>

          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-2xl font-extrabold text-wytnet-dark flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-purple-600" />
              <span>WytPayment Integration Approvals</span>
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
            Review and approve app payment integration requests. Verify API credentials, webhook endpoints, and sandbox checkout trials.
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
            border: '1px solid #fbcfe8',
            bgcolor: '#fdf4ff',
            color: '#701a75',
            fontWeight: '600',
            fontSize: '11px',
            '& .MuiAlert-icon': {
              color: '#d946ef'
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
            <Tab label="Approved Integrations" />
            <Tab label="Rejected Integrations" />
            <Tab label="All Submissions" />
          </Tabs>

          <Box className="relative flex-grow max-w-sm ml-auto py-2">
            <Search className="absolute left-3 top-5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search request by app name or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-100 hover:border-slate-200 focus:border-slate-300 text-xs font-semibold pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark"
            />
          </Box>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', py: 2 }}>Brand & Company</TableCell>
                <TableCell sx={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', py: 2 }}>API Keys Setup</TableCell>
                <TableCell sx={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', py: 2 }}>Webhook Configured</TableCell>
                <TableCell sx={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', py: 2 }}>Test Payment Completed</TableCell>
                <TableCell sx={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', py: 2 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', py: 2, pr: 4 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <RefreshCw className="h-6 w-6 text-slate-300 animate-spin mx-auto mb-2" />
                    <span className="text-xs font-semibold text-slate-400">Loading integration requests...</span>
                  </TableCell>
                </TableRow>
              ) : filteredBrands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <ClipboardCheck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-slate-400">No payment integration requests found matching this status.</span>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBrands.map((brand) => {
                  const review = brand.wytpayment_review;
                  const reviewStatus = review?.integration_status || 'pending';

                  return (
                    <TableRow key={brand.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ py: 3 }}>
                        <div className="flex items-center gap-3">
                          {brand.logo_url ? (
                            <img
                              src={brand.logo_url}
                              alt={brand.name}
                              className="h-9 w-9 rounded-xl border border-slate-100 object-cover"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs border border-slate-200/50">
                              {brand.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-bold text-slate-800">{brand.name}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{brand.company_name || 'N/A'}</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell sx={{ py: 3 }}>
                        {review?.api_keys_configured ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                            <span>Configured</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 font-medium text-xs">
                            <XCircle className="h-4.5 w-4.5 text-slate-300 shrink-0" />
                            <span>Missing</span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell sx={{ py: 3 }}>
                        {review?.webhook_verified ? (
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

                      <TableCell sx={{ py: 3 }}>
                        {review?.test_payment_completed ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                            <span>Completed</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 font-medium text-xs">
                            <XCircle className="h-4.5 w-4.5 text-slate-300 shrink-0" />
                            <span>Uncompleted</span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell sx={{ py: 3 }}>
                        {reviewStatus === 'approved' && (
                          <Chip
                            icon={<CheckCircle2 className="h-3 w-3" style={{ color: '#047857' }} />}
                            label="APPROVED"
                            size="small"
                            sx={{
                              bgcolor: '#ecfdf5',
                              color: '#047857',
                              fontWeight: 'bold',
                              fontSize: '9px',
                              border: '1px solid #d1fae5'
                            }}
                          />
                        )}
                        {reviewStatus === 'rejected' && (
                          <Chip
                            icon={<XCircle className="h-3 w-3" style={{ color: '#b91c1c' }} />}
                            label="REJECTED"
                            size="small"
                            sx={{
                              bgcolor: '#fef2f2',
                              color: '#b91c1c',
                              fontWeight: 'bold',
                              fontSize: '9px',
                              border: '1px solid #fee2e2'
                            }}
                          />
                        )}
                        {reviewStatus === 'pending' && (
                          <Chip
                            icon={<Clock className="h-3 w-3" style={{ color: '#d97706' }} />}
                            label="PENDING REVIEW"
                            size="small"
                            sx={{
                              bgcolor: '#fffbeb',
                              color: '#b45309',
                              fontWeight: 'bold',
                              fontSize: '9px',
                              border: '1px solid #fef3c7'
                            }}
                          />
                        )}
                      </TableCell>

                      <TableCell align="right" sx={{ py: 3, pr: 4 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleOpenReview(brand)}
                          sx={{
                            borderColor: reviewStatus === 'pending' ? primaryColor : '#e2e8f0',
                            color: reviewStatus === 'pending' ? primaryColor : '#475569',
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 'bold',
                            fontSize: '11px',
                            bgcolor: 'white',
                            '&:hover': {
                              borderColor: reviewStatus === 'pending' ? primaryHoverColor : '#cbd5e1',
                              bgcolor: '#f8fafc',
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
                  WytPayment Integration Review
                </Typography>
                <Typography className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  {selectedBrand.name} • {selectedBrand.company_name || 'N/A'}
                </Typography>
              </div>
            </DialogTitle>

            <DialogContent sx={{ spaceY: 4, pt: 2 }}>
              <Box className="space-y-4">
                {/* Integration Checklist Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className={`p-3.5 rounded-xl border text-center ${selectedBrand.wytpayment_review?.api_keys_configured ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="flex justify-center mb-1">
                      {selectedBrand.wytpayment_review?.api_keys_configured ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    <div className="text-[10px] font-extrabold text-slate-500 uppercase">API Credentials</div>
                    <div className={`text-xs font-bold mt-0.5 ${selectedBrand.wytpayment_review?.api_keys_configured ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {selectedBrand.wytpayment_review?.api_keys_configured ? 'Configured' : 'Missing'}
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border text-center ${selectedBrand.wytpayment_review?.webhook_verified ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="flex justify-center mb-1">
                      {selectedBrand.wytpayment_review?.webhook_verified ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    <div className="text-[10px] font-extrabold text-slate-500 uppercase">Webhook Secret</div>
                    <div className={`text-xs font-bold mt-0.5 ${selectedBrand.wytpayment_review?.webhook_verified ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {selectedBrand.wytpayment_review?.webhook_verified ? 'Verified' : 'Unverified'}
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border text-center ${selectedBrand.wytpayment_review?.test_payment_completed ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="flex justify-center mb-1">
                      {selectedBrand.wytpayment_review?.test_payment_completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    <div className="text-[10px] font-extrabold text-slate-500 uppercase">Test Payment</div>
                    <div className={`text-xs font-bold mt-0.5 ${selectedBrand.wytpayment_review?.test_payment_completed ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {selectedBrand.wytpayment_review?.test_payment_completed ? 'Completed' : 'Uncompleted'}
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>Integration Stage</span>
                    <span className="text-wytnet-blue capitalize">{selectedBrand.current_stage.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>Verification Request Status</span>
                    <span className="capitalize">{selectedBrand.wytpayment_review?.integration_status || 'pending'}</span>
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
                    disabled={selectedBrand.wytpayment_review?.integration_status !== 'pending'}
                    placeholder="Enter review findings, keys verification notes, or detailed instructions if rejecting the payment integration request..."
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

                {selectedBrand.wytpayment_review?.integration_status !== 'pending' && (
                  <Alert
                    severity={selectedBrand.wytpayment_review?.integration_status === 'approved' ? 'success' : 'error'}
                    sx={{ borderRadius: '12px', fontSize: '11.5px', fontWeight: 'bold' }}
                  >
                    This review request has already been finalized as <strong>{selectedBrand.wytpayment_review?.integration_status.toUpperCase()}</strong>.
                  </Alert>
                )}
              </Box>
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

              {selectedBrand.wytpayment_review?.integration_status === 'pending' && (
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

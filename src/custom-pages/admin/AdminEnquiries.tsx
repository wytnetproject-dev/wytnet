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
  CircularProgress
} from '@mui/material';
import {
  RefreshCw,
  Search,
  Trash2,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Eye,
  XCircle,
  FileText
} from 'lucide-react';
import type { Enquiry } from '@/api/wytsaas/enquiry';
import { fetchAllEnquiries, deleteEnquiry } from '@/api/wytsaas/enquiry';

interface AdminEnquiriesProps {
  user?: { email: string; name: string; role: string } | null;
}

const DEFAULT_MOCK_ENQUIRIES: Enquiry[] = [
  {
    id: 1,
    first_name: "Jane",
    last_name: "Doe",
    email: "jane.doe@example.com",
    phone: "+1 555-0199",
    message: "Hi WytNet team, I am interested in integrating the SaaS marketplace API keys inside my custom React portal. Can you send over the SDK bundle guidelines?",
    terms_accepted: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    first_name: "Alex",
    last_name: "Smith",
    email: "alex.smith@example.com",
    phone: "+91 9876543210",
    message: "Looking for corporate custom plans for 50+ developer accounts. Please connect me with the sales team or product manager.",
    terms_accepted: true,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    first_name: "Elena",
    last_name: "Rostova",
    email: "elena.r@agency.ru",
    phone: undefined,
    message: "Do you support automated custom webhook confirmation verification flows, or do we have to trigger test webhook events manually from the dashboard?",
    terms_accepted: true,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export default function AdminEnquiries({ user: _user }: AdminEnquiriesProps) {
  const primaryColor = '#0066cc'; // WytNet SaaS Blue
  const primaryHoverColor = '#0a84ff';

  // State
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState<Enquiry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSandbox, setIsSandbox] = useState(false);

  // View & Delete Modal State
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  // Toast alerts
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [isDeleting, setIsDeleting] = useState(false);

  const getAuthToken = () => {
    return localStorage.getItem('wytsaas_token') || '';
  };

  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const loadEnquiries = async () => {
    setIsLoading(true);
    const token = getAuthToken();
    try {
      const fetched = await fetchAllEnquiries(token);
      setEnquiries(fetched);
      setIsSandbox(false);
    } catch (err) {
      console.warn('FastAPI backend connection failed. Enabling mock fallback sandbox for Enquiries.', err);
      const stored = localStorage.getItem('mock_enquiries');
      const initial = stored ? JSON.parse(stored) : DEFAULT_MOCK_ENQUIRIES;
      if (!stored) {
        localStorage.setItem('mock_enquiries', JSON.stringify(initial));
      }
      setEnquiries(initial);
      setIsSandbox(true);
      showToast('FastAPI server offline. Switched to Mock Enquiries Sandbox.', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
  }, []);

  // Filter list when search updates
  useEffect(() => {
    let list = [...enquiries];

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (e) =>
          e.first_name.toLowerCase().includes(q) ||
          e.last_name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          (e.phone && e.phone.toLowerCase().includes(q)) ||
          e.message.toLowerCase().includes(q)
      );
    }

    setFilteredEnquiries(list);
  }, [searchQuery, enquiries]);

  // Open modals
  const handleOpenView = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsDeleteOpen(true);
  };

  // Action Handlers
  const handleDeleteConfirm = async () => {
    if (!selectedEnquiry) return;
    setIsDeleting(true);
    const token = getAuthToken();

    if (isSandbox) {
      setTimeout(() => {
        const stored = localStorage.getItem('mock_enquiries');
        const list: Enquiry[] = stored ? JSON.parse(stored) : DEFAULT_MOCK_ENQUIRIES;
        const updatedList = list.filter((e) => e.id !== selectedEnquiry.id);
        localStorage.setItem('mock_enquiries', JSON.stringify(updatedList));
        setEnquiries(updatedList);
        setIsDeleting(false);
        setIsDeleteOpen(false);
        showToast('Enquiry deleted successfully (Sandbox)', 'success');
      }, 600);
    } else {
      try {
        await deleteEnquiry(selectedEnquiry.id, token);
        setEnquiries(enquiries.filter((e) => e.id !== selectedEnquiry.id));
        setIsDeleteOpen(false);
        showToast('Enquiry deleted successfully', 'success');
      } catch (err: any) {
        showToast(err.detail || err.message || 'Failed to delete enquiry', 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header Panel */}
      <Box
        sx={{
          py: 2.5,
          px: 4,
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          backgroundColor: '#ffffff'
        }}
      >
        <div className="flex justify-between items-center w-full">
          <div>
            <Typography variant="h6" className="text-slate-800 flex items-center gap-2" sx={{ fontWeight: 800 }}>
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span>Enquiries & Messages</span>
            </Typography>
            <Typography variant="caption" className="text-slate-400 font-semibold mt-0.5 block">
              Monitor, read, and manage contact form submissions and customer inquiries.
            </Typography>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outlined"
              size="small"
              onClick={loadEnquiries}
              disabled={isLoading}
              startIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              sx={{
                borderRadius: '10px',
                borderColor: '#e2e8f0',
                color: '#64748b',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '11.5px',
                '&:hover': {
                  borderColor: '#cbd5e1',
                  bgcolor: '#f8fafc'
                }
              }}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Box>

      {/* Control panel and filters */}
      <Box sx={{ p: 3, flexShrink: 0, display: 'flex', gap: 2, alignItems: 'center', backgroundColor: '#f8fafc' }}>
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search inquiries by sender name, email, phone or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-400 text-xs font-semibold pl-9 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-slate-700 shadow-sm"
          />
        </div>

        {isSandbox && (
          <Chip
            label="Mock Sandbox Mode Active"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ fontWeight: 800, fontSize: '10px' }}
          />
        )}
      </Box>

      {/* Main content grid */}
      <Box sx={{ flexGrow: 1, px: 3, pb: 4, overflow: 'auto', backgroundColor: '#f8fafc' }}>
        {isLoading ? (
          <Box className="flex flex-col items-center justify-center py-24 gap-3">
            <CircularProgress size={36} sx={{ color: primaryColor }} />
            <Typography className="text-slate-400 text-xs font-bold">Fetching enquiries...</Typography>
          </Box>
        ) : filteredEnquiries.length > 0 ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: '20px',
              border: '1px solid #f1f5f9',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.005)'
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">Sender</th>
                    <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">Contact Detail</th>
                    <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">Message Snippet</th>
                    <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">Consent</th>
                    <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">Received Date</th>
                    <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredEnquiries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/30 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs select-none shadow-sm">
                            {e.first_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-none">
                              {e.first_name} {e.last_name}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-6 py-3.5">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span>{e.email}</span>
                          </span>
                          {e.phone && (
                            <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{e.phone}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Message Snippet */}
                      <td className="px-6 py-3.5 max-w-xs">
                        <Typography variant="body2" noWrap className="text-xs font-medium text-slate-500">
                          {e.message}
                        </Typography>
                      </td>

                      {/* Terms Acceptance */}
                      <td className="px-6 py-3.5">
                        {e.terms_accepted ? (
                          <Chip
                            icon={<CheckCircle2 className="h-3 w-3" style={{ color: '#059669' }} />}
                            label="ACCEPTED"
                            size="small"
                            sx={{
                              borderColor: '#d1fae5',
                              bgcolor: '#ecfdf5',
                              color: '#047857',
                              fontWeight: 'black',
                              fontSize: '9px',
                              border: '1px solid'
                            }}
                          />
                        ) : (
                          <Chip
                            icon={<XCircle className="h-3 w-3" style={{ color: '#dc2626' }} />}
                            label="NOT ACCEPTED"
                            size="small"
                            sx={{
                              borderColor: '#fee2e2',
                              bgcolor: '#fef2f2',
                              color: '#b91c1c',
                              fontWeight: 'black',
                              fontSize: '9px',
                              border: '1px solid'
                            }}
                          />
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-3.5 text-xs font-semibold text-slate-400">
                        {new Date(e.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => handleOpenView(e)}
                            sx={{
                              minWidth: 0,
                              p: 1,
                              borderRadius: '8px',
                              color: primaryColor,
                              '&:hover': { bgcolor: '#eff6ff' }
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => handleOpenDelete(e)}
                            sx={{
                              minWidth: 0,
                              p: 1,
                              borderRadius: '8px',
                              color: '#ef4444',
                              '&:hover': { bgcolor: '#fef2f2' }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              borderRadius: '24px',
              border: '1px solid #f1f5f9',
              p: 8,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2
            }}
          >
            <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
              <MessageSquare className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <Typography sx={{ fontWeight: 'extrabold', color: '#334155', fontSize: '13.5px' }}>
                No Enquiries Found
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '11.5px', mt: 0.5 }}>
                Try resetting search parameters or refresh the database.
              </Typography>
            </div>
          </Paper>
        )}
      </Box>

      {/* VIEW ENQUIRY DIALOG */}
      <Dialog
        open={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
      >
        {selectedEnquiry && (
          <>
            <DialogTitle sx={{ fontWeight: 800, fontSize: '16px', pb: 1, display: 'flex', items: 'center', gap: 1 }}>
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Enquiry Information Details</span>
            </DialogTitle>
            
            <DialogContent className="space-y-4 pt-2">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wide">First Name</span>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{selectedEnquiry.first_name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wide">Last Name</span>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{selectedEnquiry.last_name}</p>
                  </div>
                </div>

                <div className="border-t border-slate-200/40 my-2" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wide">Email Address</span>
                    <p className="text-xs font-bold text-slate-700 mt-0.5 flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{selectedEnquiry.email}</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wide">Phone Number</span>
                    <p className="text-xs font-bold text-slate-700 mt-0.5 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{selectedEnquiry.phone || 'Not Provided'}</span>
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200/40 my-2" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wide">Terms Accepted</span>
                    <p className="text-xs font-bold text-slate-700 mt-1">
                      {selectedEnquiry.terms_accepted ? 'Yes (Checkbox Accepted)' : 'No'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wide">Date Received</span>
                    <p className="text-xs font-bold text-slate-700 mt-1 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{new Date(selectedEnquiry.created_at).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wide ml-1">Message Body Content</span>
                <div className="bg-[#eff6ff]/30 border border-blue-100/50 rounded-2xl p-5 mt-1 text-slate-700 text-xs font-medium leading-relaxed whitespace-pre-line shadow-inner max-h-60 overflow-y-auto">
                  {selectedEnquiry.message}
                </div>
              </div>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsViewOpen(false)}
                sx={{
                  borderRadius: '11px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  borderColor: '#cbd5e1',
                  color: '#64748b'
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog
        open={isDeleteOpen}
        onClose={() => !isDeleting && setIsDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '15px', pb: 1 }}>
          Confirm Delete Enquiry
        </DialogTitle>
        <DialogContent>
          <Typography className="text-slate-500 text-xs font-medium leading-relaxed">
            Are you sure you want to permanently delete the enquiry record from{' '}
            <strong className="text-slate-700">
              {selectedEnquiry?.first_name} {selectedEnquiry?.last_name}
            </strong>
            ? This database modification is permanent and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="text"
            size="small"
            disabled={isDeleting}
            onClick={() => setIsDeleteOpen(false)}
            sx={{
              borderRadius: '11px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '11.5px',
              color: '#64748b'
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            color="error"
            disabled={isDeleting}
            onClick={handleDeleteConfirm}
            startIcon={isDeleting && <CircularProgress size={12} style={{ color: '#fff' }} />}
            sx={{
              borderRadius: '11px',
              textTransform: 'none',
              fontWeight: 800,
              fontSize: '11.5px',
              bgcolor: '#dc2626',
              '&:hover': { bgcolor: '#b91c1c' },
              boxShadow: 'none'
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Enquiry'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR ALERTS */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={toastSeverity}
          onClose={() => setToastOpen(false)}
          sx={{ borderRadius: '14px', fontWeight: 700, fontSize: '12px', boxShadow: 3 }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

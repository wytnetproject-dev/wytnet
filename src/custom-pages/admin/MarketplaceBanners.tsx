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
  Switch,
  FormControlLabel,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  Image,
  PlusCircle,
  Eye,
  Sliders,
  CheckCircle2,
  XCircle,
  Link,
  Award
} from 'lucide-react';
import {
  fetchAllBannersAdmin,
  createMarketplaceBanner,
  updateMarketplaceBanner,
  deleteMarketplaceBanner,
  type MarketplaceBanner,
  type MarketplaceBannerCreateInput,
  type MarketplaceBannerUpdateInput
} from '@/api/wytsaas/banner';

interface MarketplaceBannersProps {
  user?: { email: string; name: string; role: string } | null;
}

const DEFAULT_MOCK_BANNERS: MarketplaceBanner[] = [
  {
    id: 1,
    title: "WhitePass SSO",
    subtitle: "Universal Identity",
    description: "Secure, decentralized single sign-on system for next-generation apps and AI agents.",
    badge: "Featured App",
    bg_image: "from-blue-600 to-indigo-900",
    icon: "https://placehold.co/120x120/0066cc/ffffff?text=WP",
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    title: "WytPayment SDK",
    subtitle: "Agent Micropayments",
    description: "Enable your AI agents to execute sub-cent transactions instantly with absolute security.",
    badge: "Trending",
    bg_image: "from-purple-600 to-pink-900",
    icon: "https://placehold.co/120x120/7e22ce/ffffff?text=WP",
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    title: "Neural Flux Engine",
    subtitle: "AI Cognition",
    description: "Low-latency decentralized task distribution across global GPU node clusters.",
    badge: "Developer Choice",
    bg_image: "from-emerald-600 to-teal-900",
    icon: "https://placehold.co/120x120/0f766e/ffffff?text=NF",
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const GRADIENT_PRESETS = [
  { label: 'Blue-Indigo', value: 'from-blue-600 to-indigo-900' },
  { label: 'Purple-Pink', value: 'from-purple-600 to-pink-900' },
  { label: 'Emerald-Teal', value: 'from-emerald-600 to-teal-900' },
  { label: 'Orange-Red', value: 'from-orange-600 to-red-900' },
  { label: 'Dark Slate', value: 'from-slate-700 to-slate-900' }
];

export default function MarketplaceBanners({ user: _user }: MarketplaceBannersProps) {
  const primaryColor = '#0066cc';
  const primaryHoverColor = '#0052a3';

  // State
  const [banners, setBanners] = useState<MarketplaceBanner[]>([]);
  const [filteredBanners, setFilteredBanners] = useState<MarketplaceBanner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSandbox, setIsSandbox] = useState(false);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<MarketplaceBanner | null>(null);

  // Form Fields
  const [titleField, setTitleField] = useState('');
  const [subtitleField, setSubtitleField] = useState('');
  const [descriptionField, setDescriptionField] = useState('');
  const [badgeField, setBadgeField] = useState('');
  const [bgImageField, setBgImageField] = useState('from-blue-600 to-indigo-900');
  const [iconField, setIconField] = useState('');
  const [isActiveField, setIsActiveField] = useState(true);
  const [sortOrderField, setSortOrderField] = useState(0);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast
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

  const loadBanners = async () => {
    setIsLoading(true);
    const token = getAuthToken();
    try {
      const fetched = await fetchAllBannersAdmin(token);
      setBanners(fetched);
      setIsSandbox(false);
    } catch (err) {
      console.warn('FastAPI backend connection failed. Enabling mock fallback sandbox for Marketplace Banners.', err);
      const stored = localStorage.getItem('mock_banners');
      const initial = stored ? JSON.parse(stored) : DEFAULT_MOCK_BANNERS;
      if (!stored) {
        localStorage.setItem('mock_banners', JSON.stringify(initial));
      }
      setBanners(initial);
      setIsSandbox(true);
      showToast('FastAPI server offline. Switched to Mock Banners Sandbox.', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  // Filter list when search updates
  useEffect(() => {
    let list = [...banners];
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.subtitle && b.subtitle.toLowerCase().includes(q)) ||
          (b.description && b.description.toLowerCase().includes(q)) ||
          (b.badge && b.badge.toLowerCase().includes(q))
      );
    }
    // Sort by sort_order ascending, then by ID
    list.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    setFilteredBanners(list);
  }, [searchQuery, banners]);

  // Open Dialogs
  const handleOpenCreate = () => {
    setTitleField('');
    setSubtitleField('');
    setDescriptionField('');
    setBadgeField('');
    setBgImageField('from-blue-600 to-indigo-900');
    setIconField('');
    setIsActiveField(true);
    setSortOrderField(banners.length + 1);
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (banner: MarketplaceBanner) => {
    setSelectedBanner(banner);
    setTitleField(banner.title);
    setSubtitleField(banner.subtitle || '');
    setDescriptionField(banner.description || '');
    setBadgeField(banner.badge || '');
    setBgImageField(banner.bg_image || '');
    setIconField(banner.icon || '');
    setIsActiveField(banner.is_active);
    setSortOrderField(banner.sort_order);
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleOpenDelete = (banner: MarketplaceBanner) => {
    setSelectedBanner(banner);
    setIsDeleteOpen(true);
  };

  // Handlers
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!titleField.trim()) {
      setFormError('Title is a required field.');
      return;
    }

    setIsSubmitting(true);
    const token = getAuthToken();

    const inputData: MarketplaceBannerCreateInput = {
      title: titleField,
      subtitle: subtitleField || undefined,
      description: descriptionField || undefined,
      badge: badgeField || undefined,
      bg_image: bgImageField,
      icon: iconField || undefined,
      is_active: isActiveField,
      sort_order: sortOrderField
    };

    if (isSandbox) {
      setTimeout(() => {
        const stored = localStorage.getItem('mock_banners');
        const list: MarketplaceBanner[] = stored ? JSON.parse(stored) : DEFAULT_MOCK_BANNERS;

        const newBanner: MarketplaceBanner = {
          id: list.length > 0 ? Math.max(...list.map(b => b.id)) + 1 : 1,
          title: titleField,
          subtitle: subtitleField || undefined,
          description: descriptionField || undefined,
          badge: badgeField || undefined,
          bg_image: bgImageField,
          icon: iconField || undefined,
          is_active: isActiveField,
          sort_order: sortOrderField,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const updatedList = [...list, newBanner];
        localStorage.setItem('mock_banners', JSON.stringify(updatedList));
        setBanners(updatedList);
        setIsSubmitting(false);
        setIsCreateOpen(false);
        showToast('Banner created successfully (Sandbox)', 'success');
      }, 800);
    } else {
      try {
        const created = await createMarketplaceBanner(inputData, token);
        setBanners([...banners, created]);
        setIsCreateOpen(false);
        showToast('Marketplace banner created successfully', 'success');
      } catch (err: any) {
        setFormError(err.detail || err.message || 'Failed to create banner');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedBanner) return;
    if (!titleField.trim()) {
      setFormError('Title is a required field.');
      return;
    }

    setIsSubmitting(true);
    const token = getAuthToken();

    const inputData: MarketplaceBannerUpdateInput = {
      title: titleField,
      subtitle: subtitleField || undefined,
      description: descriptionField || undefined,
      badge: badgeField || undefined,
      bg_image: bgImageField,
      icon: iconField || undefined,
      is_active: isActiveField,
      sort_order: sortOrderField
    };

    if (isSandbox) {
      setTimeout(() => {
        const stored = localStorage.getItem('mock_banners');
        const list: MarketplaceBanner[] = stored ? JSON.parse(stored) : DEFAULT_MOCK_BANNERS;

        const updatedList = list.map((b) => {
          if (b.id === selectedBanner.id) {
            return {
              ...b,
              title: titleField,
              subtitle: subtitleField || undefined,
              description: descriptionField || undefined,
              badge: badgeField || undefined,
              bg_image: bgImageField,
              icon: iconField || undefined,
              is_active: isActiveField,
              sort_order: sortOrderField,
              updated_at: new Date().toISOString()
            };
          }
          return b;
        });

        localStorage.setItem('mock_banners', JSON.stringify(updatedList));
        setBanners(updatedList);
        setIsSubmitting(false);
        setIsEditOpen(false);
        showToast('Banner updated successfully (Sandbox)', 'success');
      }, 800);
    } else {
      try {
        const updated = await updateMarketplaceBanner(selectedBanner.id, inputData, token);
        setBanners(banners.map((b) => (b.id === selectedBanner.id ? updated : b)));
        setIsEditOpen(false);
        showToast('Marketplace banner updated successfully', 'success');
      } catch (err: any) {
        setFormError(err.detail || err.message || 'Failed to update banner');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedBanner) return;
    setIsSubmitting(true);
    const token = getAuthToken();

    if (isSandbox) {
      setTimeout(() => {
        const stored = localStorage.getItem('mock_banners');
        const list: MarketplaceBanner[] = stored ? JSON.parse(stored) : DEFAULT_MOCK_BANNERS;
        const updatedList = list.filter((b) => b.id !== selectedBanner.id);
        localStorage.setItem('mock_banners', JSON.stringify(updatedList));
        setBanners(updatedList);
        setIsSubmitting(false);
        setIsDeleteOpen(false);
        showToast('Banner deleted successfully (Sandbox)', 'success');
      }, 600);
    } else {
      try {
        await deleteMarketplaceBanner(selectedBanner.id, token);
        setBanners(banners.filter((b) => b.id !== selectedBanner.id));
        setIsDeleteOpen(false);
        showToast('Marketplace banner deleted successfully', 'success');
      } catch (err: any) {
        showToast(err.detail || err.message || 'Failed to delete banner', 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getStatusBadge = (active: boolean) => {
    return active ? (
      <Chip
        icon={<CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#059669' }} />}
        label="ACTIVE"
        size="small"
        sx={{
          borderColor: '#d1fae5',
          bgcolor: '#ecfdf5',
          color: '#047857',
          fontWeight: 'black',
          fontSize: '9.5px',
          border: '1px solid'
        }}
      />
    ) : (
      <Chip
        icon={<XCircle className="h-3.5 w-3.5" style={{ color: '#dc2626' }} />}
        label="INACTIVE"
        size="small"
        sx={{
          borderColor: '#fee2e2',
          bgcolor: '#fef2f2',
          color: '#b91c1c',
          fontWeight: 'black',
          fontSize: '9.5px',
          border: '1px solid'
        }}
      />
    );
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
          justifyContent: 'between',
          alignItems: 'center',
          flexShrink: 0,
          backgroundColor: '#ffffff'
        }}
      >
        <div className="flex justify-between items-center w-full">
          <div>
            <Typography variant="h6" className="text-slate-800 flex items-center gap-2" sx={{ fontWeight: 800 }}>
              <Image className="h-5 w-5 text-blue-500" />
              <span>Marketplace Banners Management</span>
            </Typography>
            <Typography variant="caption" className="text-slate-400 font-semibold mt-0.5 block">
              Manage the homepage slideshow banners. You can edit text content, gradient colors, icon images and ordering.
            </Typography>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outlined"
              size="small"
              onClick={loadBanners}
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
            <Button
              variant="contained"
              size="small"
              onClick={handleOpenCreate}
              startIcon={<PlusCircle className="h-3.5 w-3.5" />}
              sx={{
                borderRadius: '10px',
                bgcolor: primaryColor,
                '&:hover': { bgcolor: primaryHoverColor },
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '11.5px',
                boxShadow: 'none'
              }}
            >
              Add New Slide
            </Button>
          </div>
        </div>
      </Box>

      {/* Filter panel */}
      <Box sx={{ p: 3, flexShrink: 0, display: 'flex', gap: 2, alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search slides by title, subtitle, badge or description..."
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

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, px: 3, pb: 4, overflow: 'auto', backgroundColor: '#f8fafc' }}>
        {isLoading ? (
          <Box className="flex flex-col items-center justify-center py-24 gap-3">
            <CircularProgress size={36} sx={{ color: primaryColor }} />
            <Typography className="text-slate-400 text-xs font-bold">Loading banners...</Typography>
          </Box>
        ) : filteredBanners.length > 0 ? (
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
                    <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">Order</th>
                    <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">Banner Slide Info</th>
                    <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">Badge</th>
                    <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">Background Preview</th>
                    <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">Status</th>
                    <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredBanners.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/30 transition-colors">
                      {/* Sort Order */}
                      <td className="px-6 py-3.5 text-xs font-bold text-slate-600 font-mono">
                        {b.sort_order}
                      </td>

                      {/* Info & Icon */}
                      <td className="px-6 py-3.5 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                            {b.icon ? (
                              <img src={b.icon} alt="" className="h-8 w-8 object-contain rounded-lg" />
                            ) : (
                              <Image className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-none">
                              {b.title}
                            </p>
                            {b.subtitle && (
                              <p className="text-[10px] font-semibold text-slate-500 mt-1">
                                {b.subtitle}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">
                              {b.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Badge */}
                      <td className="px-6 py-3.5">
                        {b.badge ? (
                          <Chip
                            label={b.badge}
                            size="small"
                            icon={<Award className="h-3 w-3" />}
                            sx={{
                              borderColor: '#e2e8f0',
                              bgcolor: '#f8fafc',
                              color: '#64748b',
                              fontWeight: 700,
                              fontSize: '9.5px',
                              border: '1px solid'
                            }}
                          />
                        ) : (
                          <span className="text-slate-300 text-xs italic">-</span>
                        )}
                      </td>

                      {/* Background image preview */}
                      <td className="px-6 py-3.5">
                        {b.bg_image ? (
                          <div className="flex items-center gap-2">
                            <Box
                              className={b.bg_image.startsWith('from-') ? `bg-gradient-to-r ${b.bg_image}` : ''}
                              sx={{
                                height: 24,
                                width: 50,
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                backgroundImage: b.bg_image.startsWith('from-') ? undefined : `url(${b.bg_image})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            />
                            <span className="text-[9px] font-mono text-slate-400 font-semibold truncate max-w-[120px]" title={b.bg_image}>
                              {b.bg_image}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs italic">Default Gradient</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3.5">
                        {getStatusBadge(b.is_active)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => handleOpenEdit(b)}
                            sx={{
                              minWidth: 0,
                              p: 1,
                              borderRadius: '8px',
                              color: '#3b82f6',
                              '&:hover': { bgcolor: '#eff6ff' }
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => handleOpenDelete(b)}
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
              <Image className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <Typography sx={{ fontWeight: 'extrabold', color: '#334155', fontSize: '13.5px' }}>
                No Banners Found
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '11.5px', mt: 0.5 }}>
                Get started by clicking the "Add New Slide" button.
              </Typography>
            </div>
          </Paper>
        )}
      </Box>

      {/* CREATE & EDIT FORM DIALOG */}
      <Dialog
        open={isCreateOpen || isEditOpen}
        onClose={() => !isSubmitting && (isCreateOpen ? setIsCreateOpen(false) : setIsEditOpen(false))}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
      >
        <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit}>
          <DialogTitle sx={{ fontWeight: 800, fontSize: '15px', pb: 1, display: 'flex', items: 'center', gap: 1 }}>
            <Sliders className="h-4.5 w-4.5 text-blue-500" />
            <span>{isCreateOpen ? 'Create New Banner Slide' : 'Modify Banner Slide'}</span>
          </DialogTitle>

          <DialogContent className="space-y-4 pt-2">
            {formError && (
              <Alert severity="error" sx={{ borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                {formError}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Form Input fields */}
              <Grid size={{ xs: 12, md: 7 }} className="space-y-4">
                <TextField
                  label="Title"
                  size="small"
                  fullWidth
                  required
                  placeholder="e.g. WhitePass SSO"
                  value={titleField}
                  onChange={(e) => setTitleField(e.target.value)}
                  slotProps={{
                    inputLabel: { style: { fontSize: '12px', fontWeight: 700 } },
                    htmlInput: { style: { fontSize: '12px', fontWeight: 500 } }
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />

                <TextField
                  label="Subtitle"
                  size="small"
                  fullWidth
                  placeholder="e.g. Universal Identity"
                  value={subtitleField}
                  onChange={(e) => setSubtitleField(e.target.value)}
                  slotProps={{
                    inputLabel: { style: { fontSize: '12px', fontWeight: 700 } },
                    htmlInput: { style: { fontSize: '12px', fontWeight: 500 } }
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />

                <TextField
                  label="Description"
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Provide details about the featured app or update..."
                  value={descriptionField}
                  onChange={(e) => setDescriptionField(e.target.value)}
                  slotProps={{
                    inputLabel: { style: { fontSize: '12px', fontWeight: 700 } },
                    htmlInput: { style: { fontSize: '12px', fontWeight: 500 } }
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />

                <Grid container spacing={2}>
                  <Grid size={6}>
                    <TextField
                      label="Badge Text"
                      size="small"
                      fullWidth
                      placeholder="e.g. Featured App"
                      value={badgeField}
                      onChange={(e) => setBadgeField(e.target.value)}
                      slotProps={{
                        inputLabel: { style: { fontSize: '12px', fontWeight: 700 } },
                        htmlInput: { style: { fontSize: '12px', fontWeight: 500 } }
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      label="Sort Order"
                      type="number"
                      size="small"
                      fullWidth
                      value={sortOrderField}
                      onChange={(e) => setSortOrderField(parseInt(e.target.value) || 0)}
                      slotProps={{
                        inputLabel: { style: { fontSize: '12px', fontWeight: 700 } },
                        htmlInput: { style: { fontSize: '12px', fontWeight: 500 } }
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="Icon Image URL"
                  size="small"
                  fullWidth
                  placeholder="e.g. https://placehold.co/120x120/0066cc/ffffff?text=WP"
                  value={iconField}
                  onChange={(e) => setIconField(e.target.value)}
                  slotProps={{
                    inputLabel: { style: { fontSize: '12px', fontWeight: 700 } },
                    htmlInput: { style: { fontSize: '12px', fontWeight: 500 } }
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />

                {/* Custom Gradient Selector */}
                <Box>
                  <Typography variant="caption" className="text-slate-400 font-bold mb-1.5 block">
                    Background Style (Tailwind Gradient Class or Image URL)
                  </Typography>
                  <div className="flex gap-2 mb-2">
                    {GRADIENT_PRESETS.map((p) => (
                      <Button
                        key={p.value}
                        variant="outlined"
                        size="small"
                        onClick={() => setBgImageField(p.value)}
                        sx={{
                          p: '4px 8px',
                          fontSize: '9.5px',
                          fontWeight: 700,
                          textTransform: 'none',
                          borderRadius: '8px',
                          color: bgImageField === p.value ? '#ffffff' : '#64748b',
                          bgcolor: bgImageField === p.value ? primaryColor : '#ffffff',
                          borderColor: bgImageField === p.value ? primaryColor : '#cbd5e1',
                          '&:hover': {
                            bgcolor: bgImageField === p.value ? primaryHoverColor : '#f8fafc',
                            borderColor: bgImageField === p.value ? primaryHoverColor : '#cbd5e1'
                          }
                        }}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Enter custom Tailwind gradient (e.g. from-blue-600 to-indigo-900) or Image URL"
                    value={bgImageField}
                    onChange={(e) => setBgImageField(e.target.value)}
                    slotProps={{
                      htmlInput: { style: { fontSize: '11px', fontWeight: 600, fontFamily: 'monospace' } }
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={isActiveField}
                      onChange={(e) => setIsActiveField(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <span className="text-xs font-bold text-slate-500">
                      Display Live on Marketplace
                    </span>
                  }
                />
              </Grid>

              {/* LIVE CAROUSEL PREVIEW CARD */}
              <Grid size={{ xs: 12, md: 5 }} className="flex flex-col">
                <Typography variant="caption" className="text-slate-400 font-bold mb-2 block flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-blue-500" />
                  <span>Real-time Showcase Preview</span>
                </Typography>

                <Box
                  className={`flex-grow h-72 rounded-2xl flex flex-col justify-between p-6 text-white shadow-md relative overflow-hidden select-none border border-slate-100 ${bgImageField.startsWith('from-') ? `bg-gradient-to-r ${bgImageField}` : ''
                    }`}
                  style={{
                    backgroundImage: bgImageField && !bgImageField.startsWith('from-') ? `url(${bgImageField})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: bgImageField ? undefined : '#0f172a'
                  }}
                >
                  {/* Badge */}
                  <div>
                    {badgeField ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white">
                        {badgeField}
                      </span>
                    ) : (
                      <span className="inline-block h-4" />
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="space-y-2 mt-auto">
                    <div>
                      <h3 className="text-lg font-black leading-tight tracking-tight">
                        {titleField || 'Featured Title'}
                      </h3>
                      {subtitleField && (
                        <p className="text-xs font-bold text-white/80 mt-0.5">
                          {subtitleField}
                        </p>
                      )}
                    </div>
                    <p className="text-[10px] text-white/70 font-medium leading-relaxed line-clamp-3">
                      {descriptionField || 'Description placeholder showing how copy will render live. Keep it clear, concise, and impact-driven.'}
                    </p>
                  </div>

                  {/* Icon */}
                  <div className="absolute top-6 right-6 h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center overflow-hidden">
                    {iconField ? (
                      <img src={iconField} alt="" className="h-10 w-10 object-contain rounded-lg" />
                    ) : (
                      <Link className="h-5 w-5 text-white/50" />
                    )}
                  </div>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => (isCreateOpen ? setIsCreateOpen(false) : setIsEditOpen(false))}
              disabled={isSubmitting}
              sx={{
                borderRadius: '10px',
                borderColor: '#e2e8f0',
                color: '#64748b',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' }
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={12} color="inherit" /> : null}
              sx={{
                borderRadius: '10px',
                bgcolor: primaryColor,
                '&:hover': { bgcolor: primaryHoverColor },
                fontWeight: 800,
                textTransform: 'none',
                boxShadow: 'none'
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog
        open={isDeleteOpen}
        onClose={() => !isSubmitting && setIsDeleteOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '15px' }}>Confirm Slide Removal</DialogTitle>
        <DialogContent>
          <Typography className="text-slate-500 text-xs font-semibold">
            Are you sure you want to remove the banner slide for <strong>{selectedBanner?.title}</strong>? This action will immediately remove it from the home page.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setIsDeleteOpen(false)}
            disabled={isSubmitting}
            sx={{
              borderRadius: '10px',
              borderColor: '#e2e8f0',
              color: '#64748b',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' }
            }}
          >
            Go Back
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={handleDeleteSubmit}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={12} color="inherit" /> : null}
            sx={{
              borderRadius: '10px',
              fontWeight: 800,
              textTransform: 'none',
              boxShadow: 'none'
            }}
          >
            {isSubmitting ? 'Removing...' : 'Remove Slide'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Alert */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity={toastSeverity}
          sx={{ borderRadius: '16px', fontSize: '12px', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Chip,
  Snackbar,
  Alert,
  IconButton,
  Divider,
  Card,
  CardMedia,
  CardActions
} from '@mui/material';
import {
  Trash2,
  Save,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Images,
  Image as ImageIcon,
  Video,
  Check,
  WifiOff,
  AlertTriangle,
  Play
} from 'lucide-react';
import type { Brand, BrandMedia } from '@/api/wytsaas/brand';
import { fetchBrands, updateBrand } from '@/api/wytsaas/brand';
import ImageUploader from './ImageUploader';

interface BrandAssetsProps {
  user?: { email: string; name: string; role: string } | null;
  portalType: 'wytsaas' | 'wytpass';
  brandId?: number;
  isEmbedded?: boolean;
  onRefreshBrand?: () => void;
  readOnly?: boolean;
}

const DEFAULT_MOCK_BRANDS: Brand[] = [];

export default function BrandAssets({ user: _user, portalType, brandId, isEmbedded, onRefreshBrand, readOnly = false }: BrandAssetsProps) {
  // Theme styling depending on portalType
  const primaryColor = portalType === 'wytsaas' ? '#0066cc' : '#9333ea';
  const primaryHoverColor = portalType === 'wytsaas' ? '#0052a3' : '#7e22ce';
  const selectionBgColor = portalType === 'wytsaas' ? '#eff6ff' : '#faf5ff';

  // State
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSandbox, setIsSandbox] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Active brand media state
  const [currentMedia, setCurrentMedia] = useState<BrandMedia[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // New media asset form state
  const [newUrl, setNewUrl] = useState('');
  const [newSortOrder, setNewSortOrder] = useState('');
  const [promoVideoUrl, setPromoVideoUrl] = useState('');

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

  // Fetch Brands implementation
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
          setCurrentMedia(b.media || []);
        }
      } else if (fetched.length > 0) {
        const defaultBrand = selectedBrand ? (fetched.find(b => b.id === selectedBrand.id) || fetched[0]) : fetched[0];
        setSelectedBrand(defaultBrand);
        setCurrentMedia(defaultBrand.media || []);
      }
      setHasChanges(false);
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
          setCurrentMedia(b.media || []);
        }
      } else if (initial.length > 0) {
        const defaultBrand = selectedBrand ? (initial.find((b: Brand) => b.id === selectedBrand.id) || initial[0]) : initial[0];
        setSelectedBrand(defaultBrand);
        setCurrentMedia(defaultBrand.media || []);
      }
      setHasChanges(false);
    } finally {
      setIsLoading(false);
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
        setCurrentMedia(b.media || []);
        setHasChanges(false);
      }
    }
  }, [brandId, brands]);



  // Automatically add screenshot to gallery list on upload success
  const handleUploadSuccess = (uploadedUrl: string) => {
    if (!uploadedUrl) return;

    const currentImagesCount = currentMedia.filter(m => m.media_type === 'image').length;
    if (currentImagesCount >= 7) {
      showToast('Maximum of 7 screenshots is allowed.', 'error');
      return;
    }

    const order = newSortOrder ? parseInt(newSortOrder) : currentMedia.length + 1;
    const newAsset: BrandMedia = {
      media_type: 'image',
      media_url: uploadedUrl,
      sort_order: order
    };
    
    const updated = [...currentMedia, newAsset].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    setCurrentMedia(updated);
    setHasChanges(true);
    setNewUrl('');
    setNewSortOrder('');
  };

  const getYouTubeThumbnail = (url: string) => {
    let videoId = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && (match[2].length === 12 || match[2].length === 11)) {
      videoId = match[2];
    }
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return '';
  };

  const handleAddPromoVideo = () => {
    if (!promoVideoUrl.trim()) {
      showToast('Please enter a YouTube video URL.', 'error');
      return;
    }
    
    // Allow only one promotional video link
    const hasVideo = currentMedia.some(item => item.media_type === 'video');
    if (hasVideo) {
      showToast('Only one promotional video link is allowed.', 'error');
      return;
    }
    
    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!ytRegex.test(promoVideoUrl.trim())) {
      showToast('Please enter a valid YouTube link.', 'error');
      return;
    }

    const order = newSortOrder ? parseInt(newSortOrder) : currentMedia.length + 1;
    const newAsset: BrandMedia = {
      media_type: 'video',
      media_url: promoVideoUrl.trim(),
      sort_order: order
    };

    const updated = [...currentMedia, newAsset].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    setCurrentMedia(updated);
    setHasChanges(true);
    setPromoVideoUrl('');
    setNewSortOrder('');
    showToast('Promotional video added to library list.', 'success');
  };

  // Remove asset from dynamic list
  const handleRemoveAsset = (itemToRemove: BrandMedia) => {
    const updated = currentMedia.filter((item) => item.media_url !== itemToRemove.media_url);
    const resort = updated.map((item, idx) => ({
      ...item,
      sort_order: idx + 1
    }));
    setCurrentMedia(resort);
    setHasChanges(true);
  };

  // Move image up in sort order
  const handleMoveImageUp = (idxInFiltered: number) => {
    if (idxInFiltered === 0) return;
    const images = currentMedia.filter(item => item.media_type === 'image');
    const videos = currentMedia.filter(item => item.media_type !== 'image');
    
    const temp = images[idxInFiltered];
    images[idxInFiltered] = images[idxInFiltered - 1];
    images[idxInFiltered - 1] = temp;
    
    const updatedImages = images.map((item, idx) => ({ ...item, sort_order: idx + 1 }));
    const updatedVideos = videos.map((item, idx) => ({ ...item, sort_order: images.length + idx + 1 }));
    
    setCurrentMedia([...updatedImages, ...updatedVideos]);
    setHasChanges(true);
  };

  // Move image down in sort order
  const handleMoveImageDown = (idxInFiltered: number) => {
    const images = currentMedia.filter(item => item.media_type === 'image');
    if (idxInFiltered === images.length - 1) return;
    const videos = currentMedia.filter(item => item.media_type !== 'image');
    
    const temp = images[idxInFiltered];
    images[idxInFiltered] = images[idxInFiltered + 1];
    images[idxInFiltered + 1] = temp;
    
    const updatedImages = images.map((item, idx) => ({ ...item, sort_order: idx + 1 }));
    const updatedVideos = videos.map((item, idx) => ({ ...item, sort_order: images.length + idx + 1 }));
    
    setCurrentMedia([...updatedImages, ...updatedVideos]);
    setHasChanges(true);
  };

  // Move video up in sort order
  const handleMoveVideoUp = (idxInFiltered: number) => {
    if (idxInFiltered === 0) return;
    const images = currentMedia.filter(item => item.media_type === 'image');
    const videos = currentMedia.filter(item => item.media_type === 'video');
    
    const temp = videos[idxInFiltered];
    videos[idxInFiltered] = videos[idxInFiltered - 1];
    videos[idxInFiltered - 1] = temp;
    
    const updatedImages = images.map((item, idx) => ({ ...item, sort_order: idx + 1 }));
    const updatedVideos = videos.map((item, idx) => ({ ...item, sort_order: images.length + idx + 1 }));
    
    setCurrentMedia([...updatedImages, ...updatedVideos]);
    setHasChanges(true);
  };

  // Move video down in sort order
  const handleMoveVideoDown = (idxInFiltered: number) => {
    const images = currentMedia.filter(item => item.media_type === 'image');
    const videos = currentMedia.filter(item => item.media_type === 'video');
    if (idxInFiltered === videos.length - 1) return;
    
    const temp = videos[idxInFiltered];
    videos[idxInFiltered] = videos[idxInFiltered + 1];
    videos[idxInFiltered + 1] = temp;
    
    const updatedImages = images.map((item, idx) => ({ ...item, sort_order: idx + 1 }));
    const updatedVideos = videos.map((item, idx) => ({ ...item, sort_order: images.length + idx + 1 }));
    
    setCurrentMedia([...updatedImages, ...updatedVideos]);
    setHasChanges(true);
  };

  // Discard updates
  const handleReset = () => {
    if (selectedBrand) {
      setCurrentMedia(selectedBrand.media || []);
      setHasChanges(false);
      showToast('Changes discarded.', 'info');
    }
  };

  // Save all media updates to DB or mock storage
  const handleSaveAssets = async () => {
    if (!selectedBrand) return;

    if (isSandbox) {
      const nowString = new Date().toISOString();
      const updatedList = brands.map((b) =>
        b.id === selectedBrand.id
          ? {
              ...b,
              media: currentMedia.map((m, idx) => ({ ...m, id: idx + 1, brand_id: b.id })),
              updated_at: nowString
            }
          : b
      );
      localStorage.setItem('mock_brands', JSON.stringify(updatedList));
      setBrands(updatedList);
      
      const newSel = updatedList.find(b => b.id === selectedBrand.id);
      if (newSel) {
        setSelectedBrand(newSel);
        setCurrentMedia(newSel.media || []);
      }
      setHasChanges(false);
      showToast('App assets saved successfully (Sandbox)', 'success');
    } else {
      const token = getAuthToken();
      if (!token) {
        showToast('Authentication token missing. Please re-login.', 'error');
        return;
      }
      setIsLoading(true);
      try {
        const payload = {
          media: currentMedia.map(m => ({
            media_type: m.media_type,
            media_url: m.media_url,
            sort_order: m.sort_order
          }))
        };
        const updated = await updateBrand(selectedBrand.id, payload, token);
        
        // Refresh local brand lists
        setBrands(brands.map(b => b.id === selectedBrand.id ? updated : b));
        setSelectedBrand(updated);
        setCurrentMedia(updated.media || []);
        setHasChanges(false);
        showToast('App assets updated successfully in backend registry.', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to update app assets in backend.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleProceedToNextStage = async () => {
    if (!selectedBrand) return;
    
    // Save assets first if there are changes
    if (hasChanges) {
      if (isSandbox) {
        const nowString = new Date().toISOString();
        const updatedList = brands.map((b) =>
          b.id === selectedBrand.id
            ? {
                ...b,
                media: currentMedia.map((m, idx) => ({ ...m, id: idx + 1, brand_id: b.id })),
                updated_at: nowString
              }
            : b
        );
        localStorage.setItem('mock_brands', JSON.stringify(updatedList));
      } else {
        const token = getAuthToken();
        if (token) {
          try {
            await updateBrand(selectedBrand.id, {
              media: currentMedia.map(m => ({
                media_type: m.media_type,
                media_url: m.media_url,
                sort_order: m.sort_order
              }))
            }, token);
          } catch (err) {
            console.error('Failed to pre-save assets:', err);
          }
        }
      }
    }

    // Now advance stage to 'Subscription Plan Configuration'
    if (isSandbox) {
      const stored = localStorage.getItem('mock_brands');
      const mockList = stored ? JSON.parse(stored) : [];
      const updatedList = mockList.map((b: Brand) =>
        b.id === selectedBrand.id
          ? {
              ...b,
              current_stage: 'Subscription Plan Configuration',
              updated_at: new Date().toISOString()
            }
          : b
      );
      localStorage.setItem('mock_brands', JSON.stringify(updatedList));
      showToast('Assets finalized! Stage 3 unlocked: Subscription Plan Configuration.', 'success');
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
        await updateBrand(selectedBrand.id, {
          current_stage: 'Subscription Plan Configuration'
        }, token);
        showToast('Assets finalized! Stage 3 unlocked: Subscription Plan Configuration.', 'success');
        if (onRefreshBrand) {
          onRefreshBrand();
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to update onboarding stage.', 'error');
      }
    }
  };

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
              Products / {portalType === 'wytsaas' ? 'WytSaaS' : 'WytPass'} / Assets / <Images className="h-3 w-3 inline" /> Developer
            </div>
            
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-extrabold text-wytnet-dark">
                App Assets Manager
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
              Upload screenshots, showcase banners, and video demos for app profile catalog displays.
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
          FastAPI Backend (port 8000) is offline. All App Assets modified will be stored temporarily in your local sandbox browser container.
        </Alert>
      )}

      {/* Main Interface Area (No Sidebar) */}
      <Box sx={{ display: 'flex', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Main assets editor */}
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
              {/* Asset Header Info */}
              <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 'black', fontSize: '15px', color: '#1e293b' }}>
                    Asset Library: {selectedBrand.name}
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', mt: 0.5 }}>
                    Company: {selectedBrand.company_name || 'Not Set'} &bull; Slug: /{selectedBrand.slug}
                  </Typography>
                </Box>

                {hasChanges && !readOnly && (
                  <Chip
                    icon={<AlertTriangle className="h-3 w-3" />}
                    label="Unsaved Changes"
                    size="small"
                    color="warning"
                    sx={{ fontWeight: 'bold', fontSize: '10px' }}
                  />
                )}
              </Box>

              {/* Form & List Workspace Scroll Area */}
              <Box sx={{ flexGrow: isEmbedded ? 0 : 1, overflowY: isEmbedded ? 'visible' : 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {!readOnly && (
                  <>
                    {/* 1. Add Asset input section */}
                    <Box>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', mb: 2, textTransform: 'uppercase' }}>
                        Add Showcase Asset
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                          <TextField
                            label="Sort Order"
                            placeholder="e.g. 1"
                            size="small"
                            type="number"
                            value={newSortOrder}
                            onChange={(e) => setNewSortOrder(e.target.value)}
                            sx={{ width: 100 }}
                            slotProps={{
                              inputLabel: { style: { fontSize: '12px', fontWeight: '600' } },
                              input: { style: { borderRadius: '10px', fontSize: '12px' } }
                            }}
                          />
                          <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                            (Optional) Specify order before uploading. Automatically appends if left blank.
                          </Typography>
                        </Box>

                        <Box sx={{ maxWidth: '100%' }}>
                          {currentMedia.filter(m => m.media_type === 'image').length >= 7 ? (
                            <Alert severity="info" sx={{ borderRadius: '12px' }}>
                              Maximum limit of 7 screenshots reached. Delete an existing screenshot to upload a new one.
                            </Alert>
                          ) : (
                            <ImageUploader
                              label="Upload Screenshot Image File"
                              value={newUrl}
                              onChange={handleUploadSuccess}
                              primaryColor={primaryColor}
                              autoResetAfterUpload={true}
                              isSandbox={isSandbox}
                              minWidth={320}
                              minHeight={320}
                              maxWidth={3840}
                              maxHeight={3840}
                              minAspectRatio={9 / 16}
                              maxAspectRatio={16 / 9}
                            />
                          )}
                        </Box>

                        <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Typography sx={{ fontWeight: 'bold', fontSize: '12px', color: '#475569' }}>
                            Or Add YouTube Promotional Video
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <TextField
                              label="YouTube Video URL"
                              placeholder="e.g. https://www.youtube.com/watch?v=..."
                              size="small"
                              value={promoVideoUrl}
                              onChange={(e) => setPromoVideoUrl(e.target.value)}
                              sx={{ flexGrow: 1, minWidth: '280px', maxWidth: '500px' }}
                              slotProps={{
                                inputLabel: { style: { fontSize: '12px', fontWeight: '600' } },
                                input: { style: { borderRadius: '10px', fontSize: '12px' } }
                              }}
                            />
                            <Button
                              variant="outlined"
                              size="medium"
                              onClick={handleAddPromoVideo}
                              sx={{
                                borderColor: primaryColor,
                                color: primaryColor,
                                borderRadius: '10px',
                                textTransform: 'none',
                                fontWeight: 'bold',
                                px: 3,
                                '&:hover': {
                                  borderColor: primaryHoverColor,
                                  bgcolor: selectionBgColor,
                                }
                              }}
                            >
                              Add Video Asset
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    <Divider />
                  </>
                )}

                {/* 2. Gallery Screenshots Section */}
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', mb: 2, textTransform: 'uppercase' }}>
                    Gallery Screenshots ({currentMedia.filter(m => m.media_type === 'image').length})
                  </Typography>

                  {currentMedia.filter(m => m.media_type === 'image').length === 0 ? (
                    <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: '16px', py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
                      <ImageIcon className="h-6 w-6 text-slate-300 mb-1" />
                      <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>
                        No Screenshots Linked
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        overflowX: 'auto',
                        pb: 2,
                        pt: 1,
                        '::-webkit-scrollbar': { display: 'none' },
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none'
                      }}
                    >
                      {currentMedia.filter(m => m.media_type === 'image').map((item, idx, arr) => {
                        return (
                          <Card
                            key={idx}
                            elevation={0}
                            sx={{
                              width: 140,
                              height: 250,
                              flexShrink: 0,
                              border: '1px solid #e2e8f0',
                              borderRadius: '16px',
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column',
                              transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                borderColor: '#cbd5e1',
                                boxShadow: '0 6px 16px rgba(0,0,0,0.06)'
                              }
                            }}
                          >
                            {/* Card Media Preview */}
                            <Box sx={{ position: 'relative', flexGrow: 1, bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                              <CardMedia
                                component="img"
                                image={item.media_url}
                                alt="Preview"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://placehold.co/300x533?text=Preview+Error';
                                }}
                                sx={{ height: '100%', width: '100%', objectFit: 'cover' }}
                              />

                              {/* Chip badge indicator */}
                              <Chip
                                icon={<ImageIcon className="h-3 w-3" />}
                                label="IMAGE"
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  left: 8,
                                  bgcolor: 'rgba(15, 23, 42, 0.75)',
                                  color: 'white',
                                  fontSize: '8px',
                                  height: '18px',
                                  fontWeight: 'bold',
                                  backdropFilter: 'blur(4px)',
                                  '& .MuiChip-icon': {
                                    color: 'white'
                                  }
                                }}
                              />

                              {/* Sort Order overlay */}
                              <Chip
                                label={`Order: ${item.sort_order || idx + 1}`}
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  bottom: 8,
                                  right: 8,
                                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                                  color: '#0f172a',
                                  fontSize: '8px',
                                  height: '18px',
                                  fontWeight: 'bold'
                                }}
                              />
                            </Box>

                            {/* Card Footer Actions */}
                            {!readOnly && (
                              <CardActions sx={{ justifyContent: 'space-between', px: 1, py: 0.5, bgcolor: '#fafafa', borderTop: '1px solid #f1f5f9' }}>
                                <Box sx={{ display: 'flex', gap: 0.15 }}>
                                  <IconButton
                                    size="small"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveImageUp(idx)}
                                    sx={{ p: 0.25, color: '#64748b' }}
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    disabled={idx === arr.length - 1}
                                    onClick={() => handleMoveImageDown(idx)}
                                    sx={{ p: 0.25, color: '#64748b' }}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </IconButton>
                                </Box>

                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveAsset(item)}
                                  sx={{
                                    p: 0.25,
                                    color: '#64748b',
                                    '&:hover': {
                                      color: '#ef4444',
                                      bgcolor: '#fee2e2'
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </IconButton>
                              </CardActions>
                            )}
                          </Card>
                        );
                      })}
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* 3. Promotional Videos Section */}
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', mb: 2, textTransform: 'uppercase' }}>
                    Promotional Videos ({currentMedia.filter(m => m.media_type === 'video').length})
                  </Typography>

                  {currentMedia.filter(m => m.media_type === 'video').length === 0 ? (
                    <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: '16px', py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
                      <Video className="h-6 w-6 text-slate-300 mb-1" />
                      <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>
                        No Videos Linked
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        overflowX: 'auto',
                        pb: 2,
                        pt: 1,
                        '::-webkit-scrollbar': { display: 'none' },
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none'
                      }}
                    >
                      {currentMedia.filter(m => m.media_type === 'video').map((item, idx, arr) => {
                        return (
                          <Card
                            key={idx}
                            elevation={0}
                            sx={{
                              width: 240,
                              height: 180,
                              flexShrink: 0,
                              border: '1px solid #e2e8f0',
                              borderRadius: '16px',
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column',
                              transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                borderColor: '#cbd5e1',
                                boxShadow: '0 6px 16px rgba(0,0,0,0.06)'
                              }
                            }}
                          >
                            {/* Card Media Preview */}
                            <Box sx={{ position: 'relative', height: 135, bgcolor: '#f1f5f9', overflow: 'hidden' }}>
                              <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
                                {getYouTubeThumbnail(item.media_url) ? (
                                  <CardMedia
                                    component="img"
                                    image={getYouTubeThumbnail(item.media_url)}
                                    alt="YouTube Preview"
                                    sx={{ height: '100%', width: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 1.5, bgcolor: '#f1f5f9' }}>
                                    <Video className="h-5 w-5 text-indigo-500 mb-1" />
                                    <Typography sx={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold', wordBreak: 'break-all', textAlign: 'center', px: 0.5 }}>
                                      {item.media_url}
                                    </Typography>
                                  </Box>
                                )}
                                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.2)' }}>
                                  <Box sx={{ bgcolor: '#ff0000', borderRadius: '50%', p: 0.75, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                                    <Play className="h-4 w-4 fill-current text-white" />
                                  </Box>
                                </Box>
                              </Box>

                              {/* Chip badge indicator */}
                              <Chip
                                icon={<Play className="h-3 w-3" />}
                                label="VIDEO"
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  left: 8,
                                  bgcolor: 'rgba(15, 23, 42, 0.75)',
                                  color: 'white',
                                  fontSize: '8px',
                                  height: '18px',
                                  fontWeight: 'bold',
                                  backdropFilter: 'blur(4px)',
                                  '& .MuiChip-icon': {
                                    color: 'white'
                                  }
                                }}
                              />

                              {/* Sort Order overlay */}
                              <Chip
                                label={`Order: ${item.sort_order || idx + 1}`}
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  bottom: 8,
                                  right: 8,
                                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                                  color: '#0f172a',
                                  fontSize: '8px',
                                  height: '18px',
                                  fontWeight: 'bold'
                                }}
                              />
                            </Box>

                            {/* Card Footer Actions */}
                            {!readOnly && (
                              <CardActions sx={{ justifyContent: 'space-between', px: 1, py: 0.5, bgcolor: '#fafafa', borderTop: '1px solid #f1f5f9' }}>
                                <Box sx={{ display: 'flex', gap: 0.15 }}>
                                  <IconButton
                                    size="small"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveVideoUp(idx)}
                                    sx={{ p: 0.25, color: '#64748b' }}
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    disabled={idx === arr.length - 1}
                                    onClick={() => handleMoveVideoDown(idx)}
                                    sx={{ p: 0.25, color: '#64748b' }}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </IconButton>
                                </Box>

                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveAsset(item)}
                                  sx={{
                                    p: 0.25,
                                    color: '#64748b',
                                    '&:hover': {
                                      color: '#ef4444',
                                      bgcolor: '#fee2e2'
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </IconButton>
                              </CardActions>
                            )}
                          </Card>
                        );
                      })}
                    </Box>
                  )}
              </Box>
            </Box>

              {/* Bottom Footer Actions Panel */}
              {!readOnly && (
                <Box sx={{ p: 3, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: '#f8fafc' }}>
                  <Button
                    onClick={handleReset}
                    disabled={!hasChanges}
                    sx={{
                      color: '#64748b',
                      textTransform: 'none',
                      fontWeight: 'bold',
                      borderRadius: '10px',
                      px: 2.5
                    }}
                  >
                    Reset Changes
                  </Button>
                  <Button
                    onClick={handleSaveAssets}
                    disabled={!hasChanges}
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
                      }
                    }}
                    startIcon={<Save className="h-4 w-4" />}
                  >
                    Save All Assets
                  </Button>
                  {isEmbedded && selectedBrand && selectedBrand.current_stage === 'App Asset Submission' && (
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
                      Complete Assets & Proceed
                    </Button>
                  )}
                </Box>
              )}
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
                <Box sx={{ width: 64, height: 64, borderRadius: '20px', bgcolor: selectionBgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                  <Images className="h-7 w-7" style={{ color: primaryColor }} />
                </Box>
                <Typography sx={{ fontWeight: 'black', fontSize: '15px', color: '#1e293b', mb: 1 }}>
                  No Apps Registered
                </Typography>
                <Typography sx={{ fontSize: '12px', color: '#64748b', lineHeight: 1.625 }}>
                  Please register a developer application in the Apps Registry page first to manage its showcase assets.
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}

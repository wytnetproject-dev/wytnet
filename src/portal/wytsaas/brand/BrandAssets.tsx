import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Select,
  MenuItem,
  Chip,
  Snackbar,
  Alert,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Card,
  CardMedia,
  CardActions
} from '@mui/material';
import {
  Plus,
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
import type { Brand, BrandMedia } from '../api/brand';
import { fetchBrands, updateBrand } from '../api/brand';
import ImageUploader from './ImageUploader';

interface BrandAssetsProps {
  user?: { email: string; name: string; role: string } | null;
  portalType: 'wytsaas' | 'wytpass';
  brandId?: number;
  isEmbedded?: boolean;
}

const DEFAULT_MOCK_BRANDS: Brand[] = [];

export default function BrandAssets({ user: _user, portalType, brandId, isEmbedded }: BrandAssetsProps) {
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
  const [newType, setNewType] = useState('image');
  const [newUrl, setNewUrl] = useState('');
  const [newSortOrder, setNewSortOrder] = useState('');

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



  // Add new asset to dynamic list
  const handleAddAsset = () => {
    if (!newUrl.trim()) {
      showToast('Media URL is required', 'error');
      return;
    }
    const order = newSortOrder ? parseInt(newSortOrder) : currentMedia.length + 1;
    const newAsset: BrandMedia = {
      media_type: newType,
      media_url: newUrl.trim(),
      sort_order: order
    };
    
    const updated = [...currentMedia, newAsset].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    setCurrentMedia(updated);
    setHasChanges(true);
    setNewUrl('');
    setNewSortOrder('');
  };

  // Automatically add screenshot to gallery list on upload success
  const handleUploadSuccess = (uploadedUrl: string) => {
    if (!uploadedUrl) return;
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

  // Remove asset from dynamic list
  const handleRemoveAsset = (index: number) => {
    const updated = currentMedia.filter((_, idx) => idx !== index);
    setCurrentMedia(updated);
    setHasChanges(true);
  };

  // Move asset up in sort order
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...currentMedia];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    
    // Recalculate sort orders
    const resort = updated.map((item, idx) => ({
      ...item,
      sort_order: idx + 1
    }));
    
    setCurrentMedia(resort);
    setHasChanges(true);
  };

  // Move asset down in sort order
  const handleMoveDown = (index: number) => {
    if (index === currentMedia.length - 1) return;
    const updated = [...currentMedia];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    
    // Recalculate sort orders
    const resort = updated.map((item, idx) => ({
      ...item,
      sort_order: idx + 1
    }));
    
    setCurrentMedia(resort);
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

                {hasChanges && (
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
                      <ImageUploader
                        label="Upload Screenshot Image File"
                        value={newUrl}
                        onChange={handleUploadSuccess}
                        primaryColor={primaryColor}
                        autoResetAfterUpload={true}
                        isSandbox={isSandbox}
                      />
                    </Box>
                  </Box>
                </Box>

                <Divider />

                {/* 2. Gallery Asset List Section */}
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', mb: 2, textTransform: 'uppercase' }}>
                    Gallery Items ({currentMedia.length})
                  </Typography>

                  {currentMedia.length === 0 ? (
                    <Box sx={{ border: '1px dashed #cbd5e1', borderRadius: '16px', py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
                      <ImageIcon className="h-8 w-8 text-slate-300 mb-2" />
                      <Typography sx={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>
                        No Assets Linked
                      </Typography>
                      <Typography sx={{ fontSize: '10.5px', color: '#94a3b8', mt: 0.5 }}>
                        Enter a URL above and click Add to create screenshots and banners.
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
                      {currentMedia.map((item, idx) => {
                        const isImage = item.media_type === 'image';
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
                              {isImage ? (
                                <CardMedia
                                  component="img"
                                  image={item.media_url}
                                  alt="Preview"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/300x533?text=Preview+Error';
                                  }}
                                  sx={{ height: '100%', width: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 1.5 }}>
                                  <Video className="h-5 w-5 text-indigo-500 mb-1" />
                                  <Typography sx={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold', wordBreak: 'break-all', textAlign: 'center', px: 0.5 }}>
                                    {item.media_url}
                                  </Typography>
                                </Box>
                              )}

                              {/* Chip badge indicator */}
                              <Chip
                                icon={isImage ? <ImageIcon className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                                label={isImage ? 'IMAGE' : 'VIDEO'}
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
                            <CardActions sx={{ justifyContent: 'space-between', px: 1, py: 0.5, bgcolor: '#fafafa', borderTop: '1px solid #f1f5f9' }}>
                              <Box sx={{ display: 'flex', gap: 0.15 }}>
                                <IconButton
                                  size="small"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveUp(idx)}
                                  sx={{ p: 0.25, color: '#64748b' }}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  disabled={idx === currentMedia.length - 1}
                                  onClick={() => handleMoveDown(idx)}
                                  sx={{ p: 0.25, color: '#64748b' }}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </IconButton>
                              </Box>

                              <IconButton
                                size="small"
                                onClick={() => handleRemoveAsset(idx)}
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
                          </Card>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Bottom Footer Actions Panel */}
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

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
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  FormControl,
  InputLabel,
  Card,
  CardMedia,
  CardActions
} from '@mui/material';
import {
  Search,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  ArrowUp,
  ArrowDown,
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

interface BrandAssetsProps {
  user?: { email: string; name: string; role: string } | null;
  portalType: 'wytsaas' | 'wytpass';
}

const DEFAULT_MOCK_BRANDS: Brand[] = [];

export default function BrandAssets({ user, portalType }: BrandAssetsProps) {
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
      
      // Update selected brand reference if one was previously selected
      if (selectedBrand) {
        const updatedSelected = fetched.find(b => b.id === selectedBrand.id);
        if (updatedSelected) {
          setSelectedBrand(updatedSelected);
          setCurrentMedia(updatedSelected.media || []);
          setHasChanges(false);
        }
      }
    } catch (err) {
      console.warn('FastAPI backend connection failed. Enabling mock fallback sandbox.', err);
      const stored = localStorage.getItem('mock_brands');
      const initial = stored ? JSON.parse(stored) : DEFAULT_MOCK_BRANDS;
      setBrands(initial);
      setIsSandbox(true);
      showToast('FastAPI server offline. Switched to Mock Sandbox Mode.', 'warning');
      
      if (selectedBrand) {
        const updatedSelected = initial.find((b: Brand) => b.id === selectedBrand.id);
        if (updatedSelected) {
          setSelectedBrand(updatedSelected);
          setCurrentMedia(updatedSelected.media || []);
          setHasChanges(false);
        }
      }
    } finally {
      setIsLoading(false);
    }
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

  // Handle selecting a brand
  const handleSelectBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    setCurrentMedia(brand.media || []);
    setHasChanges(false);
    // Reset form
    setNewUrl('');
    setNewSortOrder('');
    setNewType('image');
  };

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
    <Box className="flex-grow bg-[#f8fafc] overflow-hidden flex flex-col px-8 py-6 select-none space-y-6 h-full">
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
            },
            flexShrink: 0
          }}
        >
          FastAPI Backend (port 8000) is offline. All App Assets modified will be stored temporarily in your local sandbox browser container.
        </Alert>
      )}

      {/* Main Split Interface Area */}
      <Box sx={{ display: 'flex', gap: 3, flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Left column: Brands List Sidebar */}
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

        {/* Right column: Selected Brand assets editor */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {selectedBrand ? (
            <Paper
              elevation={0}
              sx={{
                flexGrow: 1,
                borderRadius: '20px',
                border: '1px solid #f1f5f9',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
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
              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* 1. Add Asset input section */}
                <Box>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', mb: 2, textTransform: 'uppercase' }}>
                    Add Showcase Asset
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl sx={{ minWidth: 120 }} size="small">
                      <InputLabel id="asset-type-label" sx={{ fontSize: '12px', fontWeight: '600' }}>Asset Type</InputLabel>
                      <Select
                        labelId="asset-type-label"
                        label="Asset Type"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        sx={{ borderRadius: '10px', fontSize: '12px' }}
                      >
                        <MenuItem value="image">Screenshot Image</MenuItem>
                        <MenuItem value="video">Promotional Video</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Media Resource URL"
                      placeholder="https://example.com/screenshot.png"
                      size="small"
                      fullWidth
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      sx={{ flexGrow: 1 }}
                      slotProps={{
                        inputLabel: { style: { fontSize: '12px', fontWeight: '600' } },
                        input: { style: { borderRadius: '10px', fontSize: '12px' } }
                      }}
                    />

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

                    <Button
                      variant="contained"
                      onClick={handleAddAsset}
                      sx={{
                        bgcolor: primaryColor,
                        color: 'white',
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 'bold',
                        boxShadow: 'none',
                        px: 3,
                        py: 1,
                        '&:hover': {
                          bgcolor: primaryHoverColor,
                          boxShadow: 'none'
                        }
                      }}
                      startIcon={<Plus className="h-4 w-4" />}
                    >
                      Add
                    </Button>
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
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2.5 }}>
                      {currentMedia.map((item, idx) => {
                        const isImage = item.media_type === 'image';
                        return (
                          <Card
                            key={idx}
                            elevation={0}
                            sx={{
                              border: '1px solid #e2e8f0',
                              borderRadius: '16px',
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column',
                              transition: 'transform 0.15s, border-color 0.15s',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                borderColor: '#cbd5e1'
                              }
                            }}
                          >
                            {/* Card Media Preview */}
                            <Box sx={{ position: 'relative', height: 120, bgcolor: '#f1f5f9' }}>
                              {isImage ? (
                                <CardMedia
                                  component="img"
                                  image={item.media_url}
                                  alt="Preview"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/300x180?text=Preview+Error';
                                  }}
                                  sx={{ height: '100%', width: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                                  <Video className="h-6 w-6 text-indigo-500 mb-1" />
                                  <Typography sx={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', wordBreak: 'break-all', textAlign: 'center', px: 1 }}>
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
                            <CardActions sx={{ justifyContent: 'space-between', px: 1.5, py: 1, bgcolor: '#fafafa', borderTop: '1px solid #f1f5f9' }}>
                              <Box sx={{ display: 'flex', gap: 0.25 }}>
                                <IconButton
                                  size="small"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveUp(idx)}
                                  sx={{ p: 0.5, color: '#64748b' }}
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  disabled={idx === currentMedia.length - 1}
                                  onClick={() => handleMoveDown(idx)}
                                  sx={{ p: 0.5, color: '#64748b' }}
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </IconButton>
                              </Box>

                              <IconButton
                                size="small"
                                onClick={() => handleRemoveAsset(idx)}
                                sx={{
                                  p: 0.5,
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
                  Select an App to Manage Assets
                </Typography>
                <Typography sx={{ fontSize: '12px', color: '#64748b', lineHeight: 1.625 }}>
                  Choose an app from the list on the left to configure showcase galleries, screenshots, and promo video items.
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}

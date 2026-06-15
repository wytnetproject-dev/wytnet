import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import {
  Box,
  Typography,
  Button,
  Drawer,
  TextField,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import { X, AlertTriangle, Plus } from 'lucide-react';
import type { Brand, BrandCreateInput, BrandUpdateInput, BrandLink } from '../api/brand';

interface BrandDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (brandData: BrandCreateInput | BrandUpdateInput) => Promise<void>;
  editingBrand: Brand | null;
  primaryColor: string;
  primaryHoverColor: string;
  formError: string | null;
  setFormError: (error: string | null) => void;
}

export default function BrandDrawer({
  isOpen,
  onClose,
  onSubmit,
  editingBrand,
  primaryColor,
  primaryHoverColor,
  formError,
  setFormError
}: BrandDrawerProps) {
  // Form Fields State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [brandType, setBrandType] = useState('saas');
  const [companyName, setCompanyName] = useState('');
  const [wytpassAccepted, setWytpassAccepted] = useState(false);
  const [paymentAccepted, setPaymentAccepted] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState('pending');
  const [stage, setStage] = useState('brand_submission');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [links, setLinks] = useState<BrandLink[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');


  // Slugifier helper
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Link modification handlers
  const handleAddLink = () => {
    setLinks([...links, { link_type: 'website', title: '', url: '', is_primary: false }]);
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, idx) => idx !== index));
  };

  const handleLinkChange = (index: number, field: keyof BrandLink, value: any) => {
    setLinks(
      links.map((link, idx) =>
        idx === index
          ? {
              ...link,
              [field]: value
            }
          : link
      )
    );
  };

  // Tag modification handlers
  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };


  // Populate form fields on edit mode trigger
  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      console.log('BrandDrawer: editingBrand received:', editingBrand);
      console.log('BrandDrawer: editingBrand.links received:', editingBrand?.links);
      if (editingBrand) {
        setName(editingBrand.name);
        setSlug(editingBrand.slug);
        setShortDesc(editingBrand.short_description || '');
        setFullDesc(editingBrand.full_description || '');
        setLogoUrl(editingBrand.logo_url || '');
        setBannerUrl(editingBrand.banner_url || '');
        setBrandType(editingBrand.brand_type || 'saas');
        setCompanyName(editingBrand.company_name || '');
        setWytpassAccepted(!!editingBrand.is_wytpass_integration_accepted);
        setPaymentAccepted(!!editingBrand.is_payment_integration_accepted);
        setFeatured(!!editingBrand.is_featured);
        setStatus(editingBrand.status);
        setStage(editingBrand.current_stage);
        setLinks(editingBrand.links || []);
        setTags(editingBrand.tags?.map(t => t.name) || []);
      } else {
        setName('');
        setSlug('');
        setShortDesc('');
        setFullDesc('');
        setLogoUrl('');
        setBannerUrl('');
        setBrandType('saas');
        setCompanyName('');
        setWytpassAccepted(false);
        setPaymentAccepted(false);
        setFeatured(false);
        setStatus('pending');
        setStage('brand_submission');
        setLinks([]);
        setTags([]);
      }

    }
  }, [isOpen, editingBrand]);

  // Handle name change with auto-slug generation
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!editingBrand) {
      setSlug(slugify(val));
    }
  };

  // Handle submit form wrapper
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !slug.trim()) {
      setFormError('Name and Slug fields are required.');
      return;
    }

    const payload = {
      name,
      slug,
      short_description: shortDesc || null,
      full_description: fullDesc || null,
      logo_url: logoUrl || null,
      banner_url: bannerUrl || null,
      brand_type: brandType || null,
      company_name: companyName || null,
      is_wytpass_integration_accepted: wytpassAccepted,
      is_payment_integration_accepted: paymentAccepted,
      is_featured: featured,
      status,
      current_stage: stage,
      links: links.filter(link => link.title.trim() && link.url.trim()),
      tags
    };


    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      slotProps={{
        backdrop: { style: { backgroundColor: 'rgba(9, 44, 92, 0.15)', backdropFilter: 'blur(2px)' } },
        paper: {
          sx: {
            width: { xs: '100%', sm: 480 },
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            borderLeft: '1px solid #f1f5f9'
          }
        }
      }}
    >
      {/* Header Container */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'between', borderBottom: '1px solid #f1f5f9' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography sx={{ fontWeight: 'black', fontSize: '16px', color: '#1e293b' }}>
            {editingBrand ? 'Edit App Registry' : 'Register New App'}
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>
            {editingBrand ? `App ID: #${editingBrand.id}` : 'Create a new app entry'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#94a3b8', '&:hover': { color: '#64748b' } }}>
          <X className="h-5 w-5" />
        </IconButton>
      </Box>

      {/* Body Form inputs */}
      <Box
        component="form"
        onSubmit={handleFormSubmit}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}
      >
        {formError && (
          <Alert severity="error" sx={{ borderRadius: '16px' }} icon={<AlertTriangle className="h-4.5 w-4.5" />}>
            {formError}
          </Alert>
        )}

        <TextField
          required
          label="App Name"
          placeholder="e.g. Acme SaaS"
          fullWidth
          variant="outlined"
          value={name}
          onChange={handleNameChange}
          slotProps={{
            inputLabel: { style: { fontWeight: '600', fontSize: '13px' } },
            input: { style: { borderRadius: '12px', fontSize: '13px' } }
          }}
        />

        <TextField
          required
          label="Slug Identifier"
          placeholder="e.g. acme-saas"
          fullWidth
          variant="outlined"
          value={slug}
          onChange={(e) => setSlug(slugify(e.target.value))}
          slotProps={{
            inputLabel: { style: { fontWeight: '600', fontSize: '13px' } },
            input: { style: { borderRadius: '12px', fontSize: '13px', fontFamily: 'monospace' } }
          }}
        />

        <TextField
          label="Company Name"
          placeholder="e.g. Acme Corp"
          fullWidth
          variant="outlined"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          slotProps={{
            inputLabel: { style: { fontWeight: '600', fontSize: '13px' } },
            input: { style: { borderRadius: '12px', fontSize: '13px' } }
          }}
        />

        <FormControl fullWidth variant="outlined">
          <InputLabel id="brand-drawer-type-label" sx={{ fontWeight: '600', fontSize: '13px' }}>App Classification</InputLabel>
          <Select
            labelId="brand-drawer-type-label"
            label="App Classification"
            value={brandType}
            onChange={(e) => setBrandType(e.target.value)}
            sx={{ borderRadius: '12px', fontSize: '13px' }}
          >
            <MenuItem value="saas">SaaS Platform</MenuItem>
            <MenuItem value="app">Mobile Application</MenuItem>
            <MenuItem value="website">Web Services</MenuItem>
            <MenuItem value="ai-tool">AI Agent Tool</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Short Summary"
          placeholder="Brief 1-sentence descriptor of what this brand does..."
          fullWidth
          variant="outlined"
          value={shortDesc}
          onChange={(e) => setShortDesc(e.target.value)}
          slotProps={{
            inputLabel: { style: { fontWeight: '600', fontSize: '13px' } },
            input: { style: { borderRadius: '12px', fontSize: '13px' } }
          }}
        />

        <TextField
          label="Full Description"
          placeholder="Detailed description of features, specs, and operations..."
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={fullDesc}
          onChange={(e) => setFullDesc(e.target.value)}
          slotProps={{
            inputLabel: { style: { fontWeight: '600', fontSize: '13px' } },
            input: { style: { borderRadius: '12px', fontSize: '13px' } }
          }}
        />

        <TextField
          label="Logo Image URL"
          placeholder="https://example.com/logo.png"
          fullWidth
          variant="outlined"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          slotProps={{
            inputLabel: { style: { fontWeight: '600', fontSize: '13px' } },
            input: { style: { borderRadius: '12px', fontSize: '13px' } }
          }}
        />

        <TextField
          label="Banner Showcase URL"
          placeholder="https://example.com/banner.png"
          fullWidth
          variant="outlined"
          value={bannerUrl}
          onChange={(e) => setBannerUrl(e.target.value)}
          slotProps={{
            inputLabel: { style: { fontWeight: '600', fontSize: '13px' } },
            input: { style: { borderRadius: '12px', fontSize: '13px' } }
          }}
        />



        <Divider />

        {/* Brand Links Dynamic List Form Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
              App Links
            </Typography>
            <Button
              size="small"
              onClick={handleAddLink}
              sx={{ color: primaryColor, textTransform: 'none', fontWeight: 'bold', fontSize: '11px' }}
              startIcon={<Plus className="h-3 w-3" />}
            >
              Add Link
            </Button>
          </Box>

          {links.map((link, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                p: 2,
                border: '1px solid #f1f5f9',
                borderRadius: '12px',
                bgcolor: '#f8fafc',
                position: 'relative'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>
                  Link #{idx + 1}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveLink(idx)}
                  sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' } }}
                >
                  <X className="h-3.5 w-3.5" />
                </IconButton>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id={`link-type-${idx}`} sx={{ fontSize: '11.5px' }}>Type</InputLabel>
                  <Select
                    labelId={`link-type-${idx}`}
                    label="Type"
                    value={link.link_type}
                    onChange={(e) => handleLinkChange(idx, 'link_type', e.target.value)}
                    sx={{ borderRadius: '8px', fontSize: '11.5px' }}
                  >
                    <MenuItem value="website">Website</MenuItem>
                    <MenuItem value="play_store">Play Store</MenuItem>
                    <MenuItem value="app_store">App Store</MenuItem>
                    <MenuItem value="github">GitHub</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Title"
                  placeholder="e.g. Website"
                  size="small"
                  fullWidth
                  value={link.title}
                  onChange={(e) => handleLinkChange(idx, 'title', e.target.value)}
                  slotProps={{
                    inputLabel: { style: { fontSize: '11.5px' } },
                    input: { style: { borderRadius: '8px', fontSize: '11.5px' } }
                  }}
                />
              </Box>

              <TextField
                label="URL"
                placeholder="https://..."
                size="small"
                fullWidth
                value={link.url}
                onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                slotProps={{
                  inputLabel: { style: { fontSize: '11.5px' } },
                  input: { style: { borderRadius: '8px', fontSize: '11.5px' } }
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={link.is_primary}
                    onChange={(e) => handleLinkChange(idx, 'is_primary', e.target.checked)}
                    sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }}
                  />
                }
                label={<span style={{ fontSize: '11.5px', fontWeight: '600', color: '#64748b' }}>Primary Link</span>}
              />
            </Box>
          ))}
        </Box>

        <Divider />

        {/* Brand Tags Form Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
            App Tags
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Add Tag"
              placeholder="Press Enter or comma to add tag"
              size="small"
              fullWidth
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              slotProps={{
                inputLabel: { style: { fontSize: '11.5px' } },
                input: { style: { borderRadius: '8px', fontSize: '11.5px' } }
              }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleAddTag}
              sx={{
                borderColor: '#e2e8f0',
                color: '#475569',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 'bold',
                bgcolor: 'white',
                '&:hover': {
                  borderColor: '#cbd5e1',
                  bgcolor: '#f8fafc',
                }
              }}
            >
              Add
            </Button>
          </Box>
          {tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', p: 1.5, border: '1px dashed #e2e8f0', borderRadius: '12px', bgcolor: '#f8fafc' }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  size="small"
                  sx={{
                    fontSize: '11px',
                    fontWeight: '600',
                    bgcolor: '#eff6ff',
                    color: '#1d4ed8',
                    '& .MuiChip-deleteIcon': {
                      color: '#3b82f6',
                      '&:hover': { color: '#1d4ed8' }
                    }
                  }}
                />
              ))}
            </Box>
          )}
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', mb: 1, textTransform: 'uppercase' }}>
            Ecosystem Integration Flags
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={wytpassAccepted}
                onChange={(e) => setWytpassAccepted(e.target.checked)}
                sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }}
              />
            }
            label={<span style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569' }}>Accept WytPass SSO</span>}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={paymentAccepted}
                onChange={(e) => setPaymentAccepted(e.target.checked)}
                sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }}
              />
            }
            label={<span style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569' }}>Enable WytPayment SDK</span>}
          />

        </Box>
      </Box>

      {/* Footer Actions Container */}
      <Box sx={{ p: 3, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: '#f8fafc' }}>
        <Button
          onClick={onClose}
          disabled={isSubmitting}
          sx={{
            color: '#64748b',
            textTransform: 'none',
            fontWeight: 'bold',
            borderRadius: '10px',
            px: 2.5
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleFormSubmit}
          disabled={isSubmitting || !wytpassAccepted || !paymentAccepted}
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
        >
          {isSubmitting ? 'Saving...' : editingBrand ? 'Save Changes' : 'Create App'}
        </Button>
      </Box>
    </Drawer>
  );
}

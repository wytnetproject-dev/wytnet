import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Checkbox,
  FormControlLabel,
  Alert,
  Divider,
  Chip,
  Paper
} from '@mui/material';
import {
  ArrowLeft,
  Save,
  Shield,
  Info,
  Link as LinkIcon,
  Tag,
  Globe
} from 'lucide-react';
import type { Brand, BrandCreateInput, BrandUpdateInput, BrandLink, BrandMedia } from '../api/brand';
import ImageUploader from './ImageUploader';

interface BrandFormProps {
  onCancel: () => void;
  onSubmit: (brandData: BrandCreateInput | BrandUpdateInput) => Promise<void>;
  editingBrand: Brand | null;
  primaryColor: string;
  primaryHoverColor: string;
  formError: string | null;
  setFormError: (error: string | null) => void;
  isSandbox?: boolean;
}

export default function BrandForm({
  onCancel,
  onSubmit,
  editingBrand,
  primaryColor,
  primaryHoverColor,
  formError,
  setFormError,
  isSandbox = false
}: BrandFormProps) {
  // Form Fields State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [brandType, setBrandType] = useState<string[]>(['saas']);
  const [companyName, setCompanyName] = useState('');
  const [wytpassAccepted, setWytpassAccepted] = useState(false);
  const [paymentAccepted, setPaymentAccepted] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState('pending');
  const [stage, setStage] = useState('brand_submission');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [playStoreUrl, setPlayStoreUrl] = useState('');
  const [appStoreUrl, setAppStoreUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
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



  // Classification modification handlers
  const handleClassificationToggle = (type: string, checked: boolean) => {
    if (checked) {
      setBrandType([...brandType, type]);
    } else {
      setBrandType(brandType.filter((t) => t !== type));
    }
  };

  // Tag modification handlers
  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, idx) => idx !== index));
  };

  const handleTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Lifecycle effects
  useEffect(() => {
    if (editingBrand) {
      setName(editingBrand.name);
      setSlug(editingBrand.slug);
      setShortDesc(editingBrand.short_description || '');
      setFullDesc(editingBrand.full_description || '');
      setLogoUrl(editingBrand.logo_url || '');
      setBannerUrl(editingBrand.banner_url || '');
      const bType = editingBrand.brand_type;
      setBrandType(
        Array.isArray(bType)
          ? bType
          : bType
          ? [bType]
          : ['saas']
      );
      setCompanyName(editingBrand.company_name || '');
      setWytpassAccepted(!!editingBrand.is_wytpass_integration_accepted);
      setPaymentAccepted(!!editingBrand.is_payment_integration_accepted);
      setFeatured(!!editingBrand.is_featured);
      setStatus(editingBrand.status);
      setStage(editingBrand.current_stage);
      const websiteLink = editingBrand.links?.find(l => l.link_type === 'website');
      const playStoreLink = editingBrand.links?.find(l => l.link_type === 'play_store');
      const appStoreLink = editingBrand.links?.find(l => l.link_type === 'app_store');
      const githubLink = editingBrand.links?.find(l => l.link_type === 'github');

      setWebsiteUrl(websiteLink?.url || '');
      setPlayStoreUrl(playStoreLink?.url || '');
      setAppStoreUrl(appStoreLink?.url || '');
      setGithubUrl(githubLink?.url || '');

      setTags(editingBrand.tags?.map(t => t.name) || []);
    } else {
      setName('');
      setSlug('');
      setShortDesc('');
      setFullDesc('');
      setLogoUrl('');
      setBannerUrl('');
      setBrandType(['saas']);
      setCompanyName('');
      setWytpassAccepted(false);
      setPaymentAccepted(false);
      setFeatured(false);
      setStatus('pending');
      setStage('brand_submission');
      setWebsiteUrl('');
      setPlayStoreUrl('');
      setAppStoreUrl('');
      setGithubUrl('');
      setTags([]);
    }
  }, [editingBrand]);


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

    if (!wytpassAccepted || !paymentAccepted) {
      setFormError('You must accept the WytPass SSO and WytPayment SDK terms to register your app.');
      return;
    }

    const submittedLinks: BrandLink[] = [];

    if ((brandType.includes('saas') || brandType.includes('website')) && websiteUrl.trim()) {
      submittedLinks.push({
        link_type: 'website',
        title: 'Website',
        url: websiteUrl.trim(),
        is_primary: true
      });
    }

    if (brandType.includes('app')) {
      if (playStoreUrl.trim()) {
        submittedLinks.push({
          link_type: 'play_store',
          title: 'Google Play Store',
          url: playStoreUrl.trim(),
          is_primary: submittedLinks.length === 0
        });
      }
      if (appStoreUrl.trim()) {
        submittedLinks.push({
          link_type: 'app_store',
          title: 'Apple App Store',
          url: appStoreUrl.trim(),
          is_primary: submittedLinks.length === 0
        });
      }
    }

    if (brandType.includes('ai-tool') && githubUrl.trim()) {
      submittedLinks.push({
        link_type: 'github',
        title: 'GitHub Repository',
        url: githubUrl.trim(),
        is_primary: submittedLinks.length === 0
      });
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
      links: submittedLinks,
      tags,
      media: editingBrand ? (editingBrand.media || []) : []
    };


    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      onCancel();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box className="w-full flex flex-col h-full bg-[#f8fafc] overflow-y-auto px-8 py-6 select-none space-y-6">

      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
        <div>
          <button
            onClick={onCancel}
            className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider mb-2 cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Registry
          </button>

          <h2 className="text-2xl font-extrabold text-wytnet-dark">
            {editingBrand ? 'Edit App Registry' : 'Register New App'}
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            {editingBrand ? `Update system settings and metadata for ${name} (ID: #${editingBrand.id})` : 'Register a new developer application with the Wytnet Ecosystem.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outlined"
            size="medium"
            onClick={onCancel}
            disabled={isSubmitting}
            sx={{
              borderColor: '#e2e8f0',
              color: '#475569',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 'bold',
              bgcolor: 'white',
              px: 3,
              '&:hover': {
                borderColor: '#cbd5e1',
                bgcolor: '#f8fafc',
              }
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            size="medium"
            onClick={handleFormSubmit}
            disabled={isSubmitting || !wytpassAccepted || !paymentAccepted}
            sx={{
              bgcolor: primaryColor,
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 'bold',
              boxShadow: 'none',
              px: 3.5,
              '&:hover': {
                bgcolor: primaryHoverColor,
                boxShadow: 'none',
              }
            }}
            startIcon={<Save className="h-4 w-4" />}
          >
            {isSubmitting ? 'Saving...' : editingBrand ? 'Save Changes' : 'Create App'}
          </Button>
        </div>
      </div>

      {formError && (
        <Alert severity="error" sx={{ borderRadius: '16px' }} className="animate-fadeIn">
          {formError}
        </Alert>
      )}

      {/* Main Form Body split grid */}
      <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Columns - Details (General details, descriptions, assets) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Card 1: Primary Profile */}
          <Paper elevation={0} className="border border-slate-100 p-6 rounded-3xl space-y-5">
            <div>
              <Typography className="text-slate-800 font-extrabold text-[15px] flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: primaryColor }} />
                Primary App Profile
              </Typography>
              <Typography className="text-slate-400 text-[11px] font-bold mt-0.5">
                Core identification data for the application registry.
              </Typography>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
            </div>
          </Paper>

          {/* Card 2: About & Descriptions */}
          <Paper elevation={0} className="border border-slate-100 p-6 rounded-3xl space-y-5">
            <div>
              <Typography className="text-slate-800 font-extrabold text-[15px] flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: primaryColor }} />
                About & Descriptions
              </Typography>
              <Typography className="text-slate-400 text-[11px] font-bold mt-0.5">
                Explain your app's main value proposition and details for users.
              </Typography>
            </div>

            <div className="space-y-5">
              <TextField
                label="Short Summary"
                placeholder="Brief 1-sentence descriptor of what this app does..."
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
                placeholder="Detailed description of features, specifications, and service model..."
                fullWidth
                multiline
                rows={5}
                variant="outlined"
                value={fullDesc}
                onChange={(e) => setFullDesc(e.target.value)}
                slotProps={{
                  inputLabel: { style: { fontWeight: '600', fontSize: '13px' } },
                  input: { style: { borderRadius: '12px', fontSize: '13px' } }
                }}
              />
            </div>
          </Paper>

          {/* Card 3: Showcase Assets */}
          <Paper elevation={0} className="border border-slate-100 p-6 rounded-3xl space-y-5">
            <div>
              <Typography className="text-slate-800 font-extrabold text-[15px] flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: primaryColor }} />
                Showcase & Assets
              </Typography>
              <Typography className="text-slate-400 text-[11px] font-bold mt-0.5">
                Images and assets to build your app's marketplace showcase.
              </Typography>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Box className="space-y-3">
                <ImageUploader
                  label="Logo Image"
                  value={logoUrl}
                  onChange={setLogoUrl}
                  primaryColor={primaryColor}
                  isSandbox={isSandbox}
                />
              </Box>

              <Box className="space-y-3">
                <ImageUploader
                  label="Banner Showcase Image"
                  value={bannerUrl}
                  onChange={setBannerUrl}
                  primaryColor={primaryColor}
                  isSandbox={isSandbox}
                />
              </Box>
            </div>

            {/* Quick Logo/Banner Preview */}
            {(logoUrl || bannerUrl) && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-5 items-center justify-start">
                {logoUrl && (
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Logo Preview</span>
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      className="w-16 h-16 rounded-2xl object-contain bg-white border border-slate-200/60 p-1.5 shadow-sm"
                    />
                  </div>
                )}
                {bannerUrl && (
                  <div className="flex-grow flex flex-col items-center md:items-start gap-1.5 w-full">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Banner Preview</span>
                    <img
                      src={bannerUrl}
                      alt="Banner preview"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      className="w-full max-h-20 rounded-2xl object-cover border border-slate-200/60 shadow-sm"
                    />
                  </div>
                )}
              </div>
            )}
          </Paper>


        </div>

        {/* Right Column - Configurations (SSO integration, links, tags) */}
        <div className="space-y-6">



          {/* Card 5: App Classification & Connections */}
          <Paper elevation={0} className="border border-slate-100 p-6 rounded-3xl space-y-4">
            <div>
              <Typography className="text-slate-800 font-extrabold text-[15px] flex items-center gap-2">
                <LinkIcon className="h-4.5 w-4.5" style={{ color: primaryColor }} />
                Classification & Connections
              </Typography>
              <Typography className="text-slate-400 text-[11px] font-bold mt-0.5">
                Classify your application and associate external URLs.
              </Typography>
            </div>

            {/* Checkbox Group for App Classifications */}
            <Box className="space-y-1.5 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <Typography className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                App Classification (Select all that apply)
              </Typography>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={brandType.includes('saas')}
                      onChange={(e) => handleClassificationToggle('saas', e.target.checked)}
                      sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }}
                    />
                  }
                  label={<span className="text-xs font-semibold text-slate-700">SaaS Platform</span>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={brandType.includes('app')}
                      onChange={(e) => handleClassificationToggle('app', e.target.checked)}
                      sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }}
                    />
                  }
                  label={<span className="text-xs font-semibold text-slate-700">Mobile Application</span>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={brandType.includes('website')}
                      onChange={(e) => handleClassificationToggle('website', e.target.checked)}
                      sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }}
                    />
                  }
                  label={<span className="text-xs font-semibold text-slate-700">Web Services</span>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={brandType.includes('ai-tool')}
                      onChange={(e) => handleClassificationToggle('ai-tool', e.target.checked)}
                      sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }}
                    />
                  }
                  label={<span className="text-xs font-semibold text-slate-700">AI Agent Tool</span>}
                />
              </div>
            </Box>

            <Divider />

            <div className="space-y-4">
              <Typography className="text-slate-700 font-bold text-xs">
                Connection Links
              </Typography>

              {!brandType.includes('saas') &&
                !brandType.includes('website') &&
                !brandType.includes('app') &&
                !brandType.includes('ai-tool') ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl">
                  <Typography className="text-slate-400 text-[11.5px] font-semibold">
                    Select an App Classification above to configure connection links.
                  </Typography>
                </div>
              ) : (
                <div className="space-y-4">
                  {(brandType.includes('saas') || brandType.includes('website')) && (
                    <Box className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-100/80 text-slate-500 shrink-0">
                        <Globe className="h-4 w-4" />
                      </div>
                      <TextField
                        label="Website URL"
                        placeholder="https://yourplatform.com"
                        size="small"
                        fullWidth
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        slotProps={{
                          inputLabel: { style: { fontSize: '11.5px', fontWeight: 'bold' } },
                          input: { style: { borderRadius: '10px', fontSize: '11.5px' } }
                        }}
                      />
                    </Box>
                  )}

                  {brandType.includes('app') && (
                    <>
                      <Box className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-100/80 text-slate-500 shrink-0 flex items-center justify-center">
                          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                            <path d="M5.19 3C4.85 3 4.5 3.1 4.2 3.3L13.7 12.8L18.6 7.9C17.2 7.1 12.1 4.2 5.19 3Z" />
                            <path d="M3.2 4.3C3.1 4.5 3 4.7 3 5V19C3 19.3 3.1 19.5 3.2 19.7L12.3 11.4L3.2 4.3Z" />
                            <path d="M14.9 14L4 20.7C4.3 20.9 4.65 21 5 21C12.1 21 17.2 18.1 18.6 17.3L14.9 14Z" />
                            <path d="M20.8 11.7C21 11.4 21.1 11.1 21.1 10.7C21.1 10.3 21 10 20.8 9.7L16 12L20.8 11.7Z" />
                          </svg>
                        </div>
                        <TextField
                          label="Google Play Store URL"
                          placeholder="https://play.google.com/store/apps/details?id=..."
                          size="small"
                          fullWidth
                          value={playStoreUrl}
                          onChange={(e) => setPlayStoreUrl(e.target.value)}
                          slotProps={{
                            inputLabel: { style: { fontSize: '11.5px', fontWeight: 'bold' } },
                            input: { style: { borderRadius: '10px', fontSize: '11.5px' } }
                          }}
                        />
                      </Box>

                      <Box className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-100/80 text-slate-500 shrink-0 flex items-center justify-center">
                          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                            <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 22C14.33 22.05 13.9 21.24 12.38 21.24C10.88 21.24 10.4 21.97 9.12 22.03C7.81 22.09 6.83 20.72 5.98 19.51C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.88 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C17.57 6.91 18.85 7.51 19.68 8.76C16.31 10.74 17.16 15.26 20.1 16.48C19.51 17.96 18.71 19.5 18.71 19.5M15.9 5.08C16.7 4.12 17.21 2.8 17.06 1.48C15.93 1.52 14.56 2.23 13.75 3.17C13.06 3.96 12.46 5.3 12.64 6.6C13.9 6.7 15.17 5.97 15.9 5.08Z" />
                          </svg>
                        </div>
                        <TextField
                          label="Apple App Store URL"
                          placeholder="https://apps.apple.com/app/..."
                          size="small"
                          fullWidth
                          value={appStoreUrl}
                          onChange={(e) => setAppStoreUrl(e.target.value)}
                          slotProps={{
                            inputLabel: { style: { fontSize: '11.5px', fontWeight: 'bold' } },
                            input: { style: { borderRadius: '10px', fontSize: '11.5px' } }
                          }}
                        />
                      </Box>
                    </>
                  )}

                  {brandType.includes('ai-tool') && (
                    <Box className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-100/80 text-slate-500 shrink-0 flex items-center justify-center">
                        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                        </svg>
                      </div>
                      <TextField
                        label="GitHub Repository URL"
                        placeholder="https://github.com/username/repository"
                        size="small"
                        fullWidth
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        slotProps={{
                          inputLabel: { style: { fontSize: '11.5px', fontWeight: 'bold' } },
                          input: { style: { borderRadius: '10px', fontSize: '11.5px' } }
                        }}
                      />
                    </Box>
                  )}
                </div>
              )}
            </div>
          </Paper>

          {/* Card 6: App Tags */}
          <Paper elevation={0} className="border border-slate-100 p-6 rounded-3xl space-y-4">
            <div>
              <Typography className="text-slate-800 font-extrabold text-[15px] flex items-center gap-2">
                <Tag className="h-4.5 w-4.5" style={{ color: primaryColor }} />
                Search & Tags
              </Typography>
              <Typography className="text-slate-400 text-[11px] font-bold mt-0.5">
                Categories or tags to classify and locate this application.
              </Typography>
            </div>

            <div className="flex gap-2">
              <TextField
                label="Add Tag"
                placeholder="Press Enter to add tag"
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
                  px: 2,
                  bgcolor: 'white',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    bgcolor: '#f8fafc',
                  }
                }}
              >
                Add
              </Button>
            </div>

            {tags.length > 0 ? (
              <div className="flex gap-1.5 flex-wrap p-3 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                {tags.map((tag, idx) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(idx)}
                    size="small"
                    sx={{
                      fontSize: '11px',
                      fontWeight: '600',
                      bgcolor: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #dbeafe',
                      '& .MuiChip-deleteIcon': {
                        color: '#3b82f6',
                        '&:hover': { color: '#1d4ed8' }
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-4 border border-dashed border-slate-200 rounded-2xl">
                <span className="text-[11.5px] font-semibold text-slate-400">No tags added yet.</span>
              </div>
            )}
          </Paper>

          {/* Card 4: Ecosystem Integration Terms */}
          <Paper elevation={0} className="border border-slate-100 p-6 rounded-3xl space-y-5">
            <div>
              <Typography className="text-slate-800 font-extrabold text-[15px] flex items-center gap-2">
                <Shield className="h-4.5 w-4.5" style={{ color: primaryColor }} />
                Ecosystem Integration
              </Typography>
              <Typography className="text-slate-400 text-[11px] font-bold mt-0.5">
                Mandatory integrations for app approval.
              </Typography>
            </div>

            <div className="bg-[#f0f9ff] border border-blue-100 p-3.5 rounded-2xl flex items-start gap-3">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11.5px] font-semibold text-blue-800 leading-normal">
                To connect to the Wytnet pipeline, applications must run on WytPass SSO security and implement the WytPayment billing SDK.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={wytpassAccepted}
                    onChange={(e) => setWytpassAccepted(e.target.checked)}
                    sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }}
                  />
                }
                label={<span className="text-xs font-bold text-slate-600">Accept WytPass SSO Auth</span>}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={paymentAccepted}
                    onChange={(e) => setPaymentAccepted(e.target.checked)}
                    sx={{ color: primaryColor, '&.Mui-checked': { color: primaryColor } }}
                  />
                }
                label={<span className="text-xs font-bold text-slate-600">Enable WytPayment SDK</span>}
              />
            </div>

            {(!wytpassAccepted || !paymentAccepted) && (
              <Alert severity="warning" icon={false} sx={{ py: 0.5, borderRadius: '12px' }}>
                <span className="text-[10px] font-bold text-amber-800">
                  Accept both terms to enable submission actions.
                </span>
              </Alert>
            )}
          </Paper>

        </div>
      </form>

      {/* Footer sticky-action block (additional safety check) */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200/50 pt-5 mt-4">
        <Button
          variant="outlined"
          size="medium"
          onClick={onCancel}
          disabled={isSubmitting}
          sx={{
            borderColor: '#e2e8f0',
            color: '#475569',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 'bold',
            bgcolor: 'white',
            px: 3.5,
            '&:hover': {
              borderColor: '#cbd5e1',
              bgcolor: '#f8fafc',
            }
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          size="medium"
          onClick={handleFormSubmit}
          disabled={isSubmitting || !wytpassAccepted || !paymentAccepted}
          sx={{
            bgcolor: primaryColor,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 'bold',
            boxShadow: 'none',
            px: 4,
            '&:hover': {
              bgcolor: primaryHoverColor,
              boxShadow: 'none',
            }
          }}
          startIcon={<Save className="h-4 w-4" />}
        >
          {isSubmitting ? 'Saving...' : editingBrand ? 'Save Changes' : 'Create App'}
        </Button>
      </div>
    </Box>
  );
}

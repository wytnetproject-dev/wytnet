import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Save,
  Globe,
  Key,
  Shield,
  Eye,
  EyeOff,
  Sliders,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Check,
  Download,
  FileText
} from 'lucide-react';
import { fetchBrandById, updateBrand } from '@/api/wytsaas/brand';

interface BrandIntegrationSettingsProps {
  brandId: number;
  isSandbox: boolean;
  portalType: 'wytsaas' | 'wytpass';
  onRefreshBrand?: () => void;
  readOnly?: boolean;
}

interface IntegrationData {
  create_user_endpoint: string;
  update_user_endpoint: string;
  cancel_user_endpoint: string;
  webhook_url: string;
  api_key: string;
  webhook_secret: string;
  status: string;
}

export default function BrandIntegrationSettings({ brandId, isSandbox, portalType, onRefreshBrand, readOnly = false }: BrandIntegrationSettingsProps) {
  const primaryColor = portalType === 'wytsaas' ? '#0066cc' : '#9333ea';
  const primaryHoverColor = portalType === 'wytsaas' ? '#0052a3' : '#7e22ce';

  // Form State
  const [formData, setFormData] = useState<IntegrationData>({
    create_user_endpoint: '',
    update_user_endpoint: '',
    cancel_user_endpoint: '',
    webhook_url: '',
    api_key: '',
    webhook_secret: '',
    status: 'active'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [showRefDocs, setShowRefDocs] = useState(false);
  const [activeRefTab, setActiveRefTab] = useState<'create' | 'update' | 'cancel'>('create');
  const [brandStage, setBrandStage] = useState<string | null>(null);

  // Snackbar Alert state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'warning'>('success');

  const showToast = (msg: string, severity: 'success' | 'error' | 'warning') => {
    setToastMessage(msg);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const getAuthToken = () => {
    return localStorage.getItem(portalType === 'wytsaas' ? 'wytsaas_token' : 'wytpass_token') || '';
  };

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      if (isSandbox) {
        // Mock Sandbox Load
        try {
          const stored = localStorage.getItem(`mock_brand_integration_${brandId}`);
          if (stored) {
            setFormData(JSON.parse(stored));
          } else {
            // Default placeholder endpoints for mock testing
            setFormData({
              create_user_endpoint: 'https://api.halloconnect.com/user/create',
              update_user_endpoint: 'https://api.halloconnect.com/user/update',
              cancel_user_endpoint: 'https://api.halloconnect.com/user/cancel',
              webhook_url: 'https://api.wytnet.com/webhooks/halloconnect',
              api_key: 'hallo_api_key_sandbox12345',
              webhook_secret: 'hallo_webhook_sec_sandbox54321',
              status: 'active'
            });
          }
          // Fetch brand stage
          const storedBrands = localStorage.getItem('mock_brands');
          const mockList = storedBrands ? JSON.parse(storedBrands) : [];
          const b = mockList.find((item: any) => item.id === brandId);
          if (b) {
            setBrandStage(b.current_stage);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Live Fetch from API
      try {
        const token = getAuthToken();
        const res = await fetch(`http://localhost:8000/brands/${brandId}/integration`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.item) {
            setFormData({
              create_user_endpoint: data.item.create_user_endpoint || '',
              update_user_endpoint: data.item.update_user_endpoint || '',
              cancel_user_endpoint: data.item.cancel_user_endpoint || '',
              webhook_url: data.item.webhook_url || '',
              api_key: data.item.api_key || '',
              webhook_secret: data.item.webhook_secret || '',
              status: data.item.status || 'active'
            });
          }
        }

        // Fetch brand stage
        const brandObj = await fetchBrandById(brandId);
        setBrandStage(brandObj.current_stage);
      } catch (err) {
        console.warn("Failed to load settings from backend, using default placeholders.", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [brandId, isSandbox]);

  const handleProceedToNextStage = async () => {
    setIsSaving(true);
    
    // First, save settings
    if (isSandbox) {
      localStorage.setItem(`mock_brand_integration_${brandId}`, JSON.stringify(formData));
    } else {
      const token = getAuthToken();
      if (token) {
        try {
          await fetch(`http://localhost:8000/brands/${brandId}/integration`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
          });
        } catch (err) {
          console.error("Failed to save settings to backend before proceeding:", err);
        }
      }
    }

    // Now, advance stage to whitepass_review
    if (isSandbox) {
      const stored = localStorage.getItem('mock_brands');
      const mockList = stored ? JSON.parse(stored) : [];
      const updatedList = mockList.map((b: any) =>
        b.id === brandId
          ? {
              ...b,
              current_stage: 'whitepass_review',
              updated_at: new Date().toISOString()
            }
          : b
      );
      localStorage.setItem('mock_brands', JSON.stringify(updatedList));
      showToast('API Configuration saved! Stage 5 unlocked: SSO Integration Review.', 'success');
      setBrandStage('whitepass_review');
      setIsSaving(false);
      if (onRefreshBrand) {
        onRefreshBrand();
      }
    } else {
      const token = getAuthToken();
      if (!token) {
        showToast('Authentication token missing.', 'error');
        setIsSaving(false);
        return;
      }
      try {
        await updateBrand(brandId, {
          current_stage: 'whitepass_review'
        }, token);
        showToast('API Configuration saved! Stage 5 unlocked: SSO Integration Review.', 'success');
        setBrandStage('whitepass_review');
        if (onRefreshBrand) {
          onRefreshBrand();
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to update onboarding stage.', 'error');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (isSandbox) {
      // Sandbox local Save
      localStorage.setItem(`mock_brand_integration_${brandId}`, JSON.stringify(formData));
      setTimeout(() => {
        setIsSaving(false);
        showToast("Integration configuration saved successfully (Sandbox Mode)!", "success");
      }, 800);
      return;
    }

    // Live API Save
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:8000/brands/${brandId}/integration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        showToast("Integration config sync settings updated successfully.", "success");
      } else {
        showToast("Failed to save settings to backend.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Connection error occurred while saving.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Box className="flex flex-col items-center justify-center py-20 gap-3">
        <CircularProgress size={36} sx={{ color: primaryColor }} />
        <Typography className="text-slate-400 text-xs font-semibold">Retrieving integration config...</Typography>
      </Box>
    );
  }

  return (
    <Box className="space-y-6 max-w-3xl">
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

      <div>
        <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
          <Sliders className="h-4.5 w-4.5 text-slate-500" />
          <span>API Sync & Integration Settings</span>
        </h3>
        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
          Configure synchronization endpoints to automate customer creation and plan management on your API nodes.
        </p>
      </div>

      <Divider />
      {/* API Integration Reference Documentation */}
        <Paper elevation={0} className="border border-slate-100 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-700">
              <BookOpen className="h-4.5 w-4.5 text-slate-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">API Payload Reference</span>
            </div>
            
          </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                  <div className="space-y-1 max-w-md">
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span>API Payload Specifications (PDF)</span>
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 leading-relaxed">
                      Download the complete API integration payload manual containing request headers, JSON request bodies, and expected responses for creating, updating, and cancelling user subscriptions.
                    </p>
          
                  </div>
                  <a
                    href="/wytnet_api_payload_reference.pdf"
                    download="wytnet_api_payload_reference.pdf"
                    className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 transition-all text-xs font-bold text-white px-5 py-2.5 rounded-xl cursor-pointer shadow-sm hover:shadow-md outline-none"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download PDF Reference</span>
                  </a>
                 </div>
        </Paper>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Endpoints Group */}
        <Paper elevation={0} className="border border-slate-100 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-slate-700 pb-2 border-b border-slate-100 mb-2">
            <Globe className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Synchronization Endpoints</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Create User Sync Endpoint (POST)"
              size="small"
              disabled={readOnly}
              value={formData.create_user_endpoint}
              onChange={(e) => setFormData({ ...formData, create_user_endpoint: e.target.value })}
              placeholder="e.g. https://api.yourapp.com/user/create"
              fullWidth
              slotProps={{
                inputLabel: { style: { fontSize: '11px', fontWeight: 'bold' } },
                htmlInput: { style: { fontSize: '12px', fontWeight: '500' } }
              }}
            />

            <TextField
              label="Update User Sync Endpoint (POST)"
              size="small"
              disabled={readOnly}
              value={formData.update_user_endpoint}
              onChange={(e) => setFormData({ ...formData, update_user_endpoint: e.target.value })}
              placeholder="e.g. https://api.yourapp.com/user/update"
              fullWidth
              slotProps={{
                inputLabel: { style: { fontSize: '11px', fontWeight: 'bold' } },
                htmlInput: { style: { fontSize: '12px', fontWeight: '500' } }
              }}
            />

            <TextField
              label="Cancel User Sync Endpoint (POST)"
              size="small"
              disabled={readOnly}
              value={formData.cancel_user_endpoint}
              onChange={(e) => setFormData({ ...formData, cancel_user_endpoint: e.target.value })}
              placeholder="e.g. https://api.yourapp.com/user/cancel"
              fullWidth
              slotProps={{
                inputLabel: { style: { fontSize: '11px', fontWeight: 'bold' } },
                htmlInput: { style: { fontSize: '12px', fontWeight: '500' } }
              }}
            />

            <TextField
              label="Webhook Callback URL"
              size="small"
              disabled={readOnly}
              value={formData.webhook_url}
              onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
              placeholder="e.g. https://api.wytnet.com/webhooks/your-app"
              fullWidth
              slotProps={{
                inputLabel: { style: { fontSize: '11px', fontWeight: 'bold' } },
                htmlInput: { style: { fontSize: '12px', fontWeight: '500' } }
              }}
            />
          </div>
        </Paper>

        {/* Security & Authentication Credentials */}
        <Paper elevation={0} className="border border-slate-100 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-slate-700 pb-2 border-b border-slate-100 mb-2">
            <Key className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Security Credentials</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="App Sync API Key"
              size="small"
              disabled={readOnly}
              type={showApiKey ? 'text' : 'password'}
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder="App authorization X-API-Key token"
              fullWidth
              slotProps={{
                inputLabel: { style: { fontSize: '11px', fontWeight: 'bold' } },
                htmlInput: { style: { fontSize: '12px', fontWeight: '500' } },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowApiKey(!showApiKey)} edge="end">
                        {showApiKey ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />

            <TextField
              label="Webhook Verification Secret"
              size="small"
              disabled={readOnly}
              type={showWebhookSecret ? 'text' : 'password'}
              value={formData.webhook_secret}
              onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
              placeholder="Webhook HMAC signature verification secret"
              fullWidth
              slotProps={{
                inputLabel: { style: { fontSize: '11px', fontWeight: 'bold' } },
                htmlInput: { style: { fontSize: '12px', fontWeight: '500' } },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowWebhookSecret(!showWebhookSecret)} edge="end">
                        {showWebhookSecret ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
          </div>
        </Paper>

        {/* Sync Status Settings */}
        <Paper elevation={0} className="border border-slate-100 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-slate-700 pb-2 border-b border-slate-100 mb-2">
            <Shield className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sync Pipeline Parameters</span>
          </div>

          <div className="max-w-xs">
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '11px', fontWeight: 'bold' }}>Integration Pipeline Status</InputLabel>
              <Select
                value={formData.status}
                label="Integration Pipeline Status"
                disabled={readOnly}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                sx={{ fontSize: '12px', fontWeight: '500' }}
              >
                <MenuItem value="active">ACTIVE (Automated User Sync Active)</MenuItem>
                <MenuItem value="inactive">INACTIVE (Disable Sync Queries)</MenuItem>
              </Select>
            </FormControl>
          </div>
        </Paper>


        {/* Form Actions */}
        {!readOnly && (
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving}
              sx={{
                bgcolor: primaryColor,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 'bold',
                px: 4,
                py: 1,
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: primaryHoverColor,
                  boxShadow: 'none'
                }
              }}
              startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <Save className="h-4 w-4" />}
            >
              {isSaving ? 'Saving Changes...' : 'Save Configuration'}
            </Button>
            {brandStage === 'API Integration' && (
              <Button
                type="button"
                onClick={handleProceedToNextStage}
                variant="contained"
                disabled={isSaving}
                sx={{
                  bgcolor: '#10b981',
                  color: 'white',
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  px: 4,
                  py: 1,
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#059669',
                    boxShadow: 'none'
                  }
                }}
                startIcon={<Check className="h-4 w-4" />}
              >
                Validate & Proceed to SSO Review
              </Button>
            )}
          </div>
        )}
      </form>
    </Box>
  );
}

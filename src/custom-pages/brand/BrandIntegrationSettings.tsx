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
  ChevronUp
} from 'lucide-react';

interface BrandIntegrationSettingsProps {
  brandId: number;
  isSandbox: boolean;
  portalType: 'wytsaas' | 'wytpass';
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

export default function BrandIntegrationSettings({ brandId, isSandbox, portalType }: BrandIntegrationSettingsProps) {
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
      } catch (err) {
        console.warn("Failed to load settings from backend, using default placeholders.", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [brandId, isSandbox]);

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
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                sx={{ fontSize: '12px', fontWeight: '500' }}
              >
                <MenuItem value="active">ACTIVE (Automated User Sync Active)</MenuItem>
                <MenuItem value="inactive">INACTIVE (Disable Sync Queries)</MenuItem>
              </Select>
            </FormControl>
          </div>
        </Paper>

        {/* API Integration Reference Documentation */}
        <Paper elevation={0} className="border border-slate-100 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-700">
              <BookOpen className="h-4.5 w-4.5 text-slate-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">API Payload Reference</span>
            </div>
            <IconButton onClick={() => setShowRefDocs(!showRefDocs)} size="small" className="cursor-pointer">
              {showRefDocs ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
            </IconButton>
          </div>

          {showRefDocs ? (
            <div className="space-y-4 pt-2">
              {/* Tab Selector */}
              <div className="flex gap-2 border-b border-slate-100 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveRefTab('create')}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeRefTab === 'create'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRefTab('update')}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeRefTab === 'update'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Update User
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRefTab('cancel')}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeRefTab === 'cancel'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Cancel User
                </button>
              </div>

              {activeRefTab === 'create' && (
                <div className="space-y-4">
                  <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                    When a customer purchases a plan, WytSaas triggers a POST request to your Create User sync endpoint containing the following request body payload:
                  </p>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Request Headers</span>
                    <pre className="bg-slate-950 text-slate-300 rounded-xl p-3.5 text-[10.5px] font-mono overflow-x-auto shadow-inner leading-relaxed">
{"X-API-Key: <your_configured_api_key>\nContent-Type: application/json"}
                    </pre>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Request Payload (JSON)</span>
                    <pre className="bg-slate-950 text-slate-300 rounded-xl p-3.5 text-[10.5px] font-mono overflow-x-auto shadow-inner leading-relaxed select-all">
{`{
  "user_id": "99ea7879-1bf4-4df8-8686-2a6230f6b4e3",
  "user_email": "customer@example.com",
  "user_name": "John Doe",
  "plan_id": 1,
  "plan_name": "Standard Plan",
  "price": 299.00,
  "billing_cycle": "monthly"
}`}
                    </pre>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Expected Response Payload (JSON)</span>
                    <pre className="bg-slate-950 text-emerald-400 rounded-xl p-3.5 text-[10.5px] font-mono overflow-x-auto shadow-inner leading-relaxed select-all">
{`{
  "success": true,
  "external_user_id": "APP_CUST_12345",
  "detail": "User account created and subscription plan activated."
}`}
                    </pre>
                  </div>
                </div>
              )}

              {activeRefTab === 'update' && (
                <div className="space-y-4">
                  <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                    When a customer switches or upgrades their active plan, WytSaas triggers a POST request to your Update User sync endpoint containing the following payload:
                  </p>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Request Headers</span>
                    <pre className="bg-slate-950 text-slate-300 rounded-xl p-3.5 text-[10.5px] font-mono overflow-x-auto shadow-inner leading-relaxed">
{"X-API-Key: <your_configured_api_key>\nContent-Type: application/json"}
                    </pre>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Request Payload (JSON)</span>
                    <pre className="bg-slate-950 text-slate-300 rounded-xl p-3.5 text-[10.5px] font-mono overflow-x-auto shadow-inner leading-relaxed select-all">
{`{
  "user_id": "99ea7879-1bf4-4df8-8686-2a6230f6b4e3",
  "external_user_id": "APP_CUST_12345",
  "new_plan_id": 2,
  "new_plan_name": "Premium Plan",
  "price": 599.00,
  "billing_cycle": "monthly"
}`}
                    </pre>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Expected Response Payload (JSON)</span>
                    <pre className="bg-slate-950 text-emerald-400 rounded-xl p-3.5 text-[10.5px] font-mono overflow-x-auto shadow-inner leading-relaxed select-all">
{`{
  "success": true,
  "detail": "Subscription plan modified successfully."
}`}
                    </pre>
                  </div>
                </div>
              )}

              {activeRefTab === 'cancel' && (
                <div className="space-y-4">
                  <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                    When a customer requests cancellation of their billing, WytSaas triggers a POST request to your Cancel User sync endpoint containing the following payload:
                  </p>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Request Headers</span>
                    <pre className="bg-slate-950 text-slate-300 rounded-xl p-3.5 text-[10.5px] font-mono overflow-x-auto shadow-inner leading-relaxed">
{"X-API-Key: <your_configured_api_key>\nContent-Type: application/json"}
                    </pre>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Request Payload (JSON)</span>
                    <pre className="bg-slate-950 text-slate-300 rounded-xl p-3.5 text-[10.5px] font-mono overflow-x-auto shadow-inner leading-relaxed select-all">
{`{
  "user_id": "99ea7879-1bf4-4df8-8686-2a6230f6b4e3",
  "external_user_id": "APP_CUST_12345",
  "action": "deactivate"
}`}
                    </pre>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Expected Response Payload (JSON)</span>
                    <pre className="bg-slate-950 text-emerald-400 rounded-xl p-3.5 text-[10.5px] font-mono overflow-x-auto shadow-inner leading-relaxed select-all">
{`{
  "success": true,
  "detail": "Account deactivated and user plan access revoked."
}`}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[11px] font-semibold text-slate-400">
              Click the arrow button to view expected JSON payload formats and header details.
            </p>
          )}
        </Paper>

        {/* Form Actions */}
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
        </div>
      </form>
    </Box>
  );
}

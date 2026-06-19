import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import type { Brand } from '@/api/wytsaas/brand';
import type {
  BrandSubscriptionPlan,
  BrandSubscriptionPlanCreateInput
} from '@/api/wytsaas/subscription';

interface SubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: BrandSubscriptionPlanCreateInput, brandId: number) => Promise<void>;
  editingPlan: BrandSubscriptionPlan | null;
  brands: Brand[];
  primaryColor: string;
  primaryHoverColor: string;
  brandId?: number;
}

export default function SubscriptionDialog({
  isOpen,
  onClose,
  onSubmit,
  editingPlan,
  brands,
  primaryColor,
  primaryHoverColor,
  brandId
}: SubscriptionDialogProps) {
  // Local form states
  const [formBrandId, setFormBrandId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formBillingCycle, setFormBillingCycle] = useState('monthly');
  const [formFeatures, setFormFeatures] = useState('');
  const [formExternalPlanId, setFormExternalPlanId] = useState('');
  const [formStatus, setFormStatus] = useState('active');

  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form states with editingPlan
  useEffect(() => {
    if (isOpen) {
      setLocalError(null);
      if (editingPlan) {
        setFormBrandId(editingPlan.brand_id.toString());
        setFormName(editingPlan.name);
        setFormDescription(editingPlan.description || '');
        setFormPrice(editingPlan.price.toString());
        setFormBillingCycle(editingPlan.billing_cycle);
        setFormFeatures(editingPlan.features ? editingPlan.features.join(', ') : '');
        setFormExternalPlanId(editingPlan.external_plan_id || '');
        setFormStatus(editingPlan.status);
      } else {
        setFormBrandId(brandId ? brandId.toString() : (brands.length > 0 ? brands[0].id.toString() : ''));
        setFormName('');
        setFormDescription('');
        setFormPrice('');
        setFormBillingCycle('monthly');
        setFormFeatures('');
        setFormExternalPlanId('');
        setFormStatus('active');
      }
    }
  }, [isOpen, editingPlan, brands, brandId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!formBrandId) {
      setLocalError('Please select an app.');
      return;
    }
    if (!formName.trim()) {
      setLocalError('Plan Name is required.');
      return;
    }
    const priceVal = parseFloat(formPrice);
    if (isNaN(priceVal) || priceVal < 0) {
      setLocalError('Please enter a valid price (greater than or equal to 0).');
      return;
    }

    const brandIdVal = parseInt(formBrandId, 10);
    const featuresArray = formFeatures
      ? formFeatures.split(',').map(f => f.trim()).filter(f => f.length > 0)
      : [];

    const payload: BrandSubscriptionPlanCreateInput = {
      name: formName.trim(),
      description: formDescription.trim() || null,
      price: priceVal,
      features: featuresArray,
      billing_cycle: formBillingCycle,
      external_plan_id: formExternalPlanId.trim() || null,
      status: formStatus
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload, brandIdVal);
      onClose();
    } catch (err: any) {
      setLocalError(err.message || 'An error occurred while saving the plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '24px',
            maxWidth: '550px',
            width: '100%',
            p: 1.5
          }
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 'black', color: '#1e293b', fontSize: '17px', borderBottom: '1px solid #f1f5f9', pb: 2 }}>
        {editingPlan ? 'Modify Subscription Plan' : 'Create Subscription Plan'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ spaceY: 3, pt: 3.5, pb: 1 }}>
          {localError && (
            <Alert severity="error" sx={{ borderRadius: '12px', mb: 2, fontSize: '11px', fontWeight: 'bold' }}>
              {localError}
            </Alert>
          )}

          <div className="space-y-4">
            {/* Plan Name */}
            <TextField
              fullWidth
              label="Plan Name"
              size="small"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Starter / Professional / Enterprise"
              slotProps={{
                input: {
                  style: { borderRadius: '12px', fontSize: '12px', fontWeight: '600' }
                },
                inputLabel: {
                  style: { fontSize: '12px', fontWeight: 'bold' }
                }
              }}
            />

            {/* Description */}
            <TextField
              fullWidth
              label="Short Description"
              size="small"
              multiline
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Give a short billing outline or description of the plan tier"
              slotProps={{
                input: {
                  style: { borderRadius: '12px', fontSize: '12px', fontWeight: '600' }
                },
                inputLabel: {
                  style: { fontSize: '12px', fontWeight: 'bold' }
                }
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Price */}
              <TextField
                label="Price (₹)"
                size="small"
                type="number"
                slotProps={{
                  htmlInput: { step: '0.01', min: '0' },
                  input: {
                    style: { borderRadius: '12px', fontSize: '12px', fontWeight: '600' }
                  },
                  inputLabel: {
                    style: { fontSize: '12px', fontWeight: 'bold' }
                  }
                }}
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="0.00"
              />

              {/* Billing Cycle */}
              <FormControl size="small">
                <InputLabel id="cycle-select-label" sx={{ fontSize: '12px', fontWeight: 'bold' }}>Billing Cycle</InputLabel>
                <Select
                  labelId="cycle-select-label"
                  label="Billing Cycle"
                  value={formBillingCycle}
                  onChange={(e) => setFormBillingCycle(e.target.value)}
                  sx={{ borderRadius: '12px', fontSize: '12px', fontWeight: 'semibold' }}
                >
                  <MenuItem value="monthly" sx={{ fontSize: '12px', fontWeight: 'semibold' }}>Monthly</MenuItem>
                  <MenuItem value="quarterly" sx={{ fontSize: '12px', fontWeight: 'semibold' }}>Quarterly</MenuItem>
                  <MenuItem value="yearly" sx={{ fontSize: '12px', fontWeight: 'semibold' }}>Yearly</MenuItem>
                  <MenuItem value="one-time" sx={{ fontSize: '12px', fontWeight: 'semibold' }}>One-time</MenuItem>
                </Select>
              </FormControl>
            </div>

            {/* Features Tag Input (Comma-separated) */}
            <TextField
              fullWidth
              label="Features (Comma-separated)"
              size="small"
              value={formFeatures}
              onChange={(e) => setFormFeatures(e.target.value)}
              placeholder="Feature 1, Feature 2, Feature 3"
              helperText="Enter plan features separated by commas."
              slotProps={{
                input: {
                  style: { borderRadius: '12px', fontSize: '12px', fontWeight: '600' }
                },
                inputLabel: {
                  style: { fontSize: '12px', fontWeight: 'bold' }
                },
                formHelperText: {
                  style: { fontSize: '9px', fontWeight: 'bold', color: '#94a3b8' }
                }
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* External Plan ID */}
              <TextField
                label="External Plan ID (e.g. Stripe ID)"
                size="small"
                value={formExternalPlanId}
                onChange={(e) => setFormExternalPlanId(e.target.value)}
                placeholder="price_abc123"
                slotProps={{
                  input: {
                    style: { borderRadius: '12px', fontSize: '12px', fontWeight: '600' }
                  },
                  inputLabel: {
                    style: { fontSize: '12px', fontWeight: 'bold' }
                  }
                }}
              />

              {/* Status */}
              <FormControl size="small">
                <InputLabel id="status-select-label" sx={{ fontSize: '12px', fontWeight: 'bold' }}>Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  label="Status"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  sx={{ borderRadius: '12px', fontSize: '12px', fontWeight: 'semibold' }}
                >
                  <MenuItem value="active" sx={{ fontSize: '12px', fontWeight: 'semibold' }}>Active</MenuItem>
                  <MenuItem value="inactive" sx={{ fontSize: '12px', fontWeight: 'semibold' }}>Inactive</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 2, borderTop: '1px solid #f1f5f9' }}>
          <Button
            onClick={onClose}
            disabled={isSubmitting}
            sx={{
              color: '#64748b',
              textTransform: 'none',
              fontWeight: 'bold',
              borderRadius: '10px',
              fontSize: '11.5px'
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{
              bgcolor: primaryColor,
              color: 'white',
              textTransform: 'none',
              fontWeight: 'bold',
              borderRadius: '10px',
              px: 3.5,
              boxShadow: 'none',
              fontSize: '11.5px',
              '&:hover': {
                bgcolor: primaryHoverColor,
                boxShadow: 'none'
              }
            }}
          >
            {editingPlan ? 'Save Changes' : 'Create Tier'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Typography,
  Chip,
  IconButton,
  Box
} from '@mui/material';
import { Edit2, Trash2, FolderOpen } from 'lucide-react';
import type { BrandSubscriptionPlan } from '@/api/wytsaas/subscription';

interface SubscriptionTableProps {
  plans: BrandSubscriptionPlan[];
  isLoading: boolean;
  primaryColor: string;
  getBrandLogo: (brandId: number) => string | null;
  getBrandName: (brandId: number) => string;
  onEdit: (plan: BrandSubscriptionPlan) => void;
  onDelete: (plan: BrandSubscriptionPlan) => void;
}

export default function SubscriptionTable({
  plans,
  isLoading,
  primaryColor,
  getBrandLogo,
  getBrandName,
  onEdit,
  onDelete
}: SubscriptionTableProps) {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: primaryColor }} />
        <Typography className="text-slate-400 text-xs font-semibold mt-2.5">
          Querying subscription registry...
        </Typography>
      </Box>
    );
  }

  if (plans.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10 }}>
        <div className="flex flex-col items-center justify-center text-slate-400">
          <FolderOpen className="h-10 w-10 text-slate-300 mb-3" />
          <Typography className="text-slate-500 font-extrabold text-sm">
            No Subscription Plans Found
          </Typography>
          <Typography className="text-slate-400 text-xs mt-1">
            Try selecting another app filter, or click 'Create Plan' to launch a new tier.
          </Typography>
        </div>
      </Box>
    );
  }

  return (
    <TableContainer sx={{ maxHeight: 520 }}>
      <Table stickyHeader size="medium">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>App</TableCell>
            <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>Plan Name</TableCell>
            <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>Pricing</TableCell>
            <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>Cycle</TableCell>
            <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>Key Features Included</TableCell>
            <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>External ID</TableCell>
            <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase', textAlign: 'right' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: 'all 0.15s' }}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getBrandLogo(plan.brand_id) ? (
                    <img
                      src={getBrandLogo(plan.brand_id) || ''}
                      alt="logo"
                      className="h-7 w-7 object-cover rounded-lg border border-slate-100 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/80x80?text=App';
                      }}
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center font-bold text-white text-[10px] shadow-sm" style={{ backgroundColor: primaryColor }}>
                      {getBrandName(plan.brand_id).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <Typography sx={{ fontWeight: 'bold', fontSize: '12px', color: '#334155' }}>
                    {getBrandName(plan.brand_id)}
                  </Typography>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '12.5px', color: '#1e293b' }}>
                    {plan.name}
                  </Typography>
                  {plan.description && (
                    <Typography sx={{ fontSize: '10px', color: '#64748b', maxWidth: 220 }} noWrap>
                      {plan.description}
                    </Typography>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 'black', fontSize: '12.5px', color: '#0f172a' }}>
                  ₹{plan.price.toFixed(2)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={plan.billing_cycle}
                  size="small"
                  sx={{
                    fontSize: '9px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    bgcolor: '#f1f5f9',
                    color: '#475569',
                    borderRadius: '6px'
                  }}
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 300 }}>
                  {plan.features && plan.features.length > 0 ? (
                    plan.features.map((feat, idx) => (
                      <Chip
                        key={idx}
                        label={feat}
                        size="small"
                        sx={{
                          fontSize: '8.5px',
                          height: '18px',
                          fontWeight: 'semibold',
                          bgcolor: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #dbeafe',
                          borderRadius: '6px'
                        }}
                      />
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic font-semibold">No features defined</span>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'monospace' }}>
                  {plan.external_plan_id || '—'}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={plan.status}
                  size="small"
                  color={plan.status === 'active' ? 'success' : 'default'}
                  sx={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '6px' }}
                />
              </TableCell>
              <TableCell align="right">
                <div className="flex justify-end gap-1">
                  <IconButton
                    onClick={() => onEdit(plan)}
                    size="small"
                    sx={{
                      color: '#64748b',
                      '&:hover': {
                        color: primaryColor,
                        bgcolor: `${primaryColor}10`
                      }
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    onClick={() => onDelete(plan)}
                    size="small"
                    sx={{
                      color: '#64748b',
                      '&:hover': {
                        color: '#ef4444',
                        bgcolor: '#fee2e2'
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

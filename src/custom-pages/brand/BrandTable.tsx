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
  Tooltip,
  IconButton,
  Box
} from '@mui/material';
import { Edit2, Trash2, FolderOpen, Star, Eye, ShieldCheck } from 'lucide-react';
import type { Brand } from '@/api/wytsaas/brand';

interface BrandTableProps {
  brands: Brand[];
  isLoading: boolean;
  primaryColor: string;
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
  onViewDetails?: (brand: Brand) => void;
  watchlistIds?: number[];
  onToggleWatch?: (brandId: number) => void;
  onApproveFinalReview?: (brand: Brand) => void;
}

export default function BrandTable({
  brands,
  isLoading,
  primaryColor,
  onEdit,
  onDelete,
  onViewDetails,
  watchlistIds = [],
  onToggleWatch = () => {},
  onApproveFinalReview
}: BrandTableProps) {
  // Chip color utilities for stage/status
  const getStatusChipColor = (statusVal: string) => {
    switch (statusVal.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
      case 'under_review':
        return 'warning';
      case 'rejected':
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStageChipConfig = (stageVal: string) => {
    const stage = stageVal || '';
    if (stage === 'Brand Submitted' || stage === 'Brand Registration') {
      return { label: '1. Registration', color: '#64748b', bg: '#f1f5f9' };
    }
    if (stage === 'App Asset Submission') {
      return { label: '2. App Assets', color: '#0284c7', bg: '#e0f2fe' };
    }
    if (stage === 'Subscription Plan Configuration') {
      return { label: '3. Subscriptions', color: '#7c3aed', bg: '#f3e8ff' };
    }
    if (stage === 'API Integration') {
      return { label: '4. API Sync', color: '#db2777', bg: '#fce7f3' };
    }
    if (stage === 'Waiting for WytPass Review' || stage === 'whitepass_review') {
      return { label: '5. SSO Review', color: '#ea580c', bg: '#ffedd5' };
    }
    if (stage === 'Waiting for WytPass Review Rejected') {
      return { label: '5. SSO Rejected', color: '#dc2626', bg: '#fee2e2' };
    }
    if (stage === 'WhitePass Integration Completed') {
      return { label: '5. SSO Approved', color: '#16a34a', bg: '#dcfce7' };
    }
    if (stage === 'Waiting for WytPayment Review' || stage === 'payment_integration') {
      return { label: '6. Payment Review', color: '#d97706', bg: '#fef3c7' };
    }
    if (stage === 'Waiting for WytPayment Review Rejected') {
      return { label: '6. Payment Rejected', color: '#dc2626', bg: '#fee2e2' };
    }
    if (stage === 'WytPayment Integration Completed') {
      return { label: '6. Payment Approved', color: '#16a34a', bg: '#dcfce7' };
    }
    if (stage === 'Onboarding Completed') {
      return { label: '7. Published & Live', color: '#0d9488', bg: '#ccfbf1' };
    }
    return { label: stage.replace('_', ' ').toUpperCase(), color: '#475569', bg: '#f1f5f9' };
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: primaryColor }} />
        <Typography className="text-slate-400 text-xs font-semibold mt-2.5">
          Querying database repository...
        </Typography>
      </Box>
    );
  }

  if (brands.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10 }}>
        <div className="flex flex-col items-center justify-center text-slate-400">
          <FolderOpen className="h-10 w-10 text-slate-300 mb-3" />
          <Typography className="text-slate-500 font-extrabold text-sm">
            No Apps Found
          </Typography>
          <Typography className="text-slate-400 text-xs mt-1">
            Try modifying your search or click 'Add App' to create one.
          </Typography>
        </div>
      </Box>
    );
  }

  return (
    <TableContainer sx={{ maxHeight: 520, borderTop: '1px solid var(--mui-palette-divider)' }}>
      <Table stickyHeader size="medium" sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 500, fontSize: '0.8125rem', letterSpacing: '0.2px', color: 'text.primary', textTransform: 'uppercase', height: 56, bgcolor: 'background.paper' }}>Logo</TableCell>
            <TableCell sx={{ fontWeight: 500, fontSize: '0.8125rem', letterSpacing: '0.2px', color: 'text.primary', textTransform: 'uppercase', height: 56, bgcolor: 'background.paper' }}>App Detail</TableCell>
            <TableCell sx={{ fontWeight: 500, fontSize: '0.8125rem', letterSpacing: '0.2px', color: 'text.primary', textTransform: 'uppercase', height: 56, bgcolor: 'background.paper' }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 500, fontSize: '0.8125rem', letterSpacing: '0.2px', color: 'text.primary', textTransform: 'uppercase', height: 56, bgcolor: 'background.paper' }}>Company</TableCell>
            <TableCell sx={{ fontWeight: 500, fontSize: '0.8125rem', letterSpacing: '0.2px', color: 'text.primary', textTransform: 'uppercase', height: 56, bgcolor: 'background.paper' }}>Stage</TableCell>
            <TableCell sx={{ fontWeight: 500, fontSize: '0.8125rem', letterSpacing: '0.2px', color: 'text.primary', textTransform: 'uppercase', height: 56, bgcolor: 'background.paper' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 500, fontSize: '0.8125rem', letterSpacing: '0.2px', color: 'text.primary', textTransform: 'uppercase', height: 56, bgcolor: 'background.paper', textAlign: 'center' }}>Featured</TableCell>
            <TableCell sx={{ fontWeight: 500, fontSize: '0.8125rem', letterSpacing: '0.2px', color: 'text.primary', textTransform: 'uppercase', height: 56, bgcolor: 'background.paper', textAlign: 'right', pr: 4 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {brands.map((brand) => (
            <TableRow
              key={brand.id}
              hover
              sx={{ 
                borderBottom: '1px solid var(--mui-palette-divider)',
                '&:last-child td, &:last-child th': { border: 0 },
                transition: 'all 0.15s' 
              }}
            >
              <TableCell sx={{ py: 2 }}>
                {brand.logo_url ? (
                  <img
                    src={brand.logo_url}
                    alt={`${brand.name} logo`}
                    className="h-[34px] w-[34px] object-cover rounded-xl border border-slate-100 shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/80x80?text=App';
                    }}
                  />
                ) : (
                  <div className={`h-[34px] w-[34px] rounded-xl flex items-center justify-center font-black text-white text-xs shadow-sm`} style={{ backgroundColor: primaryColor }}>
                    {brand.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </TableCell>
              <TableCell sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', color: 'text.primary' }}>
                    {brand.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                    /{brand.slug}
                  </Typography>
                  {brand.links && brand.links.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                      {brand.links.map((link, lIdx) => (
                        <Chip
                          key={lIdx}
                          label={link.title || link.link_type}
                          size="small"
                          component="a"
                          href={link.url}
                          target="_blank"
                          clickable
                          sx={{
                            fontSize: '0.75rem',
                            height: '18px',
                            fontWeight: 500,
                            bgcolor: '#f1f5f9',
                            color: primaryColor,
                            textDecoration: 'none',
                            '&:hover': { bgcolor: '#e2e8f0' }
                          }}
                        />
                      ))}
                    </Box>
                  )}
                  {brand.tags && brand.tags.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                      {brand.tags.map((tag) => (
                        <Chip
                          key={tag.id}
                          label={tag.name}
                          size="small"
                          sx={{
                            fontSize: '0.75rem',
                            height: '18px',
                            fontWeight: 500,
                            bgcolor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #dbeafe'
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </TableCell>
              <TableCell sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {(() => {
                    const types = brand.brand_type
                      ? (Array.isArray(brand.brand_type) ? brand.brand_type : [brand.brand_type])
                      : ['saas'];
                    return types.map((t, idx) => (
                      <Chip
                        key={idx}
                        label={t}
                        size="small"
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          bgcolor: '#f1f5f9',
                          color: '#475569',
                          borderRadius: '6px',
                          height: '20px'
                        }}
                      />
                    ));
                  })()}
                </Box>
              </TableCell>
              <TableCell sx={{ py: 2 }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'text.secondary' }}>
                  {brand.company_name || '—'}
                </Typography>
              </TableCell>
              <TableCell sx={{ py: 2 }}>
                {(() => {
                  const config = getStageChipConfig(brand.current_stage);
                  const isSSORejected = brand.current_stage === 'Waiting for WytPass Review Rejected';
                  const isPaymentRejected = brand.current_stage === 'Waiting for WytPayment Review Rejected';
                  const rejectReason = isSSORejected 
                    ? brand.whitepass_review?.review_notes 
                    : isPaymentRejected 
                      ? brand.wytpayment_review?.review_notes 
                      : null;
                  
                  const chipEl = (
                    <Chip
                      label={config.label}
                      size="small"
                      sx={{
                        color: config.color,
                        bgcolor: config.bg,
                        fontWeight: 'bold',
                        fontSize: '10px',
                        borderRadius: '6px',
                        border: `1px solid ${config.color}20`
                      }}
                    />
                  );

                  return (
                    <div className="flex flex-col gap-1 items-start">
                      {rejectReason ? (
                        <Tooltip title={`Rejection Reason: ${rejectReason}`} arrow>
                          <span>{chipEl}</span>
                        </Tooltip>
                      ) : chipEl}
                      {rejectReason && (
                        <Typography sx={{ fontSize: '10.5px', color: '#dc2626', fontWeight: 600, mt: 0.5, maxWidth: '160px', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.2 }}>
                          Reason: {rejectReason}
                        </Typography>
                      )}
                    </div>
                  );
                })()}
              </TableCell>
              <TableCell sx={{ py: 2 }}>
                <Chip
                  label={brand.status}
                  size="small"
                  color={getStatusChipColor(brand.status)}
                  sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', borderRadius: '6px' }}
                />
              </TableCell>
              <TableCell align="center" sx={{ py: 2 }}>
                {brand.is_featured ? (
                  <Tooltip title="Featured App">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-300/50 animate-pulse" />
                  </Tooltip>
                ) : (
                  <span className="inline-flex h-2 w-2 rounded-full bg-slate-200" />
                )}
              </TableCell>
              <TableCell align="right" sx={{ py: 2, pr: 4 }}>
                <div className="flex justify-end gap-1">
                  <Tooltip title={watchlistIds.includes(brand.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}>
                    <IconButton
                      onClick={() => onToggleWatch(brand.id)}
                      size="small"
                      sx={{
                        color: watchlistIds.includes(brand.id) ? '#eab308' : 'text.secondary',
                        '&:hover': {
                          color: '#eab308',
                          bgcolor: '#fef9c3'
                        }
                      }}
                    >
                      <Star className="h-4 w-4" style={{ fill: watchlistIds.includes(brand.id) ? '#eab308' : 'transparent' }} />
                    </IconButton>
                  </Tooltip>
                  {onViewDetails && (
                    <Tooltip title="View App Details">
                      <IconButton
                        onClick={() => onViewDetails(brand)}
                        size="small"
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            color: primaryColor,
                            bgcolor: `${primaryColor}10`
                          }
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onApproveFinalReview && brand.current_stage === 'WytPayment Integration Completed' && (
                    <Tooltip title="Verify Final Onboarding">
                      <IconButton
                        onClick={() => onApproveFinalReview(brand)}
                        size="small"
                        sx={{
                          color: '#10b981',
                          '&:hover': {
                            color: '#059669',
                            bgcolor: '#ecfdf5'
                          }
                        }}
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <IconButton
                    onClick={() => onEdit(brand)}
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        color: primaryColor,
                        bgcolor: `${primaryColor}10`
                      }
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    onClick={() => onDelete(brand)}
                    size="small"
                    sx={{
                      color: 'text.secondary',
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

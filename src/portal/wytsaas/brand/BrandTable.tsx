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
import { Edit2, Trash2, FolderOpen, Star } from 'lucide-react';
import type { Brand } from '../api/brand';

interface BrandTableProps {
  brands: Brand[];
  isLoading: boolean;
  primaryColor: string;
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
  watchlistIds?: number[];
  onToggleWatch?: (brandId: number) => void;
}

export default function BrandTable({
  brands,
  isLoading,
  primaryColor,
  onEdit,
  onDelete,
  watchlistIds = [],
  onToggleWatch = () => {}
}: BrandTableProps) {
  // Chip color utilities for stage/status
  const getStatusChipColor = (statusVal: string) => {
    switch (statusVal) {
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

  const getStageChipLabel = (stageVal: string) => {
    return stageVal.replace('_', ' ').toUpperCase();
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
    <TableContainer sx={{ maxHeight: 520 }}>
      <Table stickyHeader size="medium">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>Logo</TableCell>
            <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>App Detail</TableCell>
            <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>Company</TableCell>
            <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>Stage</TableCell>
            <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase', textAlign: 'center' }}>Featured</TableCell>
            <TableCell sx={{ fontWeight: 'bold', fontSize: '11px', color: '#64748b', bgcolor: '#f8fafc', textTransform: 'uppercase', textAlign: 'right' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {brands.map((brand) => (
            <TableRow
              key={brand.id}
              hover
              sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: 'all 0.15s' }}
            >
              <TableCell>
                {brand.logo_url ? (
                  <img
                    src={brand.logo_url}
                    alt={`${brand.name} logo`}
                    className="h-9 w-9 object-cover rounded-xl border border-slate-100 shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/80x80?text=App';
                    }}
                  />
                ) : (
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-white text-xs shadow-sm`} style={{ backgroundColor: primaryColor }}>
                    {brand.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '12.5px', color: '#1e293b' }}>
                    {brand.name}
                  </Typography>
                  <Typography sx={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'monospace' }}>
                    /{brand.slug}
                  </Typography>
                  {brand.links && brand.links.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
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
                            fontSize: '8.5px',
                            height: '16px',
                            fontWeight: 'bold',
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
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75, flexWrap: 'wrap' }}>
                      {brand.tags.map((tag) => (
                        <Chip
                          key={tag.id}
                          label={tag.name}
                          size="small"
                          sx={{
                            fontSize: '8.5px',
                            height: '16px',
                            fontWeight: 'bold',
                            bgcolor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #dbeafe'
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Chip
                  label={brand.brand_type || 'saas'}
                  size="small"
                  sx={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    bgcolor: '#f1f5f9',
                    color: '#475569',
                    borderRadius: '8px'
                  }}
                />
              </TableCell>
              <TableCell>
                <Typography sx={{ fontSize: '12px', fontWeight: '500', color: '#334155' }}>
                  {brand.company_name || '—'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>
                  {getStageChipLabel(brand.current_stage)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={brand.status}
                  size="small"
                  color={getStatusChipColor(brand.status)}
                  sx={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: '8px' }}
                />
              </TableCell>
              <TableCell align="center">
                {brand.is_featured ? (
                  <Tooltip title="Featured App">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-300/50 animate-pulse" />
                  </Tooltip>
                ) : (
                  <span className="inline-flex h-2 w-2 rounded-full bg-slate-200" />
                )}
              </TableCell>
              <TableCell align="right">
                <div className="flex justify-end gap-1">
                  <Tooltip title={watchlistIds.includes(brand.id) ? 'Remove from Watchlist' : 'Add to Watchlist'}>
                    <IconButton
                      onClick={() => onToggleWatch(brand.id)}
                      size="small"
                      sx={{
                        color: watchlistIds.includes(brand.id) ? '#eab308' : '#64748b',
                        '&:hover': {
                          color: '#eab308',
                          bgcolor: '#fef9c3'
                        }
                      }}
                    >
                      <Star className="h-4 w-4" style={{ fill: watchlistIds.includes(brand.id) ? '#eab308' : 'transparent' }} />
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    onClick={() => onEdit(brand)}
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
                    onClick={() => onDelete(brand)}
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

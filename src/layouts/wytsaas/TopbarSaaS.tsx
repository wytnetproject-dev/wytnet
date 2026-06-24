import { useState } from 'react';
import { Search, LogIn, LogOut, User, Menu as HamburgerIcon } from 'lucide-react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

interface TopbarProps {
  user: { email: string; name: string } | null;
  onLogout: () => void;
  onLoginClick: () => void;
  onMyAccountClick: () => void;
  onToggleSidebar?: () => void;
}

export default function TopbarSaaS({ user, onLogout, onLoginClick, onMyAccountClick, onToggleSidebar }: TopbarProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      component="header"
      sx={{
        height: 64,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'between',
        px: 3,
        flexShrink: 0,
        zIndex: 10,
        userSelect: 'none',
      }}
      className="justify-between"
    >
      {/* Left side Search Input */}
      <Box sx={{ flexGrow: 1, maxWidth: 448, display: 'flex', alignItems: 'center' }}>
        {/* Mobile Hamburger Menu Icon */}
        <IconButton
          onClick={onToggleSidebar}
          sx={{
            display: { xs: 'inline-flex', md: 'none' },
            mr: 1.5,
            color: 'slate.500',
            '&:hover': { backgroundColor: '#f1f5f9' },
            borderRadius: '8px',
            p: 1
          }}
        >
          <HamburgerIcon className="h-5 w-5" />
        </IconButton>

        <div className="relative group w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search SaaS modules, datasets, or ask WytEngine..."
            className="w-full bg-[#f8fafc] border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-9 pr-14 py-2 rounded-full outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white focus:shadow-[0_2px_15px_rgba(0,102,204,0.015)]"
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[10px] font-bold text-slate-400">
            <span className="bg-white border border-slate-100 px-1.5 py-0.5 rounded shadow-sm">⌘ K</span>
          </div>
        </div>
      </Box>

      {/* Right side Context details & Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {user ? (
          <Box>
            <Avatar
              onClick={handleProfileClick}
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: '#0052a3' },
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'background-color 0.2s',
              }}
            >
              {user.name.slice(0, 2).toUpperCase()}
            </Avatar>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              onClick={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.1))',
                    border: '1px solid #f1f5f9',
                    mt: 1,
                    borderRadius: '16px',
                    minWidth: 220,
                    p: 0.5,
                  },
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f8fafc' }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', mt: 0.5 }}>
                  {user.email}
                </Typography>
              </Box>
              <MenuItem
                onClick={() => {
                  onMyAccountClick();
                  handleClose();
                }}
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#475569',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  my: 0.5,
                  py: 1,
                  '&:hover': { backgroundColor: '#f8fafc' }
                }}
              >
                <User className="h-4 w-4 text-slate-500" />
                <span>My Account</span>
              </MenuItem>
              <Divider sx={{ my: '2px', borderColor: '#f8fafc' }} />
              <MenuItem
                onClick={() => {
                  onLogout();
                  handleClose();
                }}
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#e11d48',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  my: 0.5,
                  py: 1,
                  '&:hover': { backgroundColor: '#fff1f2' }
                }}
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Button
            onClick={onLoginClick}
            variant="contained"
            startIcon={<LogIn className="h-4 w-4" />}
            sx={{
              borderRadius: '9999px',
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 700,
              px: 2.5,
              py: 1,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          >
            Log In
          </Button>
        )}
      </Box>
    </Box>
  );
}

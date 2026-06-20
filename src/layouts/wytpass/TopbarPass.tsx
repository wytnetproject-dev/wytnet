import { useState } from 'react';
import { Search, ChevronDown, Zap, FileText, Bell, LogIn, LogOut } from 'lucide-react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';

interface TopbarProps {
  user: { email: string; name: string } | null;
  onLogout: () => void;
  onLoginClick: () => void;
  onSelectProduct: (product: string) => void;
}

export default function TopbarPass({ user, onLogout, onLoginClick, onSelectProduct }: TopbarProps) {
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [groupAnchorEl, setGroupAnchorEl] = useState<null | HTMLElement>(null);

  const isProfileOpen = Boolean(profileAnchorEl);
  const isGroupOpen = Boolean(groupAnchorEl);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleGroupClick = (event: React.MouseEvent<HTMLElement>) => {
    setGroupAnchorEl(event.currentTarget);
  };

  const handleGroupClose = () => {
    setGroupAnchorEl(null);
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
        justifyContent: 'space-between',
        px: 3,
        flexShrink: 0,
        zIndex: 10,
        userSelect: 'none',
      }}
    >
      {/* Left side Search Input */}
      <Box sx={{ flexGrow: 1, maxWidth: 448 }}>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search identity clients, logs, or policies..."
            className="w-full bg-[#f8fafc] border border-slate-100 hover:border-slate-200 focus:border-purple-600/40 text-xs font-medium pl-9 pr-14 py-2 rounded-full outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white focus:shadow-[0_2px_15px_rgba(147,51,234,0.015)]"
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[10px] font-bold text-slate-400">
            <span className="bg-white border border-slate-100 px-1.5 py-0.5 rounded shadow-sm">⌘ K</span>
          </div>
        </div>
      </Box>

      {/* Right side Context details & Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {user && (
          <>
            {/* Context Group selector */}
            <Box>
              <Button
                onClick={handleGroupClick}
                startIcon={
                  <Box
                    sx={{
                      height: 20,
                      width: 20,
                      borderRadius: '50%',
                      backgroundColor: '#faf5ff',
                      color: '#9333ea',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '10px',
                    }}
                  >
                    A
                  </Box>
                }
                endIcon={<ChevronDown className="h-3 w-3 text-slate-400" />}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#2c3e50',
                  px: 2,
                  py: 0.75,
                  borderRadius: '9999px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  '&:hover': {
                    backgroundColor: '#f1f5f9',
                    color: '#9333ea',
                  },
                }}
              >
                Acme Group
              </Button>
              <Menu
                anchorEl={groupAnchorEl}
                open={isGroupOpen}
                onClose={handleGroupClose}
                slotProps={{
                  paper: {
                    elevation: 0,
                    sx: {
                      border: '1px solid #f1f5f9',
                      borderRadius: '12px',
                      mt: 1,
                      minWidth: 160,
                    },
                  }
                }}
              >
                <MenuItem onClick={handleGroupClose} sx={{ fontSize: '0.75rem', fontWeight: 700 }}>Acme Group</MenuItem>
                <MenuItem onClick={handleGroupClose} sx={{ fontSize: '0.75rem', fontWeight: 700 }}>Beta Organization</MenuItem>
              </Menu>
            </Box>

            {/* Dynamic Action Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, borderLeft: '1px solid #f1f5f9', pl: 2, mr: 1 }}>
              <IconButton size="small" sx={{ color: '#94a3b8', '&:hover': { color: '#9333ea', backgroundColor: '#faf5ff' } }}>
                <Zap className="h-4 w-4" />
              </IconButton>
              
              <IconButton size="small" sx={{ color: '#94a3b8', '&:hover': { color: '#9333ea', backgroundColor: '#faf5ff' } }}>
                <FileText className="h-4 w-4" />
              </IconButton>

              <IconButton size="small" sx={{ color: '#94a3b8', '&:hover': { color: '#9333ea', backgroundColor: '#faf5ff' } }}>
                <Badge color="error" variant="dot" overlap="circular" anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                  <Bell className="h-4 w-4" />
                </Badge>
              </IconButton>
            </Box>

            <Button
              onClick={() => onSelectProduct('wytsaas')}
              variant="text"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'primary.main',
                backgroundColor: 'rgba(0, 102, 204, 0.05)',
                borderRadius: '9999px',
                px: 2.25,
                py: 0.75,
                border: '1px solid rgba(0, 102, 204, 0.1)',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(0, 102, 204, 0.1)',
                },
              }}
            >
              WytSaaS Portal
            </Button>
          </>
        )}

        {/* User initials Avatar or Log In button */}
        {user ? (
          <Box>
            <Avatar
              onClick={handleProfileClick}
              sx={{
                width: 32,
                height: 32,
                bgcolor: '#9333ea',
                '&:hover': { bgcolor: '#7e22ce' },
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
              anchorEl={profileAnchorEl}
              open={isProfileOpen}
              onClose={handleProfileClose}
              onClick={handleProfileClose}
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
                  onLogout();
                  handleProfileClose();
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
            color="secondary"
            startIcon={<LogIn className="h-4 w-4" />}
            sx={{
              borderRadius: '9999px',
              textTransform: 'none',
              fontSize: '0.75rem',
              fontWeight: 700,
              px: 2.5,
              py: 1,
              bgcolor: '#9333ea',
              '&:hover': { bgcolor: '#7e22ce' },
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

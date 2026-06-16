import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Sidebar from '@/layouts/wytpass/SidebarPass';
import Topbar from '@/layouts/wytpass/TopbarPass';
import LoginModalPass from '@/custom-pages/login/LoginModalPass';
import WytPassDashboard from '@/custom-pages/wytpass-dashboard/WytPassDashboard';
import BrandsCRUD from '@/custom-pages/brand/BrandsCRUD';

interface ProductLayoutProps {
  onSelectProduct: (product: string) => void;
}

export default function WytPassPortalLayout({ onSelectProduct }: ProductLayoutProps) {
  // Authentication state for WytPass
  const [user, setUser] = useState<{ email: string; name: string; role: string } | null>(() => {
    const stored = localStorage.getItem('wytpass_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [activeMenu, setActiveMenu] = useState(() => {
    return user?.role === 'developer' ? 'brand' : 'products';
  });
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  const handleLoginSuccess = (newToken: string, newEmail: string, newName: string, newRole: string) => {
    const newUser = { email: newEmail, name: newName, role: newRole };
    setUser(newUser);
    localStorage.setItem('wytpass_user', JSON.stringify(newUser));
    localStorage.setItem('wytpass_token', newToken);
    if (newRole === 'developer') {
      setActiveMenu('brand');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('wytpass_user');
    localStorage.removeItem('wytpass_token');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#f8fafc',
        overflow: 'hidden',
        color: '#475569',
        position: 'relative',
      }}
    >
      {user ? (
        <>
          {user.role === 'developer' && (
            <Sidebar
              activeProduct="wytpass"
              onSelectProduct={onSelectProduct}
              activeMenu={activeMenu}
              onSelectMenu={setActiveMenu}
              isMinimized={isSidebarMinimized}
              onToggleMinimize={() => setIsSidebarMinimized(!isSidebarMinimized)}
              userRole={user.role}
            />
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', height: '100%' }}>
            <Topbar
              user={user}
              onLogout={handleLogout}
              onLoginClick={() => { }}
              onSelectProduct={onSelectProduct}
            />

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
              {activeMenu === 'brand' ? (
                <BrandsCRUD user={user} portalType="wytpass" />
              ) : (
                <WytPassDashboard user={user} />
              )}
            </Box>
          </Box>
        </>
      ) : (
        <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, backgroundColor: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
          {/* Elegant Product selector tabs */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              p: 0.75,
              backgroundColor: 'rgba(241, 245, 249, 0.8)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(226, 232, 240, 0.5)',
              borderRadius: '16px',
              mb: 3,
              position: 'relative',
              zIndex: 10,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
            className="animate-fadeIn"
          >
            <Button
              onClick={() => onSelectProduct('wytsaas')}
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                px: 2.5,
                py: 1,
                borderRadius: '12px',
                textTransform: 'none',
                color: '#64748b',
                '&:hover': { color: '#0f172a', backgroundColor: 'rgba(0,0,0,0.02)' },
              }}
            >
              WytSaaS Login
            </Button>
            <Button
              onClick={() => onSelectProduct('wytpass')}
              variant="contained"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                px: 2.5,
                py: 1,
                borderRadius: '12px',
                textTransform: 'none',
                backgroundColor: '#9333ea',
                '&:hover': { backgroundColor: '#7e22ce' },
                boxShadow: '0 4px 6px -1px rgb(147 51 234 / 0.1)',
              }}
            >
              WytPass Login
            </Button>
          </Box>

          <LoginModalPass
            isOpen={true}
            onClose={() => { }}
            onLoginSuccess={handleLoginSuccess}
            isEmbedded={true}
          />
        </Box>
      )}
    </Box>
  );
}

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Sidebar from '@/layouts/wytsaas/SidebarSaaS';
import Topbar from '@/layouts/wytsaas/TopbarSaaS';
import WytSaaSDashboard from '@/custom-pages/wytsaas-dashboard/WytSaaSDashboard';
import LoginModalSaaS from '@/custom-pages/login/LoginModalSaaS';
import BrandsCRUD from '@/custom-pages/brand/BrandsCRUD';
import AdminBrands from '@/custom-pages/admin/AdminBrands';
import WytPassApprovals from '@/custom-pages/admin/WytPassApprovals';
import MyAccountModal from '@/custom-pages/my-account/MyAccountModal';
import WatchlistCRUD from '@/custom-pages/brand/WatchlistCRUD';
import UserWatchlistCards from '@/custom-pages/brand/UserWatchlistCards';

interface ProductLayoutProps {
  onSelectProduct: (product: string) => void;
}

export default function WytSaaSPortalLayout({ onSelectProduct }: ProductLayoutProps) {
  // Authentication state for WytSaaS
  const [user, setUser] = useState<{ email: string; name: string; role: string } | null>(() => {
    const stored = localStorage.getItem('wytsaas_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [activeMenu, setActiveMenu] = useState(() => {
    if (user?.role === 'developer') return 'brand';
    if (user?.role === 'wytsaas_admin') return 'admin-brands';
    if (user?.role === 'user') return 'user-watchlist';
    return 'products';
  });
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  const handleUpdateSuccess = (newEmail: string, newName: string) => {
    if (user) {
      const updatedUser = { ...user, email: newEmail, name: newName };
      setUser(updatedUser);
      localStorage.setItem('wytsaas_user', JSON.stringify(updatedUser));
    }
  };

  const handleLoginSuccess = (newToken: string, newEmail: string, newName: string, newRole: string) => {
    const newUser = { email: newEmail, name: newName, role: newRole };
    setUser(newUser);
    localStorage.setItem('wytsaas_user', JSON.stringify(newUser));
    localStorage.setItem('wytsaas_token', newToken);
    if (newRole === 'developer') {
      setActiveMenu('brand');
    } else if (newRole === 'wytsaas_admin') {
      setActiveMenu('admin-brands');
    } else if (newRole === 'user') {
      setActiveMenu('user-watchlist');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('wytsaas_user');
    localStorage.removeItem('wytsaas_token');
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
          {(user.role === 'developer' || user.role === 'wytsaas_admin' || user.role === 'user') && (
            <Sidebar
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
              onMyAccountClick={() => setActiveMenu('my-account')}
            />

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
              {activeMenu === 'brand' ? (
                <BrandsCRUD user={user} portalType="wytsaas" />
              ) : activeMenu === 'watchlist' ? (
                <WatchlistCRUD user={user} />
              ) : activeMenu === 'user-watchlist' ? (
                <UserWatchlistCards user={user} />
              ) : activeMenu === 'admin-brands' ? (
                <AdminBrands user={user} portalType="wytsaas" />
              ) : activeMenu === 'wytpass-approvals' ? (
                <WytPassApprovals user={user} portalType="wytsaas" />
              ) : activeMenu === 'my-account' ? (
                <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 4, py: 3, userSelect: 'none' }}>
                  <MyAccountModal
                    isOpen={true}
                    onClose={() => {}}
                    onUpdateSuccess={handleUpdateSuccess}
                    isEmbedded={true}
                  />
                </Box>
              ) : (
                <WytSaaSDashboard user={user} />
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
              variant="contained"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                px: 2.5,
                py: 1,
                borderRadius: '12px',
                textTransform: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            >
              WytSaaS Login
            </Button>
            <Button
              onClick={() => onSelectProduct('wytpass')}
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
              WytPass Login
            </Button>
          </Box>

          <LoginModalSaaS
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

import { useState } from 'react';
import Box from '@mui/material/Box';

import Sidebar from '@/layouts/wytsaas/SidebarSaaS';
import Topbar from '@/layouts/wytsaas/TopbarSaaS';
import WytSaaSDashboard from '@/custom-pages/wytsaas-dashboard/WytSaaSDashboard';
import LoginModalSaaS from '@/custom-pages/login/LoginModalSaaS';
import BrandsCRUD from '@/custom-pages/brand/BrandsCRUD';
import AdminBrands from '@/custom-pages/admin/AdminBrands';
import WytPassApprovals from '@/custom-pages/admin/WytPassApprovals';
import WytPaymentApprovals from '@/custom-pages/admin/WytPaymentApprovals';
import MarketplaceBanners from '@/custom-pages/admin/MarketplaceBanners';
import MyAccountModal from '@/custom-pages/my-account/MyAccountModal';
import WatchlistCRUD from '@/custom-pages/brand/WatchlistCRUD';
import UserWatchlistCards from '@/custom-pages/brand/UserWatchlistCards';
import UserMarketplaceCards from '@/custom-pages/brand/UserMarketplaceCards';
import UsersCRUD from '@/custom-pages/admin/UsersCRUD';
import AdminEnquiries from '@/custom-pages/admin/AdminEnquiries';
import BankingInfo from '@/custom-pages/banking-info/BankingInfo';

interface ProductLayoutProps {
  onSelectProduct: (product: string) => void;
}

export default function WytSaaSPortalLayout({ onSelectProduct: _onSelectProduct }: ProductLayoutProps) {
  // Authentication state for WytSaaS
  const [user, setUser] = useState<{ email: string; name: string; role: string } | null>(() => {
    const stored = localStorage.getItem('wytsaas_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [activeMenu, setActiveMenu] = useState(() => {
    if (user?.role === 'developer') return 'brand';
    if (user?.role === 'wytsaas_admin') return 'admin-brands';
    if (user?.role === 'user') return 'user-marketplace';
    return 'products';
  });
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

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
      setActiveMenu('user-marketplace');
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

          {/* Mobile Sidebar Overlay Backdrop */}
          {!isSidebarMinimized && (
            <Box
              onClick={() => setIsSidebarMinimized(true)}
              sx={{
                display: { xs: 'block', md: 'none' },
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(15, 23, 42, 0.3)',
                backdropFilter: 'blur(4px)',
                zIndex: 1100,
                transition: 'opacity 0.3s ease',
              }}
            />
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', height: '100%' }}>
            <Topbar
              user={user}
              onLogout={handleLogout}
              onLoginClick={() => { }}
              onMyAccountClick={() => setActiveMenu('my-account')}
              onToggleSidebar={() => setIsSidebarMinimized(!isSidebarMinimized)}
            />

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
              {activeMenu === 'brand' ? (
                <BrandsCRUD user={user} portalType="wytsaas" />
              ) : activeMenu === 'watchlist' ? (
                <WatchlistCRUD user={user} />
              ) : activeMenu === 'user-watchlist' ? (
                <UserWatchlistCards user={user} />
              ) : activeMenu === 'user-marketplace' ? (
                <UserMarketplaceCards user={user} />
              ) : activeMenu === 'admin-brands' ? (
                <AdminBrands user={user} portalType="wytsaas" />
              ) : activeMenu === 'wytpass-approvals' ? (
                <WytPassApprovals user={user} portalType="wytsaas" />
              ) : activeMenu === 'wytpayment-approvals' ? (
                <WytPaymentApprovals user={user} portalType="wytsaas" />
              ) : activeMenu === 'marketplace-banners' ? (
                <MarketplaceBanners user={user} />
              ) : activeMenu === 'users' ? (
                <UsersCRUD user={user} />
              ) : activeMenu === 'admin-enquiries' ? (
                <AdminEnquiries user={user} />
              ) : activeMenu === 'banking-info' ? (
                <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 4, py: 3, userSelect: 'none' }}>
                  <BankingInfo user={user} />
                </Box>
              ) : activeMenu === 'my-account' ? (
                <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 4, py: 3, userSelect: 'none' }}>
                  <MyAccountModal
                    isOpen={true}
                    onClose={() => { }}
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
        <LoginModalSaaS
          isOpen={true}
          onClose={() => { }}
          onLoginSuccess={handleLoginSuccess}
          isEmbedded={true}
        />
      )}
    </Box>
  );
}

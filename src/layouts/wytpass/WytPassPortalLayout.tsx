import { useState } from 'react';
import Box from '@mui/material/Box';
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
        <LoginModalPass
          isOpen={true}
          onClose={() => { }}
          onLoginSuccess={handleLoginSuccess}
          isEmbedded={true}
        />
      )}
    </Box>
  );
}

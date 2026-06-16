import { useState } from 'react';
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
    <div className="flex h-screen w-screen bg-[#f8fafc] overflow-hidden text-slate-600 font-sans relative">
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

          <div className="flex flex-col flex-grow overflow-hidden h-full">
            <Topbar
              user={user}
              onLogout={handleLogout}
              onLoginClick={() => { }}
              onMyAccountClick={() => setActiveMenu('my-account')}
            />

            <div className="flex-grow flex flex-col overflow-hidden relative">
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
                <div className="flex-grow overflow-y-auto px-8 py-6 select-none">
                  <MyAccountModal
                    isOpen={true}
                    onClose={() => {}}
                    onUpdateSuccess={handleUpdateSuccess}
                    isEmbedded={true}
                  />
                </div>
              ) : (
                <WytSaaSDashboard user={user} />
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-[#f8fafc] relative overflow-hidden">
          {/* Elegant Product selector tabs */}
          <div className="flex gap-2 p-1.5 bg-slate-100/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl mb-6 relative z-10 shadow-sm animate-fadeIn">
            <button
              onClick={() => onSelectProduct('wytsaas')}
              className="text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer bg-wytnet-blue text-white shadow-md"
            >
              WytSaaS Login
            </button>
            <button
              onClick={() => onSelectProduct('wytpass')}
              className="text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-wytnet-dark"
            >
              WytPass Login
            </button>
          </div>

          <LoginModalSaaS
            isOpen={true}
            onClose={() => { }}
            onLoginSuccess={handleLoginSuccess}
            isEmbedded={true}
          />
        </div>
      )}
    </div>
  );
}

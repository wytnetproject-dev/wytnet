import { useState } from 'react';
import Sidebar from './SidebarPass';
import Topbar from './TopbarPass';

import LoginModalPass from './LoginModalPass';
import WytPassDashboard from './WytPassDashboard';
import BrandsCRUD from '../wytsaas/brand/BrandsCRUD';


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
    <div className="flex h-screen w-screen bg-[#f8fafc] overflow-hidden text-slate-600 font-sans relative">
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

          <div className="flex flex-col flex-grow overflow-hidden h-full">
            <Topbar
              user={user}
              onLogout={handleLogout}
              onLoginClick={() => { }}
              onSelectProduct={onSelectProduct}
            />

            <div className="flex-grow flex flex-col overflow-hidden relative">
              {activeMenu === 'brand' ? (
                <BrandsCRUD user={user} portalType="wytpass" />
              ) : (
                <WytPassDashboard user={user} />
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
              className="text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-wytnet-dark"
            >
              WytSaaS Login
            </button>
            <button
              onClick={() => onSelectProduct('wytpass')}
              className="text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer bg-purple-600 text-white shadow-md"
            >
              WytPass Login
            </button>
          </div>

          <LoginModalPass
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

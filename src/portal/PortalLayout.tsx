import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import WytSaaSDashboard from './wytsaas/WytSaaSDashboard';

import { LayoutGrid, Wrench } from 'lucide-react';
import LoginModalSaaS from './wytsaas/LoginModalSaaS';
import LoginModalPass from './wytpass/LoginModalPass';
import WytPassDashboard from './WytPassDashboard';

export default function PortalLayout() {
  const [activeMenu, setActiveMenu] = useState('products');
  const [activeProduct, setActiveProduct] = useState('wytsaas');
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  // Authentication states mapped per product: { [productId]: { email, name } }
  const [sessions, setSessions] = useState<Record<string, { email: string; name: string } | null>>(() => {
    const wytsaasUser = localStorage.getItem('wytsaas_user');
    const wytpassUser = localStorage.getItem('wytpass_user');
    return {
      wytsaas: wytsaasUser ? JSON.parse(wytsaasUser) : null,
      wytpass: wytpassUser ? JSON.parse(wytpassUser) : null,
    };
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const currentUser = sessions[activeProduct] || null;

  const handleLoginSuccess = (newToken: string, newEmail: string, newName: string) => {
    const newUser = { email: newEmail, name: newName };
    setSessions(prev => {
      const updated = { ...prev, [activeProduct]: newUser };
      localStorage.setItem(`${activeProduct}_user`, JSON.stringify(newUser));
      localStorage.setItem(`${activeProduct}_token`, newToken);
      return updated;
    });
  };

  const handleLogout = () => {
    setSessions(prev => {
      const updated = { ...prev, [activeProduct]: null };
      localStorage.removeItem(`${activeProduct}_user`);
      localStorage.removeItem(`${activeProduct}_token`);
      return updated;
    });
  };

  return (
    <div className="flex h-screen w-screen bg-[#f8fafc] overflow-hidden text-slate-600 font-sans relative">

      {/* 1. Sidebar Nav panel */}
      <Sidebar
        activeProduct={activeProduct}
        onSelectProduct={setActiveProduct}
        activeMenu={activeMenu}
        onSelectMenu={setActiveMenu}
        isMinimized={isSidebarMinimized}
        onToggleMinimize={() => setIsSidebarMinimized(!isSidebarMinimized)}
      />

      {/* 2. Right workspace side */}
      <div className="flex flex-col flex-grow overflow-hidden h-full">

        {/* Topbar Selector headers */}
        <Topbar
          user={currentUser}
          onLogout={handleLogout}
          onLoginClick={() => setIsLoginModalOpen(true)}
        />

        {/* Dynamic page switcher content workspace */}
        <div className="flex-grow flex flex-col overflow-hidden relative">

          {activeMenu === 'products' && activeProduct === 'wytsaas' ? (
            <WytSaaSDashboard />
          ) : activeMenu === 'products' && activeProduct === 'wytpass' ? (
            <WytPassDashboard />
          ) : (
            // Premium illustration placeholder workspace for other list paths
            <div className="flex-grow flex flex-col items-center justify-center p-8 bg-[#f8fafc] text-center select-none animate-fadeIn">
              <div className="h-16 w-16 rounded-2xl bg-wytnet-blue/5 border border-wytnet-blue/10 flex items-center justify-center text-wytnet-blue shadow-inner animate-pulse">
                <Wrench className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-wytnet-dark mt-4">
                Section Under Development
              </h3>
              <p className="text-xs font-semibold text-slate-400 max-w-xs leading-relaxed mt-2">
                This workspace module is currently being configured. Click on "Products ➔ WytSaaS" or "Products ➔ WytPass" in the sidebar to review the active consoles!
              </p>

              {/* Quick shortcut helper button */}
              <button
                onClick={() => {
                  setActiveMenu('products');
                  setActiveProduct('wytsaas');
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-wytnet-blue px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-wytnet-blue-light transition-all cursor-pointer"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Go to WytSaaS Console
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Login Modal Overlay at root DOM level to maintain correct stacking context */}
      {activeProduct === 'wytpass' ? (
        <LoginModalPass
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        <LoginModalSaaS
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

    </div>
  );
}

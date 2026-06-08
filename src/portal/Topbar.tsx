import { useState } from 'react';
import { Search, ChevronDown, Zap, FileText, Bell, LogIn, LogOut } from 'lucide-react';
import { IconButton } from '@mui/material';

interface TopbarProps {
  user: { email: string; name: string } | null;
  onLogout: () => void;
  onLoginClick: () => void;
}

export default function Topbar({ user, onLogout, onLoginClick }: TopbarProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-10 select-none">
      
      {/* Left side Search Input */}
      <div className="flex-grow max-w-md">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search products, modules, or ask WytEngine..."
            className="w-full bg-[#f8fafc] border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-9 pr-14 py-2 rounded-full outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white focus:shadow-[0_2px_15px_rgba(0,102,204,0.015)]"
          />
          {/* Key shortcut indicator */}
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[10px] font-bold text-slate-400">
            <span className="bg-white border border-slate-100 px-1.5 py-0.5 rounded shadow-sm">⌘ K</span>
          </div>
        </div>
      </div>

      {/* Right side Context details & Controls */}
      <div className="flex items-center gap-4">
        
        {user && (
          <>
            {/* Context Group selector */}
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] border border-slate-100 hover:border-slate-200 transition-all rounded-full cursor-pointer group shadow-[0_1px_3px_rgba(0,0,0,0.005)]">
              <div className="h-5 w-5 rounded-full bg-wytnet-blue/10 text-wytnet-blue flex items-center justify-center font-bold text-[10px]">
                A
              </div>
              <span className="text-xs font-bold text-[#2c3e50] group-hover:text-wytnet-blue transition-colors">
                Acme Group
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-wytnet-blue transition-colors" />
            </button>

            {/* Dynamic Action Buttons */}
            <div className="flex items-center gap-1.5 border-l border-slate-100 pl-4 mr-2">
              <IconButton size="small" className="text-slate-400 hover:text-wytnet-blue hover:bg-slate-50 transition-colors">
                <Zap className="h-4 w-4" />
              </IconButton>
              
              <IconButton size="small" className="text-slate-400 hover:text-wytnet-blue hover:bg-slate-50 transition-colors">
                <FileText className="h-4 w-4" />
              </IconButton>

              <IconButton size="small" className="text-slate-400 hover:text-wytnet-blue hover:bg-slate-50 transition-colors relative">
                <Bell className="h-4 w-4" />
                {/* Small notification badge dot */}
                <span className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
              </IconButton>
            </div>
          </>
        )}

        {/* User initials Avatar or Log In button */}
        {user ? (
          <div className="relative">
            <div 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="h-8 w-8 rounded-full bg-wytnet-blue hover:bg-wytnet-blue-light transition-colors text-white font-extrabold text-xs flex items-center justify-center cursor-pointer shadow-sm select-none"
            >
              {user.name.slice(0, 2).toUpperCase()}
            </div>

            {/* Dropdown Menu */}
            {isProfileMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2.5 w-56 origin-top-right rounded-2xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-black/5 focus:outline-none z-30 animate-fadeIn">
                  <div className="px-3.5 py-2.5 border-b border-slate-50">
                    <p className="text-xs font-extrabold text-wytnet-dark truncate">
                      {user.name}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer mt-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="flex items-center gap-2 bg-wytnet-blue hover:bg-blue-600 transition-all text-xs font-bold text-white px-5 py-2.5 rounded-full shadow-md hover:shadow-lg cursor-pointer animate-fadeIn"
          >
            <LogIn className="h-4 w-4" />
            <span>Log In</span>
          </button>
        )}

      </div>

    </header>
  );
}

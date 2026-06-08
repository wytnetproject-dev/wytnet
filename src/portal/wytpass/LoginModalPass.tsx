import React, { useState } from 'react';
import { X, Mail, Lock, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, email: string, name: string) => void;
}

export default function LoginModalPass({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const backendUrl = 'http://localhost:8001/auth/login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.item?.access_token || '';
        const displayName = email.split('@')[0];
        const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        
        onLoginSuccess(token, email, formattedName);
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.detail || 'Invalid email or password.');
      }
    } catch (err) {
      console.warn('WytPass backend connection failed, falling back to mock authentication', err);
      setStatusMessage('WytPass backend (port 8001) offline. Logging in via mock fallback...');
      
      setTimeout(() => {
        onLoginSuccess('mock-jwt-token-wytpass', email, 'WytPass User');
        setIsLoading(false);
        onClose();
      }, 1200);
      return;
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#092c5c]/25 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Main glassmorphic login card with custom purple accents */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/90 p-8 shadow-[0_20px_50px_rgba(147,51,234,0.15)] backdrop-blur-xl animate-fadeIn">
        
        {/* Glow background accent */}
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-purple-600/10 blur-2xl" />
        <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-2xl" />

        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Branding header tailored for WytPass */}
        <div className="text-center mb-8 relative z-10">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 shadow-inner">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-extrabold text-wytnet-dark">
            Welcome back to WytPass
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Access your secure WytPass dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs font-bold text-rose-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && !error && (
            <div className="flex items-center gap-2 rounded-xl bg-purple-50 border border-purple-100 p-3 text-xs font-bold text-purple-600 animate-pulse">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-purple-600/40 text-xs font-medium pl-10 pr-4 py-3 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white focus:shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-600 transition-colors">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-purple-600/40 text-xs font-medium pl-10 pr-4 py-3 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white focus:shadow-sm"
              />
            </div>
          </div>

          {/* Submit Button themed with purple */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 transition-all text-xs font-bold text-white py-3 rounded-xl cursor-pointer shadow-md hover:shadow-lg focus:outline-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Dev Credentials (Database)
          </p>
          <p className="text-[10px] font-semibold text-slate-400 mt-1">
            Email: any valid email | Password: any password
          </p>
        </div>

      </div>
    </div>
  );
}

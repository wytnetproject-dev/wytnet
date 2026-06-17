import React, { useState } from 'react';
import { X, Mail, Lock, Loader2, ShieldCheck, AlertCircle, User, UserPlus } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, email: string, name: string, role: string) => void;
  isEmbedded?: boolean;
}

const DEFAULT_MOCK_USERS_MIN = [
  { id: "u1", username: "admin_wyt", email: "admin@wytnet.com", full_name: "SaaS Admin", role: "wytsaas_admin", is_active: true },
  { id: "u2", username: "dev_sanjay", email: "developer@wytnet.com", full_name: "Developer", role: "developer", is_active: true },
  { id: "u3", username: "customer_rahul", email: "user@wytnet.com", full_name: "Customer User", role: "user", is_active: true }
];

export default function LoginModalSaaS({ isOpen, onClose, onLoginSuccess, isEmbedded = false }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Field States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'developer' | 'user'>('developer');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen && !isEmbedded) return null;

  const backendUrl = 'http://localhost:8000/auth/login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);

    if (mode === 'login') {
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
          const userRole = data.item?.user?.role || data.item?.role || data.role || data.user?.role || 'user';
          const token = data.item?.access_token || '';
          const displayName = data.item?.user?.full_name || data.item?.user?.username || email.split('@')[0];
          const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
          
          onLoginSuccess(token, email, formattedName, userRole);
          if (onClose) onClose();
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.detail || 'Invalid email or password.');
        }
      } catch (err) {
        console.warn('WytSaaS backend connection failed, falling back to mock authentication', err);
        
        const mockRole = email.toLowerCase().includes('admin')
          ? 'wytsaas_admin'
          : (email.toLowerCase().includes('dev') || email.toLowerCase().includes('jane.smith') || email.toLowerCase().includes('jane'))
          ? 'developer'
          : 'user';

        setTimeout(() => {
          onLoginSuccess('mock-jwt-token-wytsaas', email, mockRole === 'wytsaas_admin' ? 'SaaS Admin' : 'WytSaaS User', mockRole);
          setIsLoading(false);
          if (onClose) onClose();
        }, 1200);
        return;
      }
    } else {
      // Register logic
      if (!email || !password || !username) {
        setError('Please fill in all required fields.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }

      setIsLoading(true);

      const registerUrl = 'http://localhost:8000/users/';

      try {
        const response = await fetch(registerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            email,
            full_name: fullName || null,
            password,
            role,
            is_active: true
          }),
        });

        if (response.ok) {
          // Auto log in after registration success
          try {
            const loginRes = await fetch(backendUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            });

            if (loginRes.ok) {
              const data = await loginRes.json();
              const userRole = data.item?.user?.role || data.item?.role || data.role || data.user?.role || 'user';
              const token = data.item?.access_token || '';
              const displayName = data.item?.user?.full_name || data.item?.user?.username || email.split('@')[0];
              const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
              
              onLoginSuccess(token, email, formattedName, userRole);
              if (onClose) onClose();
            } else {
              setMode('login');
              setStatusMessage('Account created! Please sign in using your credentials.');
            }
          } catch (loginErr) {
            setMode('login');
            setStatusMessage('Account created! Please sign in using your credentials.');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.detail || 'Registration failed. Username or email might already be taken.');
        }
      } catch (err) {
        console.warn('WytSaaS backend offline during registration. Persisting to mock storage.', err);
        
        // Save to offline local storage fallback
        const stored = localStorage.getItem('mock_users');
        const list = stored ? JSON.parse(stored) : DEFAULT_MOCK_USERS_MIN;

        if (list.some((u: any) => u.username.toLowerCase() === username.toLowerCase())) {
          setError('Username already taken (Sandbox)');
          setIsLoading(false);
          return;
        }
        if (list.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
          setError('Email already registered (Sandbox)');
          setIsLoading(false);
          return;
        }

        const newUser = {
          id: `user-uuid-${Math.floor(Math.random() * 10000)}`,
          username,
          email,
          full_name: fullName || null,
          role,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: null
        };
        
        const updatedList = [newUser, ...list];
        localStorage.setItem('mock_users', JSON.stringify(updatedList));

        setTimeout(() => {
          const displayName = fullName || username || email.split('@')[0];
          const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
          
          onLoginSuccess('mock-jwt-token-wytsaas', email, formattedName, role);
          setIsLoading(false);
          if (onClose) onClose();
        }, 1200);
        return;
      }
    }

    setIsLoading(false);
  };

  const cardContent = (
    <div className="relative w-full max-w-md max-h-full overflow-y-auto no-scrollbar rounded-3xl border border-white/20 bg-white/90 p-8 shadow-[0_20px_50px_rgba(0,102,204,0.15)] backdrop-blur-xl animate-fadeIn">
      
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-wytnet-blue/10 blur-2xl" />
      <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-purple-500/10 blur-2xl" />

      {!isEmbedded && (
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      <div className="text-center mb-8 relative z-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-wytnet-blue/5 border border-wytnet-blue/10 text-wytnet-blue shadow-inner">
          {mode === 'login' ? <ShieldCheck className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
        </div>
        <h2 className="text-xl font-extrabold text-wytnet-dark">
          {mode === 'login' ? 'Welcome back to WytSaaS' : 'Create WytSaaS Account'}
        </h2>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          {mode === 'login' ? 'Access your secure WytSaaS dashboard' : 'Join WytSaaS as a Developer or Customer'}
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
          <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs font-bold text-wytnet-blue animate-pulse">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            <span>{statusMessage}</span>
          </div>
        )}

        {mode === 'register' && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-3 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white focus:shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Username *</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
                  <span className="text-[13px] font-bold pl-0.5">@</span>
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-3 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white focus:shadow-sm"
                />
              </div>
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500">Email Address *</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-3 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white focus:shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500">Password *</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
              <Lock className="h-4 w-4" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-3 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white focus:shadow-sm"
            />
          </div>
        </div>

        {mode === 'register' && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">I am joining as a:</label>
            <div className="flex rounded-xl bg-slate-100/80 p-1 border border-slate-200/50">
              <button
                type="button"
                onClick={() => setRole('developer')}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  role === 'developer'
                    ? 'bg-white text-wytnet-blue shadow-sm border border-slate-200/20'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Developer
              </button>
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  role === 'user'
                    ? 'bg-white text-wytnet-blue shadow-sm border border-slate-200/20'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Customer / User
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-6 flex items-center justify-center gap-2 bg-wytnet-blue hover:bg-blue-600 disabled:bg-blue-400 transition-all text-xs font-bold text-white py-3 rounded-xl cursor-pointer shadow-md hover:shadow-lg focus:outline-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{mode === 'login' ? 'Signing in...' : 'Registering...'}</span>
            </>
          ) : (
            <span>{mode === 'login' ? 'Sign In' : 'Sign Up'}</span>
          )}
        </button>
      </form>

      <div className="mt-5 text-center relative z-10">
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError(null);
            setStatusMessage(null);
          }}
          className="text-xs font-bold text-wytnet-blue hover:text-blue-600 transition-all cursor-pointer underline hover:no-underline"
        >
          {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </button>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {mode === 'login' ? 'Dev Credentials (Database)' : 'Database Account Registration'}
        </p>
        <p className="text-[10px] font-semibold text-slate-400 mt-1">
          {mode === 'login' 
            ? 'Email: any valid email | Password: any password' 
            : 'Fill in fields above to dynamically register account'}
        </p>
      </div>

    </div>
  );

  if (isEmbedded) {
    return cardContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#092c5c]/25 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      {cardContent}
    </div>
  );
}

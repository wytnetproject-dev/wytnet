import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, Loader2, User, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { fetchUserProfile, updateUserProfile, type UserProfileUpdateInput } from '@/api/wytsaas/user';

interface MyAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess: (newEmail: string, newName: string) => void;
  isEmbedded?: boolean;
}

export default function MyAccountModal({ isOpen, onClose, onUpdateSuccess, isEmbedded = false }: MyAccountModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const token = localStorage.getItem('wytsaas_token');

  useEffect(() => {
    if ((isOpen || isEmbedded) && token) {
      loadProfile();
    }
  }, [isOpen, isEmbedded, token]);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (!token) throw new Error('Authentication token not found');
      const profile = await fetchUserProfile(token);
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
      setEmail(profile.email || '');
      setRole(profile.role || 'user');
    } catch (err: any) {
      console.warn('Backend offline or error fetching profile, using mock fallback', err);
      // Fallback mock values from localStorage
      const storedUserStr = localStorage.getItem('wytsaas_user');
      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr);
        setFullName(storedUser.name || '');
        setUsername(storedUser.name.toLowerCase().replace(/\s+/g, '') || '');
        setEmail(storedUser.email || '');
        setRole(storedUser.role || 'user');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !username) {
      setError('Username and Email are required.');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        setError('New Password must be at least 8 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setIsSaving(true);

    try {
      const updateData: UserProfileUpdateInput = {
        full_name: fullName || null,
        username,
        email,
      };

      if (newPassword) {
        updateData.password = newPassword;
      }

      if (token && token !== 'mock-jwt-token-wytsaas') {
        const updated = await updateUserProfile(updateData, token);
        const displayName = updated.full_name || updated.username;
        const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

        onUpdateSuccess(updated.email, formattedName);
      } else {
        // Mock fallback update
        const displayName = fullName || username;
        const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

        // Sync back mock user to localStorage
        const storedUserStr = localStorage.getItem('wytsaas_user');
        if (storedUserStr) {
          const storedUser = JSON.parse(storedUserStr);
          localStorage.setItem('wytsaas_user', JSON.stringify({
            ...storedUser,
            name: formattedName,
            email: email
          }));
        }

        onUpdateSuccess(email, formattedName);
      }

      setSuccessMsg('Profile updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        if (!isEmbedded) {
          onClose();
        } else {
          setSuccessMsg(null);
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen && !isEmbedded) return null;

  const content = (
    <div className={`relative w-full overflow-hidden animate-fadeIn ${
      isEmbedded 
        ? 'max-w-6xl bg-transparent mx-auto' 
        : 'max-w-md border border-white/20 bg-white/95 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,102,204,0.15)] backdrop-blur-xl'
    }`}>
      {isEmbedded ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Left Navigation Card */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-wytnet-blue/5 blur-xl pointer-events-none" />
              
              {/* Initials Avatar with glowing ring */}
              <div className="relative mb-4">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-wytnet-blue to-blue-500 font-extrabold text-2xl text-white flex items-center justify-center shadow-md select-none">
                  {fullName ? fullName.slice(0, 2).toUpperCase() : username.slice(0, 2).toUpperCase()}
                </div>
                <span className="absolute -bottom-1.5 -right-1.5 h-4.5 w-4.5 rounded-full border-4 border-white bg-emerald-500 shadow-sm" />
              </div>
              
              <h3 className="text-base font-extrabold text-wytnet-dark truncate w-full">
                {fullName || 'User Profile'}
              </h3>
              <p className="text-xs font-semibold text-slate-400 truncate w-full mb-3">
                {email}
              </p>
              
              {/* Role badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-blue-50 text-wytnet-blue border border-blue-100/50">
                <Shield className="h-3 w-3" />
                {role}
              </span>
            </div>
            
            {/* Tab navigation */}
            <div className="bg-white border border-slate-100 rounded-3xl p-2 shadow-sm flex flex-row md:flex-col gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-2.5 px-4 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-blue-50/60 text-wytnet-blue shadow-sm'
                    : 'text-slate-500 hover:text-wytnet-dark hover:bg-slate-50/50'
                }`}
              >
                <User className="h-4.5 w-4.5" />
                <span>Personal Info</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-2.5 px-4 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-blue-50/60 text-wytnet-blue shadow-sm'
                    : 'text-slate-500 hover:text-wytnet-dark hover:bg-slate-50/50'
                }`}
              >
                <Lock className="h-4.5 w-4.5" />
                <span>Security</span>
              </button>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="md:col-span-3">
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm relative overflow-hidden h-full">
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-wytnet-blue/5 blur-2xl pointer-events-none" />
              
              <h2 className="text-lg font-extrabold text-wytnet-dark mb-1">
                {activeTab === 'profile' ? 'Personal Information' : 'Security Settings'}
              </h2>
              <p className="text-xs font-semibold text-slate-400 mb-6">
                {activeTab === 'profile' 
                  ? 'Update your public details, contact email and organization handle' 
                  : 'Update your security credentials and secure password info'}
              </p>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="h-8 w-8 text-wytnet-blue animate-spin" />
                  <span className="text-xs font-bold text-slate-400">Loading details...</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs font-bold text-rose-600 animate-fadeIn">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs font-bold text-emerald-600 animate-fadeIn">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {activeTab === 'profile' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-1 md:col-span-2">
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
                            className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white"
                          />
                        </div>
                      </div>

                      {/* Username */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Username</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
                            <User className="h-4 w-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="johndoe"
                            className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white"
                          />
                        </div>
                      </div>

                      {/* Email Address */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Email Address</label>
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
                            className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white"
                          />
                        </div>
                      </div>
                      
                      {/* Role (Read Only) */}
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold text-slate-500">Role</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Shield className="h-4 w-4" />
                          </div>
                          <input
                            type="text"
                            disabled
                            value={role.toUpperCase()}
                            className="w-full bg-slate-100 border border-slate-100 text-xs font-extrabold pl-10 pr-4 py-2.5 rounded-xl text-slate-500 cursor-not-allowed select-none"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                      {/* New Password */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">New Password</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
                            <Lock className="h-4 w-4" />
                          </div>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white"
                          />
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Confirm Password</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
                            <Lock className="h-4 w-4" />
                          </div>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2 border-t border-slate-50 mt-6">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center justify-center gap-2 bg-wytnet-blue hover:bg-blue-600 disabled:bg-blue-400 transition-all text-xs font-bold text-white px-8 py-3 rounded-xl cursor-pointer shadow-md hover:shadow-lg focus:outline-none"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Saving changes...</span>
                        </>
                      ) : (
                        <span>Save Changes</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Modal layout stays exactly the same to preserve simple modal form structure */}
          {/* Soft Background Gradients */}
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-wytnet-blue/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

          {/* Close Button */}
          {!isEmbedded && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer z-10"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {/* Header */}
          <div className="text-center mb-6 relative z-10">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-wytnet-blue/5 border border-wytnet-blue/10 text-wytnet-blue shadow-inner">
              <User className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-extrabold text-wytnet-dark">
              My Account Settings
            </h2>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Update your profile and security credentials
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 text-wytnet-blue animate-spin" />
              <span className="text-xs font-bold text-slate-400">Loading profile details...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 relative z-10 max-h-[60vh] overflow-y-auto pr-1">
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs font-bold text-rose-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1">
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
                    className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Email Address</label>
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
                    className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white"
                  />
                </div>
              </div>

              {/* Role (Read Only) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Role</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Shield className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    disabled
                    value={role.toUpperCase()}
                    className="w-full bg-slate-100 border border-slate-100 text-xs font-extrabold pl-10 pr-4 py-2.5 rounded-xl text-slate-500 cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Password Fields Divider */}
              <div className="border-t border-slate-100 pt-3 mt-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Change Password (Leave blank to keep current)
                </p>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-wytnet-blue hover:bg-blue-600 disabled:bg-blue-400 transition-all text-xs font-bold text-white py-3 rounded-xl cursor-pointer shadow-md hover:shadow-lg focus:outline-none"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving changes...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#092c5c]/25 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      {content}
    </div>
  );
}

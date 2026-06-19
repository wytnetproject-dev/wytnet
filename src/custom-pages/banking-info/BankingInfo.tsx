import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  User, 
  Hash, 
  Building, 
  CreditCard, 
  Globe, 
  Loader2, 
  Pencil, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { 
  fetchDeveloperBankAccount, 
  createDeveloperBankAccount, 
  updateDeveloperBankAccount, 
  deleteDeveloperBankAccount,
  type DeveloperBankAccount
} from '@/api/wytsaas/developer_bank_account';

interface BankingInfoProps {
  user: { email: string; name: string; role: string } | null;
}

export default function BankingInfo({ user }: BankingInfoProps) {
  const [bankAccount, setBankAccount] = useState<DeveloperBankAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('view');

  // Form fields
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountType, setAccountType] = useState('Checking');
  const [bankAddress, setBankAddress] = useState('');

  const token = localStorage.getItem('wytsaas_token');

  useEffect(() => {
    if (token) {
      loadBankAccount();
    }
  }, [token]);

  const loadBankAccount = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!token) throw new Error('Authentication token not found');
      const account = await fetchDeveloperBankAccount(token);
      setBankAccount(account);
      if (account) {
        setFormFields(account);
        setMode('view');
      } else {
        setMode('create');
      }
    } catch (err: any) {
      console.error('Error fetching bank account details:', err);
      setError(err.message || 'Failed to retrieve banking details.');
    } finally {
      setIsLoading(false);
    }
  };

  const setFormFields = (account: DeveloperBankAccount) => {
    setBankName(account.bank_name || '');
    setAccountHolderName(account.account_holder_name || '');
    setAccountNumber(account.account_number || '');
    setRoutingNumber(account.routing_number || '');
    setSwiftCode(account.swift_code || '');
    setIfscCode(account.ifsc_code || '');
    setAccountType(account.account_type || 'Checking');
    setBankAddress(account.bank_address || '');
  };

  const handleEditClick = () => {
    if (bankAccount) {
      setFormFields(bankAccount);
      setMode('edit');
    }
  };

  const handleDeleteClick = async () => {
    if (!window.confirm('Are you sure you want to delete your banking details? This action cannot be undone.')) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (!token) throw new Error('Authentication token not found');
      await deleteDeveloperBankAccount(token);
      setBankAccount(null);
      setMode('create');
      setSuccessMsg('Banking details deleted successfully!');
      // Reset form
      setBankName('');
      setAccountHolderName('');
      setAccountNumber('');
      setRoutingNumber('');
      setSwiftCode('');
      setIfscCode('');
      setAccountType('Checking');
      setBankAddress('');
    } catch (err: any) {
      setError(err.message || 'Failed to delete banking details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!bankName || !accountHolderName || !accountNumber) {
      setError('Bank Name, Account Holder Name, and Account Number are required.');
      return;
    }

    setIsSaving(true);

    try {
      if (!token) throw new Error('Authentication token not found');

      const payload = {
        bank_name: bankName,
        account_holder_name: accountHolderName,
        account_number: accountNumber,
        routing_number: routingNumber || null,
        swift_code: swiftCode || null,
        ifsc_code: ifscCode || null,
        account_type: accountType,
        bank_address: bankAddress || null,
      };

      let updatedAccount: DeveloperBankAccount;
      if (mode === 'create') {
        updatedAccount = await createDeveloperBankAccount(payload, token);
        setSuccessMsg('Banking details created successfully!');
      } else {
        updatedAccount = await updateDeveloperBankAccount(payload, token);
        setSuccessMsg('Banking details updated successfully!');
      }

      setBankAccount(updatedAccount);
      setFormFields(updatedAccount);
      setMode('view');
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving your banking information.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (bankAccount) {
      setFormFields(bankAccount);
      setMode('view');
    } else {
      setMode('create');
    }
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-10 w-10 text-wytnet-blue animate-spin" />
        <span className="text-sm font-bold text-slate-400">Loading banking settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl bg-transparent mx-auto px-4 py-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left Informational Column */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-wytnet-blue/5 blur-xl pointer-events-none" />
            
            <div className="relative mb-4">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-wytnet-blue to-blue-500 font-extrabold text-2xl text-white flex items-center justify-center shadow-md select-none">
                <Landmark className="h-10 w-10 text-white" />
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 h-4.5 w-4.5 rounded-full border-4 border-white bg-emerald-500 shadow-sm" />
            </div>
            
            <h3 className="text-base font-extrabold text-wytnet-dark truncate w-full">
              Payout Details
            </h3>
            <p className="text-xs font-semibold text-slate-400 w-full mb-3 mt-1">
              Developer Bank Account
            </p>
            
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-blue-50 text-wytnet-blue border border-blue-100/50">
              <ShieldCheck className="h-3.5 w-3.5" />
              {user?.role || 'Developer'}
            </span>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
            <h4 className="text-xs font-extrabold text-wytnet-dark uppercase tracking-wider">
              Security Notice
            </h4>
            <p className="text-[11px] font-semibold text-slate-400 leading-relaxed">
              Your banking details are encrypted and securely stored. We only use this information to process payouts for your published applications.
            </p>
          </div>
        </div>

        {/* Right Main Column */}
        <div className="md:col-span-3">
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm relative overflow-hidden min-h-[400px]">
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-wytnet-blue/5 blur-2xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-extrabold text-wytnet-dark mb-1">
                  {mode === 'view' ? 'Banking Details' : mode === 'edit' ? 'Edit Banking Information' : 'Setup Bank Account'}
                </h2>
                <p className="text-xs font-semibold text-slate-400">
                  {mode === 'view' 
                    ? 'Review the bank account details where you will receive payouts.' 
                    : 'Enter the payout bank account details for your developer account.'}
                </p>
              </div>

              {mode === 'view' && bankAccount && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEditClick}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 border border-slate-100 hover:border-slate-200 text-slate-600 hover:text-wytnet-dark font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 border border-rose-100 hover:border-rose-200 text-rose-600 hover:text-rose-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs font-bold text-rose-600 mb-5 animate-fadeIn">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs font-bold text-emerald-600 mb-5 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'view' && bankAccount ? (
              // Display mode
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn mt-2">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Bank Name</span>
                    <div className="flex items-center gap-2 text-xs font-bold text-wytnet-dark">
                      <Landmark className="h-4 w-4 text-wytnet-blue shrink-0" />
                      <span>{bankAccount.bank_name}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Account Holder Name</span>
                    <div className="flex items-center gap-2 text-xs font-bold text-wytnet-dark">
                      <User className="h-4 w-4 text-wytnet-blue shrink-0" />
                      <span>{bankAccount.account_holder_name}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Account Number</span>
                    <div className="flex items-center gap-2 text-xs font-bold text-wytnet-dark">
                      <Hash className="h-4 w-4 text-wytnet-blue shrink-0" />
                      <span>{bankAccount.account_number}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Account Type</span>
                    <div className="flex items-center gap-2 text-xs font-bold text-wytnet-dark">
                      <CreditCard className="h-4 w-4 text-wytnet-blue shrink-0" />
                      <span>{bankAccount.account_type || 'Checking'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {bankAccount.routing_number && (
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Routing/Transit Number</span>
                      <div className="flex items-center gap-2 text-xs font-bold text-wytnet-dark">
                        <Hash className="h-4 w-4 text-wytnet-blue shrink-0" />
                        <span>{bankAccount.routing_number}</span>
                      </div>
                    </div>
                  )}

                  {bankAccount.swift_code && (
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">SWIFT / BIC Code</span>
                      <div className="flex items-center gap-2 text-xs font-bold text-wytnet-dark">
                        <Globe className="h-4 w-4 text-wytnet-blue shrink-0" />
                        <span>{bankAccount.swift_code}</span>
                      </div>
                    </div>
                  )}

                  {bankAccount.ifsc_code && (
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">IFSC Code</span>
                      <div className="flex items-center gap-2 text-xs font-bold text-wytnet-dark">
                        <Globe className="h-4 w-4 text-wytnet-blue shrink-0" />
                        <span>{bankAccount.ifsc_code}</span>
                      </div>
                    </div>
                  )}

                  {bankAccount.bank_address && (
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Bank Address</span>
                      <div className="flex items-start gap-2 text-xs font-bold text-wytnet-dark">
                        <Building className="h-4 w-4 text-wytnet-blue shrink-0 mt-0.5" />
                        <span className="whitespace-pre-line">{bankAccount.bank_address}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Form mode (Edit / Create)
              <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bank Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Bank Name *</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
                        <Landmark className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. Chase Bank, Barclays"
                        className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Account Holder Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Account Holder Name *</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        placeholder="e.g. Jane Doe"
                        className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Account Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Account Number *</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
                        <Hash className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="e.g. 1234567890"
                        className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Account Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Account Type</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <select
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all text-wytnet-dark focus:bg-white appearance-none cursor-pointer"
                      >
                        <option value="Checking">Checking</option>
                        <option value="Savings">Savings</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                        <ChevronRight className="h-4 w-4 transform rotate-90" />
                      </div>
                    </div>
                  </div>

                  {/* Routing Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Routing Number / SWIFT/IFSC Code</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
                        <Hash className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={routingNumber}
                        onChange={(e) => setRoutingNumber(e.target.value)}
                        placeholder="Routing transit number"
                        className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* SWIFT Code */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">SWIFT / BIC Code</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
                        <Globe className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={swiftCode}
                        onChange={(e) => setSwiftCode(e.target.value)}
                        placeholder="SWIFT code (international)"
                        className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* IFSC Code */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">IFSC Code</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
                        <Globe className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        placeholder="IFSC code (India)"
                        className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Bank Address */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500">Bank Address</label>
                    <div className="relative group">
                      <div className="absolute top-3 left-0 pl-3.5 flex items-start pointer-events-none text-slate-400 group-focus-within:text-wytnet-blue transition-colors">
                        <Building className="h-4 w-4" />
                      </div>
                      <textarea
                        value={bankAddress}
                        onChange={(e) => setBankAddress(e.target.value)}
                        placeholder="123 Bank St, New York, NY 10001"
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-wytnet-blue/40 text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-wytnet-dark focus:bg-white resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 mt-6">
                  {mode === 'edit' && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-3 border border-slate-100 text-slate-500 hover:bg-slate-50 transition-all text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 bg-wytnet-blue hover:bg-blue-600 disabled:bg-blue-400 transition-all text-xs font-bold text-white px-8 py-3 rounded-xl cursor-pointer shadow-md hover:shadow-lg focus:outline-none"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving details...</span>
                      </>
                    ) : (
                      <span>Save Banking Info</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

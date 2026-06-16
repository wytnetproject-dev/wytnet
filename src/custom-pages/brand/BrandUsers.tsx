import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Users,
  Mail,
  Calendar,
  CreditCard,
  UserCheck
} from 'lucide-react';

interface BrandUsersProps {
  portalType: 'wytsaas' | 'wytpass';
  brandId: number;
  isSandbox: boolean;
}

interface Subscriber {
  id: number;
  user_id: string;
  user_name: string;
  user_email: string;
  plan_id: number;
  plan_name: string;
  plan_price: number;
  billing_cycle: string;
  status: string;
  subscribed_at: string | null;
  external_user_id?: string | null;
  sync_status?: string | null;
  last_synced_at?: string | null;
}

export default function BrandUsers({ portalType, brandId, isSandbox }: BrandUsersProps) {
  const primaryColor = portalType === 'wytsaas' ? '#0066cc' : '#9333ea';

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = () => {
    return localStorage.getItem(portalType === 'wytsaas' ? 'wytsaas_token' : 'wytpass_token') || '';
  };

  useEffect(() => {
    const loadSubscribers = async () => {
      setIsLoading(true);
      setError(null);

      if (isSandbox) {
        // Load mock subscriber list
        const mockList: Subscriber[] = [
          {
            id: 101,
            user_id: "u-1a2b3c",
            user_name: "Alice Sharma",
            user_email: "alice@wytnet.com",
            plan_id: 1,
            plan_name: "Standard Plan",
            plan_price: 299.00,
            billing_cycle: "monthly",
            status: "active",
            subscribed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            external_user_id: "HC1001",
            sync_status: "synced"
          },
          {
            id: 102,
            user_id: "u-4d5e6f",
            user_name: "Rahul Verma",
            user_email: "rahul.v@gmail.com",
            plan_id: 2,
            plan_name: "Premium Plan",
            plan_price: 599.00,
            billing_cycle: "monthly",
            status: "active",
            subscribed_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            external_user_id: "HC1002",
            sync_status: "synced"
          },
          {
            id: 103,
            user_id: "u-7g8h9i",
            user_name: "Sanya Gupta",
            user_email: "sanya@outlook.com",
            plan_id: 1,
            plan_name: "Standard Plan",
            plan_price: 299.00,
            billing_cycle: "monthly",
            status: "active",
            subscribed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            external_user_id: "HC1003",
            sync_status: "synced"
          }
        ];

        // Check if current user is subscribed locally
        try {
          const userStr = localStorage.getItem('wytsaas_user') || localStorage.getItem('wytpass_user');
          if (userStr) {
            const currentUserObj = JSON.parse(userStr);
            const userEmail = currentUserObj.email || 'guest';
            const activeSubs = localStorage.getItem(`mock_user_subscriptions_${userEmail}`);
            if (activeSubs) {
              const parsedSubs = JSON.parse(activeSubs);
              const planId = parsedSubs[brandId];
              if (planId) {
                const storedPlans = localStorage.getItem('mock_subscription_plans');
                let matchedPlan = { name: "Subscribed Plan", price: 0 };
                if (storedPlans) {
                  const plans = JSON.parse(storedPlans);
                  const found = plans.find((p: any) => p.id === Number(planId));
                  if (found) {
                    matchedPlan = found;
                  }
                }
                
                mockList.unshift({
                  id: 999,
                  user_id: "u-current-user",
                  user_name: currentUserObj.name || currentUserObj.email.split('@')[0],
                  user_email: currentUserObj.email,
                  plan_id: Number(planId),
                  plan_name: matchedPlan.name,
                  plan_price: matchedPlan.price,
                  billing_cycle: "monthly",
                  status: "active",
                  subscribed_at: new Date().toISOString(),
                  external_user_id: "HC_DEV_999",
                  sync_status: "synced"
                });
              }
            }
          }
        } catch (err) {
          console.error("Failed to parse mock local storage subscriber info", err);
        }

        setSubscribers(mockList);
        setIsLoading(false);
        return;
      }

      // Fetch from API
      try {
        const token = getAuthToken();
        const response = await fetch(`http://localhost:8000/brands/${brandId}/subscribers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSubscribers(data.items || []);
        } else {
          throw new Error("Failed to load subscribers from API");
        }
      } catch (err: any) {
        console.warn("Subscribers API failed, falling back to mock sandbox list", err);
        // Fallback mock list on error
        const mockList: Subscriber[] = [
          {
            id: 101,
            user_id: "u-1a2b3c",
            user_name: "Alice Sharma",
            user_email: "alice@wytnet.com",
            plan_id: 1,
            plan_name: "Standard Plan",
            plan_price: 299.00,
            billing_cycle: "monthly",
            status: "active",
            subscribed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            external_user_id: "HC1001",
            sync_status: "synced"
          }
        ];
        setSubscribers(mockList);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscribers();
  }, [brandId, isSandbox]);

  if (isLoading) {
    return (
      <Box className="flex flex-col items-center justify-center py-20 gap-3">
        <CircularProgress size={36} sx={{ color: primaryColor }} />
        <Typography className="text-slate-400 text-xs font-semibold">Retrieving subscribers list...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: '16px', fontSize: '12.5px', fontWeight: 'bold' }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box className="space-y-6">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-slate-500" />
            <span>Subscribed Users</span>
          </h3>
          <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
            Manage and view customers currently subscribed to your app plans.
          </p>
        </div>
        <Chip
          label={`${subscribers.length} Subscribers`}
          size="small"
          sx={{
            bgcolor: `${primaryColor}10`,
            color: primaryColor,
            fontWeight: 'extrabold',
            fontSize: '11px',
            border: `1px solid ${primaryColor}30`
          }}
        />
      </div>

      {subscribers.length > 0 ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: '20px',
            border: '1px solid #f1f5f9',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.005)'
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">Subscriber</th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">Purchased Plan</th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">Status</th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">External ID</th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">Sync Status</th>
                  <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">Subscribed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors">
                    {/* User Profile */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs select-none shadow-inner border border-slate-200">
                          {sub.user_name ? sub.user_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5 leading-none">
                            <span>{sub.user_name || 'Verified Customer'}</span>
                          </p>
                          <span className="text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-300" />
                            <span>{sub.user_email}</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Subscribed Plan details */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#01875f] bg-[#01875f]/5 border border-[#01875f]/25 px-2 py-0.5 rounded-full uppercase tracking-wider leading-none">
                          <CreditCard className="h-2.5 w-2.5" />
                          <span>{sub.plan_name}</span>
                        </span>
                        <p className="text-[11px] font-bold text-slate-500 select-none pl-1">
                          ₹{sub.plan_price.toFixed(2)} / {sub.billing_cycle}
                        </p>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4">
                      <Chip
                        icon={<UserCheck className="h-3 w-3" style={{ color: '#059669' }} />}
                        label={sub.status.toUpperCase()}
                        size="small"
                        sx={{
                          borderColor: '#d1fae5',
                          bgcolor: '#ecfdf5',
                          color: '#047857',
                          fontWeight: 'black',
                          fontSize: '10px',
                          border: '1px solid'
                        }}
                      />
                    </td>

                    {/* External User ID */}
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                      {sub.external_user_id ? (
                        <span className="font-mono bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60 text-[11px]">
                          {sub.external_user_id}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Not synced</span>
                      )}
                    </td>

                    {/* Sync Status */}
                    <td className="px-6 py-4">
                      <Chip
                        label={(sub.sync_status || 'pending').toUpperCase()}
                        size="small"
                        sx={{
                          borderColor: sub.sync_status === 'synced' ? '#d1fae5' : sub.sync_status === 'failed' ? '#fee2e2' : '#fef3c7',
                          bgcolor: sub.sync_status === 'synced' ? '#ecfdf5' : sub.sync_status === 'failed' ? '#fef2f2' : '#fffbeb',
                          color: sub.sync_status === 'synced' ? '#047857' : sub.sync_status === 'failed' ? '#b91c1c' : '#b45309',
                          fontWeight: 'bold',
                          fontSize: '9px',
                          border: '1px solid',
                          '& .MuiChip-label': { px: 1.5 }
                        }}
                      />
                    </td>

                    {/* Subscribed Date */}
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {sub.subscribed_at
                            ? new Date(sub.subscribed_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : 'Recently'}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            borderRadius: '24px',
            border: '1px solid #f1f5f9',
            p: 8,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'col',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}
        >
          <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
            <Users className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <Typography sx={{ fontWeight: 'extrabold', color: '#334155', fontSize: '13.5px' }}>
              No Subscribers Yet
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '11px', mt: 0.5 }}>
              Once users subscribe to your app on the marketplace, their purchase details will appear here.
            </Typography>
          </div>
        </Paper>
      )}
    </Box>
  );
}

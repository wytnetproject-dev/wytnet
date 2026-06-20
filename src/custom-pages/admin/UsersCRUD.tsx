import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import {
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  Loader2,
  ShieldCheck,
  UserPlus,
  Users,
  Mail,
  ShieldAlert,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import type {
  UserProfile,
  UserCreateInput,
  UserUpdateInput
} from '@/api/wytsaas/user';
import {
  listAllUsers,
  createNewUser,
  modifyUser,
  removeUser
} from '@/api/wytsaas/user';

interface UsersCRUDProps {
  user?: { email: string; name: string; role: string } | null;
}

const DEFAULT_MOCK_USERS: UserProfile[] = [
  {
    id: "user-uuid-1",
    username: "admin_wyt",
    email: "admin@wytnet.com",
    full_name: "SaaS Administrator",
    role: "wytsaas_admin",
    is_active: true,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: null
  },
  {
    id: "user-uuid-2",
    username: "dev_sanjay",
    email: "developer@wytnet.com",
    full_name: "Sanjay Kumar",
    role: "developer",
    is_active: true,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: null
  },
  {
    id: "user-uuid-3",
    username: "jane_smith",
    email: "jane.smith@wytnet.com",
    full_name: "Jane Smith",
    role: "developer",
    is_active: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: null
  },
  {
    id: "user-uuid-4",
    username: "customer_rahul",
    email: "user@wytnet.com",
    full_name: "Rahul Sharma",
    role: "user",
    is_active: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: null
  },
  {
    id: "user-uuid-5",
    username: "blocked_tester",
    email: "inactive_user@wytnet.com",
    full_name: "Inactive Tester",
    role: "user",
    is_active: false,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: null
  }
];

export default function UsersCRUD({ user: _user }: UsersCRUDProps) {
  const primaryColor = '#3b82f6'; // Sleek WytSaaS Blue for Users admin
  const primaryHoverColor = '#2563eb';

  // State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSandbox, setIsSandbox] = useState(false);

  // View Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Selected user for editing/deleting
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Form Field State
  const [usernameField, setUsernameField] = useState('');
  const [emailField, setEmailField] = useState('');
  const [fullNameField, setFullNameField] = useState('');
  const [passwordField, setPasswordField] = useState('');
  const [roleField, setRoleField] = useState('user');
  const [isActiveField, setIsActiveField] = useState(true);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast alerts
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  const getAuthToken = () => {
    return localStorage.getItem('wytsaas_token') || '';
  };

  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const loadUsers = async () => {
    setIsLoading(true);
    const token = getAuthToken();
    try {
      const fetched = await listAllUsers(token);
      setUsers(fetched);
      setIsSandbox(false);
    } catch (err) {
      console.warn('FastAPI backend connection failed. Enabling mock fallback sandbox for Users.', err);
      const stored = localStorage.getItem('mock_users');
      const initial = stored ? JSON.parse(stored) : DEFAULT_MOCK_USERS;
      if (!stored) {
        localStorage.setItem('mock_users', JSON.stringify(initial));
      }
      setUsers(initial);
      setIsSandbox(true);
      showToast('FastAPI server offline. Switched to Mock Users Sandbox.', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter list when search/role updates
  useEffect(() => {
    let list = [...users];
    
    // Role filter
    if (roleFilter !== 'all') {
      list = list.filter((u) => u.role === roleFilter);
    }

    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.full_name && u.full_name.toLowerCase().includes(q))
      );
    }

    setFilteredUsers(list);
  }, [searchQuery, roleFilter, users]);

  // Open modals
  const handleOpenCreate = () => {
    setUsernameField('');
    setEmailField('');
    setFullNameField('');
    setPasswordField('');
    setRoleField('user');
    setIsActiveField(true);
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (userProfile: UserProfile) => {
    setSelectedUser(userProfile);
    setUsernameField(userProfile.username);
    setEmailField(userProfile.email);
    setFullNameField(userProfile.full_name || '');
    setPasswordField(''); // blank by default
    setRoleField(userProfile.role);
    setIsActiveField(userProfile.is_active);
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleOpenDelete = (userProfile: UserProfile) => {
    setSelectedUser(userProfile);
    setIsDeleteOpen(true);
  };

  // Actions
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!usernameField || !emailField || !passwordField) {
      setFormError('Username, Email, and Password are required fields.');
      return;
    }
    if (passwordField.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    const token = getAuthToken();

    const inputData: UserCreateInput = {
      username: usernameField,
      email: emailField,
      full_name: fullNameField || null,
      password: passwordField,
      role: roleField,
      is_active: isActiveField
    };

    if (isSandbox) {
      // Offline local storage operation
      setTimeout(() => {
        const stored = localStorage.getItem('mock_users');
        const list: UserProfile[] = stored ? JSON.parse(stored) : DEFAULT_MOCK_USERS;
        
        // Validation check
        if (list.some((u) => u.username.toLowerCase() === usernameField.toLowerCase())) {
          setFormError('Username already registered (Sandbox)');
          setIsSubmitting(false);
          return;
        }
        if (list.some((u) => u.email.toLowerCase() === emailField.toLowerCase())) {
          setFormError('Email already registered (Sandbox)');
          setIsSubmitting(false);
          return;
        }

        const newUser: UserProfile = {
          id: `user-uuid-${Math.floor(Math.random() * 10000)}`,
          username: usernameField,
          email: emailField,
          full_name: fullNameField || null,
          role: roleField,
          is_active: isActiveField,
          created_at: new Date().toISOString(),
          updated_at: null
        };

        const updatedList = [newUser, ...list];
        localStorage.setItem('mock_users', JSON.stringify(updatedList));
        setUsers(updatedList);
        setIsSubmitting(false);
        setIsCreateOpen(false);
        showToast('User created successfully (Sandbox)', 'success');
      }, 800);
    } else {
      // API call
      try {
        const created = await createNewUser(inputData, token);
        setUsers([created, ...users]);
        setIsCreateOpen(false);
        showToast('User created successfully', 'success');
      } catch (err: any) {
        setFormError(err.detail || err.message || 'Failed to create user');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedUser) return;
    if (!usernameField || !emailField) {
      setFormError('Username and Email are required fields.');
      return;
    }
    if (passwordField && passwordField.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    const token = getAuthToken();

    const inputData: UserUpdateInput = {
      username: usernameField,
      email: emailField,
      full_name: fullNameField || null,
      role: roleField,
      is_active: isActiveField
    };

    if (passwordField) {
      inputData.password = passwordField;
    }

    if (isSandbox) {
      setTimeout(() => {
        const stored = localStorage.getItem('mock_users');
        const list: UserProfile[] = stored ? JSON.parse(stored) : DEFAULT_MOCK_USERS;

        // Check validation
        if (list.some((u) => u.username.toLowerCase() === usernameField.toLowerCase() && u.id !== selectedUser.id)) {
          setFormError('Username already taken (Sandbox)');
          setIsSubmitting(false);
          return;
        }
        if (list.some((u) => u.email.toLowerCase() === emailField.toLowerCase() && u.id !== selectedUser.id)) {
          setFormError('Email already taken (Sandbox)');
          setIsSubmitting(false);
          return;
        }

        const updatedList = list.map((u) => {
          if (u.id === selectedUser.id) {
            return {
              ...u,
              username: usernameField,
              email: emailField,
              full_name: fullNameField || null,
              role: roleField,
              is_active: isActiveField,
              updated_at: new Date().toISOString()
            };
          }
          return u;
        });

        localStorage.setItem('mock_users', JSON.stringify(updatedList));
        setUsers(updatedList);
        setIsSubmitting(false);
        setIsEditOpen(false);
        showToast('User details updated successfully (Sandbox)', 'success');
      }, 800);
    } else {
      try {
        const updated = await modifyUser(selectedUser.id, inputData, token);
        setUsers(users.map((u) => (u.id === selectedUser.id ? updated : u)));
        setIsEditOpen(false);
        showToast('User details updated successfully', 'success');
      } catch (err: any) {
        setFormError(err.detail || err.message || 'Failed to update user');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    const token = getAuthToken();

    if (isSandbox) {
      setTimeout(() => {
        const stored = localStorage.getItem('mock_users');
        const list: UserProfile[] = stored ? JSON.parse(stored) : DEFAULT_MOCK_USERS;
        const updatedList = list.filter((u) => u.id !== selectedUser.id);
        localStorage.setItem('mock_users', JSON.stringify(updatedList));
        setUsers(updatedList);
        setIsSubmitting(false);
        setIsDeleteOpen(false);
        showToast('User deleted successfully (Sandbox)', 'success');
      }, 600);
    } else {
      try {
        await removeUser(selectedUser.id, token);
        setUsers(users.filter((u) => u.id !== selectedUser.id));
        setIsDeleteOpen(false);
        showToast('User deleted successfully', 'success');
      } catch (err: any) {
        showToast(err.detail || err.message || 'Failed to delete user', 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'wytsaas_admin':
        return (
          <Chip
            label="SAAS ADMIN"
            size="small"
            icon={<ShieldCheck className="h-3 w-3" style={{ color: '#ef4444' }} />}
            sx={{
              borderColor: '#fca5a5',
              bgcolor: '#fee2e2',
              color: '#ef4444',
              fontWeight: 'extrabold',
              fontSize: '10px',
              border: '1px solid'
            }}
          />
        );
      case 'developer':
        return (
          <Chip
            label="DEVELOPER"
            size="small"
            sx={{
              borderColor: '#93c5fd',
              bgcolor: '#dbeafe',
              color: '#3b82f6',
              fontWeight: 'extrabold',
              fontSize: '10px',
              border: '1px solid'
            }}
          />
        );
      default:
        return (
          <Chip
            label="USER"
            size="small"
            sx={{
              borderColor: '#cbd5e1',
              bgcolor: '#f1f5f9',
              color: '#64748b',
              fontWeight: 'extrabold',
              fontSize: '10px',
              border: '1px solid'
            }}
          />
        );
    }
  };

  const getStatusBadge = (active: boolean) => {
    return active ? (
      <Chip
        icon={<CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#059669' }} />}
        label="ACTIVE"
        size="small"
        sx={{
          borderColor: '#d1fae5',
          bgcolor: '#ecfdf5',
          color: '#047857',
          fontWeight: 'black',
          fontSize: '9.5px',
          border: '1px solid'
        }}
      />
    ) : (
      <Chip
        icon={<XCircle className="h-3.5 w-3.5" style={{ color: '#dc2626' }} />}
        label="INACTIVE"
        size="small"
        sx={{
          borderColor: '#fee2e2',
          bgcolor: '#fef2f2',
          color: '#b91c1c',
          fontWeight: 'black',
          fontSize: '9.5px',
          border: '1px solid'
        }}
      />
    );
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header Panel */}
      <Box
        sx={{
          py: 2.5,
          px: 4,
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'between',
          alignItems: 'center',
          flexShrink: 0,
          backgroundColor: '#ffffff'
        }}
      >
        <div className="flex justify-between items-center w-full">
          <div>
            <Typography variant="h6" className="text-slate-800 flex items-center gap-2" sx={{ fontWeight: 800 }}>
              <Users className="h-5 w-5 text-blue-500" />
              <span>User Accounts Management</span>
            </Typography>
            <Typography variant="caption" className="text-slate-400 font-semibold mt-0.5 block">
              Manage WytSaaS users, update access permissions, reset credentials and track roles.
            </Typography>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outlined"
              size="small"
              onClick={loadUsers}
              disabled={isLoading}
              startIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              sx={{
                borderRadius: '10px',
                borderColor: '#e2e8f0',
                color: '#64748b',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '11.5px',
                '&:hover': {
                  borderColor: '#cbd5e1',
                  bgcolor: '#f8fafc'
                }
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleOpenCreate}
              startIcon={<UserPlus className="h-3.5 w-3.5" />}
              sx={{
                borderRadius: '10px',
                bgcolor: primaryColor,
                '&:hover': { bgcolor: primaryHoverColor },
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '11.5px',
                boxShadow: 'none'
              }}
            >
              Add New User
            </Button>
          </div>
        </div>
      </Box>

      {/* Control panel and filters */}
      <Box sx={{ p: 3, flexShrink: 0, display: 'flex', gap: 2, alignItems: 'center', backgroundColor: '#f8fafc' }}>
        {/* Search */}
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search users by name, username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-400 text-xs font-semibold pl-9 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder-slate-400 text-slate-700 shadow-sm"
          />
        </div>

        {/* Role Filter */}
        <Box sx={{ minWidth: 150 }}>
          <FormControl size="small" fullWidth>
            <InputLabel id="role-filter-label" sx={{ fontSize: '11.5px', fontWeight: 700 }}>Filter by Role</InputLabel>
            <Select
              labelId="role-filter-label"
              id="role-filter"
              value={roleFilter}
              label="Filter by Role"
              onChange={(e) => setRoleFilter(e.target.value)}
              sx={{
                borderRadius: '11px',
                fontSize: '12px',
                fontWeight: 600,
                bgcolor: '#ffffff',
                '& .MuiSelect-select': { py: 1.2 }
              }}
            >
              <MenuItem value="all" sx={{ fontSize: '12px', fontWeight: 600 }}>All Roles</MenuItem>
              <MenuItem value="wytsaas_admin" sx={{ fontSize: '12px', fontWeight: 600 }}>SaaS Admin</MenuItem>
              <MenuItem value="developer" sx={{ fontSize: '12px', fontWeight: 600 }}>Developer</MenuItem>
              <MenuItem value="user" sx={{ fontSize: '12px', fontWeight: 600 }}>User</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {isSandbox && (
          <Chip
            label="Mock Sandbox Mode Active"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ fontWeight: 800, fontSize: '10px' }}
          />
        )}
      </Box>

      {/* Main content grid */}
      <Box sx={{ flexGrow: 1, px: 3, pb: 4, overflow: 'auto', backgroundColor: '#f8fafc' }}>
        {isLoading ? (
          <Box className="flex flex-col items-center justify-center py-24 gap-3">
            <CircularProgress size={36} sx={{ color: primaryColor }} />
            <Typography className="text-slate-400 text-xs font-bold">Fetching user accounts...</Typography>
          </Box>
        ) : filteredUsers.length > 0 ? (
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
                    <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">User Profile</th>
                    <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">Username</th>
                    <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">System Role</th>
                    <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">Account Status</th>
                    <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5">Joined Date</th>
                    <th className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-6 py-4.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                      {/* Name / Email */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs select-none shadow-sm">
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-none">
                              {u.full_name || 'No Full Name'}
                            </p>
                            <span className="text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                              <Mail className="h-3 w-3 text-slate-300" />
                              <span>{u.email}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="px-6 py-3.5 text-xs font-bold text-slate-600 font-mono">
                        @{u.username}
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-3.5">
                        {getRoleBadge(u.role)}
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-3.5">
                        {getStatusBadge(u.is_active)}
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-3.5 text-xs font-semibold text-slate-400">
                        {new Date(u.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => handleOpenEdit(u)}
                            sx={{
                              minWidth: 0,
                              p: 1,
                              borderRadius: '8px',
                              color: '#3b82f6',
                              '&:hover': { bgcolor: '#eff6ff' }
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="text"
                            size="small"
                            onClick={() => handleOpenDelete(u)}
                            sx={{
                              minWidth: 0,
                              p: 1,
                              borderRadius: '8px',
                              color: '#ef4444',
                              '&:hover': { bgcolor: '#fef2f2' }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
              flexDirection: 'column',
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
                No User Accounts Found
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '11.5px', mt: 0.5 }}>
                Try resetting filters or adjusting search query parameters.
              </Typography>
            </div>
          </Paper>
        )}
      </Box>

      {/* CREATE USER DIALOG */}
      <Dialog
        open={isCreateOpen}
        onClose={() => !isSubmitting && setIsCreateOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
      >
        <form onSubmit={handleCreateSubmit}>
          <DialogTitle sx={{ fontWeight: 800, fontSize: '15px', pb: 1, display: 'flex', items: 'center', gap: 1 }}>
            <UserPlus className="h-4.5 w-4.5 text-blue-500" />
            <span>Create New User Account</span>
          </DialogTitle>
          
          <DialogContent className="space-y-4 pt-2">
            {formError && (
              <Alert severity="error" sx={{ borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                {formError}
              </Alert>
            )}

            <TextField
              label="Username"
              size="small"
              fullWidth
              required
              placeholder="e.g. rohit_gupta"
              value={usernameField}
              onChange={(e) => setUsernameField(e.target.value)}
              slotProps={{
                inputLabel: { style: { fontSize: '12px', fontWeight: 700 } },
                htmlInput: { style: { fontSize: '12px', fontWeight: 500 } }
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <TextField
              label="Email Address"
              type="email"
              size="small"
              fullWidth
              required
              placeholder="e.g. rohit@wytnet.com"
              value={emailField}
              onChange={(e) => setEmailField(e.target.value)}
              slotProps={{
                inputLabel: { style: { fontSize: '12px', fontWeight: 700 } },
                htmlInput: { style: { fontSize: '12px', fontWeight: 500 } }
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <TextField
              label="Full Name"
              size="small"
              fullWidth
              placeholder="e.g. Rohit Gupta"
              value={fullNameField}
              onChange={(e) => setFullNameField(e.target.value)}
              slotProps={{
                inputLabel: { style: { fontSize: '12px', fontWeight: 700 } },
                htmlInput: { style: { fontSize: '12px', fontWeight: 500 } }
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <TextField
              label="Password (min 8 chars)"
              type="password"
              size="small"
              fullWidth
              required
              placeholder="••••••••"
              value={passwordField}
              onChange={(e) => setPasswordField(e.target.value)}
              slotProps={{
                inputLabel: { style: { fontSize: '12px', fontWeight: 700 } },
                htmlInput: { style: { fontSize: '12px', fontWeight: 500 } }
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <FormControl size="small" fullWidth>
              <InputLabel id="create-role-label" sx={{ fontSize: '12px', fontWeight: 700 }}>System Role</InputLabel>
              <Select
                labelId="create-role-label"
                value={roleField}
                label="System Role"
                onChange={(e) => setRoleField(e.target.value)}
                sx={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}
              >
                <MenuItem value="wytsaas_admin" sx={{ fontSize: '12px', fontWeight: 600 }}>SaaS Admin</MenuItem>
                <MenuItem value="developer" sx={{ fontSize: '12px', fontWeight: 600 }}>Developer</MenuItem>
                <MenuItem value="user" sx={{ fontSize: '12px', fontWeight: 600 }}>Standard User</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={isActiveField}
                  onChange={(e) => setIsActiveField(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                  Account Active / Enabled
                </Typography>
              }
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              size="small"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, color: '#64748b' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="small"
              variant="contained"
              disabled={isSubmitting}
              sx={{
                borderRadius: '10px',
                bgcolor: primaryColor,
                '&:hover': { bgcolor: primaryHoverColor },
                textTransform: 'none',
                fontWeight: 800,
                boxShadow: 'none'
              }}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* EDIT USER DIALOG */}
      <Dialog
        open={isEditOpen}
        onClose={() => !isSubmitting && setIsEditOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
      >
        <form onSubmit={handleEditSubmit}>
          <DialogTitle sx={{ fontWeight: 800, fontSize: '15px', pb: 1, display: 'flex', items: 'center', gap: 1 }}>
            <ShieldCheck className="h-4.5 w-4.5 text-blue-500" />
            <span>Update User Account</span>
          </DialogTitle>
          
          <DialogContent className="space-y-4 pt-2">
            {formError && (
              <Alert severity="error" sx={{ borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                {formError}
              </Alert>
            )}

            <TextField
              label="Username"
              size="small"
              fullWidth
              required
              value={usernameField}
              onChange={(e) => setUsernameField(e.target.value)}
              slotProps={{
                inputLabel: { style: { fontSize: '12px', fontWeight: 700 } },
                htmlInput: { style: { fontSize: '12px', fontWeight: 500 } }
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <TextField
              label="Email Address"
              type="email"
              size="small"
              fullWidth
              required
              value={emailField}
              onChange={(e) => setEmailField(e.target.value)}
              slotProps={{
                inputLabel: { style: { fontSize: '12px', fontWeight: 700 } },
                htmlInput: { style: { fontSize: '12px', fontWeight: 500 } }
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <TextField
              label="Full Name"
              size="small"
              fullWidth
              placeholder="e.g. Rohit Gupta"
              value={fullNameField}
              onChange={(e) => setFullNameField(e.target.value)}
              slotProps={{
                inputLabel: { style: { fontSize: '12px', fontWeight: 700 } },
                htmlInput: { style: { fontSize: '12px', fontWeight: 500 } }
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <TextField
              label="Reset Password"
              type="password"
              size="small"
              fullWidth
              placeholder="Leave blank to keep current"
              value={passwordField}
              onChange={(e) => setPasswordField(e.target.value)}
              slotProps={{
                inputLabel: { style: { fontSize: '12px', fontWeight: 700 } },
                htmlInput: { style: { fontSize: '12px', fontWeight: 500 } }
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <FormControl size="small" fullWidth>
              <InputLabel id="edit-role-label" sx={{ fontSize: '12px', fontWeight: 700 }}>System Role</InputLabel>
              <Select
                labelId="edit-role-label"
                value={roleField}
                label="System Role"
                onChange={(e) => setRoleField(e.target.value)}
                sx={{ borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}
              >
                <MenuItem value="wytsaas_admin" sx={{ fontSize: '12px', fontWeight: 600 }}>SaaS Admin</MenuItem>
                <MenuItem value="developer" sx={{ fontSize: '12px', fontWeight: 600 }}>Developer</MenuItem>
                <MenuItem value="user" sx={{ fontSize: '12px', fontWeight: 600 }}>Standard User</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={isActiveField}
                  onChange={(e) => setIsActiveField(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                  Account Active / Enabled
                </Typography>
              }
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              size="small"
              onClick={() => setIsEditOpen(false)}
              disabled={isSubmitting}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, color: '#64748b' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="small"
              variant="contained"
              disabled={isSubmitting}
              sx={{
                borderRadius: '10px',
                bgcolor: primaryColor,
                '&:hover': { bgcolor: primaryHoverColor },
                textTransform: 'none',
                fontWeight: 800,
                boxShadow: 'none'
              }}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog
        open={isDeleteOpen}
        onClose={() => !isSubmitting && setIsDeleteOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: '24px', p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '14.5px', pb: 1, display: 'flex', items: 'center', gap: 1 }}>
          <ShieldAlert className="h-5 w-5 text-red-500" />
          <span>Confirm User Deletion</span>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#475569', fontSize: '12px', fontWeight: 500, lineHeight: 1.6 }}>
            Are you sure you want to delete user account <strong>{selectedUser?.username}</strong> ({selectedUser?.email})?
            <br />
            This action is permanent and cannot be undone. Any associated logins and sandbox profile settings will be removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setIsDeleteOpen(false)}
            disabled={isSubmitting}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, color: '#64748b' }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={handleDeleteSubmit}
            disabled={isSubmitting}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 800,
              boxShadow: 'none'
            }}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Alert */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity={toastSeverity}
          variant="filled"
          sx={{ borderRadius: '16px', fontWeight: 700, fontSize: '12px' }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { Mail, Lock, ShieldCheck, Eye, EyeOff, Globe, ChevronDown, Smartphone, Fingerprint } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, email: string, name: string, role: string) => void;
  isEmbedded?: boolean;
}

export default function LoginModalPass({ isOpen, onLoginSuccess, isEmbedded = false }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Registration states
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'developer' | 'user'>('developer');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Carousel slider state
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: 'Secure access to your digital world',
      description: 'WytPass keeps your data safe with enterprise-grade security',
      icon: <Lock className="h-10 w-10 text-purple-400" style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.7))' }} />
    },
    {
      title: 'MFA & Passwordless Identity',
      description: 'Protect your logins with hardware keys, biometrics, and push alerts',
      icon: <Smartphone className="h-10 w-10 text-purple-400" style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.7))' }} />
    },
    {
      title: 'SSO & Identity Federation',
      description: 'One secure account to sign in to all your organization\'s apps',
      icon: <Fingerprint className="h-10 w-10 text-purple-400" style={{ filter: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.7))' }} />
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen && !isEmbedded) return null;

  const backendUrl = 'http://localhost:8001/auth/login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);

    if (!email || !password || (mode === 'register' && !username)) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);

    if (mode === 'login') {
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
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.detail || 'Invalid email or password.');
        }
      } catch (err) {
        console.warn('WytPass backend connection failed, falling back to mock authentication', err);
        setStatusMessage('WytPass backend (port 8001) offline. Logging in via mock fallback...');

        const mockRole = (email.toLowerCase().includes('dev') || email.toLowerCase().includes('admin') || email.toLowerCase().includes('jane.smith') || email.toLowerCase().includes('jane')) ? 'developer' : 'user';

        setTimeout(() => {
          onLoginSuccess('mock-jwt-token-wytpass', email, 'WytPass User', mockRole);
          setIsLoading(false);
        }, 1200);
        return;
      }
    } else {
      // Mock registration fallback
      setStatusMessage('Creating your WytPass account (mock sandbox)...');
      setTimeout(() => {
        onLoginSuccess('mock-jwt-token-wytpass', email, fullName || username || email.split('@')[0], role);
        setIsLoading(false);
      }, 1500);
    }

    setIsLoading(false);
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        bgcolor: '#ffffff',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      
      {/* LEFT SIDE: Deep Purple-Blue Graphics Section */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: { md: '42%', lg: '38%', xl: '35%' },
          background: 'linear-gradient(to bottom, #150a21, #210c38, #0c0514)',
          p: 6,
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Glow ambient background rings */}
        <Box sx={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', bg: 'rgba(147, 51, 234, 0.1)', filter: 'blur(80px)', top: -80, left: -80 }} />
        <Box sx={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', bg: 'rgba(217, 70, 239, 0.1)', filter: 'blur(80px)', bottom: -40, right: -40 }} />

        {/* Brand/Logo Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative', zIndex: 10 }}>
          <Box
            sx={{
              display: 'flex',
              height: 40,
              width: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              bgcolor: 'rgba(147, 51, 234, 0.1)',
              border: '1px solid rgba(147, 51, 234, 0.2)',
              color: '#a855f7',
            }}
          >
            <ShieldCheck className="h-6 w-6" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', letterSpacing: '-0.025em' }}>
            WytPass
          </Typography>
        </Box>

        {/* Floating Glow Shield Centerpiece */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, py: 4, position: 'relative', zIndex: 10 }}>
          {/* Glowing field base stand */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 64,
              width: 208,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'rgba(15, 5, 25, 0.5)',
              border: '1px solid rgba(147, 51, 234, 0.15)',
              boxShadow: '0 4px 30px rgba(147, 51, 234, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              className="animate-pulse"
              sx={{
                width: 160,
                height: 24,
                borderRadius: '50%',
                bgcolor: 'rgba(147, 51, 234, 0.2)',
                filter: 'blur(4px)',
              }}
            />
          </Box>

          {/* Floating shield */}
          <Box
            sx={{
              position: 'relative',
              width: 160,
              height: 192,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '32px',
              background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.5s',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          >
            {/* Glossy top shine */}
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 24, background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0))', borderTopLeftRadius: '32px', borderTopRightRadius: '32px' }} />
            
            {/* Center Icon container */}
            <Box
              sx={{
                height: 88,
                width: 88,
                borderRadius: '50%',
                bgcolor: 'rgba(147, 51, 234, 0.1)',
                border: '1px solid rgba(147, 51, 234, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)',
                transition: 'all 0.4s ease',
              }}
            >
              {slides[activeSlide].icon}
            </Box>
          </Box>
        </Box>

        {/* Subtext and Indicators */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, position: 'relative', zIndex: 10 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minHeight: 90 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffffff', letterSpacing: '-0.025em', transition: 'all 0.3s' }}>
              {slides[activeSlide].title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#cbd5e1', lineHeight: 1.6, transition: 'all 0.3s' }}>
              {slides[activeSlide].description}
            </Typography>
          </Box>
          {/* Pager Indicator Dots */}
          <Box sx={{ display: 'flex', gap: 1.25 }}>
            {slides.map((_, idx) => (
              <Box
                key={idx}
                onClick={() => setActiveSlide(idx)}
                sx={{
                  height: 8,
                  width: activeSlide === idx ? 24 : 8,
                  borderRadius: activeSlide === idx ? '4px' : '50%',
                  bgcolor: activeSlide === idx ? '#9333ea' : 'rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: activeSlide === idx ? '#9333ea' : 'rgba(255,255,255,0.4)',
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* RIGHT SIDE: Clean White Form Section */}
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: '#ffffff',
          p: { xs: 2, sm: 3, md: 3, lg: 4 },
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflowY: 'auto',
        }}
      >


        {/* Form contents */}
        <Box sx={{ mx: 'auto', my: 'auto', py: 0.5, width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.025em', fontSize: '1.4rem' }}>
              {mode === 'login' ? 'Welcome back' : 'Create WytPass Account'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              {mode === 'login' ? 'Sign in to your WytPass account' : 'Join the secure identity network'}
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: '10px', py: 0.5, fontSize: '0.75rem' }}>
                {error}
              </Alert>
            )}

            {statusMessage && !error && (
              <Alert
                severity="info"
                icon={<CircularProgress size={12} color="inherit" />}
                sx={{ borderRadius: '10px', py: 0.5, fontSize: '0.75rem' }}
              >
                {statusMessage}
              </Alert>
            )}

            {mode === 'register' && (
              <>
                {/* Full name input */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '9px' }}>
                    Full name
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&.Mui-focused fieldset': {
                          borderColor: '#9333ea',
                        }
                      }
                    }}
                  />
                </Box>
                {/* Username input */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '9px' }}>
                    Username *
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    size="small"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        '&.Mui-focused fieldset': {
                          borderColor: '#9333ea',
                        }
                      }
                    }}
                  />
                </Box>
                {/* Join role selector */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '9px' }}>
                    I am joining as a
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, p: 0.5, bgcolor: '#f1f5f9', borderRadius: '10px' }}>
                    <Button
                      fullWidth
                      size="small"
                      onClick={() => setRole('developer')}
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        py: 0.75,
                        borderRadius: '8px',
                        bgcolor: role === 'developer' ? '#ffffff' : 'transparent',
                        color: role === 'developer' ? '#9333ea' : '#64748b',
                        boxShadow: role === 'developer' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                        '&:hover': { bgcolor: role === 'developer' ? '#ffffff' : 'rgba(0,0,0,0.02)' }
                      }}
                    >
                      Developer
                    </Button>
                    <Button
                      fullWidth
                      size="small"
                      onClick={() => setRole('user')}
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        py: 0.75,
                        borderRadius: '8px',
                        bgcolor: role === 'user' ? '#ffffff' : 'transparent',
                        color: role === 'user' ? '#9333ea' : '#64748b',
                        boxShadow: role === 'user' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                        '&:hover': { bgcolor: role === 'user' ? '#ffffff' : 'rgba(0,0,0,0.02)' }
                      }}
                    >
                      Customer / User
                    </Button>
                  </Box>
                </Box>
              </>
            )}

            {/* Email Address */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '9px' }}>
                Email address
              </Typography>
              <TextField
                fullWidth
                required
                size="small"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </InputAdornment>
                    ),
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    '&.Mui-focused fieldset': {
                      borderColor: '#9333ea',
                    }
                  }
                }}
              />
            </Box>

            {/* Password */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '9px' }}>
                Password
              </Typography>
              <TextField
                fullWidth
                required
                size="small"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} size="small" edge="end">
                          {showPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    '&.Mui-focused fieldset': {
                      borderColor: '#9333ea',
                    }
                  }
                }}
              />
            </Box>

            {/* Options */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    size="small"
                    sx={{
                      color: '#cbd5e1',
                      p: 0.5,
                      '&.Mui-checked': {
                        color: '#9333ea',
                      }
                    }}
                  />
                }
                label={
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', userSelect: 'none', fontSize: '0.75rem' }}>
                    Remember me
                  </Typography>
                }
              />
              <Link
                href="#forgot"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#9333ea',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Forgot password?
              </Link>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              variant="contained"
              fullWidth
              sx={{
                bgcolor: '#9333ea',
                '&:hover': { bgcolor: '#7e22ce' },
                color: '#ffffff',
                py: 0.9,
                borderRadius: '10px',
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 2px 4px rgba(147, 51, 234, 0.15)',
                mt: 0.25,
              }}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={14} color="inherit" />
                  <span>{mode === 'login' ? 'Signing in...' : 'Registering...'}</span>
                </Box>
              ) : (
                <span>{mode === 'login' ? 'Sign in' : 'Sign up'}</span>
              )}
            </Button>
          </Box>



          {/* Toggle modes */}
          <Box sx={{ textAlignment: 'center', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <Link
                component="button"
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError(null);
                  setStatusMessage(null);
                }}
                sx={{
                  color: '#9333ea',
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: '0.75rem',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </Link>
            </Typography>
          </Box>



        </Box>

      </Box>

    </Box>
  );
}

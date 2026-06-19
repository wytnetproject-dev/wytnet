import { useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LandingPage from '@/pages/LandingPage';
import MarketplacePage from '@/pages/MarketplacePage';
import PortalPage from '@/pages/PortalPage';

// Create premium light mode MUI Theme matching branding typography and tokens
const theme = createTheme({
  palette: {
    primary: {
      main: '#0066cc',
      light: '#0a84ff',
    },
    background: {
      default: '#fafbfe',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Segoe UI", sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
        },
      },
    },
  },
});

function App() {
  const [view, setView] = useState<'landing' | 'portal' | 'wytpass'>('landing');
  const [currentHash, setCurrentHash] = useState('');

  // Unified native hash-routing handler
  useEffect(() => {
    const checkHash = () => {
      setCurrentHash(window.location.hash);
      if (window.location.hash === '#portal') {
        setView('portal');
      } else if (window.location.hash === '#wytpass') {
        setView('wytpass');
      } else {
        setView('landing');
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {view === 'portal' ? (
        <PortalPage product="wytsaas" />
      ) : view === 'wytpass' ? (
        <PortalPage product="wytpass" />
      ) : currentHash.startsWith('#marketplace') ? (
        <MarketplacePage currentHash={currentHash} />
      ) : (
        <LandingPage />
      )}
    </ThemeProvider>
  );
}

export default App;

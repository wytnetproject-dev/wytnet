import { useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './components/Header';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Ecosystem from './components/Ecosystem';
import Orchestration from './components/Orchestration';
import CTA from './components/CTA';
import Footer from './components/Footer';
import PortalLayout from './portal/PortalLayout';

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
  const [view, setView] = useState<'landing' | 'portal'>('landing');

  // Unified native hash-routing handler
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#portal') {
        setView('portal');
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
        <PortalLayout />
      ) : (
        <div className="flex flex-col min-h-screen bg-[#fafbfe]/30 selection:bg-wytnet-blue/10 selection:text-wytnet-blue">
          <Header />
          <main className="flex-grow">
            <Hero />
            <Stats />
            <Ecosystem />
            <Orchestration />
            <CTA />
          </main>
          <Footer />
        </div>
      )}
    </ThemeProvider>
  );
}

export default App;

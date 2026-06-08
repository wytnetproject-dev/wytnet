/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wytnet: {
          blue: '#0066cc',
          'blue-light': '#0a84ff',
          'blue-glow': 'rgba(0, 102, 204, 0.06)',
          'purple-glow': 'rgba(168, 85, 247, 0.05)',
          dark: '#0b2447',
          body: '#2c3e50',
          bg: '#f8fafd',
          border: 'rgba(0, 102, 204, 0.08)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 6s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'flow': 'flow 3s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1) translate(0px, 0px)', opacity: 0.4 },
          '33%': { transform: 'scale(1.1) translate(30px, -50px)', opacity: 0.6 },
          '66%': { transform: 'scale(0.9) translate(-20px, 20px)', opacity: 0.5 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        flow: {
          '0%': { strokeDashoffset: '20' },
          '100%': { strokeDashoffset: '0' }
        }
      }
    },
  },
  plugins: [],
}

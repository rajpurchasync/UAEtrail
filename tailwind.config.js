/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '400px'
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ]
      },
      /* One step lighter than Tailwind defaults for a softer UI */
      fontWeight: {
        semibold: '500',
        bold: '600',
        extrabold: '700',
        black: '800'
      },
      colors: {
        ios: {
          bg: '#EEF6F3',
          grouped: '#FFFFFF',
          separator: 'rgba(60, 60, 67, 0.12)',
          label: '#000000',
          secondary: 'rgba(60, 60, 67, 0.6)',
          tint: '#059669'
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b'
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f'
        }
      },
      boxShadow: {
        ios: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        'ios-sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
        glass: '0 8px 32px rgba(16, 185, 129, 0.08), 0 2px 12px rgba(0, 0, 0, 0.04)',
        'glass-lg': '0 16px 48px rgba(16, 185, 129, 0.12), 0 4px 16px rgba(0, 0, 0, 0.06)',
        'glass-nav': '0 -4px 24px rgba(0, 0, 0, 0.06), 0 8px 32px rgba(16, 185, 129, 0.08)'
      },
      borderRadius: {
        ios: '12px',
        'ios-lg': '16px',
        glass: '22px'
      },
      animation: {
        'fade-up': 'fadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fadeIn 0.35s ease-out both',
        float: 'float 6s ease-in-out infinite'
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' }
        }
      }
    }
  },
  plugins: []
};

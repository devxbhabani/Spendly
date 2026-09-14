/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          bg: '#F4F5F8',
          card: '#FFFFFF',
          dark: '#12141A',
          charcoal: '#1E222B',
          muted: '#8A92A6',
          border: '#E8ECF2',
          lime: '#BEF264',
          limeHover: '#A3E635',
          limeDark: '#1E3A0F',
          orange: '#FF7A45',
          purple: '#8B5CF6',
          blue: '#3B82F6',
          coral: '#FF6B6B',
        }
      },
      boxShadow: {
        'soft': '0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 4px 12px -2px rgba(0, 0, 0, 0.02)',
        'card': '0 2px 14px rgba(0, 0, 0, 0.04)',
        'elevated': '0 20px 40px -15px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      }
    },
  },
  plugins: [],
}

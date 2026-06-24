/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F0B90B',
        'primary-hover': '#D4A309',
        'bg-dark': '#0B0E11',
        'bg-card': '#1E2329',
        'bg-hover': '#2B3139',
        'bg-input': '#2B3139',
        'border-color': '#2B3139',
        'text-primary': '#EAECEF',
        'text-secondary': '#848E9C',
        'text-muted': '#5E6673',
        'green': '#0ECB81',
        'red': '#F6465D',
        'green-bg': 'rgba(14, 203, 129, 0.1)',
        'red-bg': 'rgba(246, 70, 93, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

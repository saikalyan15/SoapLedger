/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:            '#F9F6F0',
        surface:       '#FFFFFF',
        primary:       '#1B4332',
        'primary-light': '#D8F3DC',
        accent:        '#D4A017',
        'accent-light': '#FEF3C7',
        muted:         '#6B7280',
        border:       '#E5E7EB',
        danger:       '#DC2626',
      },
      fontFamily: {
        serif:  ['DM Serif Display', 'serif'],
        sans:   ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.10)',
      },
      borderRadius: {
        card: '12px',
      }
    },
  },
  plugins: [],
}

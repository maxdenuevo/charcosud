/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B0000', // Wine red
          light: '#A52A2A',
          dark: '#5C0000',
        },
        secondary: {
          DEFAULT: '#D4AF37', // Mustard/gold
          light: '#F4CF57',
          dark: '#B48F17',
        },
        alert: '#DC2626', // Bright red for low stock
        success: '#10B981', // Soft green
      },
    },
  },
  plugins: [],
}

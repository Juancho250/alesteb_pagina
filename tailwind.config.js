/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "rgb(var(--brand-rgb, 0 0 0) / <alpha-value>)",
      },
    },
  },
  plugins: [],
}

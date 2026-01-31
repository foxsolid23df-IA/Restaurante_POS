/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#064e3b", // Deep Emerald
        accent: "#10b981", // Bright Emerald
        "background-light": "#fdfdfd",
        "background-dark": "#0f172a",
        charcoal: "#1e293b",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
    },
  },
  plugins: [],
}

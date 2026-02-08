/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0f172a", // Midnight Navy
        secondary: "#2563eb", // Electric Blue
        accent: "#06b6d4", // Cyan
        success: "#10b981", // Emerald
        warning: "#f59e0b", // Amber
        charcoal: "#1e293b",
        surface: "#ffffff",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
      borderRadius: {
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}

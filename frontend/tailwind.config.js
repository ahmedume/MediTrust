/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "3.75rem",
      "7xl": "4.5rem",
      "8xl": "6rem",
    },
    extend: {
      colors: {
        navy: {
          950: "#0a0e1a",
          900: "#0f1629",
          800: "#151d33",
        },
        accent: {
          DEFAULT: "#3b82f6",
          soft: "#60a5fa",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      backdropBlur: {
        glass: "16px",
      },
    },
  },
  plugins: [],
};

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        eagle: {
          blue: "#007BFE",
          "blue-dark": "#05379E",
          "blue-navy": "#021B4F",
          "blue-tint": "#EBF4FF",
          red: "#FC0201",
        },
        bumblebee: {
          yellow: "#FEC201",
          gold: "#D89A23",
          light: "#FFF9E6",
        },
        forest: {
          light: "#4CAF50",
          DEFAULT: "#2E7D32",
          dark: "#1B5E20",
          tint: "#E8F5E9",
        },
        canvas: {
          dark: "#080C16",
          slate: "#0D1322",
          card: "#121A2F",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "-apple-system", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
        glass: "16px",
        deep: "24px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-sm": "0 4px 16px 0 rgba(0, 0, 0, 0.25)",
        "glass-inner": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)",
        "glow-blue": "0 0 25px -5px rgba(0, 123, 254, 0.4)",
        "glow-yellow": "0 0 25px -5px rgba(254, 194, 1, 0.4)",
        "glow-green": "0 0 25px -5px rgba(76, 175, 80, 0.4)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "liquid-shimmer": "shimmer 3s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

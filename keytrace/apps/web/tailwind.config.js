/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#07090e",
        surface: {
          DEFAULT: "#0d121f",
          elevated: "#121829",
          subtle: "#0a0e17",
          card: "rgba(13, 18, 31, 0.75)",
          hover: "#172036",
        },
        border: {
          DEFAULT: "#1e283d",
          subtle: "#151c2c",
          bright: "#2d3c5c",
          glow: "rgba(6, 182, 212, 0.4)",
        },
        accent: {
          DEFAULT: "#f59e0b",
          hover: "#d97706",
          light: "#fbbf24",
          muted: "rgba(245, 158, 11, 0.14)",
          glow: "rgba(245, 158, 11, 0.35)",
        },
        cyan: {
          DEFAULT: "#06b6d4",
          hover: "#0891b2",
          light: "#38bdf8",
          muted: "rgba(6, 182, 212, 0.14)",
          glow: "rgba(6, 182, 212, 0.35)",
        },
        primary: {
          DEFAULT: "#f59e0b",
          foreground: "#090d16",
        },
        foreground: {
          DEFAULT: "#f8fafc",
          muted: "#cbd5e1",
          subtle: "#94a3b8",
        },
        match: "#10b981",
        review: "#f59e0b",
        alert: "#f43f5e",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },
      boxShadow: {
        "glow-accent": "0 0 25px -4px rgba(245, 158, 11, 0.4)",
        "glow-cyan": "0 0 25px -4px rgba(6, 182, 212, 0.4)",
        "glow-match": "0 0 25px -4px rgba(16, 185, 129, 0.4)",
        "glow-review": "0 0 25px -4px rgba(245, 158, 11, 0.4)",
        "glow-alert": "0 0 25px -4px rgba(244, 63, 94, 0.4)",
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.02)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "pulse-slow": "pulseGlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scanline": "scanline 8s linear infinite",
        "shimmer": "shimmer 2s infinite",
      },
    },
  },
  plugins: [],
};

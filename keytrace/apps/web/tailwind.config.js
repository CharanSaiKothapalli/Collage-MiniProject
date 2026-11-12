/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Approved KEYTRACE Phase 2 Palette
        background: {
          DEFAULT: "#0B1220",
          main: "#0B1220",
          secondary: "#111B2E",
        },
        surface: {
          DEFAULT: "#111B2E",
          elevated: "#1A2A44",
          subtle: "#0B1220",
          card: "#111B2E",
          hover: "#223656",
        },
        card: {
          DEFAULT: "#111B2E",
          elevated: "#1A2A44",
        },
        border: {
          DEFAULT: "#263B5E",
          subtle: "#1B2B46",
          focus: "#FF6A00",
          bright: "#354E7A",
          glow: "rgba(255, 106, 0, 0.25)",
        },
        accent: {
          DEFAULT: "#FF6A00",
          hover: "#E55F00",
          light: "#FF8533",
          muted: "rgba(255, 106, 0, 0.12)",
          glow: "rgba(255, 106, 0, 0.25)",
        },
        orange: {
          DEFAULT: "#FF6A00",
          hover: "#E55F00",
          light: "#FF8533",
          muted: "rgba(255, 106, 0, 0.12)",
          glow: "rgba(255, 106, 0, 0.25)",
        },
        blue: {
          DEFAULT: "#38BDF8",
          hover: "#0EA5E9",
          light: "#7DD3FC",
          muted: "rgba(56, 189, 248, 0.12)",
          glow: "rgba(56, 189, 248, 0.25)",
        },
        success: {
          DEFAULT: "#22C55E",
          hover: "#16A34A",
          muted: "rgba(34, 197, 94, 0.12)",
        },
        match: {
          DEFAULT: "#22C55E",
          muted: "rgba(34, 197, 94, 0.12)",
        },
        warning: {
          DEFAULT: "#F59E0B",
          hover: "#D97706",
          muted: "rgba(245, 158, 11, 0.12)",
        },
        review: {
          DEFAULT: "#F59E0B",
          muted: "rgba(245, 158, 11, 0.12)",
        },
        danger: {
          DEFAULT: "#EF4444",
          hover: "#DC2626",
          muted: "rgba(239, 68, 68, 0.12)",
        },
        alert: {
          DEFAULT: "#EF4444",
          muted: "rgba(239, 68, 68, 0.12)",
        },
        info: {
          DEFAULT: "#38BDF8",
          muted: "rgba(56, 189, 248, 0.12)",
        },
        foreground: {
          DEFAULT: "#F8FAFC",
          secondary: "#94A3B8",
          muted: "#64748B",
        },
        primary: {
          DEFAULT: "#F8FAFC",
          foreground: "#0B1220",
        },
      },
      fontFamily: {
        heading: ["Space Grotesk", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "IBM Plex Mono", "Fira Code", "Courier New", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "14px",
        "2xl": "18px",
        full: "9999px",
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.03)",
        elevated: "0 12px 36px -4px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
        "glow-orange": "0 0 20px -4px rgba(255, 106, 0, 0.3)",
        "glow-blue": "0 0 20px -4px rgba(56, 189, 248, 0.3)",
      },
      keyframes: {
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "pulse-subtle": "pulseSubtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Obsidian Pulse Design System
        background: {
          DEFAULT: "#080B12",
          secondary: "#0D1320",
        },
        surface: {
          DEFAULT: "#111927",
          elevated: "#172235",
          subtle: "#0D1320",
          card: "#111927",
          hover: "#172235",
        },
        border: {
          DEFAULT: "#243247",
          subtle: "#172235",
          bright: "#344560",
          glow: "rgba(53, 214, 232, 0.25)",
        },
        accent: {
          DEFAULT: "#35D6E8",
          hover: "#21BCD0",
          light: "#6DE3F2",
          muted: "rgba(53, 214, 232, 0.12)",
          glow: "rgba(53, 214, 232, 0.25)",
        },
        cyan: {
          DEFAULT: "#35D6E8",
          hover: "#21BCD0",
          light: "#6DE3F2",
          muted: "rgba(53, 214, 232, 0.12)",
        },
        violet: {
          DEFAULT: "#8B7CFF",
          hover: "#7261EB",
          light: "#A59AFF",
          muted: "rgba(139, 124, 255, 0.12)",
        },
        match: {
          DEFAULT: "#32D6A0",
          muted: "rgba(50, 214, 160, 0.12)",
        },
        success: {
          DEFAULT: "#32D6A0",
          muted: "rgba(50, 214, 160, 0.12)",
        },
        review: {
          DEFAULT: "#FFBF55",
          muted: "rgba(255, 191, 85, 0.12)",
        },
        warning: {
          DEFAULT: "#FFBF55",
          muted: "rgba(255, 191, 85, 0.12)",
        },
        alert: {
          DEFAULT: "#FF647C",
          muted: "rgba(255, 100, 124, 0.12)",
        },
        danger: {
          DEFAULT: "#FF647C",
          muted: "rgba(255, 100, 124, 0.12)",
        },
        foreground: {
          DEFAULT: "#F4F7FC",
          muted: "#94A3B8",
          subtle: "#64748B",
        },
        primary: {
          DEFAULT: "#F4F7FC",
          foreground: "#080B12",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.04)",
        elevated: "0 12px 36px -4px rgba(0, 0, 0, 0.65), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)",
        glow: "0 0 24px -4px rgba(53, 214, 232, 0.2)",
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

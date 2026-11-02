import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL || "http://127.0.0.1:5000",
        changeOrigin: true,
      },
      "/health": {
        target: process.env.VITE_API_BASE_URL || "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
          ui: ["lucide-react", "framer-motion"],
        },
      },
    },
  },
  preview: {
    port: 5174,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});

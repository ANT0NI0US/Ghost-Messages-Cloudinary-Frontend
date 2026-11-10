import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // the backend's FRONTEND_URL (development) is http://localhost:3000, so reset links open here
      port: 3000,
      strictPort: true,
      proxy: {
        // in development the app calls /api/... and Vite forwards it to the backend
        "/api": {
          target: env.DEV_BACKEND_URL || "http://localhost:4000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          // the backend rate limiter only allows Egyptian IPs and localhost has no country,
          // so the proxy presents an Egyptian IP (the backend has trust proxy enabled)
          headers: { "x-forwarded-for": env.DEV_FORWARDED_IP || "41.33.0.1" },
        },
      },
    },
  };
});

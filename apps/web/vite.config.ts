/**
 * Configuración de Vite+ para el frontend.
 *
 * - `lazyPlugins`: React + Tailwind 4 (plugin de Vite, sin `tailwind.config`).
 * - Alias `@` → `apps/web/src` (TS 7 ya no usa `baseUrl`).
 * - El servidor escucha en 0.0.0.0:5173 y reenvía `/api` a la API Hono
 *   (`API_PROXY_TARGET` en Compose es `http://api:3000`).
 */
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig({
  plugins: lazyPlugins(() => [react(), tailwindcss()]),
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET ?? "http://localhost:3000",
        changeOrigin: true,
        timeout: 0,
        proxyTimeout: 0,
        configure: (proxy) => {
          proxy.on("proxyRes", (proxyRes) => {
            const contentType = String(proxyRes.headers["content-type"] ?? "");
            if (contentType.includes("text/event-stream")) {
              proxyRes.headers["cache-control"] = "no-cache, no-transform";
              proxyRes.headers["x-accel-buffering"] = "no";
            }
          });
        },
      },
    },
  },
});

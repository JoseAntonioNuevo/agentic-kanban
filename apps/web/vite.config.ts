/**
 * Configuración de Vite+ para el frontend.
 *
 * - `lazyPlugins`: React + Tailwind 4 (plugin de Vite, sin `tailwind.config`).
 * - Alias `@` → `apps/web/src` (TS 7 ya no usa `baseUrl`).
 * - Vigila `packages/` entero (cambios de schemas en caliente dentro de Docker).
 * - El servidor escucha en 0.0.0.0:5173 y reenvía `/api` a la API Hono
 *   (`API_PROXY_TARGET` en Compose es `http://api:3000`).
 */
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, lazyPlugins } from "vite-plus";

// `packages/` queda fuera del root (`apps/web`): Vite vigila esos ficheros uno a
// uno y, en el bind-mount de Docker, pierde el cambio cuando un editor o git
// reemplaza el fichero (inode nuevo). Vigilar el directorio entero lo evita.
const packagesDir = fileURLToPath(new URL("../../packages", import.meta.url));

export default defineConfig({
  plugins: lazyPlugins(() => [
    react(),
    tailwindcss(),
    {
      name: "watch-workspace-packages",
      configureServer(server) {
        server.watcher.add(packagesDir);
      },
    },
  ]),
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
        // El proxy de desarrollo no corta conexiones largas (SSE de `/events`).
        timeout: 0,
        proxyTimeout: 0,
      },
    },
  },
});

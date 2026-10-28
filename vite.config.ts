/**
 * Config raíz de Vite+: fmt (Oxfmt), lint (Oxlint) y typecheck de todo el monorepo.
 *
 * El frontend no usa ESLint/Prettier. `prefer-vite-plus-imports` obliga a
 * importar `defineConfig` / `test` desde `vite-plus`. En `apps/web` se
 * activan las rules de React; en la API se permite `console` (logs de health).
 * Las migraciones de Drizzle se ignoran en fmt: drizzle-kit no sigue Oxfmt.
 */
import { fileURLToPath, URL } from "node:url";

import { configDefaults, defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ignorePatterns: ["packages/db/migrations/**"],
  },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    plugins: ["typescript"],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    overrides: [
      {
        files: ["apps/web/**"],
        plugins: ["typescript", "react", "oxc"],
        rules: {
          "react/rules-of-hooks": "error",
        },
      },
      {
        files: ["apps/api/**"],
        rules: {
          "no-console": "off",
        },
      },
    ],
  },
  run: {
    cache: true,
  },
  test: {
    // Cada fichero recibe su libSQL temporal en apps/api/src/test/setup.ts.
    // DATABASE_URL no se fija aquí: el cliente la cachea al primer acceso y
    // los ficheros corren en paralelo.
    env: {
      NODE_ENV: "test",
      BETTER_AUTH_SECRET: "local-test-only-not-a-real-secret",
      BETTER_AUTH_URL: "http://localhost:5173",
      AUTH_RATE_LIMIT_MAX: "10000",
    },
    // El barrel `hono/bun` lee el global `Bun` al importarse (`ssg.js`) y
    // los tests corren en Node. Solo aquí se resuelve al módulo real de
    // WebSocket (`upgradeWebSocket`, `websocket`); la API sigue en Bun.
    alias: [
      {
        find: /^hono\/bun$/,
        replacement: fileURLToPath(
          new URL("./node_modules/hono/dist/adapter/bun/websocket.js", import.meta.url),
        ),
      },
    ],
    setupFiles: ["apps/api/src/test/setup.ts"],
    exclude: [...configDefaults.exclude, "**/.claude/worktrees/**"],
  },
});

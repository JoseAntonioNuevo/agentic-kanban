/**
 * Config raíz de Vite+: fmt (Oxfmt), lint (Oxlint) y typecheck de todo el monorepo.
 *
 * El frontend no usa ESLint/Prettier. `prefer-vite-plus-imports` obliga a
 * importar `defineConfig` / `test` desde `vite-plus`. En `apps/web` se
 * activan las rules de React; en la API se permite `console` (logs de health).
 */
import { defineConfig } from "vite-plus";

export default defineConfig({
  // drizzle-kit regenera migrations/meta/*.json sin formato en cada db:generate.
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
  // Tests de API: cada fichero usa su propia base temporal (ver el setup) y un
  // secreto de Better Auth de prueba, nunca `data/agentic-kanban.db`.
  test: {
    env: {
      NODE_ENV: "test",
      BETTER_AUTH_SECRET: "secreto-solo-para-tests-no-usar-en-produccion-0123456789",
      BETTER_AUTH_URL: "http://localhost:5173",
    },
    setupFiles: ["apps/api/src/test/setup.ts"],
  },
});

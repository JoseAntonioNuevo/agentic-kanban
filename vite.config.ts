/**
 * Config raíz de Vite+: fmt (Oxfmt), lint (Oxlint) y typecheck de todo el monorepo.
 *
 * El frontend no usa ESLint/Prettier. `prefer-vite-plus-imports` obliga a
 * importar `defineConfig` / `test` desde `vite-plus`. En `apps/web` se
 * activan las rules de React; en la API se permite `console` (logs de health).
 * Las migraciones de Drizzle se ignoran en fmt: drizzle-kit no sigue Oxfmt.
 */
import { defineConfig } from "vite-plus";

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
});

import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {},
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

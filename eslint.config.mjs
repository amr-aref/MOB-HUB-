// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  // ─── Global ignores ──────────────────────────────────────────────────────────
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.expo/**",
      "**/build/**",
      // Generated API client / Zod schema code — do not lint
      "lib/api-client-react/src/generated/**",
      "lib/api-zod/src/generated/**",
      // Replit platform internals
      ".local/**",
      ".agents/**",
    ],
  },

  // ─── Base JS recommended (applies everywhere) ────────────────────────────────
  js.configs.recommended,

  // ─── TypeScript-aware rules for all TS/TSX files ─────────────────────────────
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Type-checked rules require parserServices (project references) — off
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },

  // ─── React Hooks enforcement ──────────────────────────────────────────────────
  // Covers the mobile app and mockup-sandbox (both use React / React Native)
  {
    files: [
      "artifacts/mobile/**/*.{ts,tsx}",
      "artifacts/mockup-sandbox/**/*.{ts,tsx}",
      "lib/api-client-react/**/*.{ts,tsx}",
    ],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      // Hard error: hooks called outside components or inside conditions/loops
      "react-hooks/rules-of-hooks": "error",
      // Warning: missing or stale effect/callback/memo deps
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // ─── Node.js ESM scripts (.mjs) ──────────────────────────────────────────────
  {
    files: ["**/*.mjs"],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: "module",
    },
    rules: {
      "no-console": "off",
    },
  },

  // ─── Node.js CJS scripts (.js) ───────────────────────────────────────────────
  // metro.config.js, babel.config.js, scripts/build.js, server/serve.js
  // These use CommonJS (require/module/__dirname) — must come AFTER tseslint spread
  {
    files: [
      "**/*.config.js",
      "artifacts/mobile/scripts/**/*.js",
      "artifacts/mobile/server/**/*.js",
      "scripts/**/*.js",
    ],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: "commonjs",
      ecmaVersion: 2022,
    },
    rules: {
      "no-console": "off",
      // CJS files legitimately use require() — disable the TS rule for them
      "@typescript-eslint/no-require-imports": "off",
      // Build scripts don't need error-cause chaining
      "preserve-caught-error": "off",
    },
  },

  // ─── Server / DB packages: add node globals, allow console ───────────────────
  {
    files: [
      "artifacts/api-server/**/*.ts",
      "scripts/**/*.ts",
      "lib/db/**/*.ts",
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "no-console": "off",
    },
  },
);

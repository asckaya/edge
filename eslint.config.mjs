import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      react: {
        version: "19.2.5",
      },
    },
  },
  {
    files: [
      "tests/**/*.ts",
      "tests/**/*.tsx",
      "**/__tests__/**/*.ts",
      "**/__tests__/**/*.tsx",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: [
      "functions/*.ts",
      "functions/_src/utils/**/*.ts",
      "gen-url.ts",
      "test-mihomo.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
]);

export default eslintConfig;

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // ローカル関数はアロー関数に統一する。ページ/レイアウトのdefault export
      // （このルールが自動で対象外にする）とコンポーネントのnamed exportは対象外
      // （`function`宣言のままでよい）。
      "func-style": [
        "error",
        "expression",
        { allowArrowFunctions: true, overrides: { namedExports: "ignore" } },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

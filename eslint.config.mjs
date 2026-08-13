import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // アロー関数に統一する。ページ/レイアウトのdefault exportだけは
      // ルール仕様上つねに対象外（App Routerの規約でfunction宣言のまま）。
      "func-style": [
        "error",
        "expression",
        { allowArrowFunctions: true, overrides: { namedExports: "expression" } },
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

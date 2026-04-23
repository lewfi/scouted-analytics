import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Supabase responses aren't typed — any is acceptable here
      "@typescript-eslint/no-explicit-any": "off",
      // setState resets in useEffect are intentional patterns in this codebase
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
  },
]);

export default eslintConfig;

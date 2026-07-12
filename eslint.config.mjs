import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "app/components/games/**/*.tsx",
      "app/components/useControllerGame.ts",
      "app/components/useGameSession.ts",
      "app/components/useMultiplayerGame.ts",
      "app/components/useStageGame.ts",
    ],
    rules: {
      // Round/session changes intentionally reset ephemeral controller input.
      // These effects do not synchronize shared game state and are scoped to the legacy adapters.
      "react-hooks/set-state-in-effect": "off",
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

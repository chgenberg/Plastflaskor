import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/integrations/adapters/mock", "@/server/integrations/adapters/mock"],
              message: "Importera getIntegrations() istället för mock-adaptrar.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "next", message: "domain är rent TypeScript. Ingen Next." },
            { name: "react", message: "domain är rent TypeScript. Ingen React." },
            { name: "react-dom", message: "domain är rent TypeScript. Ingen React." },
          ],
          patterns: [
            { group: ["next/*"], message: "domain är rent TypeScript. Ingen Next." },
            { group: ["react/*", "react-dom/*"], message: "domain är rent TypeScript. Ingen React." },
            { group: ["@/server", "@/server/*"], message: "domain anropar inte servern." },
            { group: ["@/actions", "@/actions/*"], message: "domain anropar inte actions." },
            { group: ["@/ui", "@/ui/*"], message: "domain importerar inte UI." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [{ name: "@/server/db", message: "Sidor anropar services, inte Prisma." }],
          patterns: [
            {
              group: ["**/integrations/adapters/mock", "@/server/integrations/adapters/mock"],
              message: "Importera getIntegrations() istället för mock-adaptrar.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "@prisma/client", message: "UI pratar inte med databasen." },
          ],
          patterns: [
            { group: ["@/server/db"], message: "UI anropar inte Prisma." },
            {
              group: ["**/integrations/adapters/mock", "@/server/integrations/adapters/mock"],
              message: "Importera getIntegrations() istället för mock-adaptrar.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;

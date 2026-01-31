/**
 * ESLint configuration pour le package @modele/types
 * Étend les règles d'isolation monorepo
 */

module.exports = {
  extends: ["../../.eslintrc.monorepo.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    // TypeScript rules
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "no-console": "off", // Types package may not need console
  },
  ignorePatterns: ["node_modules/", "dist/"],
};

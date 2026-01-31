/**
 * ESLint configuration pour règles d'isolation monorepo
 * À étendre dans les packages pour valider les imports
 */

module.exports = {
  rules: {
    // Règle pour interdire les imports entre apps et backend
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["../../apps/*", "../apps/*", "apps/*"],
            message:
              "Packages cannot import from apps. Apps can only import from packages.",
          },
          {
            group: ["../../backend/*", "../backend/*", "backend/*"],
            message:
              "Frontend cannot import from backend. Use API calls instead.",
          },
        ],
      },
    ],
  },
};

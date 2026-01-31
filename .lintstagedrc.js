/** @type {import('lint-staged').Config} */
module.exports = {
  // Frontend files
  "apps/web/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "apps/web/**/*.{json,css,scss,md}": ["prettier --write"],

  // Types package
  "packages/types/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],

  // Root files
  "*.{json,md,yml,yaml}": ["prettier --write"],
};

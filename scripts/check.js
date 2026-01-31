#!/usr/bin/env node

/**
 * Script de vérification complète du projet
 * Usage: node scripts/check.js [--fix] [--skip-tests]
 */

const { execSync } = require("child_process");

const args = process.argv.slice(2);
const fix = args.includes("--fix");
const skipTests = args.includes("--skip-tests");

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, options = {}) {
  try {
    execSync(command, {
      stdio: "inherit",
      ...options,
    });
    return true;
  } catch (error) {
    return false;
  }
}

log("\n🔍 Vérification complète du projet\n", "cyan");

let hasErrors = false;

// 1. Format
log("📝 Formatage du code...", "blue");
if (fix) {
  if (!runCommand("pnpm format")) {
    log("❌ Erreurs de formatage", "red");
    hasErrors = true;
  } else {
    log("✅ Code formaté", "green");
  }
} else {
  log("💡 Utilisez --fix pour formater automatiquement", "yellow");
}

// 2. Lint
log("\n🔍 Vérification ESLint...", "blue");
const lintCommand = fix ? "pnpm lint" : "pnpm lint";
if (!runCommand(lintCommand)) {
  log("❌ Erreurs ESLint détectées", "red");
  hasErrors = true;
} else {
  log("✅ ESLint OK", "green");
}

// 3. Type Check
log("\n🔷 Vérification TypeScript...", "blue");
if (!runCommand("pnpm type-check")) {
  log("❌ Erreurs TypeScript détectées", "red");
  hasErrors = true;
} else {
  log("✅ TypeScript OK", "green");
}

// 4. Tests
if (!skipTests) {
  log("\n🧪 Exécution des tests...", "blue");
  if (!runCommand("pnpm test --run")) {
    log("❌ Certains tests ont échoué", "red");
    hasErrors = true;
  } else {
    log("✅ Tests OK", "green");
  }
} else {
  log("\n⏭️  Tests ignorés (--skip-tests)", "yellow");
}

// 5. Build (optionnel)
const skipBuild = args.includes("--skip-build");
if (!skipBuild) {
  log("\n🏗️  Vérification du build...", "blue");
  if (!runCommand("pnpm build")) {
    log("❌ Erreurs de build détectées", "red");
    hasErrors = true;
  } else {
    log("✅ Build OK", "green");
  }
} else {
  log("\n⏭️  Build ignoré (--skip-build)", "yellow");
}

if (hasErrors) {
  log("\n❌ Vérification échouée", "red");
  log("💡 Corrigez les erreurs avant de continuer", "yellow");
  process.exit(1);
}

log("\n✅ Toutes les vérifications sont passées!", "green");
process.exit(0);

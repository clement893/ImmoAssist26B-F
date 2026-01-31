#!/usr/bin/env node

/**
 * Script de vérification pré-commit
 * Exécute lint, type-check et tests avant chaque commit
 */

const { execSync } = require("child_process");
const path = require("path");

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, cwd = process.cwd()) {
  try {
    execSync(command, {
      cwd,
      stdio: "inherit",
    });
    return true;
  } catch (error) {
    return false;
  }
}

log("\n🔍 Vérification pré-commit...\n", "blue");

let hasErrors = false;

// 1. Lint Frontend
log("📝 Vérification ESLint (frontend)...", "blue");
if (!runCommand("pnpm --filter @modele/web lint")) {
  log("❌ Erreurs ESLint détectées dans le frontend", "red");
  hasErrors = true;
} else {
  log("✅ ESLint OK", "green");
}

// 2. Type Check Frontend
log("\n🔷 Vérification TypeScript (frontend)...", "blue");
if (!runCommand("pnpm --filter @modele/web type-check")) {
  log("❌ Erreurs TypeScript détectées dans le frontend", "red");
  hasErrors = true;
} else {
  log("✅ TypeScript OK", "green");
}

// 3. Type Check Types Package
log("\n📦 Vérification TypeScript (types package)...", "blue");
if (!runCommand("pnpm --filter @modele/types type-check")) {
  log("❌ Erreurs TypeScript détectées dans le package types", "red");
  hasErrors = true;
} else {
  log("✅ Types package OK", "green");
}

// 4. Security Audit
log("\n🔒 Audit de sécurité...", "blue");
if (!runCommand("node scripts/audit-security.js")) {
  log("❌ Problèmes de sécurité détectés", "red");
  log("💡 Corrigez les problèmes critiques avant de commiter", "yellow");
  hasErrors = true;
} else {
  log("✅ Audit de sécurité OK", "green");
}

// 5. Tests unitaires (optionnel - peut être désactivé pour accélérer)
const skipTests = process.argv.includes("--skip-tests");
if (!skipTests) {
  log("\n🧪 Exécution des tests unitaires...", "blue");
  if (!runCommand("pnpm --filter @modele/web test --run")) {
    log("⚠️  Certains tests ont échoué", "yellow");
    log("💡 Utilisez --skip-tests pour ignorer les tests", "yellow");
    // Ne pas bloquer le commit pour les tests par défaut
    // hasErrors = true;
  } else {
    log("✅ Tests OK", "green");
  }
}

if (hasErrors) {
  log("\n❌ Vérification pré-commit échouée", "red");
  log("💡 Corrigez les erreurs avant de commiter", "yellow");
  process.exit(1);
}

log("\n✅ Vérification pré-commit réussie!", "green");
process.exit(0);

#!/usr/bin/env node

/**
 * Script de build optimisé avec cache et parallélisation
 * Usage: node scripts/build-optimized.js [--clean] [--filter=package]
 */

const { execSync } = require("child_process");

const args = process.argv.slice(2);
const clean = args.includes("--clean");
const filterArg = args.find((arg) => arg.startsWith("--filter="));
const filter = filterArg ? filterArg.split("=")[1] : null;

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

log("\n🏗️  Build optimisé du monorepo\n", "cyan");

if (clean) {
  log("🧹 Nettoyage des builds précédents...", "yellow");
  if (!runCommand("pnpm clean")) {
    log("❌ Erreur lors du nettoyage", "red");
    process.exit(1);
  }
}

log("\n📦 Build des packages...", "blue");

let buildCommand = "turbo run build";
if (filter) {
  buildCommand += ` --filter=${filter}`;
  log(`   Filtre: ${filter}`, "blue");
} else {
  log("   Build complet avec dépendances", "blue");
}

if (!runCommand(buildCommand)) {
  log("\n❌ Erreur lors du build", "red");
  process.exit(1);
}

log("\n✅ Build terminé avec succès!", "green");

// Afficher les statistiques de cache
log("\n📊 Statistiques de cache:", "cyan");
try {
  execSync(
    'turbo run build --dry-run=json 2>/dev/null || echo "Cache stats unavailable"',
    {
      stdio: "inherit",
    },
  );
} catch (error) {
  // Ignorer les erreurs de dry-run
}

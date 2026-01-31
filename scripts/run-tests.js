#!/usr/bin/env node

/**
 * Script pour exécuter tous les tests unitaires du projet
 * Usage: node scripts/run-tests.js [options]
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const args = process.argv.slice(2);
const options = {
  watch: args.includes("--watch") || args.includes("-w"),
  coverage: args.includes("--coverage") || args.includes("-c"),
  backend: args.includes("--backend") || args.includes("-b"),
  frontend: args.includes("--frontend") || args.includes("-f"),
  verbose: args.includes("--verbose") || args.includes("-v"),
  bail: args.includes("--bail"),
};

function log(message, type = "info") {
  const colors = {
    info: "\x1b[36m",
    success: "\x1b[32m",
    error: "\x1b[31m",
    warning: "\x1b[33m",
    reset: "\x1b[0m",
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function runCommand(command, cwd = process.cwd()) {
  try {
    if (options.verbose) {
      log(`Exécution: ${command}`, "info");
    }
    execSync(command, {
      cwd,
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "test" },
    });
    return true;
  } catch (error) {
    log(`Erreur lors de l'exécution: ${command}`, "error");
    if (options.bail) {
      process.exit(1);
    }
    return false;
  }
}

function checkDependencies() {
  log("Vérification des dépendances...", "info");

  // Vérifier backend
  const backendPath = path.join(process.cwd(), "backend");
  if (fs.existsSync(backendPath)) {
    const requirementsPath = path.join(backendPath, "requirements.txt");
    if (fs.existsSync(requirementsPath)) {
      log("Installation des dépendances Python...", "info");
      runCommand("pip install -r requirements.txt", backendPath);
    }
  }

  // Vérifier frontend
  const frontendPath = path.join(process.cwd(), "apps", "web");
  if (fs.existsSync(frontendPath)) {
    log("Vérification des dépendances Node.js...", "info");
    runCommand("pnpm install", process.cwd());
  }
}

function runBackendTests() {
  log("\n🧪 Exécution des tests backend...", "info");
  const backendPath = path.join(process.cwd(), "backend");

  if (!fs.existsSync(backendPath)) {
    log("Répertoire backend introuvable", "warning");
    return false;
  }

  let command = "pytest";
  if (options.coverage) {
    command += " --cov=app --cov-report=html --cov-report=term";
  }
  if (options.verbose) {
    command += " -v";
  }

  return runCommand(command, backendPath);
}

function runFrontendTests() {
  log("\n🧪 Exécution des tests frontend...", "info");
  const frontendPath = path.join(process.cwd(), "apps", "web");

  if (!fs.existsSync(frontendPath)) {
    log("Répertoire frontend introuvable", "warning");
    return false;
  }

  let command = options.watch ? "pnpm test:watch" : "pnpm test";
  if (options.coverage) {
    command = "pnpm test:coverage";
  }

  return runCommand(command, frontendPath);
}

function main() {
  log("🚀 Démarrage des tests unitaires\n", "success");

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: node scripts/run-tests.js [options]

Options:
  --watch, -w          Mode watch (frontend uniquement)
  --coverage, -c       Générer le rapport de couverture
  --backend, -b        Exécuter uniquement les tests backend
  --frontend, -f        Exécuter uniquement les tests frontend
  --verbose, -v         Mode verbeux
  --bail                Arrêter à la première erreur
  --help, -h            Afficher cette aide

Exemples:
  node scripts/run-tests.js                    # Exécuter tous les tests
  node scripts/run-tests.js --coverage          # Avec couverture
  node scripts/run-tests.js --backend           # Backend uniquement
  node scripts/run-tests.js --frontend --watch  # Frontend en mode watch
    `);
    return;
  }

  // Vérifier les dépendances si nécessaire
  if (!args.includes("--skip-deps")) {
    checkDependencies();
  }

  let backendSuccess = true;
  let frontendSuccess = true;

  // Exécuter les tests selon les options
  if (options.backend && !options.frontend) {
    backendSuccess = runBackendTests();
  } else if (options.frontend && !options.backend) {
    frontendSuccess = runFrontendTests();
  } else {
    // Exécuter les deux
    backendSuccess = runBackendTests();
    frontendSuccess = runFrontendTests();
  }

  // Résumé
  log("\n📊 Résumé des tests", "info");
  if (backendSuccess && frontendSuccess) {
    log("✅ Tous les tests sont passés!", "success");
    process.exit(0);
  } else {
    log("❌ Certains tests ont échoué", "error");
    process.exit(1);
  }
}

main();

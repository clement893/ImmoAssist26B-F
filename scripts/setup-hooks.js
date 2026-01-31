#!/usr/bin/env node

/**
 * Script de configuration des hooks Git
 * Installe husky et configure les hooks pré-commit
 */

const { execSync } = require("child_process");
const fs = require("fs");
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

log("\n🔧 Configuration des hooks Git...\n", "blue");

// Vérifier si husky est installé
log("📦 Vérification de husky...", "blue");
try {
  require.resolve("husky");
  log("✅ Husky est installé", "green");
} catch (error) {
  log("⚠️  Husky n'est pas installé. Installation...", "yellow");
  if (!runCommand("pnpm add -D husky lint-staged")) {
    log("❌ Erreur lors de l'installation de husky", "red");
    process.exit(1);
  }
  log("✅ Husky installé", "green");
}

// Initialiser husky
log("\n🔨 Initialisation de husky...", "blue");
if (!runCommand("npx husky init")) {
  log("⚠️  Husky est peut-être déjà initialisé", "yellow");
}

// Créer le dossier .husky s'il n'existe pas
const huskyDir = path.join(process.cwd(), ".husky");
if (!fs.existsSync(huskyDir)) {
  fs.mkdirSync(huskyDir, { recursive: true });
}

// Créer le hook pre-commit
const preCommitHook = path.join(huskyDir, "pre-commit");
const hookContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Exécuter lint-staged
npx lint-staged

# Exécuter le script de vérification pré-commit
node scripts/pre-commit.js
`;

fs.writeFileSync(preCommitHook, hookContent);

// Rendre le hook exécutable (Unix)
if (process.platform !== "win32") {
  runCommand(`chmod +x ${preCommitHook}`);
}

log("✅ Hook pre-commit configuré", "green");

// Créer le hook commit-msg (optionnel)
const commitMsgHook = path.join(huskyDir, "commit-msg");
const commitMsgContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validation du message de commit (optionnel)
# npx commitlint --edit "$1"
`;

fs.writeFileSync(commitMsgHook, commitMsgContent);
if (process.platform !== "win32") {
  runCommand(`chmod +x ${commitMsgHook}`);
}

log("✅ Hook commit-msg configuré", "green");

log("\n✅ Configuration terminée!", "green");
log("\n💡 Les hooks Git sont maintenant actifs:", "blue");
log("   - pre-commit: lint-staged + vérifications", "blue");
log("   - commit-msg: validation du message (optionnel)", "blue");

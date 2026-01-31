#!/usr/bin/env node

/**
 * Script de développement avec hot reload pour frontend et backend
 * Usage: node scripts/dev.js [--frontend-only] [--backend-only]
 */

const { spawn } = require("child_process");
const path = require("path");

const args = process.argv.slice(2);
const frontendOnly = args.includes("--frontend-only") || args.includes("-f");
const backendOnly = args.includes("--backend-only") || args.includes("-b");

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset", prefix = "") {
  console.log(`${colors[color]}${prefix}${message}${colors.reset}`);
}

function runProcess(name, command, cwd, color) {
  return new Promise((resolve, reject) => {
    log(`🚀 Démarrage de ${name}...`, color);

    const [cmd, ...args] = command.split(" ");
    const proc = spawn(cmd, args, {
      cwd,
      shell: true,
      stdio: "inherit",
    });

    proc.on("error", (error) => {
      log(`❌ Erreur lors du démarrage de ${name}: ${error.message}`, "red");
      reject(error);
    });

    proc.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        log(`⚠️  ${name} s'est arrêté avec le code ${code}`, "yellow");
      }
      resolve(code);
    });

    // Gestion de l'arrêt propre
    process.on("SIGINT", () => {
      log(`\n🛑 Arrêt de ${name}...`, "yellow");
      proc.kill("SIGINT");
    });

    process.on("SIGTERM", () => {
      log(`\n🛑 Arrêt de ${name}...`, "yellow");
      proc.kill("SIGTERM");
    });
  });
}

async function main() {
  log("\n🔥 Mode développement avec hot reload\n", "cyan");

  const processes = [];

  // Frontend (Next.js avec hot reload natif)
  if (!backendOnly) {
    log("📱 Frontend: Next.js dev server (hot reload activé)", "blue");
    processes.push(
      runProcess(
        "Frontend",
        "pnpm --filter @modele/web dev",
        process.cwd(),
        "green",
      ),
    );
  }

  // Backend (FastAPI avec --reload)
  if (!frontendOnly) {
    log("🔧 Backend: FastAPI avec uvicorn --reload", "blue");
    log("💡 Assurez-vous que le backend est configuré avec --reload", "yellow");
    processes.push(
      runProcess(
        "Backend",
        "cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000",
        process.cwd(),
        "blue",
      ),
    );
  }

  // Attendre que tous les processus démarrent
  try {
    await Promise.all(processes);
  } catch (error) {
    log(`\n❌ Erreur: ${error.message}`, "red");
    process.exit(1);
  }
}

main();

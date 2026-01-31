#!/usr/bin/env node

/**
 * Script de Seed de Données
 * Lance le script Python de seed pour générer des données de développement
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

function checkPython() {
  const commands = ["python3", "python", "py"];

  for (const cmd of commands) {
    try {
      execSync(`${cmd} --version`, { stdio: "ignore" });
      return cmd;
    } catch {
      continue;
    }
  }

  throw new Error("Python 3 n'est pas installé");
}

function main() {
  const scriptDir = __dirname;
  const rootDir = path.resolve(scriptDir, "..");
  const backendDir = path.join(rootDir, "backend");
  const seedScript = path.join(backendDir, "scripts", "seed.py");
  const extendedScript = path.join(backendDir, "scripts", "seed_extended.py");

  const args = process.argv.slice(2);
  const extended = args.includes("--extended") || args.includes("-e");

  if (!fs.existsSync(seedScript)) {
    console.error(`❌ Script de seed introuvable: ${seedScript}`);
    process.exit(1);
  }

  try {
    const pythonCmd = checkPython();
    const script = extended ? extendedScript : seedScript;

    console.log(`🔄 Exécution du seed${extended ? " étendu" : ""}...\n`);

    execSync(`${pythonCmd} "${script}"`, {
      stdio: "inherit",
      cwd: backendDir,
      env: {
        ...process.env,
        PYTHONPATH: backendDir,
      },
    });

    console.log("\n✅ Seed terminé avec succès!");
  } catch (error) {
    console.error("\n❌ Erreur lors du seed:", error.message);
    process.exit(1);
  }
}

main();

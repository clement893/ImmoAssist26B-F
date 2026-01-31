#!/usr/bin/env node

/**
 * Wrapper Node.js pour le générateur Python
 * Exécute le script Python et gère les erreurs
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const scriptDir = __dirname;
const pythonScript = path.join(scriptDir, "generate_types.py");

// Vérifier que Python est disponible
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

  console.error("\n❌ Python 3 n'est pas installé.");
  console.error(
    "   Veuillez installer Python 3.11+ depuis https://www.python.org/downloads/",
  );
  console.error(
    "   Ou utilisez: npm run generate:types:fallback (version basique)",
  );
  throw new Error("Python 3 requis pour la génération de types");
}

function main() {
  try {
    console.log("🔄 Génération des types TypeScript depuis Pydantic...\n");

    const pythonCmd = checkPython();
    const command = `${pythonCmd} "${pythonScript}"`;

    execSync(command, {
      stdio: "inherit",
      cwd: path.resolve(__dirname, "../../.."),
    });

    console.log("\n✅ Synchronisation terminée!");
  } catch (error) {
    console.error("\n❌ Erreur lors de la génération:", error.message);
    process.exit(1);
  }
}

main();

#!/usr/bin/env node

/**
 * Script pour intégrer un module depuis un autre repository Git
 * Usage: node scripts/integrate-from-repo.js <repo-url> <module-path> <module-name> [options]
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  );
  console.log("📦 Intégration de Module depuis Repository Git Externe");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
  );

  // Demander l'URL du repo
  console.log("📍 Étape 1/5: Informations du Repository");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
  );

  let repoUrl = await question("URL du repository Git (NUKLEO-ERP):\n> ");
  repoUrl = repoUrl.trim();

  if (!repoUrl) {
    console.log("❌ URL du repository requise.");
    rl.close();
    process.exit(1);
  }

  // Demander le chemin du module dans le repo
  console.log("\n\n📁 Étape 2/5: Localisation du Module");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  );
  console.log('\nOù se trouve le module "Réseau" dans le repository?');
  console.log("Exemples:");
  console.log("  - backend/app/modules/reseau (module backend Python)");
  console.log("  - packages/reseau (module TypeScript partagé)");
  console.log("  - apps/web/src/app/reseau (module frontend Next.js)\n");

  let modulePath = await question("Chemin du module dans le repo:\n> ");
  modulePath = modulePath.trim();

  // Demander le nom du module
  console.log("\n\n📝 Étape 3/5: Nom du Module");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
  );

  let moduleName = await question("Nom du module (défaut: reseau):\n> ");
  moduleName = (moduleName.trim() || "reseau")
    .toLowerCase()
    .replace(/\s+/g, "-");

  // Déterminer le type de module
  console.log("\n\n🔧 Étape 4/5: Type de Module");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  );

  let moduleType = "shared";
  if (modulePath.includes("backend") || modulePath.includes("app/modules")) {
    moduleType = "backend";
  } else if (
    modulePath.includes("apps/web") ||
    modulePath.includes("src/app")
  ) {
    moduleType = "frontend";
  } else {
    const typeAnswer = await question(
      "Type de module? (frontend/backend/shared) [shared]:\n> ",
    );
    moduleType = (typeAnswer.trim() || "shared").toLowerCase();
  }

  console.log(`✅ Type détecté/sélectionné: ${moduleType}`);

  // Cloner le repo temporairement
  console.log("\n\n🚀 Étape 5/5: Clonage et Migration");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
  );

  const tempDir = path.join(process.cwd(), ".temp-repos", "nukleo-erp");
  const fullModulePath = path.join(tempDir, modulePath);

  console.log(`📥 Clonage du repository dans: ${tempDir}`);

  try {
    // Créer le dossier temporaire
    if (fs.existsSync(tempDir)) {
      console.log("⚠️  Le dossier temporaire existe déjà. Suppression...");
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    // Cloner le repo
    console.log(`\n🔄 Clonage de ${repoUrl}...`);
    execSync(`git clone ${repoUrl} "${tempDir}"`, {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    // Vérifier que le module existe
    if (!fs.existsSync(fullModulePath)) {
      console.log(`\n❌ Le module n'a pas été trouvé à: ${fullModulePath}`);
      console.log("\nContenu du repository cloné:");
      try {
        const files = fs.readdirSync(tempDir);
        console.log(files.join("\n"));
      } catch (e) {
        console.log("Impossible de lister les fichiers.");
      }

      const continueAnyway = await question(
        "\nVoulez-vous continuer quand même? (o/n): ",
      );
      if (
        continueAnyway.toLowerCase() !== "o" &&
        continueAnyway.toLowerCase() !== "oui"
      ) {
        console.log("❌ Opération annulée.");
        fs.rmSync(tempDir, { recursive: true, force: true });
        rl.close();
        return;
      }
    } else {
      console.log(`✅ Module trouvé: ${fullModulePath}`);
    }

    // Exécuter la migration
    console.log("\n🔄 Migration du module...\n");
    execSync(
      `node scripts/migrate-module.js "${fullModulePath}" "${moduleName}" --type ${moduleType}`,
      {
        stdio: "inherit",
        cwd: process.cwd(),
      },
    );

    // Nettoyer
    console.log("\n🧹 Nettoyage du dossier temporaire...");
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log("✅ Nettoyage terminé.");

    console.log(
      "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    );
    console.log("✅ Intégration terminée avec succès!");
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
    );

    // Afficher les prochaines étapes
    console.log("📝 Prochaines étapes:\n");

    if (moduleType === "frontend" || moduleType === "shared") {
      console.log(`1. Vérifier le code dans: packages/${moduleName}`);
      console.log(`2. Installer les dépendances:`);
      console.log(`   cd packages/${moduleName}`);
      console.log(`   pnpm install`);
      console.log(`3. Builder le module:`);
      console.log(`   pnpm build`);
      console.log(`4. Ajouter au projet principal (apps/web/package.json):`);
      console.log(`   "@modele/${moduleName}": "workspace:*"`);
    } else if (moduleType === "backend") {
      console.log(
        `1. Vérifier le code dans: backend/app/modules/${moduleName}`,
      );
      console.log(
        `2. Ajouter les imports dans backend/app/models/__init__.py si nécessaire`,
      );
      console.log(`3. Créer les migrations:`);
      console.log(`   cd backend`);
      console.log(
        `   alembic revision --autogenerate -m "Add ${moduleName} module"`,
      );
      console.log(`4. Appliquer les migrations:`);
      console.log(`   alembic upgrade head`);
    }
  } catch (error) {
    console.error("\n❌ Erreur lors de l'intégration:");
    console.error(error.message);

    // Nettoyer en cas d'erreur
    if (fs.existsSync(tempDir)) {
      console.log("\n🧹 Nettoyage du dossier temporaire...");
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    rl.close();
    process.exit(1);
  }

  rl.close();
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  rl.close();
  process.exit(1);
});

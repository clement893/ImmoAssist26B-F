#!/usr/bin/env node

/**
 * Guide interactif pour l'intégration de module
 * Ce script pose des questions et guide l'utilisateur étape par étape
 */

const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

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
  console.log("📦 Guide d'Intégration de Module Externe");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
  );

  // Étape 1: Chemin du module source
  console.log("📍 Étape 1/4: Localisation du module source");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  );

  let sourcePath = await question(
    "\nQuel est le chemin du module à intégrer?\n(Exemple: C:\\autre-projet\\packages\\mon-module)\n> ",
  );
  sourcePath = sourcePath.trim().replace(/['"]/g, "");

  // Vérifier que le chemin existe
  if (!fs.existsSync(sourcePath)) {
    console.log(`\n⚠️  Le chemin "${sourcePath}" n'existe pas.`);
    const continueAnyway = await question(
      "Voulez-vous continuer quand même? (o/n): ",
    );
    if (
      continueAnyway.toLowerCase() !== "o" &&
      continueAnyway.toLowerCase() !== "oui"
    ) {
      console.log("❌ Opération annulée.");
      rl.close();
      return;
    }
  } else {
    console.log(`✅ Chemin trouvé: ${sourcePath}`);
  }

  // Étape 2: Nom du module
  console.log("\n\n📝 Étape 2/4: Nom du module");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  );
  console.log("\nLe nom doit être en kebab-case (minuscules avec tirets)");
  console.log("Exemples: task-manager, crm-module, analytics-dashboard\n");

  let moduleName = await question("Quel nom voulez-vous donner au module?\n> ");
  moduleName = moduleName.trim().toLowerCase().replace(/\s+/g, "-");

  // Valider le nom
  if (!/^[a-z0-9-]+$/.test(moduleName)) {
    console.log(
      "⚠️  Le nom contient des caractères invalides. Utilisation de kebab-case...",
    );
    moduleName = moduleName.replace(/[^a-z0-9-]/g, "-");
  }

  console.log(`✅ Nom du module: ${moduleName}`);

  // Étape 3: Type de module
  console.log("\n\n🔧 Étape 3/4: Type de module");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  );
  console.log(
    "\n1. frontend  - Module React/Next.js (composants, pages, hooks)",
  );
  console.log("2. backend   - Module Python/FastAPI (API, modèles, services)");
  console.log(
    "3. shared    - Module TypeScript partagé (types, utilitaires)\n",
  );

  let moduleType = await question(
    "Quel type de module? (1/2/3 ou frontend/backend/shared) [shared]: ",
  );
  moduleType = moduleType.trim().toLowerCase();

  if (moduleType === "1" || moduleType === "frontend") {
    moduleType = "frontend";
  } else if (moduleType === "2" || moduleType === "backend") {
    moduleType = "backend";
  } else {
    moduleType = "shared";
  }

  console.log(`✅ Type sélectionné: ${moduleType}`);

  // Étape 4: Confirmation et exécution
  console.log("\n\n✅ Étape 4/4: Confirmation");
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  );
  console.log("\n📋 Résumé:");
  console.log(`   Source:      ${sourcePath}`);
  console.log(`   Nom:         ${moduleName}`);
  console.log(`   Type:        ${moduleType}`);

  const targetPath =
    moduleType === "backend"
      ? path.join(process.cwd(), "backend", "app", "modules", moduleName)
      : path.join(process.cwd(), "packages", moduleName);

  console.log(`   Destination: ${targetPath}\n`);

  // Vérifier si la destination existe déjà
  if (fs.existsSync(targetPath)) {
    console.log("⚠️  ATTENTION: Le module existe déjà à la destination!");
    const overwrite = await question(
      "Voulez-vous écraser le module existant? (o/n): ",
    );
    if (overwrite.toLowerCase() !== "o" && overwrite.toLowerCase() !== "oui") {
      console.log("❌ Opération annulée.");
      rl.close();
      return;
    }
  }

  const confirm = await question("\nVoulez-vous continuer? (o/n): ");
  if (confirm.toLowerCase() !== "o" && confirm.toLowerCase() !== "oui") {
    console.log("❌ Opération annulée.");
    rl.close();
    return;
  }

  // Proposer dry-run d'abord
  console.log(
    "\n💡 Astuce: Je recommande de faire un dry-run d'abord pour voir ce qui sera fait.",
  );
  const dryRunFirst = await question(
    "Voulez-vous faire un dry-run d'abord? (o/n) [o]: ",
  );

  if (
    dryRunFirst.toLowerCase() === "o" ||
    dryRunFirst.toLowerCase() === "oui" ||
    dryRunFirst === ""
  ) {
    console.log("\n🔍 Exécution du dry-run...\n");
    try {
      execSync(
        `node scripts/migrate-module.js "${sourcePath}" "${moduleName}" --type ${moduleType} --dry-run`,
        {
          stdio: "inherit",
          cwd: process.cwd(),
        },
      );

      const proceed = await question(
        "\n\nLe dry-run est terminé. Voulez-vous procéder à la migration réelle? (o/n): ",
      );
      if (proceed.toLowerCase() !== "o" && proceed.toLowerCase() !== "oui") {
        console.log("❌ Opération annulée.");
        rl.close();
        return;
      }
    } catch (error) {
      console.log(
        "\n❌ Erreur lors du dry-run. Voulez-vous continuer quand même?",
      );
      const proceed = await question("(o/n): ");
      if (proceed.toLowerCase() !== "o" && proceed.toLowerCase() !== "oui") {
        console.log("❌ Opération annulée.");
        rl.close();
        return;
      }
    }
  }

  // Exécuter la migration
  console.log("\n🚀 Exécution de la migration...\n");
  try {
    execSync(
      `node scripts/migrate-module.js "${sourcePath}" "${moduleName}" --type ${moduleType}`,
      {
        stdio: "inherit",
        cwd: process.cwd(),
      },
    );

    console.log(
      "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    );
    console.log("✅ Migration terminée avec succès!");
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
      console.log(`5. Utiliser dans le code:`);
      console.log(`   import { ... } from '@modele/${moduleName}'`);
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
      console.log(
        `5. Ajouter les routes dans backend/app/api/__init__.py si nécessaire`,
      );
    }

    console.log(
      "\n💡 Consultez docs/MODULE_INTEGRATION_GUIDE.md pour plus de détails.\n",
    );
  } catch (error) {
    console.log("\n❌ Erreur lors de la migration:");
    console.log(error.message);
    console.log("\n💡 Vérifiez les erreurs ci-dessus et réessayez.");
  }

  rl.close();
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  rl.close();
  process.exit(1);
});

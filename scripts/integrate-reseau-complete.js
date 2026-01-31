#!/usr/bin/env node

/**
 * Script pour intégrer le module Réseau complet depuis NUKLEO-ERP
 * Ce script migre à la fois les pages et les composants
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SOURCE_REPO = "C:\\Users\\cleme\\Nukleo-ERP";
const TARGET_PROJECT = process.cwd();

console.log(
  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
);
console.log("📦 Intégration du Module Réseau depuis NUKLEO-ERP");
console.log(
  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
);

// Chemins sources
const sourcePages = path.join(
  SOURCE_REPO,
  "apps",
  "web",
  "src",
  "app",
  "[locale]",
  "dashboard",
  "reseau",
);
const sourceComponents = path.join(
  SOURCE_REPO,
  "apps",
  "web",
  "src",
  "components",
  "reseau",
);

// Chemins cibles
const targetPages = path.join(
  TARGET_PROJECT,
  "apps",
  "web",
  "src",
  "app",
  "[locale]",
  "dashboard",
  "reseau",
);
const targetComponents = path.join(
  TARGET_PROJECT,
  "apps",
  "web",
  "src",
  "components",
  "reseau",
);

// Vérifier que les sources existent
if (!fs.existsSync(sourcePages)) {
  console.error(`❌ Le dossier des pages n'existe pas: ${sourcePages}`);
  process.exit(1);
}

if (!fs.existsSync(sourceComponents)) {
  console.error(
    `❌ Le dossier des composants n'existe pas: ${sourceComponents}`,
  );
  process.exit(1);
}

console.log("✅ Sources trouvées:");
console.log(`   Pages: ${sourcePages}`);
console.log(`   Composants: ${sourceComponents}\n`);

// Fonction pour copier récursivement
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    files.forEach((file) => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      copyRecursive(srcPath, destPath);
    });
  } else {
    // Ignorer certains fichiers
    if (
      path.basename(src).startsWith(".") ||
      path.basename(src) === "node_modules" ||
      path.basename(src) === ".next"
    ) {
      return;
    }

    let content = fs.readFileSync(src, "utf8");

    // Adapter les imports
    content = content.replace(
      /from ['"]@\/components\/commercial\//g,
      "from '@/components/reseau/",
    );
    content = content.replace(
      /from ['"]@\/lib\/api\/commercial\//g,
      "from '@/lib/api/reseau/",
    );

    fs.writeFileSync(dest, content);
    console.log(`✅ Copié: ${path.relative(TARGET_PROJECT, dest)}`);
  }
}

// Copier les pages
console.log("📄 Copie des pages...\n");
if (fs.existsSync(targetPages)) {
  console.log(`⚠️  Le dossier existe déjà: ${targetPages}`);
  console.log("   Les fichiers existants seront écrasés.\n");
} else {
  fs.mkdirSync(path.dirname(targetPages), { recursive: true });
}
copyRecursive(sourcePages, targetPages);

// Copier les composants
console.log("\n🧩 Copie des composants...\n");
if (fs.existsSync(targetComponents)) {
  console.log(`⚠️  Le dossier existe déjà: ${targetComponents}`);
  console.log("   Les fichiers existants seront écrasés.\n");
} else {
  fs.mkdirSync(path.dirname(targetComponents), { recursive: true });
}
copyRecursive(sourceComponents, targetComponents);

console.log(
  "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
);
console.log("✅ Intégration terminée!");
console.log(
  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
);

console.log("📝 Prochaines étapes:\n");
console.log("1. Vérifier les imports dans les fichiers copiés");
console.log("2. Créer les API endpoints backend si nécessaire");
console.log("3. Créer les types TypeScript si nécessaire");
console.log("4. Tester les pages: http://localhost:3000/dashboard/reseau");
console.log(
  "\n💡 Consultez docs/MODULE_INTEGRATION_GUIDE.md pour plus de détails.\n",
);

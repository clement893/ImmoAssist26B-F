#!/usr/bin/env node

/**
 * Script final pour corriger TOUTES les classes gray hardcodées restantes
 * Version optimisée qui préserve le formatage
 */

const fs = require("fs");
const path = require("path");

const COMPONENTS_DIR = path.join(__dirname, "../apps/web/src/components");

// Patterns de remplacement complets
const replacements = [
  // Patterns avec dark: combinés (priorité haute - à faire en premier)
  {
    from: /text-gray-(\d+)\s+dark:text-gray-(\d+)/g,
    to: "text-muted-foreground",
  },
  { from: /text-gray-(\d+)\s+dark:text-white/g, to: "text-foreground" },
  { from: /bg-gray-(\d+)\s+dark:bg-gray-(\d+)/g, to: "bg-muted" },
  { from: /bg-gray-(\d+)\s+dark:bg-(\w+)/g, to: "bg-muted" },
  { from: /bg-white\s+dark:bg-gray-(\d+)/g, to: "bg-background" },
  { from: /bg-black\s+dark:bg-gray-900/g, to: "bg-foreground" },
  { from: /border-gray-(\d+)\s+dark:border-gray-(\d+)/g, to: "border-border" },
  { from: /border-gray-(\d+)\s+dark:border-(\w+)/g, to: "border-border" },
  {
    from: /hover:bg-gray-(\d+)\s+dark:hover:bg-gray-(\d+)/g,
    to: "hover:bg-muted",
  },
  { from: /hover:bg-gray-(\d+)\s+dark:hover:bg-(\w+)/g, to: "hover:bg-muted" },
  {
    from: /hover:border-gray-(\d+)\s+dark:hover:border-gray-(\d+)/g,
    to: "hover:border-border",
  },
  {
    from: /hover:border-gray-(\d+)\s+dark:hover:border-(\w+)/g,
    to: "hover:border-muted-foreground",
  },
  {
    from: /placeholder:text-gray-(\d+)\s+dark:placeholder:text-gray-(\d+)/g,
    to: "placeholder:text-muted-foreground",
  },
  {
    from: /focus:ring-offset-gray-(\d+)\s+dark:focus:ring-offset-gray-(\d+)/g,
    to: "focus:ring-offset-background",
  },
  {
    from: /focus:bg-gray-(\d+)\s+dark:focus:bg-gray-(\d+)/g,
    to: "focus:bg-muted",
  },

  // Patterns dark: simples (suppression)
  { from: /\s+dark:text-gray-(\d+)/g, to: "" },
  { from: /\s+dark:text-white/g, to: " text-foreground" },
  { from: /\s+dark:bg-gray-(\d+)/g, to: "" },
  { from: /\s+dark:bg-white/g, to: " bg-background" },
  { from: /\s+dark:border-gray-(\d+)/g, to: "" },
  { from: /\s+dark:hover:bg-gray-(\d+)/g, to: "" },
  { from: /\s+dark:hover:border-gray-(\d+)/g, to: "" },
  { from: /\s+dark:placeholder:text-gray-(\d+)/g, to: "" },
  { from: /\s+dark:focus:ring-offset-gray-(\d+)/g, to: "" },
  { from: /\s+dark:focus:bg-gray-(\d+)/g, to: "" },
  { from: /\s+dark:focus:ring-gray-(\d+)/g, to: "" },

  // Patterns simples (sans dark:)
  { from: /text-gray-900/g, to: "text-foreground" },
  { from: /text-gray-800/g, to: "text-foreground" },
  { from: /text-gray-700/g, to: "text-foreground" },
  { from: /text-gray-600/g, to: "text-muted-foreground" },
  { from: /text-gray-500/g, to: "text-muted-foreground" },
  { from: /text-gray-400/g, to: "text-muted-foreground" },
  { from: /text-gray-300/g, to: "text-muted-foreground" },

  { from: /bg-gray-900/g, to: "bg-background" },
  { from: /bg-gray-800/g, to: "bg-muted" },
  { from: /bg-gray-700/g, to: "bg-muted" },
  { from: /bg-gray-600/g, to: "bg-muted" },
  { from: /bg-gray-500/g, to: "bg-muted" },
  { from: /bg-gray-400/g, to: "bg-muted" },
  { from: /bg-gray-300/g, to: "bg-muted" },
  { from: /bg-gray-200/g, to: "bg-muted" },
  { from: /bg-gray-100/g, to: "bg-muted" },
  { from: /bg-gray-50/g, to: "bg-muted" },

  { from: /border-gray-900/g, to: "border-border" },
  { from: /border-gray-800/g, to: "border-border" },
  { from: /border-gray-700/g, to: "border-border" },
  { from: /border-gray-600/g, to: "border-border" },
  { from: /border-gray-500/g, to: "border-border" },
  { from: /border-gray-400/g, to: "border-border" },
  { from: /border-gray-300/g, to: "border-border" },
  { from: /border-gray-200/g, to: "border-border" },
  { from: /border-gray-100/g, to: "border-border" },

  { from: /hover:bg-gray-900/g, to: "hover:bg-muted" },
  { from: /hover:bg-gray-800/g, to: "hover:bg-muted" },
  { from: /hover:bg-gray-700/g, to: "hover:bg-muted" },
  { from: /hover:bg-gray-600/g, to: "hover:bg-muted" },
  { from: /hover:bg-gray-500/g, to: "hover:bg-muted" },
  { from: /hover:bg-gray-400/g, to: "hover:bg-muted" },
  { from: /hover:bg-gray-300/g, to: "hover:bg-muted" },
  { from: /hover:bg-gray-200/g, to: "hover:bg-muted" },
  { from: /hover:bg-gray-100/g, to: "hover:bg-muted" },
  { from: /hover:bg-gray-50/g, to: "hover:bg-muted" },

  { from: /hover:border-gray-(\d+)/g, to: "hover:border-muted-foreground" },
  { from: /focus:bg-gray-(\d+)/g, to: "focus:bg-muted" },
  { from: /focus:ring-gray-(\d+)/g, to: "focus:ring-muted-foreground" },
  {
    from: /placeholder:text-gray-(\d+)/g,
    to: "placeholder:text-muted-foreground",
  },
  { from: /focus:ring-offset-gray-(\d+)/g, to: "focus:ring-offset-background" },

  // Special cases
  { from: /bg-black/g, to: "bg-foreground" },
  { from: /bg-white/g, to: "bg-background" },
  { from: /text-white/g, to: "text-background" },
  { from: /border-white/g, to: "border-background" },

  // Purple -> Primary (promotion)
  {
    from: /bg-purple-(\d+)\s+dark:bg-purple-(\d+)/g,
    to: "bg-primary-$1 dark:bg-primary-$2",
  },
  {
    from: /text-purple-(\d+)\s+dark:text-purple-(\d+)/g,
    to: "text-primary-$1 dark:text-primary-$2",
  },
  {
    from: /border-purple-(\d+)\s+dark:border-purple-(\d+)/g,
    to: "border-primary-$1 dark:border-primary-$2",
  },
  { from: /bg-purple-(\d+)/g, to: "bg-primary-$1" },
  { from: /text-purple-(\d+)/g, to: "text-primary-$1" },
  { from: /border-purple-(\d+)/g, to: "border-primary-$1" },
];

function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  if (![".tsx", ".ts"].includes(ext)) return false;
  if (filePath.includes("node_modules")) return false;
  if (filePath.includes(".test.")) return false;
  if (filePath.includes(".spec.")) return false;
  if (filePath.includes(".stories.")) return false;
  if (filePath.includes("__tests__")) return false;
  if (filePath.includes("index.ts")) return false;
  if (filePath.includes("types.ts")) return false; // Garder types.ts comme référence
  if (filePath.includes("constants.ts")) return false;
  if (filePath.includes("utils.ts")) return false;
  if (filePath.includes("hooks.ts")) return false;
  if (filePath.includes("README.md")) return false;
  return true;
}

function fixComponent(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf-8");
    const originalContent = content;

    // Appliquer tous les remplacements
    replacements.forEach(({ from, to }) => {
      content = content.replace(from, to);
    });

    // Nettoyage final - supprimer les espaces multiples et les classes vides
    content = content.replace(/\s{2,}/g, " ");
    content = content.replace(/\s+'/g, "'");
    content = content.replace(/'\s+/g, "' ");
    content = content.replace(/\s+"/g, '"');
    content = content.replace(/"\s+/g, '" ');
    content = content.replace(/className="\s+"/g, 'className=""');
    content = content.replace(/className='\s+'/g, "className=''");

    // Si le contenu a changé, sauvegarder
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf-8");
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Erreur: ${filePath}:`, error.message);
    return false;
  }
}

function scanDirectory(dir) {
  let fixedCount = 0;
  let totalCount = 0;

  if (!fs.existsSync(dir)) return { fixedCount, totalCount };

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const result = scanDirectory(fullPath);
      fixedCount += result.fixedCount;
      totalCount += result.totalCount;
    } else if (entry.isFile() && shouldScanFile(fullPath)) {
      totalCount++;
      if (fixComponent(fullPath)) {
        fixedCount++;
        const relativePath = path.relative(COMPONENTS_DIR, fullPath);
        console.log(`✅ ${relativePath}`);
      }
    }
  }

  return { fixedCount, totalCount };
}

function main() {
  console.log(
    "🔍 Correction automatique finale de toutes les classes gray...\n",
  );

  const { fixedCount, totalCount } = scanDirectory(COMPONENTS_DIR);

  console.log(`\n📊 Résultats:`);
  console.log(`   Fichiers scannés: ${totalCount}`);
  console.log(`   Fichiers corrigés: ${fixedCount}`);
  console.log(`\n✅ Terminé!\n`);
}

if (require.main === module) {
  main();
}

module.exports = { fixComponent, scanDirectory };

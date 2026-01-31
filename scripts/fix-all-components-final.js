#!/usr/bin/env node

/**
 * Script FINAL pour corriger TOUTES les classes gray hardcodées
 * Version optimisée qui préserve le formatage et gère tous les cas
 */

const fs = require("fs");
const path = require("path");

const COMPONENTS_DIR = path.join(__dirname, "../apps/web/src/components");

function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  if (![".tsx", ".ts"].includes(ext)) return false;
  const basename = path.basename(filePath);
  if (basename.includes(".test.")) return false;
  if (basename.includes(".spec.")) return false;
  if (basename.includes(".stories.")) return false;
  if (filePath.includes("__tests__")) return false;
  if (basename === "types.ts") return false; // Garder types.ts comme référence
  if (basename === "constants.ts") return false; // Garder constants.ts comme référence
  if (basename.includes("README")) return false;
  return true;
}

function fixGrayClasses(content) {
  let fixed = content;

  // Phase 1: Patterns avec dark: combinés (priorité haute)
  const combinedPatterns = [
    // Text + dark:text
    [/text-gray-(\d+)\s+dark:text-gray-(\d+)/g, "text-muted-foreground"],
    [/text-gray-(\d+)\s+dark:text-white/g, "text-foreground"],
    [/text-gray-(\d+)\s+dark:text-(\w+)/g, "text-muted-foreground"],

    // Background + dark:bg
    [/bg-gray-(\d+)\s+dark:bg-gray-(\d+)/g, "bg-muted"],
    [/bg-gray-(\d+)\s+dark:bg-(\w+)/g, "bg-muted"],
    [/bg-white\s+dark:bg-gray-(\d+)/g, "bg-background"],
    [/bg-black\s+dark:bg-gray-900/g, "bg-foreground"],

    // Border + dark:border
    [/border-gray-(\d+)\s+dark:border-gray-(\d+)/g, "border-border"],
    [/border-gray-(\d+)\s+dark:border-(\w+)/g, "border-border"],

    // Hover + dark:hover
    [/hover:bg-gray-(\d+)\s+dark:hover:bg-gray-(\d+)/g, "hover:bg-muted"],
    [/hover:bg-gray-(\d+)\s+dark:hover:bg-(\w+)/g, "hover:bg-muted"],
    [
      /hover:border-gray-(\d+)\s+dark:hover:border-gray-(\d+)/g,
      "hover:border-border",
    ],
    [
      /hover:border-gray-(\d+)\s+dark:hover:border-(\w+)/g,
      "hover:border-muted-foreground",
    ],

    // Divide + dark:divide
    [/divide-gray-(\d+)\s+dark:divide-gray-(\d+)/g, "divide-border"],
    [
      /divide-y\s+divide-gray-(\d+)\s+dark:divide-gray-(\d+)/g,
      "divide-y divide-border",
    ],

    // Placeholder + dark:placeholder
    [
      /placeholder:text-gray-(\d+)\s+dark:placeholder:text-gray-(\d+)/g,
      "placeholder:text-muted-foreground",
    ],

    // Focus + dark:focus
    [
      /focus:ring-offset-gray-(\d+)\s+dark:focus:ring-offset-gray-(\d+)/g,
      "focus:ring-offset-background",
    ],
    [/focus:bg-gray-(\d+)\s+dark:focus:bg-gray-(\d+)/g, "focus:bg-muted"],
    [
      /focus:ring-gray-(\d+)\s+dark:focus:ring-gray-(\d+)/g,
      "focus:ring-muted-foreground",
    ],
  ];

  combinedPatterns.forEach(([pattern, replacement]) => {
    fixed = fixed.replace(pattern, replacement);
  });

  // Phase 2: Suppression des dark: simples
  const darkOnlyPatterns = [
    [/\s+dark:text-gray-(\d+)/g, ""],
    [/\s+dark:text-white/g, " text-foreground"],
    [/\s+dark:bg-gray-(\d+)/g, ""],
    [/\s+dark:bg-white/g, " bg-background"],
    [/\s+dark:border-gray-(\d+)/g, ""],
    [/\s+dark:hover:bg-gray-(\d+)/g, ""],
    [/\s+dark:hover:border-gray-(\d+)/g, ""],
    [/\s+dark:divide-gray-(\d+)/g, ""],
    [/\s+dark:placeholder:text-gray-(\d+)/g, ""],
    [/\s+dark:focus:ring-offset-gray-(\d+)/g, ""],
    [/\s+dark:focus:bg-gray-(\d+)/g, ""],
    [/\s+dark:focus:ring-gray-(\d+)/g, ""],
  ];

  darkOnlyPatterns.forEach(([pattern, replacement]) => {
    fixed = fixed.replace(pattern, replacement);
  });

  // Phase 3: Remplacements simples (sans dark:)
  const simplePatterns = [
    // Text
    [/text-gray-900/g, "text-foreground"],
    [/text-gray-800/g, "text-foreground"],
    [/text-gray-700/g, "text-foreground"],
    [/text-gray-600/g, "text-muted-foreground"],
    [/text-gray-500/g, "text-muted-foreground"],
    [/text-gray-400/g, "text-muted-foreground"],
    [/text-gray-300/g, "text-muted-foreground"],

    // Background
    [/bg-gray-900/g, "bg-background"],
    [/bg-gray-800/g, "bg-muted"],
    [/bg-gray-700/g, "bg-muted"],
    [/bg-gray-600/g, "bg-muted"],
    [/bg-gray-500/g, "bg-muted"],
    [/bg-gray-400/g, "bg-muted"],
    [/bg-gray-300/g, "bg-muted"],
    [/bg-gray-200/g, "bg-muted"],
    [/bg-gray-100/g, "bg-muted"],
    [/bg-gray-50/g, "bg-muted"],

    // Border
    [/border-gray-900/g, "border-border"],
    [/border-gray-800/g, "border-border"],
    [/border-gray-700/g, "border-border"],
    [/border-gray-600/g, "border-border"],
    [/border-gray-500/g, "border-border"],
    [/border-gray-400/g, "border-border"],
    [/border-gray-300/g, "border-border"],
    [/border-gray-200/g, "border-border"],
    [/border-gray-100/g, "border-border"],

    // Hover
    [/hover:bg-gray-900/g, "hover:bg-muted"],
    [/hover:bg-gray-800/g, "hover:bg-muted"],
    [/hover:bg-gray-700/g, "hover:bg-muted"],
    [/hover:bg-gray-600/g, "hover:bg-muted"],
    [/hover:bg-gray-500/g, "hover:bg-muted"],
    [/hover:bg-gray-400/g, "hover:bg-muted"],
    [/hover:bg-gray-300/g, "hover:bg-muted"],
    [/hover:bg-gray-200/g, "hover:bg-muted"],
    [/hover:bg-gray-100/g, "hover:bg-muted"],
    [/hover:bg-gray-50/g, "hover:bg-muted"],
    [/hover:border-gray-(\d+)/g, "hover:border-muted-foreground"],

    // Divide
    [/divide-gray-900/g, "divide-border"],
    [/divide-gray-800/g, "divide-border"],
    [/divide-gray-700/g, "divide-border"],
    [/divide-gray-600/g, "divide-border"],
    [/divide-gray-500/g, "divide-border"],
    [/divide-gray-400/g, "divide-border"],
    [/divide-gray-300/g, "divide-border"],
    [/divide-gray-200/g, "divide-border"],
    [/divide-gray-100/g, "divide-border"],

    // Focus
    [/focus:bg-gray-(\d+)/g, "focus:bg-muted"],
    [/focus:ring-gray-(\d+)/g, "focus:ring-muted-foreground"],
    [/focus:ring-offset-gray-(\d+)/g, "focus:ring-offset-background"],

    // Placeholder
    [/placeholder:text-gray-(\d+)/g, "placeholder:text-muted-foreground"],
  ];

  simplePatterns.forEach(([pattern, replacement]) => {
    fixed = fixed.replace(pattern, replacement);
  });

  // Phase 4: Special cases
  fixed = fixed.replace(/bg-black/g, "bg-foreground");
  fixed = fixed.replace(/bg-white/g, "bg-background");
  fixed = fixed.replace(/text-white/g, "text-background");
  fixed = fixed.replace(/border-white/g, "border-background");

  // Purple -> Primary
  fixed = fixed.replace(
    /bg-purple-(\d+)\s+dark:bg-purple-(\d+)/g,
    "bg-primary-$1 dark:bg-primary-$2",
  );
  fixed = fixed.replace(
    /text-purple-(\d+)\s+dark:text-purple-(\d+)/g,
    "text-primary-$1 dark:text-primary-$2",
  );
  fixed = fixed.replace(
    /border-purple-(\d+)\s+dark:border-purple-(\d+)/g,
    "border-primary-$1 dark:border-primary-$2",
  );
  fixed = fixed.replace(/bg-purple-(\d+)/g, "bg-primary-$1");
  fixed = fixed.replace(/text-purple-(\d+)/g, "text-primary-$1");
  fixed = fixed.replace(/border-purple-(\d+)/g, "border-primary-$1");

  // Nettoyage final - supprimer les espaces multiples mais préserver les retours à la ligne
  // Ne pas toucher aux retours à la ligne, juste nettoyer les espaces dans les chaînes
  fixed = fixed.replace(
    /className="([^"]*)\s{2,}([^"]*)"/g,
    (match, p1, p2) => {
      return `className="${p1.trim()} ${p2.trim()}"`;
    },
  );
  fixed = fixed.replace(
    /className='([^']*)\s{2,}([^']*)'/g,
    (match, p1, p2) => {
      return `className='${p1.trim()} ${p2.trim()}'`;
    },
  );

  // Supprimer les classes vides
  fixed = fixed.replace(/className="\s+"/g, 'className=""');
  fixed = fixed.replace(/className='\s+'/g, "className=''");

  return fixed;
}

function fixComponent(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const fixed = fixGrayClasses(content);

    if (content !== fixed) {
      fs.writeFileSync(filePath, fixed, "utf-8");
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ ${filePath}:`, error.message);
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
  console.log("🔍 Correction FINALE de toutes les classes gray...\n");

  const { fixedCount, totalCount } = scanDirectory(COMPONENTS_DIR);

  console.log(`\n📊 Résultats:`);
  console.log(`   Fichiers scannés: ${totalCount}`);
  console.log(`   Fichiers corrigés: ${fixedCount}`);
  console.log(`\n✅ Terminé!\n`);
}

if (require.main === module) {
  main();
}

module.exports = { fixGrayClasses, fixComponent, scanDirectory };

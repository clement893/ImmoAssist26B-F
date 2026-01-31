#!/usr/bin/env node

/**
 * Script pour corriger TOUTES les classes gray hardcodées
 * Version améliorée qui gère tous les cas
 */

const fs = require("fs");
const path = require("path");

const COMPONENTS_DIR = path.join(__dirname, "../apps/web/src/components");

function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  return (
    [".tsx", ".ts"].includes(ext) &&
    !filePath.includes("node_modules") &&
    !filePath.includes(".test.") &&
    !filePath.includes(".spec.") &&
    !filePath.includes(".stories.") &&
    !filePath.includes("__tests__") &&
    !filePath.includes("index.ts") &&
    !filePath.includes("types.ts") &&
    !filePath.includes("constants.ts") &&
    !filePath.includes("utils.ts") &&
    !filePath.includes("hooks.ts") &&
    !filePath.includes("README.md")
  );
}

function fixGrayClasses(content) {
  let fixed = content;

  // Remplacements avec dark: combinés (priorité haute)
  fixed = fixed.replace(
    /text-gray-(\d+)\s+dark:text-gray-(\d+)/g,
    "text-muted-foreground",
  );
  fixed = fixed.replace(
    /text-gray-(\d+)\s+dark:text-white/g,
    "text-foreground",
  );
  fixed = fixed.replace(
    /text-gray-(\d+)\s+dark:text-(\w+)/g,
    "text-muted-foreground",
  );

  fixed = fixed.replace(/bg-gray-(\d+)\s+dark:bg-gray-(\d+)/g, "bg-muted");
  fixed = fixed.replace(/bg-gray-(\d+)\s+dark:bg-(\w+)/g, "bg-muted");
  fixed = fixed.replace(/bg-white\s+dark:bg-gray-(\d+)/g, "bg-background");
  fixed = fixed.replace(/bg-black\s+dark:bg-gray-900/g, "bg-foreground");

  fixed = fixed.replace(
    /border-gray-(\d+)\s+dark:border-gray-(\d+)/g,
    "border-border",
  );
  fixed = fixed.replace(
    /border-gray-(\d+)\s+dark:border-(\w+)/g,
    "border-border",
  );

  fixed = fixed.replace(
    /hover:bg-gray-(\d+)\s+dark:hover:bg-gray-(\d+)/g,
    "hover:bg-muted",
  );
  fixed = fixed.replace(
    /hover:bg-gray-(\d+)\s+dark:hover:bg-(\w+)/g,
    "hover:bg-muted",
  );
  fixed = fixed.replace(
    /hover:border-gray-(\d+)\s+dark:hover:border-gray-(\d+)/g,
    "hover:border-border",
  );
  fixed = fixed.replace(
    /hover:border-gray-(\d+)\s+dark:hover:border-(\w+)/g,
    "hover:border-muted-foreground",
  );

  fixed = fixed.replace(
    /placeholder:text-gray-(\d+)\s+dark:placeholder:text-gray-(\d+)/g,
    "placeholder:text-muted-foreground",
  );
  fixed = fixed.replace(
    /focus:ring-offset-gray-(\d+)\s+dark:focus:ring-offset-gray-(\d+)/g,
    "focus:ring-offset-background",
  );

  // Remplacements simples dark: (suppression)
  fixed = fixed.replace(/\s*dark:text-gray-(\d+)/g, "");
  fixed = fixed.replace(/\s*dark:text-white/g, " text-foreground");
  fixed = fixed.replace(/\s*dark:bg-gray-(\d+)/g, "");
  fixed = fixed.replace(/\s*dark:bg-white/g, " bg-background");
  fixed = fixed.replace(/\s*dark:border-gray-(\d+)/g, "");
  fixed = fixed.replace(/\s*dark:hover:bg-gray-(\d+)/g, "");
  fixed = fixed.replace(/\s*dark:hover:border-gray-(\d+)/g, "");
  fixed = fixed.replace(/\s*dark:placeholder:text-gray-(\d+)/g, "");
  fixed = fixed.replace(/\s*dark:focus:ring-offset-gray-(\d+)/g, "");
  fixed = fixed.replace(/\s*dark:focus:bg-gray-(\d+)/g, "");

  // Remplacements simples sans dark:
  fixed = fixed.replace(/text-gray-(\d+)/g, (match, shade) => {
    const num = parseInt(shade);
    if (num >= 900) return "text-foreground";
    if (num >= 700) return "text-foreground";
    return "text-muted-foreground";
  });

  fixed = fixed.replace(/bg-gray-(\d+)/g, (match, shade) => {
    const num = parseInt(shade);
    if (num >= 900) return "bg-background";
    if (num >= 800) return "bg-muted";
    if (num >= 700) return "bg-muted";
    return "bg-muted";
  });

  fixed = fixed.replace(/border-gray-(\d+)/g, "border-border");
  fixed = fixed.replace(/hover:bg-gray-(\d+)/g, "hover:bg-muted");
  fixed = fixed.replace(
    /hover:border-gray-(\d+)/g,
    "hover:border-muted-foreground",
  );
  fixed = fixed.replace(
    /placeholder:text-gray-(\d+)/g,
    "placeholder:text-muted-foreground",
  );
  fixed = fixed.replace(
    /focus:ring-offset-gray-(\d+)/g,
    "focus:ring-offset-background",
  );
  fixed = fixed.replace(/focus:bg-gray-(\d+)/g, "focus:bg-muted");

  // Special cases
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

  // Nettoyage des espaces multiples
  fixed = fixed.replace(/\s{2,}/g, " ");
  fixed = fixed.replace(/\s+'/g, "'");
  fixed = fixed.replace(/'\s+/g, "' ");
  fixed = fixed.replace(/\s+"/g, '"');
  fixed = fixed.replace(/"\s+/g, '" ');
  fixed = fixed.replace(/className="\s+"/g, 'className=""');
  fixed = fixed.replace(/className='\s+'/g, "className=''");
  fixed = fixed.replace(/\s+className/g, " className");
  fixed = fixed.replace(/className\s+/g, "className ");

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
    console.error(
      `❌ Erreur lors de la correction de ${filePath}:`,
      error.message,
    );
    return false;
  }
}

function scanDirectory(dir) {
  let fixedCount = 0;
  let totalCount = 0;

  if (!fs.existsSync(dir)) {
    return { fixedCount, totalCount };
  }

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
        console.log(`✅ Corrigé: ${relativePath}`);
      }
    }
  }

  return { fixedCount, totalCount };
}

function main() {
  console.log(
    "🔍 Correction automatique de TOUTES les classes gray hardcodées...\n",
  );

  const { fixedCount, totalCount } = scanDirectory(COMPONENTS_DIR);

  console.log(`\n📊 Statistiques:`);
  console.log(`   Total de fichiers scannés: ${totalCount}`);
  console.log(`   Fichiers corrigés: ${fixedCount}`);
  console.log(`\n✅ Correction terminée!\n`);
}

if (require.main === module) {
  main();
}

module.exports = { fixGrayClasses, fixComponent, scanDirectory };

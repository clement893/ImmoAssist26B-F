#!/usr/bin/env node

/**
 * Script pour corriger automatiquement tous les composants restants sans thème
 * Remplace toutes les couleurs hardcodées par des classes thématisées
 */

const fs = require("fs");
const path = require("path");

const COMPONENTS_DIR = path.join(__dirname, "../apps/web/src/components");

// Mappings de remplacement - Version améliorée
const replacements = [
  // Text colors avec dark: combinés (priorité haute)
  {
    pattern: /text-gray-(\d+)\s+dark:text-gray-(\d+)/g,
    replacement: "text-muted-foreground",
  },
  {
    pattern: /text-gray-(\d+)\s+dark:text-white/g,
    replacement: "text-foreground",
  },
  {
    pattern: /text-gray-(\d+)\s+dark:text-(\w+)/g,
    replacement: "text-muted-foreground",
  },
  { pattern: /dark:text-gray-(\d+)/g, replacement: "" },
  { pattern: /dark:text-white/g, replacement: "text-foreground" },
  {
    pattern: /text-gray-(\d+)/g,
    replacement: (match, shade) => {
      const num = parseInt(shade);
      if (num >= 900) return "text-foreground";
      if (num >= 700) return "text-foreground";
      if (num >= 500) return "text-muted-foreground";
      if (num >= 400) return "text-muted-foreground";
      return "text-muted-foreground";
    },
  },

  // Background colors avec dark: combinés (priorité haute)
  { pattern: /bg-gray-(\d+)\s+dark:bg-gray-(\d+)/g, replacement: "bg-muted" },
  { pattern: /bg-gray-(\d+)\s+dark:bg-(\w+)/g, replacement: "bg-muted" },
  { pattern: /bg-white\s+dark:bg-gray-(\d+)/g, replacement: "bg-background" },
  { pattern: /bg-black\s+dark:bg-gray-900/g, replacement: "bg-foreground" },
  { pattern: /dark:bg-gray-(\d+)/g, replacement: "" },
  {
    pattern: /bg-gray-(\d+)/g,
    replacement: (match, shade) => {
      const num = parseInt(shade);
      if (num >= 900) return "bg-background";
      if (num >= 800) return "bg-muted";
      if (num >= 700) return "bg-muted";
      if (num >= 200) return "bg-muted";
      if (num >= 100) return "bg-muted";
      if (num >= 50) return "bg-muted";
      return "bg-muted";
    },
  },

  // Hover backgrounds avec dark: combinés (priorité haute)
  {
    pattern: /hover:bg-gray-(\d+)\s+dark:hover:bg-gray-(\d+)/g,
    replacement: "hover:bg-muted",
  },
  {
    pattern: /hover:bg-gray-(\d+)\s+dark:hover:bg-(\w+)/g,
    replacement: "hover:bg-muted",
  },
  { pattern: /dark:hover:bg-gray-(\d+)/g, replacement: "" },
  { pattern: /hover:bg-gray-(\d+)/g, replacement: "hover:bg-muted" },

  // Focus backgrounds avec dark: combinés
  {
    pattern: /focus:bg-gray-(\d+)\s+dark:focus:bg-gray-(\d+)/g,
    replacement: "focus:bg-muted",
  },
  { pattern: /dark:focus:bg-gray-(\d+)/g, replacement: "" },
  { pattern: /focus:bg-gray-(\d+)/g, replacement: "focus:bg-muted" },

  // Border colors avec dark: combinés (priorité haute)
  {
    pattern: /border-gray-(\d+)\s+dark:border-gray-(\d+)/g,
    replacement: "border-border",
  },
  {
    pattern: /border-gray-(\d+)\s+dark:border-(\w+)/g,
    replacement: "border-border",
  },
  { pattern: /dark:border-gray-(\d+)/g, replacement: "" },
  { pattern: /border-gray-(\d+)/g, replacement: "border-border" },

  // Hover borders avec dark: combinés
  {
    pattern: /hover:border-gray-(\d+)\s+dark:hover:border-gray-(\d+)/g,
    replacement: "hover:border-border",
  },
  {
    pattern: /hover:border-gray-(\d+)\s+dark:hover:border-(\w+)/g,
    replacement: "hover:border-muted-foreground",
  },
  { pattern: /dark:hover:border-gray-(\d+)/g, replacement: "" },
  {
    pattern: /hover:border-gray-(\d+)/g,
    replacement: "hover:border-muted-foreground",
  },

  // Placeholder colors
  {
    pattern: /placeholder:text-gray-(\d+)\s+dark:placeholder:text-gray-(\d+)/g,
    replacement: "placeholder:text-muted-foreground",
  },
  { pattern: /dark:placeholder:text-gray-(\d+)/g, replacement: "" },
  {
    pattern: /placeholder:text-gray-(\d+)/g,
    replacement: "placeholder:text-muted-foreground",
  },

  // Focus ring offsets
  {
    pattern:
      /focus:ring-offset-gray-(\d+)\s+dark:focus:ring-offset-gray-(\d+)/g,
    replacement: "focus:ring-offset-background",
  },
  { pattern: /dark:focus:ring-offset-gray-(\d+)/g, replacement: "" },
  {
    pattern: /focus:ring-offset-gray-(\d+)/g,
    replacement: "focus:ring-offset-background",
  },

  // Purple (promotion) -> Primary
  {
    pattern: /bg-purple-(\d+)\s+dark:bg-purple-(\d+)/g,
    replacement: "bg-primary-$1 dark:bg-primary-$2",
  },
  {
    pattern: /text-purple-(\d+)\s+dark:text-purple-(\d+)/g,
    replacement: "text-primary-$1 dark:text-primary-$2",
  },
  {
    pattern: /border-purple-(\d+)\s+dark:border-purple-(\d+)/g,
    replacement: "border-primary-$1 dark:border-primary-$2",
  },
  { pattern: /bg-purple-(\d+)/g, replacement: "bg-primary-$1" },
  { pattern: /text-purple-(\d+)/g, replacement: "text-primary-$1" },
  { pattern: /border-purple-(\d+)/g, replacement: "border-primary-$1" },

  // Special cases
  { pattern: /bg-black\s+dark:bg-gray-900/g, replacement: "bg-foreground" },
  { pattern: /bg-black/g, replacement: "bg-foreground" },
  { pattern: /bg-white\s+dark:bg-gray-(\d+)/g, replacement: "bg-background" },
  { pattern: /bg-white/g, replacement: "bg-background" },
  { pattern: /text-white/g, replacement: "text-background" },

  // Nettoyage des espaces multiples après suppression de dark:
  { pattern: /\s+/g, replacement: " " },
  { pattern: /\s+'/g, replacement: "'" },
  { pattern: /'\s+/g, replacement: "' " },
];

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

function fixComponent(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf-8");
    let modified = false;
    const originalContent = content;

    // Apply all replacements multiple times until no more changes
    let changed = true;
    let iterations = 0;
    while (changed && iterations < 10) {
      changed = false;
      const beforeReplace = content;

      replacements.forEach(({ pattern, replacement }) => {
        if (typeof replacement === "function") {
          content = content.replace(pattern, replacement);
        } else {
          content = content.replace(pattern, replacement);
        }
      });

      if (content !== beforeReplace) {
        changed = true;
      }
      iterations++;
    }

    // Nettoyage final - supprimer les classes vides et les espaces multiples
    content = content.replace(/className="\s+"/g, 'className=""');
    content = content.replace(/className='\s+'/g, "className=''");
    content = content.replace(/\s{2,}/g, " ");
    content = content.replace(/\s+"/g, '"');
    content = content.replace(/"\s+/g, '" ');
    content = content.replace(/\s+'/g, "'");
    content = content.replace(/'\s+/g, "' ");

    // Check if content was modified
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf-8");
      modified = true;
    }

    return modified;
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
  console.log("🔍 Correction automatique de tous les composants...\n");

  const { fixedCount, totalCount } = scanDirectory(COMPONENTS_DIR);

  console.log(`\n📊 Statistiques:`);
  console.log(`   Total de fichiers scannés: ${totalCount}`);
  console.log(`   Fichiers corrigés: ${fixedCount}`);
  console.log(`\n✅ Correction terminée!\n`);
}

if (require.main === module) {
  main();
}

module.exports = { fixComponent, scanDirectory };

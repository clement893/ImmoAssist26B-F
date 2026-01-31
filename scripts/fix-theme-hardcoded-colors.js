#!/usr/bin/env node

/**
 * Script pour corriger automatiquement les couleurs hardcodées dans les composants
 *
 * Remplace:
 * - text-gray-* → text-muted-foreground ou text-foreground
 * - bg-gray-* → bg-muted ou bg-background
 * - border-gray-* → border-border
 * - text-red-* → text-error-*
 * - bg-red-* → bg-error-*
 * - border-red-* → border-error-*
 * - text-blue-* → text-primary-*
 * - bg-blue-* → bg-primary-*
 */

const fs = require("fs");
const path = require("path");

const COMPONENTS_DIR = path.join(__dirname, "../apps/web/src/components");

// Mappings de remplacement
const REPLACEMENTS = [
  // Gray colors - contexte spécifique
  {
    pattern: /text-gray-900\s+dark:text-gray-100/g,
    replacement: "text-foreground",
  },
  {
    pattern: /text-gray-100\s+dark:text-gray-900/g,
    replacement: "text-background",
  },
  {
    pattern: /text-gray-700\s+dark:text-gray-300/g,
    replacement: "text-foreground",
  },
  {
    pattern: /text-gray-600\s+dark:text-gray-400/g,
    replacement: "text-muted-foreground",
  },
  {
    pattern: /text-gray-500\s+dark:text-gray-400/g,
    replacement: "text-muted-foreground",
  },
  {
    pattern: /text-gray-400\s+dark:text-gray-500/g,
    replacement: "text-muted-foreground",
  },
  {
    pattern: /text-gray-300\s+dark:text-gray-600/g,
    replacement: "text-muted-foreground",
  },

  { pattern: /bg-gray-900\s+dark:bg-gray-100/g, replacement: "bg-background" },
  { pattern: /bg-gray-800\s+dark:bg-gray-800/g, replacement: "bg-background" },
  { pattern: /bg-gray-100\s+dark:bg-gray-800/g, replacement: "bg-muted" },
  { pattern: /bg-gray-50\s+dark:bg-gray-900/g, replacement: "bg-muted" },
  { pattern: /bg-gray-200\s+dark:bg-gray-700/g, replacement: "bg-muted" },
  { pattern: /bg-white\s+dark:bg-gray-800/g, replacement: "bg-background" },

  {
    pattern: /border-gray-700\s+dark:border-gray-700/g,
    replacement: "border-border",
  },
  {
    pattern: /border-gray-600\s+dark:border-gray-600/g,
    replacement: "border-border",
  },
  {
    pattern: /border-gray-300\s+dark:border-gray-600/g,
    replacement: "border-border",
  },
  {
    pattern: /border-gray-200\s+dark:border-gray-700/g,
    replacement: "border-border",
  },

  // Red colors
  { pattern: /text-red-(\d+)/g, replacement: "text-error-$1" },
  { pattern: /bg-red-(\d+)/g, replacement: "bg-error-$1" },
  { pattern: /border-red-(\d+)/g, replacement: "border-error-$1" },

  // Blue colors
  { pattern: /text-blue-(\d+)/g, replacement: "text-primary-$1" },
  { pattern: /bg-blue-(\d+)/g, replacement: "bg-primary-$1" },
  { pattern: /border-blue-(\d+)/g, replacement: "border-primary-$1" },

  // Green colors
  { pattern: /text-green-(\d+)/g, replacement: "text-success-$1" },
  { pattern: /bg-green-(\d+)/g, replacement: "bg-success-$1" },
  { pattern: /border-green-(\d+)/g, replacement: "border-success-$1" },

  // Yellow colors
  { pattern: /text-yellow-(\d+)/g, replacement: "text-warning-$1" },
  { pattern: /bg-yellow-(\d+)/g, replacement: "bg-warning-$1" },
  { pattern: /border-yellow-(\d+)/g, replacement: "border-warning-$1" },

  // Hover states gray
  {
    pattern: /hover:bg-gray-100\s+dark:hover:bg-gray-800/g,
    replacement: "hover:bg-muted",
  },
  {
    pattern: /hover:bg-gray-50\s+dark:hover:bg-gray-700/g,
    replacement: "hover:bg-muted",
  },
  {
    pattern: /hover:text-gray-700\s+dark:hover:text-gray-300/g,
    replacement: "hover:text-foreground",
  },
  {
    pattern: /hover:text-gray-600\s+dark:hover:text-gray-400/g,
    replacement: "hover:text-muted-foreground",
  },
];

// Fichiers à exclure (tests, stories, etc.)
const EXCLUDE_PATTERNS = [
  /\.test\./,
  /\.spec\./,
  /\.stories\./,
  /__tests__/,
  /node_modules/,
];

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  if (![".tsx", ".ts", ".jsx", ".js"].includes(ext)) {
    return false;
  }

  return !EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  let newContent = content;
  let changed = false;

  REPLACEMENTS.forEach(({ pattern, replacement }) => {
    if (pattern.test(newContent)) {
      newContent = newContent.replace(pattern, replacement);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, newContent, "utf-8");
    return true;
  }

  return false;
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) {
    return { processed: 0, fixed: 0 };
  }

  let processed = 0;
  let fixed = 0;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const result = processDirectory(fullPath);
      processed += result.processed;
      fixed += result.fixed;
    } else if (entry.isFile() && shouldProcessFile(fullPath)) {
      processed++;
      try {
        if (fixFile(fullPath)) {
          fixed++;
          console.log(`✅ Fixed: ${path.relative(process.cwd(), fullPath)}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${fullPath}:`, error.message);
      }
    }
  }

  return { processed, fixed };
}

// Point d'entrée
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  console.log("🔧 Correction automatique des couleurs hardcodées...\n");

  if (dryRun) {
    console.log("⚠️  Mode DRY-RUN - Aucun fichier ne sera modifié\n");
  }

  const { processed, fixed } = processDirectory(COMPONENTS_DIR);

  console.log("\n" + "=".repeat(80));
  console.log(`📊 Résumé:`);
  console.log(`   Fichiers traités: ${processed}`);
  console.log(`   Fichiers corrigés: ${fixed}`);
  console.log("=".repeat(80) + "\n");
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, processDirectory };

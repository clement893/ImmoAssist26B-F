#!/usr/bin/env node

/**
 * Script complet pour corriger automatiquement TOUTES les couleurs hardcodées
 * dans tous les fichiers du projet
 */

const fs = require("fs");
const path = require("path");

const COMPONENTS_DIR = path.join(__dirname, "../apps/web/src/components");
const APP_DIR = path.join(__dirname, "../apps/web/src/app");

// Remplacements complets
const REPLACEMENTS = [
  // Gray text colors
  { from: /text-gray-900\s+dark:text-gray-100/g, to: "text-foreground" },
  { from: /text-gray-100\s+dark:text-gray-900/g, to: "text-background" },
  { from: /text-gray-800\s+dark:text-gray-200/g, to: "text-foreground" },
  { from: /text-gray-700\s+dark:text-gray-300/g, to: "text-foreground" },
  { from: /text-gray-600\s+dark:text-gray-400/g, to: "text-muted-foreground" },
  { from: /text-gray-500\s+dark:text-gray-400/g, to: "text-muted-foreground" },
  { from: /text-gray-500\s+dark:text-gray-500/g, to: "text-muted-foreground" },
  { from: /text-gray-400\s+dark:text-gray-500/g, to: "text-muted-foreground" },
  { from: /text-gray-400\s+dark:text-gray-400/g, to: "text-muted-foreground" },
  { from: /text-gray-300\s+dark:text-gray-600/g, to: "text-muted-foreground" },

  // Gray background colors
  { from: /bg-gray-900\s+dark:bg-gray-100/g, to: "bg-background" },
  { from: /bg-gray-800\s+dark:bg-gray-800/g, to: "bg-background" },
  { from: /bg-gray-100\s+dark:bg-gray-800/g, to: "bg-muted" },
  { from: /bg-gray-50\s+dark:bg-gray-900/g, to: "bg-muted" },
  { from: /bg-gray-50\s+dark:bg-gray-800/g, to: "bg-muted" },
  { from: /bg-gray-200\s+dark:bg-gray-700/g, to: "bg-muted" },
  { from: /bg-white\s+dark:bg-gray-800/g, to: "bg-background" },

  // Gray border colors
  { from: /border-gray-700\s+dark:border-gray-700/g, to: "border-border" },
  { from: /border-gray-600\s+dark:border-gray-600/g, to: "border-border" },
  { from: /border-gray-300\s+dark:border-gray-600/g, to: "border-border" },
  { from: /border-gray-200\s+dark:border-gray-700/g, to: "border-border" },

  // Hover states
  { from: /hover:bg-gray-100\s+dark:hover:bg-gray-800/g, to: "hover:bg-muted" },
  { from: /hover:bg-gray-50\s+dark:hover:bg-gray-700/g, to: "hover:bg-muted" },
  {
    from: /hover:text-gray-700\s+dark:hover:text-gray-300/g,
    to: "hover:text-foreground",
  },
  {
    from: /hover:text-gray-600\s+dark:hover:text-gray-400/g,
    to: "hover:text-muted-foreground",
  },

  // Red colors
  { from: /text-red-(\d+)/g, to: "text-error-$1" },
  { from: /bg-red-(\d+)/g, to: "bg-error-$1" },
  { from: /border-red-(\d+)/g, to: "border-error-$1" },
  { from: /hover:text-red-(\d+)/g, to: "hover:text-error-$1" },
  { from: /hover:bg-red-(\d+)/g, to: "hover:bg-error-$1" },

  // Blue colors
  { from: /text-blue-(\d+)/g, to: "text-primary-$1" },
  { from: /bg-blue-(\d+)/g, to: "bg-primary-$1" },
  { from: /border-blue-(\d+)/g, to: "border-primary-$1" },
  { from: /hover:text-blue-(\d+)/g, to: "hover:text-primary-$1" },
  { from: /hover:bg-blue-(\d+)/g, to: "hover:bg-primary-$1" },

  // Green colors
  { from: /text-green-(\d+)/g, to: "text-success-$1" },
  { from: /bg-green-(\d+)/g, to: "bg-success-$1" },
  { from: /border-green-(\d+)/g, to: "border-success-$1" },

  // Yellow colors
  { from: /text-yellow-(\d+)/g, to: "text-warning-$1" },
  { from: /bg-yellow-(\d+)/g, to: "bg-warning-$1" },
  { from: /border-yellow-(\d+)/g, to: "border-warning-$1" },
];

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  if (![".tsx", ".ts", ".jsx", ".js"].includes(ext)) return false;

  const excludePatterns = [
    /\.test\./,
    /\.spec\./,
    /\.stories\./,
    /__tests__/,
    /node_modules/,
  ];

  return !excludePatterns.some((pattern) => pattern.test(filePath));
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  let originalContent = content;

  REPLACEMENTS.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, "utf-8");
    return true;
  }

  return false;
}

function processDirectory(dir, stats = { processed: 0, fixed: 0, files: [] }) {
  if (!fs.existsSync(dir)) return stats;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath, stats);
    } else if (entry.isFile() && shouldProcessFile(fullPath)) {
      stats.processed++;
      try {
        if (fixFile(fullPath)) {
          stats.fixed++;
          stats.files.push(path.relative(process.cwd(), fullPath));
        }
      } catch (error) {
        console.error(`❌ Error: ${fullPath}`, error.message);
      }
    }
  }

  return stats;
}

// Main
function main() {
  console.log("🔧 Correction automatique des couleurs hardcodées...\n");

  const stats = { processed: 0, fixed: 0, files: [] };

  [COMPONENTS_DIR, APP_DIR].forEach((dir) => {
    if (fs.existsSync(dir)) {
      processDirectory(dir, stats);
    }
  });

  console.log("\n" + "=".repeat(80));
  console.log("📊 Résumé:");
  console.log(`   Fichiers traités: ${stats.processed}`);
  console.log(`   Fichiers corrigés: ${stats.fixed}`);

  if (stats.files.length > 0) {
    console.log("\n✅ Fichiers corrigés:");
    stats.files.slice(0, 20).forEach((file) => {
      console.log(`   - ${file}`);
    });
    if (stats.files.length > 20) {
      console.log(`   ... et ${stats.files.length - 20} autres`);
    }
  }

  console.log("=".repeat(80) + "\n");
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, processDirectory };

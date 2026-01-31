#!/usr/bin/env node

/**
 * Script d'audit pour détecter les problèmes d'unification du thème
 *
 * Usage: node scripts/audit-theme-unification.js [options]
 *
 * Options:
 *   --fix    Tente de corriger automatiquement les problèmes détectés
 *   --json   Sortie en format JSON
 *   --verbose   Affiche plus de détails
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const COMPONENTS_DIR = path.join(__dirname, "../apps/web/src/components");
const APP_DIR = path.join(__dirname, "../apps/web/src/app");
const LIB_DIR = path.join(__dirname, "../apps/web/src/lib");

// Couleurs hardcodées à détecter (regex patterns)
const HARDCODED_COLORS = [
  // Tailwind color classes
  /text-(red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone)-\d+/g,
  /bg-(red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone)-\d+/g,
  /border-(red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone)-\d+/g,
  // Hex colors in styles
  /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})/g,
  // RGB colors
  /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g,
  /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/g,
];

// Classes à remplacer par des variables CSS
const REPLACEMENT_MAP = {
  "text-red-": "text-error-",
  "text-blue-": "text-primary-",
  "text-green-": "text-success-",
  "text-yellow-": "text-warning-",
  "bg-red-": "bg-error-",
  "bg-blue-": "bg-primary-",
  "bg-green-": "bg-success-",
  "bg-yellow-": "bg-warning-",
  "border-red-": "border-error-",
  "border-blue-": "border-primary-",
  "border-green-": "border-success-",
  "border-yellow-": "border-warning-",
  "border-gray-": "border-border",
  "text-gray-": "text-muted-foreground",
  "bg-gray-": "bg-muted",
};

// Statistiques
const stats = {
  filesScanned: 0,
  filesWithIssues: 0,
  hardcodedColors: 0,
  hardcodedHexColors: 0,
  hardcodedRgbColors: 0,
  nonThematicClasses: 0,
  issues: [],
};

/**
 * Vérifie si un fichier doit être analysé
 */
function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  return (
    [".tsx", ".ts", ".jsx", ".js"].includes(ext) &&
    !filePath.includes("node_modules") &&
    !filePath.includes(".test.") &&
    !filePath.includes(".spec.") &&
    !filePath.includes("__tests__") &&
    !filePath.includes(".stories.")
  );
}

/**
 * Analyse un fichier pour détecter les problèmes de thème
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(process.cwd(), filePath);
  const issues = [];

  // Détecter les couleurs hardcodées dans className
  const classNameMatches =
    content.match(/className=["'`]([^"'`]+)["'`]/g) || [];
  classNameMatches.forEach((match) => {
    const classNameContent = match.match(/["'`]([^"'`]+)["'`]/)[1];

    HARDCODED_COLORS.slice(0, 3).forEach((pattern, index) => {
      const matches = classNameContent.match(pattern);
      if (matches) {
        matches.forEach((m) => {
          issues.push({
            type: "hardcoded-color-class",
            severity: "high",
            line: getLineNumber(content, match),
            match: m,
            suggestion: getSuggestion(m),
            context: getContext(content, match),
          });
          stats.hardcodedColors++;
          if (index === 0) stats.nonThematicClasses++;
        });
      }
    });
  });

  // Détecter les couleurs hex dans styles inline
  const styleMatches = content.match(/style={[^}]+}/g) || [];
  styleMatches.forEach((match) => {
    const hexMatches = match.match(/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})/g);
    if (hexMatches) {
      hexMatches.forEach((m) => {
        issues.push({
          type: "hardcoded-hex-color",
          severity: "high",
          line: getLineNumber(content, match),
          match: m,
          suggestion:
            "Utiliser var(--color-*) ou une classe Tailwind thématisée",
          context: getContext(content, match),
        });
        stats.hardcodedHexColors++;
      });
    }

    const rgbMatches = match.match(/rgb\([^)]+\)/g);
    if (rgbMatches) {
      rgbMatches.forEach((m) => {
        issues.push({
          type: "hardcoded-rgb-color",
          severity: "high",
          line: getLineNumber(content, match),
          match: m,
          suggestion:
            "Utiliser var(--color-*) ou une classe Tailwind thématisée",
          context: getContext(content, match),
        });
        stats.hardcodedRgbColors++;
      });
    }
  });

  // Vérifier l'utilisation des hooks de thème
  const usesThemeHooks =
    content.includes("useGlobalTheme") ||
    content.includes("useComponentConfig") ||
    content.includes("useThemeManager");

  if (!usesThemeHooks && content.includes("className") && issues.length === 0) {
    // Pas forcément un problème, mais à noter
    if (
      content.includes("text-") ||
      content.includes("bg-") ||
      content.includes("border-")
    ) {
      issues.push({
        type: "no-theme-hook",
        severity: "low",
        line: 1,
        match: "Fichier utilise des classes Tailwind mais pas de hook de thème",
        suggestion:
          "Vérifier si useGlobalTheme() ou useComponentConfig() devrait être utilisé",
        context: "N/A",
      });
    }
  }

  if (issues.length > 0) {
    stats.filesWithIssues++;
    stats.issues.push({
      file: relativePath,
      issues: issues,
    });
  }

  stats.filesScanned++;
}

/**
 * Obtient le numéro de ligne d'une correspondance
 */
function getLineNumber(content, match) {
  const lines = content.substring(0, content.indexOf(match)).split("\n");
  return lines.length;
}

/**
 * Obtient le contexte autour d'une correspondance
 */
function getContext(content, match, contextLines = 2) {
  const matchIndex = content.indexOf(match);
  const lines = content.split("\n");
  const matchLine = content.substring(0, matchIndex).split("\n").length - 1;

  const start = Math.max(0, matchLine - contextLines);
  const end = Math.min(lines.length - 1, matchLine + contextLines);

  return lines
    .slice(start, end + 1)
    .map((line, idx) => `${start + idx + 1}: ${line}`)
    .join("\n");
}

/**
 * Obtient une suggestion de remplacement
 */
function getSuggestion(match) {
  for (const [old, replacement] of Object.entries(REPLACEMENT_MAP)) {
    if (match.includes(old)) {
      return match.replace(old, replacement);
    }
  }

  // Suggestion générique
  if (match.includes("text-")) {
    return match.replace(
      /text-(red|blue|green|yellow)-\d+/,
      "text-{error|primary|success|warning}-$1",
    );
  }
  if (match.includes("bg-")) {
    return match.replace(
      /bg-(red|blue|green|yellow)-\d+/,
      "bg-{error|primary|success|warning}-$1",
    );
  }
  if (match.includes("border-")) {
    return match.replace(
      /border-(red|blue|green|yellow)-\d+/,
      "border-{error|primary|success|warning}-$1",
    );
  }

  return "Utiliser var(--color-*) ou une classe Tailwind thématisée";
}

/**
 * Parcourt récursivement un répertoire
 */
function scanDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️  Répertoire non trouvé: ${dir}`);
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && shouldScanFile(fullPath)) {
      try {
        scanFile(fullPath);
      } catch (error) {
        console.error(
          `❌ Erreur lors de l'analyse de ${fullPath}:`,
          error.message,
        );
      }
    }
  }
}

/**
 * Génère un rapport
 */
function generateReport(options = {}) {
  const { json = false, verbose = false } = options;

  if (json) {
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  console.log("\n" + "=".repeat(80));
  console.log("📊 RAPPORT D'AUDIT DU SYSTÈME DE THÈME UNIFIÉ");
  console.log("=".repeat(80) + "\n");

  console.log("📈 Statistiques:");
  console.log(`   Fichiers analysés: ${stats.filesScanned}`);
  console.log(`   Fichiers avec problèmes: ${stats.filesWithIssues}`);
  console.log(`   Couleurs hardcodées (classes): ${stats.hardcodedColors}`);
  console.log(`   Couleurs hex hardcodées: ${stats.hardcodedHexColors}`);
  console.log(`   Couleurs RGB hardcodées: ${stats.hardcodedRgbColors}`);
  console.log(`   Classes non-thématiques: ${stats.nonThematicClasses}`);
  console.log(
    `   Total de problèmes: ${stats.issues.reduce((sum, file) => sum + file.issues.length, 0)}`,
  );

  console.log("\n" + "-".repeat(80));
  console.log("🔍 Détails des problèmes:\n");

  if (stats.issues.length === 0) {
    console.log(
      "✅ Aucun problème détecté! Le système de thème est bien unifié.\n",
    );
    return;
  }

  // Grouper par sévérité
  const issuesBySeverity = {
    high: [],
    medium: [],
    low: [],
  };

  stats.issues.forEach((fileIssue) => {
    fileIssue.issues.forEach((issue) => {
      if (!issuesBySeverity[issue.severity]) {
        issuesBySeverity[issue.severity] = [];
      }
      issuesBySeverity[issue.severity].push({
        file: fileIssue.file,
        ...issue,
      });
    });
  });

  // Afficher les problèmes par sévérité
  ["high", "medium", "low"].forEach((severity) => {
    const issues = issuesBySeverity[severity];
    if (issues.length === 0) return;

    const emoji =
      severity === "high" ? "🔴" : severity === "medium" ? "🟡" : "🟢";
    console.log(
      `${emoji} ${severity.toUpperCase()} (${issues.length} problèmes):\n`,
    );

    // Limiter l'affichage si pas verbose
    const issuesToShow = verbose ? issues : issues.slice(0, 20);

    issuesToShow.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue.file}:${issue.line}`);
      console.log(`      Type: ${issue.type}`);
      console.log(`      Match: ${issue.match}`);
      console.log(`      Suggestion: ${issue.suggestion}`);
      if (verbose) {
        console.log(
          `      Contexte:\n${issue.context
            .split("\n")
            .map((l) => `         ${l}`)
            .join("\n")}`,
        );
      }
      console.log("");
    });

    if (!verbose && issues.length > 20) {
      console.log(
        `   ... et ${issues.length - 20} autres problèmes (utilisez --verbose pour voir tous)`,
      );
    }

    console.log("");
  });

  // Score
  const totalIssues = stats.issues.reduce(
    (sum, file) => sum + file.issues.length,
    0,
  );
  const highSeverityIssues = issuesBySeverity.high.length;
  const score = Math.max(0, 10 - highSeverityIssues * 0.1 - totalIssues * 0.01);

  console.log("=".repeat(80));
  console.log(`📊 Score: ${score.toFixed(1)}/10`);
  if (score >= 9) {
    console.log("✅ Excellent! Le système de thème est bien unifié.");
  } else if (score >= 7) {
    console.log("⚠️  Bon, mais quelques améliorations sont nécessaires.");
  } else {
    console.log("❌ Des corrections importantes sont nécessaires.");
  }
  console.log("=".repeat(80) + "\n");
}

// Point d'entrée
function main() {
  const args = process.argv.slice(2);
  const options = {
    json: args.includes("--json"),
    verbose: args.includes("--verbose"),
    fix: args.includes("--fix"),
  };

  console.log("🔍 Analyse du système de thème unifié...\n");

  // Analyser les répertoires
  [COMPONENTS_DIR, APP_DIR, LIB_DIR].forEach((dir) => {
    if (fs.existsSync(dir)) {
      scanDirectory(dir);
    }
  });

  // Générer le rapport
  generateReport(options);

  // Mode fix (à implémenter)
  if (options.fix) {
    console.log("⚠️  Le mode --fix n'est pas encore implémenté.");
    console.log(
      "   Utilisez les suggestions du rapport pour corriger manuellement.\n",
    );
  }

  // Code de sortie
  const highSeverityCount = stats.issues.reduce(
    (sum, file) =>
      sum + file.issues.filter((i) => i.severity === "high").length,
    0,
  );

  process.exit(highSeverityCount > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { scanFile, scanDirectory, generateReport };

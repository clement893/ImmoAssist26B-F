#!/usr/bin/env node

/**
 * Audit complet de l'application du thème dans tous les composants
 *
 * Ce script analyse tous les fichiers TSX pour identifier:
 * 1. Les couleurs hardcodées (hex, rgb, rgba)
 * 2. Les classes Tailwind non-thémées (bg-blue-500 au lieu de bg-primary-500)
 * 3. Les composants qui n'utilisent pas les variables CSS du thème
 * 4. Les composants qui n'utilisent pas les hooks du thème
 */

const fs = require("fs");
const path = require("path");

// Configuration
const COMPONENTS_DIR = path.join(process.cwd(), "apps/web/src/components");
const OUTPUT_FILE = path.join(process.cwd(), "THEME_AUDIT_COMPLETE.md");
const OUTPUT_JSON = path.join(process.cwd(), "THEME_AUDIT_COMPLETE.json");

// Patterns de détection
const PATTERNS = {
  // Couleurs hardcodées
  hardcodedColors: {
    hex: /#[0-9A-Fa-f]{3,8}\b/g,
    rgb: /rgba?\([^)]+\)/g,
    hsl: /hsla?\([^)]+\)/g,
  },

  // Classes Tailwind non-thémées (couleurs spécifiques)
  nonThemedTailwind: {
    blue: /\b(bg|text|border)-blue-\d+/g,
    gray: /\b(bg|text|border)-gray-\d+/g,
    slate: /\b(bg|text|border)-slate-\d+/g,
    zinc: /\b(bg|text|border)-zinc-\d+/g,
    neutral: /\b(bg|text|border)-neutral-\d+/g,
    stone: /\b(bg|text|border)-stone-\d+/g,
    red: /\b(bg|text|border)-red-\d+/g,
    orange: /\b(bg|text|border)-orange-\d+/g,
    amber: /\b(bg|text|border)-amber-\d+/g,
    yellow: /\b(bg|text|border)-yellow-\d+/g,
    lime: /\b(bg|text|border)-lime-\d+/g,
    green: /\b(bg|text|border)-green-\d+/g,
    emerald: /\b(bg|text|border)-emerald-\d+/g,
    teal: /\b(bg|text|border)-teal-\d+/g,
    cyan: /\b(bg|text|border)-cyan-\d+/g,
    sky: /\b(bg|text|border)-sky-\d+/g,
    indigo: /\b(bg|text|border)-indigo-\d+/g,
    violet: /\b(bg|text|border)-violet-\d+/g,
    purple: /\b(bg|text|border)-purple-\d+/g,
    fuchsia: /\b(bg|text|border)-fuchsia-\d+/g,
    pink: /\b(bg|text|border)-pink-\d+/g,
    rose: /\b(bg|text|border)-rose-\d+/g,
  },

  // Variables CSS du thème (ce qu'on devrait utiliser)
  themeVariables: {
    colors:
      /var\(--color-(primary|secondary|danger|error|warning|info|success|foreground|background|muted|border|input|ring)-\d*\)/g,
    fonts: /var\(--font-family(-heading|-subheading)?\)/g,
    spacing: /var\(--spacing-\w+\)/g,
    borderRadius: /var\(--border-radius[-\w]*\)/g,
  },

  // Hooks du thème
  themeHooks: {
    useComponentConfig: /useComponentConfig/g,
    useThemeColors: /useThemeColors/g,
    useGlobalTheme: /useGlobalTheme/g,
    useThemeSpacing: /useThemeSpacing/g,
    useLayout: /useLayout/g,
  },

  // Classes Tailwind thémées (ce qu'on devrait utiliser)
  themedTailwind: {
    primary: /\b(bg|text|border)-primary-\d+/g,
    secondary: /\b(bg|text|border)-secondary-\d+/g,
    danger: /\b(bg|text|border)-danger-\d+/g,
    error: /\b(bg|text|border)-error-\d+/g,
    warning: /\b(bg|text|border)-warning-\d+/g,
    info: /\b(bg|text|border)-info-\d+/g,
    success: /\b(bg|text|border)-success-\d+/g,
  },
};

// Classes Tailwind qui utilisent les variables CSS automatiquement
const THEMED_UTILITY_CLASSES = [
  "bg-background",
  "bg-foreground",
  "bg-muted",
  "bg-muted-foreground",
  "text-background",
  "text-foreground",
  "text-muted",
  "text-muted-foreground",
  "border-border",
  "border-background",
  "border-foreground",
  "bg-input",
  "ring-ring",
];

// Statistiques globales
const stats = {
  totalFiles: 0,
  filesWithIssues: 0,
  filesByCategory: {
    withHardcodedColors: [],
    withNonThemedClasses: [],
    withoutThemeHooks: [],
    withoutThemeVariables: [],
  },
  issuesByType: {
    hardcodedHex: 0,
    hardcodedRgb: 0,
    hardcodedHsl: 0,
    nonThemedTailwind: {},
    missingThemeHooks: 0,
    missingThemeVariables: 0,
  },
};

// Analyser un fichier
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(process.cwd(), filePath);
  const issues = [];

  // Ignorer les fichiers de test et certains fichiers
  if (
    filePath.includes("__tests__") ||
    filePath.includes(".test.") ||
    filePath.includes(".stories.") ||
    relativePath.includes("node_modules") ||
    relativePath.includes(".next")
  ) {
    return null;
  }

  // Détecter les couleurs hardcodées
  const hardcodedIssues = detectHardcodedColors(content, relativePath);
  if (hardcodedIssues.length > 0) {
    issues.push(...hardcodedIssues);
    stats.filesByCategory.withHardcodedColors.push(relativePath);
  }

  // Détecter les classes Tailwind non-thémées
  const tailwindIssues = detectNonThemedTailwind(content, relativePath);
  if (tailwindIssues.length > 0) {
    issues.push(...tailwindIssues);
    stats.filesByCategory.withNonThemedClasses.push(relativePath);
  }

  // Détecter l'absence de hooks du thème (pour certains types de composants)
  const hookIssues = detectMissingThemeHooks(content, relativePath);
  if (hookIssues.length > 0) {
    issues.push(...hookIssues);
    stats.filesByCategory.withoutThemeHooks.push(relativePath);
  }

  // Détecter l'absence de variables CSS du thème
  const variableIssues = detectMissingThemeVariables(content, relativePath);
  if (variableIssues.length > 0) {
    issues.push(...variableIssues);
    stats.filesByCategory.withoutThemeVariables.push(relativePath);
  }

  return issues.length > 0 ? { file: relativePath, issues } : null;
}

// Détecter les couleurs hardcodées
function detectHardcodedColors(content, filePath) {
  const issues = [];

  // Hex colors
  const hexMatches = content.match(PATTERNS.hardcodedColors.hex);
  if (hexMatches) {
    const uniqueHex = [...new Set(hexMatches)];
    uniqueHex.forEach((hex) => {
      // Ignorer les couleurs dans les commentaires ou les valeurs par défaut
      const lineNumber = getLineNumber(content, hex);
      const context = getContext(content, hex, 3);

      // Ignorer si c'est dans un commentaire ou une valeur par défaut acceptable
      if (!isInComment(context) && !isAcceptableDefault(hex, context)) {
        issues.push({
          type: "hardcoded-hex",
          value: hex,
          line: lineNumber,
          context: context,
          severity: "high",
        });
        stats.issuesByType.hardcodedHex++;
      }
    });
  }

  // RGB/RGBA colors
  const rgbMatches = content.match(PATTERNS.hardcodedColors.rgb);
  if (rgbMatches) {
    const uniqueRgb = [...new Set(rgbMatches)];
    uniqueRgb.forEach((rgb) => {
      const lineNumber = getLineNumber(content, rgb);
      const context = getContext(content, rgb, 3);

      if (!isInComment(context) && !isAcceptableDefault(rgb, context)) {
        // Ignorer rgba avec variables CSS
        if (!rgb.includes("var(--")) {
          issues.push({
            type: "hardcoded-rgb",
            value: rgb,
            line: lineNumber,
            context: context,
            severity: "high",
          });
          stats.issuesByType.hardcodedRgb++;
        }
      }
    });
  }

  return issues;
}

// Détecter les classes Tailwind non-thémées
function detectNonThemedTailwind(content, filePath) {
  const issues = [];

  Object.entries(PATTERNS.nonThemedTailwind).forEach(([color, pattern]) => {
    const matches = content.match(pattern);
    if (matches) {
      const uniqueMatches = [...new Set(matches)];
      uniqueMatches.forEach((match) => {
        const lineNumber = getLineNumber(content, match);
        const context = getContext(content, match, 3);

        if (!isInComment(context)) {
          issues.push({
            type: "non-themed-tailwind",
            value: match,
            color: color,
            line: lineNumber,
            context: context,
            severity: "medium",
            suggestion: getSuggestionForColor(color, match),
          });

          if (!stats.issuesByType.nonThemedTailwind[color]) {
            stats.issuesByType.nonThemedTailwind[color] = 0;
          }
          stats.issuesByType.nonThemedTailwind[color]++;
        }
      });
    }
  });

  return issues;
}

// Détecter l'absence de hooks du thème
function detectMissingThemeHooks(content, filePath) {
  const issues = [];

  // Vérifier si le composant utilise des classes de couleur mais pas de hooks du thème
  const hasColorClasses =
    Object.values(PATTERNS.nonThemedTailwind).some((pattern) =>
      pattern.test(content),
    ) ||
    Object.values(PATTERNS.themedTailwind).some((pattern) =>
      pattern.test(content),
    );

  const hasThemeHooks =
    PATTERNS.themeHooks.useComponentConfig.test(content) ||
    PATTERNS.themeHooks.useThemeColors.test(content) ||
    PATTERNS.themeHooks.useGlobalTheme.test(content);

  // Pour les composants UI principaux, on devrait utiliser les hooks
  if (hasColorClasses && !hasThemeHooks && filePath.includes("/ui/")) {
    issues.push({
      type: "missing-theme-hooks",
      severity: "low",
      suggestion:
        "Considérer l'utilisation de useComponentConfig ou useThemeColors",
    });
    stats.issuesByType.missingThemeHooks++;
  }

  return issues;
}

// Détecter l'absence de variables CSS du thème
function detectMissingThemeVariables(content, filePath) {
  const issues = [];

  // Vérifier si le composant utilise des styles inline mais pas de variables CSS
  const hasInlineStyles = /style=\{[^}]+\}/.test(content);
  const hasThemeVariables =
    PATTERNS.themeVariables.colors.test(content) ||
    PATTERNS.themeVariables.fonts.test(content) ||
    PATTERNS.themeVariables.spacing.test(content);

  // Pour les composants avec styles inline, on devrait utiliser les variables CSS
  if (hasInlineStyles && !hasThemeVariables) {
    const styleMatches = content.match(/style=\{([^}]+)\}/g);
    if (styleMatches) {
      styleMatches.forEach((style) => {
        // Vérifier si le style contient des valeurs hardcodées
        if (/#[0-9A-Fa-f]{3,8}|rgba?\(|hsla?\(/.test(style)) {
          issues.push({
            type: "missing-theme-variables",
            severity: "medium",
            suggestion:
              "Remplacer les valeurs hardcodées par des variables CSS du thème",
          });
          stats.issuesByType.missingThemeVariables++;
        }
      });
    }
  }

  return issues;
}

// Helpers
function getLineNumber(content, search) {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(search)) {
      return i + 1;
    }
  }
  return 0;
}

function getContext(content, search, lines = 3) {
  const lineNumber = getLineNumber(content, search);
  if (lineNumber === 0) return "";

  const allLines = content.split("\n");
  const start = Math.max(0, lineNumber - lines - 1);
  const end = Math.min(allLines.length, lineNumber + lines);

  return allLines.slice(start, end).join("\n");
}

function isInComment(context) {
  return (
    context.includes("//") || context.includes("/*") || context.includes("*")
  );
}

function isAcceptableDefault(value, context) {
  // Accepter certaines valeurs par défaut communes
  const acceptableDefaults = [
    "#000000",
    "#ffffff",
    "#fff",
    "#000",
    "rgba(0, 0, 0, 0)",
    "rgba(255, 255, 255, 1)",
    "transparent",
  ];

  if (acceptableDefaults.includes(value.toLowerCase())) {
    return true;
  }

  // Accepter si c'est dans un fallback ou une valeur par défaut
  if (
    context.includes("fallback") ||
    context.includes("default") ||
    context.includes("||")
  ) {
    return true;
  }

  return false;
}

function getSuggestionForColor(color, match) {
  const mapping = {
    blue: "primary",
    green: "success",
    red: "danger",
    yellow: "warning",
    indigo: "primary",
    purple: "secondary",
    violet: "secondary",
    pink: "secondary",
    emerald: "success",
    teal: "info",
    cyan: "info",
    orange: "warning",
    amber: "warning",
  };

  const themeColor = mapping[color] || "primary";
  const parts = match.split("-");
  const shade = parts[parts.length - 1];

  return match.replace(color, themeColor);
}

// Générer le rapport
function generateReport(results) {
  const report = {
    summary: {
      totalFiles: stats.totalFiles,
      filesWithIssues: stats.filesWithIssues,
      totalIssues: Object.values(stats.issuesByType).reduce((sum, val) => {
        return (
          sum +
          (typeof val === "object"
            ? Object.values(val).reduce((a, b) => a + b, 0)
            : val)
        );
      }, 0),
    },
    stats: stats,
    results: results,
  };

  return report;
}

// Générer le rapport Markdown
function generateMarkdownReport(report) {
  let md = `# 🔍 Audit Complet de l'Application du Thème\n\n`;
  md += `**Date :** ${new Date().toLocaleString("fr-FR")}\n\n`;
  md += `## 📊 Résumé\n\n`;
  md += `- **Fichiers analysés :** ${report.summary.totalFiles}\n`;
  md += `- **Fichiers avec problèmes :** ${report.summary.filesWithIssues}\n`;
  md += `- **Total des problèmes :** ${report.summary.totalIssues}\n\n`;

  md += `## 🎯 Statistiques par Catégorie\n\n`;

  md += `### Couleurs Hardcodées\n\n`;
  md += `- Hex : ${report.stats.issuesByType.hardcodedHex}\n`;
  md += `- RGB/RGBA : ${report.stats.issuesByType.hardcodedRgb}\n`;
  md += `- HSL/HSLA : ${report.stats.issuesByType.hardcodedHsl}\n\n`;

  md += `### Classes Tailwind Non-Thémées\n\n`;
  Object.entries(report.stats.issuesByType.nonThemedTailwind).forEach(
    ([color, count]) => {
      md += `- ${color} : ${count}\n`;
    },
  );
  md += `\n`;

  md += `### Problèmes Divers\n\n`;
  md += `- Hooks du thème manquants : ${report.stats.issuesByType.missingThemeHooks}\n`;
  md += `- Variables CSS manquantes : ${report.stats.issuesByType.missingThemeVariables}\n\n`;

  md += `## 📁 Fichiers par Catégorie\n\n`;

  md += `### Fichiers avec Couleurs Hardcodées (${report.stats.filesByCategory.withHardcodedColors.length})\n\n`;
  report.stats.filesByCategory.withHardcodedColors.forEach((file) => {
    md += `- \`${file}\`\n`;
  });
  md += `\n`;

  md += `### Fichiers avec Classes Tailwind Non-Thémées (${report.stats.filesByCategory.withNonThemedClasses.length})\n\n`;
  report.stats.filesByCategory.withNonThemedClasses.forEach((file) => {
    md += `- \`${file}\`\n`;
  });
  md += `\n`;

  md += `## 📋 Détails par Fichier\n\n`;

  // Grouper par fichier
  const filesMap = {};
  report.results.forEach((result) => {
    if (!filesMap[result.file]) {
      filesMap[result.file] = [];
    }
    filesMap[result.file].push(...result.issues);
  });

  Object.entries(filesMap).forEach(([file, issues]) => {
    md += `### \`${file}\`\n\n`;
    md += `**Total des problèmes :** ${issues.length}\n\n`;

    // Grouper par type
    const issuesByType = {};
    issues.forEach((issue) => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);
    });

    Object.entries(issuesByType).forEach(([type, typeIssues]) => {
      md += `#### ${type} (${typeIssues.length})\n\n`;
      typeIssues.slice(0, 10).forEach((issue) => {
        md += `- **Ligne ${issue.line || "?"}** : \`${issue.value || "N/A"}\`\n`;
        if (issue.suggestion) {
          md += `  - 💡 Suggestion : \`${issue.suggestion}\`\n`;
        }
        if (issue.context) {
          md += `  - 📝 Contexte : \`${issue.context.split("\n")[0].trim().slice(0, 100)}...\`\n`;
        }
      });
      if (typeIssues.length > 10) {
        md += `  - ... et ${typeIssues.length - 10} autres\n`;
      }
      md += `\n`;
    });
  });

  return md;
}

// Fonction récursive pour trouver tous les fichiers TSX
function findTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorer certains dossiers
      if (!["node_modules", ".next", "__tests__"].includes(file)) {
        findTsxFiles(filePath, fileList);
      }
    } else if (
      file.endsWith(".tsx") &&
      !file.includes(".test.") &&
      !file.includes(".stories.")
    ) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Main
function main() {
  console.log("🔍 Démarrage de l'audit des composants...\n");

  // Trouver tous les fichiers TSX
  const componentsDir = path.join(process.cwd(), "apps/web/src/components");
  const files = findTsxFiles(componentsDir);

  console.log(`📁 ${files.length} fichiers trouvés\n`);

  stats.totalFiles = files.length;

  const results = [];

  // Analyser chaque fichier
  files.forEach((file) => {
    const result = analyzeFile(file);
    if (result) {
      results.push(result);
      stats.filesWithIssues++;
    }
  });

  // Générer le rapport
  const report = generateReport(results);
  const markdown = generateMarkdownReport(report);

  // Sauvegarder
  fs.writeFileSync(OUTPUT_FILE, markdown, "utf-8");
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(report, null, 2), "utf-8");

  console.log("✅ Audit terminé !\n");
  console.log(`📊 Résultats :`);
  console.log(`   - Fichiers analysés : ${report.summary.totalFiles}`);
  console.log(
    `   - Fichiers avec problèmes : ${report.summary.filesWithIssues}`,
  );
  console.log(`   - Total des problèmes : ${report.summary.totalIssues}\n`);
  console.log(`📄 Rapports générés :`);
  console.log(`   - Markdown : ${OUTPUT_FILE}`);
  console.log(`   - JSON : ${OUTPUT_JSON}\n`);
}

main();

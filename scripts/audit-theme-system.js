/**
 * Audit complet du système de thème et des composants
 * Analyse la structure du thème, son utilisation, et les problèmes potentiels
 */

const fs = require("fs");
const path = require("path");

const COMPONENTS_DIR = path.join(
  __dirname,
  "..",
  "apps",
  "web",
  "src",
  "components",
);
const THEME_DIR = path.join(
  __dirname,
  "..",
  "apps",
  "web",
  "src",
  "lib",
  "theme",
);
const UI_DIR = path.join(
  __dirname,
  "..",
  "apps",
  "web",
  "src",
  "components",
  "ui",
);

// Statistiques globales
const stats = {
  totalComponents: 0,
  componentsUsingTheme: 0,
  componentsNotUsingTheme: [],
  themeHooksUsage: {
    useComponentConfig: 0,
    useGlobalTheme: 0,
    useThemeColors: 0,
    useThemeSpacing: 0,
    useEffects: 0,
    useLayout: 0,
  },
  cssVariables: {
    used: new Set(),
    defined: new Set(),
  },
  issues: [],
  recommendations: [],
};

/**
 * Récupère tous les fichiers .tsx et .ts
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorer node_modules, .next, etc.
      if (
        !file.startsWith(".") &&
        file !== "node_modules" &&
        file !== "__tests__" &&
        file !== "__mocks__"
      ) {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Analyse un fichier pour détecter l'utilisation du thème
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(path.join(__dirname, ".."), filePath);

  // Détecter les hooks du thème
  const usesComponentConfig = /useComponentConfig/.test(content);
  const usesGlobalTheme = /useGlobalTheme/.test(content);
  const usesThemeColors = /useThemeColors/.test(content);
  const usesThemeSpacing = /useThemeSpacing/.test(content);
  const usesEffects = /useEffects/.test(content);
  const usesLayout = /useLayout/.test(content);

  // Détecter les variables CSS du thème
  const cssVarMatches = content.match(/var\(--[a-zA-Z0-9-]+\)/g) || [];
  cssVarMatches.forEach((match) => {
    const varName = match.replace(/var\(--/, "").replace(/\)$/, "");
    stats.cssVariables.used.add(varName);
  });

  // Détecter les classes Tailwind thémées
  const themedClasses = [
    /bg-primary-\d+/,
    /bg-secondary-\d+/,
    /bg-danger-\d+/,
    /bg-warning-\d+/,
    /bg-success-\d+/,
    /bg-error-\d+/,
    /text-primary-\d+/,
    /text-secondary-\d+/,
    /bg-foreground/,
    /text-foreground/,
    /bg-background/,
    /text-background/,
    /bg-muted/,
    /text-muted-foreground/,
    /border-border/,
  ];

  const hasThemedClasses = themedClasses.some((regex) => regex.test(content));

  // Détecter les classes hardcodées (non-thémées)
  const hardcodedClasses = [
    /bg-gray-\d+/,
    /text-gray-\d+/,
    /border-gray-\d+/,
    /bg-black/,
    /text-black/,
    /bg-white/,
    /text-white/,
    /bg-red-\d+/,
    /text-red-\d+/,
    /bg-green-\d+/,
    /text-green-\d+/,
    /bg-yellow-\d+/,
    /text-yellow-\d+/,
    /bg-blue-\d+/,
    /text-blue-\d+/,
  ];

  const hasHardcodedClasses = hardcodedClasses.some((regex) =>
    regex.test(content),
  );

  // Déterminer si le composant utilise le thème
  const usesTheme =
    usesComponentConfig ||
    usesGlobalTheme ||
    usesThemeColors ||
    usesThemeSpacing ||
    usesEffects ||
    usesLayout ||
    hasThemedClasses;

  // Compter les hooks
  if (usesComponentConfig) stats.themeHooksUsage.useComponentConfig++;
  if (usesGlobalTheme) stats.themeHooksUsage.useGlobalTheme++;
  if (usesThemeColors) stats.themeHooksUsage.useThemeColors++;
  if (usesThemeSpacing) stats.themeHooksUsage.useThemeSpacing++;
  if (usesEffects) stats.themeHooksUsage.useEffects++;
  if (usesLayout) stats.themeHooksUsage.useLayout++;

  // Identifier les problèmes
  const issues = [];
  if (hasHardcodedClasses && !usesTheme) {
    issues.push({
      type: "hardcoded-colors",
      severity: "medium",
      message:
        "Utilise des couleurs hardcodées sans utiliser le système de thème",
    });
  }

  if (!usesTheme && relativePath.includes("components/ui/")) {
    issues.push({
      type: "no-theme-usage",
      severity: "low",
      message: "Composant UI n'utilise pas le système de thème",
    });
  }

  return {
    file: relativePath,
    usesTheme,
    hooks: {
      useComponentConfig: usesComponentConfig,
      useGlobalTheme: usesGlobalTheme,
      useThemeColors: usesThemeColors,
      useThemeSpacing: usesThemeSpacing,
      useEffects: usesEffects,
      useLayout: usesLayout,
    },
    hasThemedClasses,
    hasHardcodedClasses,
    cssVariables: cssVarMatches.length,
    issues,
  };
}

/**
 * Analyse les fichiers de thème pour identifier les variables CSS définies
 */
function analyzeThemeFiles() {
  const themeFiles = getAllFiles(THEME_DIR);

  themeFiles.forEach((filePath) => {
    const content = fs.readFileSync(filePath, "utf-8");

    // Détecter les définitions de variables CSS
    const cssVarDefMatches =
      content.match(/setProperty\(['"]--[a-zA-Z0-9-]+['"]/g) || [];
    cssVarDefMatches.forEach((match) => {
      const varName = match
        .replace(/setProperty\(['"]--/, "")
        .replace(/['"]$/, "");
      stats.cssVariables.defined.add(varName);
    });
  });
}

/**
 * Analyse tous les composants UI
 */
function analyzeComponents() {
  console.log("🔍 Analyse des composants...\n");

  const uiFiles = getAllFiles(UI_DIR);
  stats.totalComponents = uiFiles.length;

  const results = [];

  uiFiles.forEach((filePath) => {
    const result = analyzeFile(filePath);
    results.push(result);

    if (result.usesTheme) {
      stats.componentsUsingTheme++;
    } else {
      stats.componentsNotUsingTheme.push(result.file);
    }

    if (result.issues.length > 0) {
      stats.issues.push({
        file: result.file,
        issues: result.issues,
      });
    }
  });

  return results;
}

/**
 * Génère le rapport d'audit
 */
function generateReport(componentResults) {
  const report = {
    summary: {
      date: new Date().toISOString(),
      totalComponents: stats.totalComponents,
      componentsUsingTheme: stats.componentsUsingTheme,
      componentsNotUsingTheme: stats.componentsNotUsingTheme.length,
      percentageUsingTheme: (
        (stats.componentsUsingTheme / stats.totalComponents) *
        100
      ).toFixed(1),
    },
    themeHooksUsage: stats.themeHooksUsage,
    cssVariables: {
      defined: Array.from(stats.cssVariables.defined).sort(),
      used: Array.from(stats.cssVariables.used).sort(),
      unused: Array.from(stats.cssVariables.defined)
        .filter((v) => !stats.cssVariables.used.has(v))
        .sort(),
    },
    issues: stats.issues,
    components: componentResults.map((r) => ({
      file: r.file,
      usesTheme: r.usesTheme,
      hooks: Object.entries(r.hooks)
        .filter(([_, used]) => used)
        .map(([name]) => name),
      cssVariables: r.cssVariables,
      hasHardcodedColors: r.hasHardcodedClasses,
      issues: r.issues,
    })),
  };

  // Recommandations
  const recommendations = [];

  if (stats.componentsNotUsingTheme.length > 0) {
    recommendations.push({
      type: "theme-adoption",
      priority: "high",
      message: `${stats.componentsNotUsingTheme.length} composants n'utilisent pas le système de thème`,
      files: stats.componentsNotUsingTheme.slice(0, 10), // Limiter à 10 pour la lisibilité
    });
  }

  const unusedVars = Array.from(stats.cssVariables.defined).filter(
    (v) => !stats.cssVariables.used.has(v),
  );
  if (unusedVars.length > 0) {
    recommendations.push({
      type: "unused-variables",
      priority: "low",
      message: `${unusedVars.length} variables CSS définies mais non utilisées`,
      variables: unusedVars.slice(0, 20),
    });
  }

  const hardcodedIssues = stats.issues.filter((i) =>
    i.issues.some((issue) => issue.type === "hardcoded-colors"),
  );
  if (hardcodedIssues.length > 0) {
    recommendations.push({
      type: "hardcoded-colors",
      priority: "medium",
      message: `${hardcodedIssues.length} composants utilisent des couleurs hardcodées`,
      files: hardcodedIssues.slice(0, 10).map((i) => i.file),
    });
  }

  report.recommendations = recommendations;

  return report;
}

/**
 * Affiche le rapport dans la console
 */
function printReport(report) {
  console.log("=".repeat(80));
  console.log("📊 RAPPORT D'AUDIT - SYSTÈME DE THÈME");
  console.log("=".repeat(80));
  console.log();

  console.log("📈 RÉSUMÉ");
  console.log("-".repeat(80));
  console.log(`Total de composants UI: ${report.summary.totalComponents}`);
  console.log(
    `Composants utilisant le thème: ${report.summary.componentsUsingTheme}`,
  );
  console.log(
    `Composants n'utilisant PAS le thème: ${report.summary.componentsNotUsingTheme}`,
  );
  console.log(
    `Pourcentage d'adoption: ${report.summary.percentageUsingTheme}%`,
  );
  console.log();

  console.log("🪝 UTILISATION DES HOOKS");
  console.log("-".repeat(80));
  Object.entries(report.themeHooksUsage).forEach(([hook, count]) => {
    console.log(`  ${hook}: ${count} composants`);
  });
  console.log();

  console.log("🎨 VARIABLES CSS");
  console.log("-".repeat(80));
  console.log(`  Variables définies: ${report.cssVariables.defined.length}`);
  console.log(`  Variables utilisées: ${report.cssVariables.used.length}`);
  console.log(
    `  Variables non utilisées: ${report.cssVariables.unused.length}`,
  );
  if (
    report.cssVariables.unused.length > 0 &&
    report.cssVariables.unused.length <= 10
  ) {
    console.log(`  Liste: ${report.cssVariables.unused.join(", ")}`);
  }
  console.log();

  console.log("⚠️  PROBLÈMES DÉTECTÉS");
  console.log("-".repeat(80));
  if (report.issues.length === 0) {
    console.log("  ✅ Aucun problème détecté");
  } else {
    report.issues.slice(0, 20).forEach((issue) => {
      console.log(`  📄 ${issue.file}`);
      issue.issues.forEach((i) => {
        console.log(
          `     - [${i.severity.toUpperCase()}] ${i.type}: ${i.message}`,
        );
      });
    });
    if (report.issues.length > 20) {
      console.log(`  ... et ${report.issues.length - 20} autres problèmes`);
    }
  }
  console.log();

  console.log("💡 RECOMMANDATIONS");
  console.log("-".repeat(80));
  if (report.recommendations.length === 0) {
    console.log("  ✅ Aucune recommandation");
  } else {
    report.recommendations.forEach((rec) => {
      console.log(`  [${rec.priority.toUpperCase()}] ${rec.type}`);
      console.log(`     ${rec.message}`);
      if (rec.files && rec.files.length > 0) {
        console.log(`     Exemples: ${rec.files.slice(0, 3).join(", ")}`);
      }
    });
  }
  console.log();
}

/**
 * Point d'entrée principal
 */
function main() {
  console.log("🚀 Démarrage de l'audit du système de thème...\n");

  // Analyser les fichiers de thème
  console.log("🔍 Analyse des fichiers de thème...");
  analyzeThemeFiles();
  console.log(
    `✅ ${stats.cssVariables.defined.size} variables CSS identifiées\n`,
  );

  // Analyser les composants
  const componentResults = analyzeComponents();
  console.log(`✅ ${stats.totalComponents} composants analysés\n`);

  // Générer le rapport
  console.log("📝 Génération du rapport...");
  const report = generateReport(componentResults);

  // Afficher le rapport
  printReport(report);

  // Sauvegarder le rapport JSON
  const reportPath = path.join(__dirname, "..", "THEME_SYSTEM_AUDIT.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`💾 Rapport JSON sauvegardé: ${reportPath}`);

  // Sauvegarder le rapport Markdown
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = path.join(__dirname, "..", "THEME_SYSTEM_AUDIT.md");
  fs.writeFileSync(markdownPath, markdownReport);
  console.log(`💾 Rapport Markdown sauvegardé: ${markdownPath}`);

  console.log("\n✅ Audit terminé !");
}

/**
 * Génère un rapport Markdown
 */
function generateMarkdownReport(report) {
  let md = `# 🔍 Audit du Système de Thème\n\n`;
  md += `**Date:** ${new Date(report.summary.date).toLocaleString("fr-FR")}\n\n`;

  md += `## 📈 Résumé\n\n`;
  md += `- **Total de composants UI:** ${report.summary.totalComponents}\n`;
  md += `- **Composants utilisant le thème:** ${report.summary.componentsUsingTheme}\n`;
  md += `- **Composants n'utilisant PAS le thème:** ${report.summary.componentsNotUsingTheme}\n`;
  md += `- **Pourcentage d'adoption:** ${report.summary.percentageUsingTheme}%\n\n`;

  md += `## 🪝 Utilisation des Hooks\n\n`;
  Object.entries(report.themeHooksUsage).forEach(([hook, count]) => {
    md += `- **${hook}:** ${count} composants\n`;
  });
  md += `\n`;

  md += `## 🎨 Variables CSS\n\n`;
  md += `- **Variables définies:** ${report.cssVariables.defined.length}\n`;
  md += `- **Variables utilisées:** ${report.cssVariables.used.length}\n`;
  md += `- **Variables non utilisées:** ${report.cssVariables.unused.length}\n\n`;

  if (
    report.cssVariables.unused.length > 0 &&
    report.cssVariables.unused.length <= 30
  ) {
    md += `### Variables non utilisées:\n\n`;
    report.cssVariables.unused.forEach((v) => {
      md += `- \`--${v}\`\n`;
    });
    md += `\n`;
  }

  md += `## ⚠️ Problèmes Détectés\n\n`;
  if (report.issues.length === 0) {
    md += `✅ Aucun problème détecté\n\n`;
  } else {
    md += `### Liste des problèmes\n\n`;
    report.issues.forEach((issue) => {
      md += `#### \`${issue.file}\`\n\n`;
      issue.issues.forEach((i) => {
        md += `- **[${i.severity.toUpperCase()}]** ${i.type}: ${i.message}\n`;
      });
      md += `\n`;
    });
  }

  md += `## 💡 Recommandations\n\n`;
  if (report.recommendations.length === 0) {
    md += `✅ Aucune recommandation\n\n`;
  } else {
    report.recommendations.forEach((rec) => {
      md += `### [${rec.priority.toUpperCase()}] ${rec.type}\n\n`;
      md += `${rec.message}\n\n`;
      if (rec.files && rec.files.length > 0) {
        md += `**Fichiers concernés:**\n\n`;
        rec.files.slice(0, 10).forEach((file) => {
          md += `- \`${file}\`\n`;
        });
        md += `\n`;
      }
      if (rec.variables && rec.variables.length > 0) {
        md += `**Variables concernées:**\n\n`;
        rec.variables.forEach((v) => {
          md += `- \`--${v}\`\n`;
        });
        md += `\n`;
      }
    });
  }

  md += `## 📋 Détails par Composant\n\n`;
  md += `| Fichier | Utilise le thème | Hooks | Variables CSS | Couleurs hardcodées |\n`;
  md += `|---------|-----------------|-------|---------------|---------------------|\n`;

  report.components.forEach((comp) => {
    const hooksStr = comp.hooks.length > 0 ? comp.hooks.join(", ") : "-";
    md += `| \`${comp.file}\` | ${comp.usesTheme ? "✅" : "❌"} | ${hooksStr} | ${comp.cssVariables} | ${comp.hasHardcodedColors ? "⚠️" : "✅"} |\n`;
  });

  return md;
}

// Exécuter l'audit
if (require.main === module) {
  main();
}

module.exports = { main, analyzeFile, analyzeComponents };

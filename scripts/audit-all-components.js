/**
 * Audit complet de TOUS les composants
 * Identifie ceux qui n'utilisent pas le thème, ceux qui sont inutiles ou en doublon
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
const UI_DIR = path.join(
  __dirname,
  "..",
  "apps",
  "web",
  "src",
  "components",
  "ui",
);

// Catégories de composants
const categories = {
  usesTheme: [],
  noTheme: [],
  stories: [],
  utilities: [],
  duplicates: [],
  unnecessary: [],
  all: [],
};

/**
 * Récupère tous les fichiers .tsx et .ts
 */
function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorer certains dossiers
      if (
        !file.startsWith(".") &&
        file !== "node_modules" &&
        file !== "__tests__" &&
        file !== "__mocks__" &&
        file !== ".next"
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
  const fileName = path.basename(filePath);
  const dirName = path.basename(path.dirname(filePath));

  // Détecter les hooks du thème
  const usesComponentConfig = /useComponentConfig/.test(content);
  const usesGlobalTheme = /useGlobalTheme/.test(content);
  const usesThemeColors = /useThemeColors/.test(content);
  const usesThemeSpacing = /useThemeSpacing/.test(content);
  const usesEffects = /useEffects/.test(content);
  const usesLayout = /useLayout/.test(content);

  // Détecter les variables CSS du thème
  const cssVarMatches = content.match(/var\(--[a-zA-Z0-9-]+\)/g) || [];
  const cssVars = cssVarMatches.map((m) =>
    m.replace(/var\(--/, "").replace(/\)$/, ""),
  );

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

  // Déterminer si le composant utilise le thème
  const usesTheme =
    usesComponentConfig ||
    usesGlobalTheme ||
    usesThemeColors ||
    usesThemeSpacing ||
    usesEffects ||
    usesLayout ||
    hasThemedClasses ||
    cssVars.length > 0;

  // Identifier le type de fichier
  const isStory = fileName.includes(".stories.");
  const isTest = fileName.includes(".test.") || fileName.includes(".spec.");
  const isType =
    fileName.endsWith(".types.ts") || fileName.endsWith(".type.ts");
  const isHook = fileName.includes(".hooks.") || fileName.endsWith(".hook.ts");
  const isUtil = fileName.includes(".utils.") || fileName.endsWith(".util.ts");
  const isIndex = fileName === "index.ts";
  const isConstants = fileName === "constants.ts" || fileName === "tokens.ts";
  const isLazy = fileName === "lazy.tsx";

  // Vérifier si c'est un composant exportable
  const hasExport =
    /export\s+(default\s+)?(function|const|class|interface|type)/.test(content);
  const isComponent =
    hasExport && !isStory && !isTest && !isType && !isHook && !isUtil;

  // Compter les lignes de code
  const lines = content.split("\n").length;
  const emptyLines = content.split("\n").filter((l) => l.trim() === "").length;
  const codeLines = lines - emptyLines;

  return {
    file: relativePath,
    fileName,
    dirName,
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
    cssVariables: cssVars,
    cssVariableCount: cssVars.length,
    isStory,
    isTest,
    isType,
    isHook,
    isUtil,
    isIndex,
    isConstants,
    isLazy,
    isComponent,
    lines,
    codeLines,
  };
}

/**
 * Détecte les doublons potentiels (même nom de fichier dans différents dossiers)
 */
function findDuplicates(results) {
  const nameMap = new Map();
  const duplicates = [];

  results.forEach((result) => {
    const baseName = result.fileName.replace(/\.(tsx?|stories\.tsx?)$/, "");
    if (!nameMap.has(baseName)) {
      nameMap.set(baseName, []);
    }
    nameMap.get(baseName).push(result);
  });

  nameMap.forEach((files, baseName) => {
    if (files.length > 1 && files.some((f) => f.isComponent)) {
      // Vérifier si ce sont vraiment des doublons (même fonctionnalité)
      const componentFiles = files.filter((f) => f.isComponent && !f.isStory);
      if (componentFiles.length > 1) {
        duplicates.push({
          name: baseName,
          files: componentFiles.map((f) => f.file),
        });
      }
    }
  });

  return duplicates;
}

/**
 * Identifie les composants potentiellement inutiles pour un template
 */
function identifyUnnecessary(results) {
  const unnecessary = [];

  results.forEach((result) => {
    // Composants très spécifiques à un projet
    const specificPatterns = [
      /masterclass/i,
      /russ/i,
      /harris/i,
      /swiss/i,
      /booking/i,
      /city/i,
      /event/i,
      /venue/i,
    ];

    // Utilitaires qui pourraient être dans lib/
    const utilityPatterns = [
      /ClientOnly/i,
      /SafeHTML/i,
      /lazy/i,
      /LoadingSkeleton/i,
      /Spinner/i,
    ];

    // Composants avec très peu de code (wrappers simples)
    const isTiny = result.codeLines < 20 && result.isComponent;

    const isSpecific = specificPatterns.some((p) => p.test(result.file));
    const isUtility = utilityPatterns.some((p) => p.test(result.fileName));

    if (isSpecific || (isUtility && result.isComponent) || isTiny) {
      unnecessary.push({
        ...result,
        reason: isSpecific
          ? "Contenu spécifique au projet"
          : isUtility
            ? "Utilitaire (pourrait être dans lib/)"
            : "Composant très simple (wrapper)",
      });
    }
  });

  return unnecessary;
}

/**
 * Analyse tous les composants
 */
function analyzeAllComponents() {
  console.log("🔍 Analyse de TOUS les composants...\n");

  const allFiles = getAllFiles(COMPONENTS_DIR);
  console.log(`📁 ${allFiles.length} fichiers trouvés\n`);

  const results = allFiles.map((filePath) => analyzeFile(filePath));

  // Catégoriser les résultats
  results.forEach((result) => {
    categories.all.push(result);

    if (result.isStory) {
      categories.stories.push(result);
    } else if (
      result.isTest ||
      result.isType ||
      result.isHook ||
      result.isUtil ||
      result.isIndex ||
      result.isConstants
    ) {
      categories.utilities.push(result);
    } else if (result.usesTheme) {
      categories.usesTheme.push(result);
    } else {
      categories.noTheme.push(result);
    }
  });

  // Trouver les doublons
  const duplicates = findDuplicates(results);
  categories.duplicates = duplicates;

  // Identifier les composants inutiles
  const unnecessary = identifyUnnecessary(results);
  categories.unnecessary = unnecessary;

  return results;
}

/**
 * Génère le rapport complet
 */
function generateReport(results) {
  // Filtrer les composants réels (pas stories, tests, etc.)
  const realComponents = results.filter(
    (r) =>
      r.isComponent &&
      !r.isStory &&
      !r.isTest &&
      !r.isType &&
      !r.isHook &&
      !r.isUtil &&
      !r.isIndex &&
      !r.isConstants &&
      !r.isLazy,
  );

  const componentsWithTheme = realComponents.filter((c) => c.usesTheme);
  const componentsNoTheme = realComponents.filter((c) => !c.usesTheme);

  const report = {
    summary: {
      date: new Date().toISOString(),
      totalFiles: categories.all.length,
      totalComponents: realComponents.length,
      componentsWithTheme: componentsWithTheme.length,
      componentsNoTheme: componentsNoTheme.length,
      stories: categories.stories.length,
      utilities: categories.utilities.length,
      duplicates: categories.duplicates.length,
      potentiallyUnnecessary: categories.unnecessary.length,
    },
    components: {
      withTheme: componentsWithTheme.map((c) => ({
        file: c.file,
        hooks: Object.entries(c.hooks)
          .filter(([_, used]) => used)
          .map(([name]) => name),
        cssVariables: c.cssVariableCount,
      })),
      noTheme: componentsNoTheme.map((c) => ({
        file: c.file,
        dirName: c.dirName,
        codeLines: c.codeLines,
      })),
    },
    duplicates: categories.duplicates,
    unnecessary: categories.unnecessary.map((u) => ({
      file: u.file,
      reason: u.reason,
      codeLines: u.codeLines,
    })),
    byDirectory: {},
  };

  // Grouper par répertoire
  realComponents.forEach((comp) => {
    if (!report.byDirectory[comp.dirName]) {
      report.byDirectory[comp.dirName] = {
        total: 0,
        withTheme: 0,
        noTheme: 0,
        components: [],
      };
    }
    report.byDirectory[comp.dirName].total++;
    if (comp.usesTheme) {
      report.byDirectory[comp.dirName].withTheme++;
    } else {
      report.byDirectory[comp.dirName].noTheme++;
    }
    report.byDirectory[comp.dirName].components.push({
      file: comp.fileName,
      usesTheme: comp.usesTheme,
    });
  });

  return report;
}

/**
 * Affiche le rapport dans la console
 */
function printReport(report) {
  console.log("=".repeat(80));
  console.log("📊 RAPPORT COMPLET - TOUS LES COMPOSANTS");
  console.log("=".repeat(80));
  console.log();

  console.log("📈 RÉSUMÉ GLOBAL");
  console.log("-".repeat(80));
  console.log(`Total de fichiers: ${report.summary.totalFiles}`);
  console.log(`Composants réels: ${report.summary.totalComponents}`);
  console.log(`  ✅ Avec thème: ${report.summary.componentsWithTheme}`);
  console.log(`  ❌ Sans thème: ${report.summary.componentsNoTheme}`);
  console.log(`Fichiers Storybook (.stories.tsx): ${report.summary.stories}`);
  console.log(
    `Fichiers utilitaires (types, hooks, utils): ${report.summary.utilities}`,
  );
  console.log(`Doublons potentiels: ${report.summary.duplicates}`);
  console.log(
    `Composants potentiellement inutiles: ${report.summary.potentiallyUnnecessary}`,
  );
  console.log();

  console.log("❌ COMPOSANTS SANS THÈME");
  console.log("-".repeat(80));
  if (report.components.noTheme.length === 0) {
    console.log("  ✅ Tous les composants utilisent le thème !");
  } else {
    report.components.noTheme.forEach((comp) => {
      console.log(`  📄 ${comp.file}`);
      console.log(
        `     Répertoire: ${comp.dirName} | Lignes: ${comp.codeLines}`,
      );
    });
  }
  console.log();

  console.log("🔄 DOUBLONS POTENTIELS");
  console.log("-".repeat(80));
  if (report.duplicates.length === 0) {
    console.log("  ✅ Aucun doublon détecté");
  } else {
    report.duplicates.forEach((dup) => {
      console.log(`  ⚠️  ${dup.name}`);
      dup.files.forEach((file) => {
        console.log(`     - ${file}`);
      });
    });
  }
  console.log();

  console.log("🗑️  COMPOSANTS POTENTIELLEMENT INUTILES");
  console.log("-".repeat(80));
  if (report.unnecessary.length === 0) {
    console.log("  ✅ Aucun composant inutile identifié");
  } else {
    report.unnecessary.forEach((comp) => {
      console.log(`  📄 ${comp.file}`);
      console.log(`     Raison: ${comp.reason} | Lignes: ${comp.codeLines}`);
    });
  }
  console.log();

  console.log("📁 PAR RÉPERTOIRE");
  console.log("-".repeat(80));
  Object.entries(report.byDirectory)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([dir, stats]) => {
      const themePercent = ((stats.withTheme / stats.total) * 100).toFixed(0);
      console.log(
        `  📂 ${dir}: ${stats.total} composants (${stats.withTheme} avec thème / ${stats.noTheme} sans thème - ${themePercent}%)`,
      );
    });
  console.log();
}

/**
 * Génère un rapport Markdown détaillé
 */
function generateMarkdownReport(report) {
  let md = `# 📊 Audit Complet de TOUS les Composants\n\n`;
  md += `**Date:** ${new Date(report.summary.date).toLocaleString("fr-FR")}\n\n`;

  md += `## 📈 Résumé Global\n\n`;
  md += `- **Total de fichiers:** ${report.summary.totalFiles}\n`;
  md += `- **Composants réels:** ${report.summary.totalComponents}\n`;
  md += `  - ✅ Avec thème: **${report.summary.componentsWithTheme}**\n`;
  md += `  - ❌ Sans thème: **${report.summary.componentsNoTheme}**\n`;
  md += `- **Fichiers Storybook:** ${report.summary.stories}\n`;
  md += `- **Fichiers utilitaires:** ${report.summary.utilities}\n`;
  md += `- **Doublons potentiels:** ${report.summary.duplicates}\n`;
  md += `- **Composants potentiellement inutiles:** ${report.summary.potentiallyUnnecessary}\n\n`;

  md += `## ❌ Composants Sans Thème (${report.components.noTheme.length})\n\n`;
  if (report.components.noTheme.length === 0) {
    md += `✅ Tous les composants utilisent le thème !\n\n`;
  } else {
    md += `| Fichier | Répertoire | Lignes de code |\n`;
    md += `|---------|------------|----------------|\n`;
    report.components.noTheme.forEach((comp) => {
      md += `| \`${comp.file}\` | \`${comp.dirName}\` | ${comp.codeLines} |\n`;
    });
    md += `\n`;
  }

  md += `## 🔄 Doublons Potentiels (${report.duplicates.length})\n\n`;
  if (report.duplicates.length === 0) {
    md += `✅ Aucun doublon détecté\n\n`;
  } else {
    report.duplicates.forEach((dup) => {
      md += `### \`${dup.name}\`\n\n`;
      dup.files.forEach((file) => {
        md += `- \`${file}\`\n`;
      });
      md += `\n`;
    });
  }

  md += `## 🗑️ Composants Potentiellement Inutiles (${report.unnecessary.length})\n\n`;
  if (report.unnecessary.length === 0) {
    md += `✅ Aucun composant inutile identifié\n\n`;
  } else {
    md += `| Fichier | Raison | Lignes |\n`;
    md += `|---------|--------|--------|\n`;
    report.unnecessary.forEach((comp) => {
      md += `| \`${comp.file}\` | ${comp.reason} | ${comp.codeLines} |\n`;
    });
    md += `\n`;
  }

  md += `## 📁 Composants par Répertoire\n\n`;
  md += `| Répertoire | Total | Avec thème | Sans thème | % Adoption |\n`;
  md += `|------------|-------|------------|-------------|------------|\n`;
  Object.entries(report.byDirectory)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([dir, stats]) => {
      const themePercent = ((stats.withTheme / stats.total) * 100).toFixed(0);
      md += `| \`${dir}\` | ${stats.total} | ${stats.withTheme} | ${stats.noTheme} | ${themePercent}% |\n`;
    });
  md += `\n`;

  md += `## ✅ Composants Avec Thème (${report.components.withTheme.length})\n\n`;
  md += `| Fichier | Hooks | Variables CSS |\n`;
  md += `|---------|-------|---------------|\n`;
  report.components.withTheme.forEach((comp) => {
    const hooksStr = comp.hooks.length > 0 ? comp.hooks.join(", ") : "-";
    md += `| \`${comp.file}\` | ${hooksStr} | ${comp.cssVariables} |\n`;
  });

  return md;
}

/**
 * Point d'entrée principal
 */
function main() {
  console.log("🚀 Démarrage de l'audit complet de TOUS les composants...\n");

  const results = analyzeAllComponents();
  const report = generateReport(results);

  printReport(report);

  // Sauvegarder le rapport JSON
  const reportPath = path.join(
    __dirname,
    "..",
    "COMPONENTS_COMPLETE_AUDIT.json",
  );
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`💾 Rapport JSON sauvegardé: ${reportPath}`);

  // Sauvegarder le rapport Markdown
  const markdownReport = generateMarkdownReport(report);
  const markdownPath = path.join(
    __dirname,
    "..",
    "COMPONENTS_COMPLETE_AUDIT.md",
  );
  fs.writeFileSync(markdownPath, markdownReport);
  console.log(`💾 Rapport Markdown sauvegardé: ${markdownPath}`);

  console.log("\n✅ Audit terminé !");
}

// Exécuter l'audit
if (require.main === module) {
  main();
}

module.exports = { main, analyzeFile, analyzeAllComponents };

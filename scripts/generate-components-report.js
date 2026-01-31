#!/usr/bin/env node

/**
 * Script de génération de rapport complet des composants
 *
 * Génère un rapport détaillé au format Markdown avec:
 * 1. Liste complète de tous les composants
 * 2. Composants non liés au thème
 * 3. Composants redondants/inutiles pour un template complet
 */

const fs = require("fs");
const path = require("path");
const { analyzeComponent, scanDirectory } = require("./analyze-components");

const COMPONENTS_DIR = path.join(__dirname, "../apps/web/src/components");
const OUTPUT_FILE = path.join(__dirname, "../COMPONENTS_ANALYSIS_REPORT.md");

const stats = {
  totalComponents: 0,
  componentsWithTheme: 0,
  componentsWithoutTheme: 0,
  essentialComponents: 0,
  redundantComponents: 0,
  domainSpecificComponents: 0,
  components: [],
};

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

function analyzeComponentDetailed(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(COMPONENTS_DIR, filePath);
  const category = relativePath.split(path.sep)[0];
  const name = path.basename(filePath, path.extname(filePath));

  // Vérifier l'utilisation du thème
  const themePatterns = [
    /var\(--color-/g,
    /(?:className|class)=["'].*?(?:text-|bg-|border-)(?:primary|secondary|error|warning|info|success|foreground|background|muted|border|input|ring)-/g,
    /useGlobalTheme|useComponentConfig|useThemeManager|useThemeColors/g,
    /from ['"]@\/lib\/theme/g,
  ];

  const usesTheme = themePatterns.some((pattern) => pattern.test(content));

  // Détecter les couleurs hardcodées
  const hardcodedPatterns = [
    /text-(?:red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone)-\d+/g,
    /bg-(?:red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone)-\d+/g,
    /border-(?:red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone)-\d+/g,
  ];

  const hardcodedColors = [];
  hardcodedPatterns.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      hardcodedColors.push(...matches);
    }
  });

  // Détecter les classes gray hardcodées (non thématisées)
  const grayPatterns = [
    /text-gray-\d+/g,
    /bg-gray-\d+/g,
    /border-gray-\d+/g,
    /hover:bg-gray-\d+/g,
    /dark:bg-gray-\d+/g,
    /dark:text-gray-\d+/g,
  ];

  const grayClasses = [];
  grayPatterns.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      grayClasses.push(...matches);
    }
  });

  const hasHardcoded = hardcodedColors.length > 0 || grayClasses.length > 0;

  // Déterminer si c'est essentiel
  const ESSENTIAL = {
    ui: [
      "Button",
      "Card",
      "Input",
      "Form",
      "Modal",
      "Dropdown",
      "Select",
      "Alert",
      "Badge",
      "Avatar",
      "Breadcrumbs",
      "Divider",
      "Skeleton",
      "Text",
    ],
    layout: ["Header", "Footer", "Sidebar", "DashboardLayout", "Container"],
    auth: ["ProtectedRoute", "MFA", "UserProfile"],
    errors: ["ErrorDisplay", "ErrorBoundary", "ApiError"],
  };

  const isEssential = ESSENTIAL[category]?.includes(name) || false;

  // Déterminer si c'est redondant
  const REDUNDANT = {
    DataTable: ["DataTableEnhanced", "VirtualTable"],
    Chart: ["AdvancedCharts"],
    Form: ["FormBuilder", "CMSFormBuilder"],
    Modal: ["CRUDModal"],
    Pagination: ["TablePagination"],
    ActivityFeed: ["ActivityLog", "ActivityTimeline", "EventHistory"],
  };

  let isRedundant = null;
  for (const [base, alternatives] of Object.entries(REDUNDANT)) {
    if (
      alternatives.includes(name) ||
      (relativePath.includes(name) &&
        alternatives.some((alt) => relativePath.includes(alt)))
    ) {
      isRedundant = { type: "duplicate", base, alternatives };
      break;
    }
  }

  // Domain-specific
  const domainSpecific = ["billing", "subscriptions", "erp", "crm"];
  if (domainSpecific.some((domain) => relativePath.includes(domain))) {
    isRedundant = {
      type: "domain-specific",
      domain: domainSpecific.find((d) => relativePath.includes(d)),
    };
  }

  stats.totalComponents++;
  if (usesTheme) {
    stats.componentsWithTheme++;
  } else if (/className=|style=/.test(content)) {
    stats.componentsWithoutTheme++;
  }

  if (isEssential) {
    stats.essentialComponents++;
  }

  if (isRedundant) {
    stats.redundantComponents++;
    if (isRedundant.type === "domain-specific") {
      stats.domainSpecificComponents++;
    }
  }

  const componentInfo = {
    path: relativePath,
    category,
    name,
    usesTheme,
    hasHardcodedColors: hasHardcoded,
    hardcodedColors: [...new Set(hardcodedColors)],
    grayClasses: [...new Set(grayClasses)],
    isEssential,
    isRedundant: !!isRedundant,
    redundancyInfo: isRedundant,
    linesOfCode: content.split("\n").length,
    hasExports:
      /export\s+(default\s+)?function|export\s+function|export\s+const|export\s+class/.test(
        content,
      ),
  };

  stats.components.push(componentInfo);

  return componentInfo;
}

function scanDirectoryDetailed(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDirectoryDetailed(fullPath);
    } else if (entry.isFile() && shouldScanFile(fullPath)) {
      try {
        analyzeComponentDetailed(fullPath);
      } catch (error) {
        console.error(
          `❌ Erreur lors de l'analyse de ${fullPath}:`,
          error.message,
        );
      }
    }
  }
}

function generateMarkdownReport() {
  const componentsByCategory = {};
  stats.components.forEach((comp) => {
    if (!componentsByCategory[comp.category]) {
      componentsByCategory[comp.category] = [];
    }
    componentsByCategory[comp.category].push(comp);
  });

  const withoutTheme = stats.components.filter(
    (c) =>
      !c.usesTheme &&
      (c.hardcodedColors.length > 0 || c.grayClasses.length > 0),
  );
  const redundant = stats.components.filter((c) => c.isRedundant);

  let markdown = `# 📊 RAPPORT COMPLET D'ANALYSE DES COMPOSANTS\n\n`;
  markdown += `**Date de génération:** ${new Date().toLocaleString("fr-FR")}\n\n`;
  markdown += `---\n\n`;

  // Statistiques globales
  markdown += `## 📈 Statistiques Globales\n\n`;
  markdown += `- **Total de composants analysés:** ${stats.totalComponents}\n`;
  markdown += `- **Composants avec thème:** ${stats.componentsWithTheme} (${((stats.componentsWithTheme / stats.totalComponents) * 100).toFixed(1)}%)\n`;
  markdown += `- **Composants sans thème:** ${stats.componentsWithoutTheme} (${((stats.componentsWithoutTheme / stats.totalComponents) * 100).toFixed(1)}%)\n`;
  markdown += `- **Composants essentiels:** ${stats.essentialComponents}\n`;
  markdown += `- **Composants redondants/inutiles:** ${stats.redundantComponents}\n`;
  markdown += `- **Composants spécifiques à un domaine:** ${stats.domainSpecificComponents}\n\n`;

  const themeScore = (
    (stats.componentsWithTheme / stats.totalComponents) *
    100
  ).toFixed(1);
  markdown += `### Score Global: ${themeScore}%\n\n`;

  if (parseFloat(themeScore) >= 95) {
    markdown += `✅ **Excellent!** Le système de thème est presque parfaitement unifié.\n\n`;
  } else if (parseFloat(themeScore) >= 85) {
    markdown += `⚠️  **Bon**, mais quelques composants nécessitent encore des corrections.\n\n`;
  } else {
    markdown += `❌ **Des améliorations importantes sont nécessaires.**\n\n`;
  }

  markdown += `---\n\n`;

  // 1. Composants sans thème
  markdown += `## 1️⃣ Composants NON LIÉS AU THÈME\n\n`;
  markdown += `⚠️  **${withoutTheme.length} composants** n'utilisent pas le système de thème unifié et contiennent des couleurs hardcodées.\n\n`;

  if (withoutTheme.length === 0) {
    markdown += `✅ Aucun composant sans thème détecté! Tous utilisent le système de thème unifié.\n\n`;
  } else {
    // Grouper par catégorie
    const byCategory = {};
    withoutTheme.forEach((comp) => {
      if (!byCategory[comp.category]) {
        byCategory[comp.category] = [];
      }
      byCategory[comp.category].push(comp);
    });

    Object.entries(byCategory)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([category, comps]) => {
        markdown += `### 📁 ${category}/ (${comps.length} composants)\n\n`;
        markdown += `| Composant | Couleurs hardcodées | Classes gray | Lignes |\n`;
        markdown += `|-----------|---------------------|--------------|--------|\n`;

        comps.forEach((comp) => {
          const hardcoded =
            comp.hardcodedColors.length > 0
              ? `🔴 ${comp.hardcodedColors.length}`
              : "✅";
          const gray =
            comp.grayClasses.length > 0
              ? `🟡 ${comp.grayClasses.length}`
              : "✅";
          markdown += `| **${comp.name}**<br>\`${comp.path}\` | ${hardcoded} | ${gray} | ${comp.linesOfCode} |\n`;
        });
        markdown += `\n`;
      });

    // Liste détaillée des couleurs hardcodées
    markdown += `### 🔍 Détail des couleurs hardcodées par composant\n\n`;
    withoutTheme.forEach((comp) => {
      if (comp.hardcodedColors.length > 0 || comp.grayClasses.length > 0) {
        markdown += `#### ${comp.name} (\`${comp.path}\`)\n\n`;
        if (comp.hardcodedColors.length > 0) {
          markdown += `- **Couleurs hardcodées:** ${comp.hardcodedColors.join(", ")}\n`;
        }
        if (comp.grayClasses.length > 0) {
          markdown += `- **Classes gray non thématisées:** ${comp.grayClasses.join(", ")}\n`;
        }
        markdown += `\n`;
      }
    });
  }

  markdown += `---\n\n`;

  // 2. Composants redondants/inutiles
  markdown += `## 2️⃣ Composants REDONDANTS/INUTILES pour un Template Complet\n\n`;
  markdown += `⚠️  **${redundant.length} composants** potentiellement redondants ou inutiles pour un template générique.\n\n`;

  if (redundant.length === 0) {
    markdown += `✅ Aucun composant redondant détecté.\n\n`;
  } else {
    // Grouper par type de redondance
    const byType = {
      duplicate: [],
      "domain-specific": [],
    };

    redundant.forEach((comp) => {
      if (comp.redundancyInfo) {
        const type = comp.redundancyInfo.type;
        if (byType[type]) {
          byType[type].push(comp);
        }
      }
    });

    // Duplications
    if (byType["duplicate"].length > 0) {
      markdown += `### 🔄 Duplications de fonctionnalités\n\n`;
      markdown += `| Composant | Duplique | Alternatives | Recommandation |\n`;
      markdown += `|-----------|----------|--------------|----------------|\n`;

      byType["duplicate"].forEach((comp) => {
        const info = comp.redundancyInfo;
        const recommendation =
          comp.category === "ui" && comp.name.includes("Enhanced")
            ? "Conserver la version avancée, documenter la différence"
            : comp.name.includes("Builder")
              ? "Conserver FormBuilder/FormBuilder comme variante"
              : "Évaluer si la fonctionnalité est vraiment nécessaire";
        markdown += `| **${comp.name}**<br>\`${comp.path}\` | ${info.base} | ${info.alternatives?.join(", ") || "N/A"} | ${recommendation} |\n`;
      });
      markdown += `\n`;
    }

    // Domain-specific
    if (byType["domain-specific"].length > 0) {
      markdown += `### 🏢 Composants spécifiques à un domaine (OPTIONNELS pour template générique)\n\n`;
      markdown += `Ces composants sont spécifiques à un domaine métier et peuvent être **optionnels** pour un template générique.\n\n`;

      const byDomain = {};
      byType["domain-specific"].forEach((comp) => {
        const domain = comp.redundancyInfo.domain;
        if (!byDomain[domain]) {
          byDomain[domain] = [];
        }
        byDomain[domain].push(comp);
      });

      Object.entries(byDomain)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([domain, comps]) => {
          markdown += `#### 📦 ${domain.toUpperCase()} (${comps.length} composants)\n\n`;
          markdown += `| Composant | Path | Lignes |\n`;
          markdown += `|-----------|------|--------|\n`;
          comps.forEach((comp) => {
            markdown += `| **${comp.name}** | \`${comp.path}\` | ${comp.linesOfCode} |\n`;
          });
          markdown += `\n`;
          markdown += `**Recommandation:** Ces composants peuvent être conservés dans un template complet mais doivent être **documentés comme optionnels**.\n\n`;
        });
    }
  }

  markdown += `---\n\n`;

  // 3. Liste complète par catégorie
  markdown += `## 3️⃣ LISTE COMPLÈTE DES COMPOSANTS PAR CATÉGORIE\n\n`;

  Object.entries(componentsByCategory)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([category, comps]) => {
      const themeCount = comps.filter((c) => c.usesTheme).length;
      const themePercent = ((themeCount / comps.length) * 100).toFixed(0);
      const essentialCount = comps.filter((c) => c.isEssential).length;
      const redundantCount = comps.filter((c) => c.isRedundant).length;
      const withoutThemeCount = comps.filter(
        (c) =>
          !c.usesTheme &&
          (c.hardcodedColors.length > 0 || c.grayClasses.length > 0),
      ).length;

      const statusIcon = withoutThemeCount > 0 ? "⚠️" : "✅";
      const statusText =
        withoutThemeCount > 0 ? "Nécessite corrections" : "Thème unifié";

      markdown += `### ${statusIcon} ${category}/ (${comps.length} composants)\n\n`;
      markdown += `- **Thème:** ${themeCount}/${comps.length} (${themePercent}%) - ${statusText}\n`;
      markdown += `- **Essentiels:** ${essentialCount}\n`;
      markdown += `- **Redondants:** ${redundantCount}\n\n`;

      markdown += `| Composant | Thème | Couleurs hardcodées | Essentiel | Redondant | LOC |\n`;
      markdown += `|-----------|-------|---------------------|-----------|-----------|-----|\n`;

      comps
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((comp) => {
          const themeIcon = comp.usesTheme ? "✅" : "❌";
          const hardcodedIcon =
            comp.hardcodedColors.length > 0 || comp.grayClasses.length > 0
              ? `🔴 ${comp.hardcodedColors.length + comp.grayClasses.length}`
              : "✅";
          const essentialIcon = comp.isEssential ? "⭐" : "";
          const redundantIcon = comp.isRedundant ? "🔄" : "";
          markdown += `| ${comp.name} | ${themeIcon} | ${hardcodedIcon} | ${essentialIcon} | ${redundantIcon} | ${comp.linesOfCode} |\n`;
        });

      markdown += `\n`;
    });

  markdown += `---\n\n`;

  // 4. Recommandations
  markdown += `## 4️⃣ RECOMMANDATIONS\n\n`;

  markdown += `### ✅ Actions prioritaires:\n\n`;
  markdown += `1. **Corriger les composants sans thème:** ${withoutTheme.length} composants nécessitent une correction pour utiliser le système de thème unifié.\n`;
  markdown += `2. **Remplacer les couleurs hardcodées:** Utiliser les variables CSS du thème (\`var(--color-*)\`) ou les classes Tailwind thématisées.\n`;
  markdown += `3. **Documenter les composants optionnels:** Les composants spécifiques à un domaine doivent être documentés comme optionnels.\n`;
  markdown += `4. **Évaluer les duplications:** ${redundant.filter((c) => c.redundancyInfo?.type === "duplicate").length} composants en double - décider lesquels conserver.\n\n`;

  markdown += `### 📋 Liste des composants à corriger en priorité:\n\n`;
  withoutTheme
    .sort(
      (a, b) =>
        b.hardcodedColors.length +
        b.grayClasses.length -
        (a.hardcodedColors.length + a.grayClasses.length),
    )
    .slice(0, 20)
    .forEach((comp, index) => {
      markdown += `${index + 1}. **${comp.name}** (\`${comp.path}\`) - ${comp.hardcodedColors.length + comp.grayClasses.length} couleurs hardcodées\n`;
    });

  markdown += `\n---\n\n`;
  markdown += `**Généré automatiquement par** \`scripts/generate-components-report.js\`\n\n`;

  return markdown;
}

// Point d'entrée
function main() {
  console.log("🔍 Analyse détaillée de tous les composants...\n");

  scanDirectoryDetailed(COMPONENTS_DIR);

  console.log("📝 Génération du rapport Markdown...\n");

  const markdown = generateMarkdownReport();

  fs.writeFileSync(OUTPUT_FILE, markdown, "utf-8");

  console.log(`✅ Rapport généré avec succès: ${OUTPUT_FILE}\n`);
  console.log(`📊 Statistiques:`);
  console.log(`   - Total: ${stats.totalComponents} composants`);
  console.log(
    `   - Avec thème: ${stats.componentsWithTheme} (${((stats.componentsWithTheme / stats.totalComponents) * 100).toFixed(1)}%)`,
  );
  console.log(
    `   - Sans thème: ${stats.componentsWithoutTheme} (${((stats.componentsWithoutTheme / stats.totalComponents) * 100).toFixed(1)}%)`,
  );
  console.log(`   - Redondants: ${stats.redundantComponents}`);
  console.log(`\n📄 Rapport complet disponible dans: ${OUTPUT_FILE}\n`);
}

if (require.main === module) {
  main();
}

module.exports = { generateMarkdownReport };

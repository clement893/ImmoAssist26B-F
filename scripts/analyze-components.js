#!/usr/bin/env node

/**
 * Script d'analyse complète des composants
 *
 * Identifie:
 * 1. Les composants qui ne sont pas liés au thème
 * 2. Les composants inutiles ou en double pour un template complet
 *
 * Usage: node scripts/analyze-components.js [--json] [--verbose]
 */

const fs = require("fs");
const path = require("path");

const COMPONENTS_DIR = path.join(__dirname, "../apps/web/src/components");

// Patterns pour détecter l'utilisation du thème
const THEME_PATTERNS = {
  // Variables CSS du thème
  cssVars: [
    /var\(--color-/g,
    /var\(--font-/g,
    /var\(--spacing-/g,
    /var\(--border-radius/g,
    /--color-/g,
  ],
  // Classes Tailwind thématisées
  themedClasses: [
    /(?:className|class)=["'].*?(?:text-|bg-|border-)(?:primary|secondary|error|warning|info|success|foreground|background|muted|border|input|ring)-/g,
    /(?:className|class)=["'].*?text-(?:foreground|muted-foreground)/g,
    /(?:className|class)=["'].*?bg-(?:background|muted)/g,
    /(?:className|class)=["'].*?border-border/g,
  ],
  // Hooks de thème
  themeHooks: [
    /useGlobalTheme|useComponentConfig|useThemeManager|useThemeColors/g,
    /from ['"]@\/lib\/theme/g,
    /from ['"]@\/components\/theme/g,
  ],
  // Variables CSS en style inline
  inlineThemeVars: [/style=\{.*?--color-/g, /style=\{.*?var\(--color-/g],
};

// Composants essentiels pour un template complet
const ESSENTIAL_COMPONENTS = {
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
    "Spinner",
    "Loading",
    "EmptyState",
    "ErrorBoundary",
    "Text",
  ],
  layout: ["Header", "Footer", "Sidebar", "DashboardLayout", "Container"],
  auth: ["ProtectedRoute", "MFA", "UserProfile"],
  errors: ["ErrorDisplay", "ErrorBoundary", "ApiError"],
};

// Composants potentiellement redondants ou spécifiques à un cas d'usage
const POTENTIALLY_REDUNDANT = {
  // Duplications de fonctionnalités
  duplicates: {
    DataTable: ["DataTableEnhanced", "VirtualTable"],
    Chart: ["AdvancedCharts"],
    Form: ["FormBuilder"],
    Modal: ["CRUDModal"],
    Pagination: ["TablePagination"],
    ActivityFeed: ["ActivityLog", "ActivityTimeline", "EventHistory"],
    TagInput: ["tags/TagInput", "ui/TagInput"],
    TemplateEditor: ["templates/TemplateEditor", "page-builder/PageEditor"],
  },
  // Composants très spécifiques à un domaine
  domainSpecific: [
    "billing",
    "subscriptions",
    "invoices",
    "payments",
    "erp",
    "crm",
    "accounting",
  ],
  // Composants de monitoring avancé (optionnels pour template de base)
  advancedMonitoring: [
    "monitoring/PerformanceProfiler",
    "monitoring/SystemMetrics",
    "monitoring/ErrorTrackingDashboard",
    "performance/OptimizationDashboard",
  ],
};

const stats = {
  totalComponents: 0,
  componentsWithTheme: 0,
  componentsWithoutTheme: 0,
  essentialComponents: 0,
  redundantComponents: 0,
  domainSpecificComponents: 0,
  unusedComponents: [],
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

function usesTheme(content) {
  const checks = {
    cssVars: false,
    themedClasses: false,
    themeHooks: false,
    inlineThemeVars: false,
  };

  // Vérifier les patterns
  THEME_PATTERNS.cssVars.forEach((pattern) => {
    if (pattern.test(content)) checks.cssVars = true;
  });

  THEME_PATTERNS.themedClasses.forEach((pattern) => {
    if (pattern.test(content)) checks.themedClasses = true;
  });

  THEME_PATTERNS.themeHooks.forEach((pattern) => {
    if (pattern.test(content)) checks.themeHooks = true;
  });

  THEME_PATTERNS.inlineThemeVars.forEach((pattern) => {
    if (pattern.test(content)) checks.inlineThemeVars = true;
  });

  // Retourne true si au moins un pattern est trouvé
  return (
    checks.cssVars ||
    checks.themedClasses ||
    checks.themeHooks ||
    checks.inlineThemeVars
  );
}

function hasHardcodedColors(content) {
  // Détecter les couleurs hardcodées (après nos corrections, il ne devrait plus y en avoir)
  const hardcodedPatterns = [
    /text-(?:red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone)-\d+/g,
    /bg-(?:red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone)-\d+/g,
    /border-(?:red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone)-\d+/g,
    /#[0-9A-Fa-f]{3,6}/g,
    /rgb\(/g,
  ];

  return hardcodedPatterns.some((pattern) => pattern.test(content));
}

function isEssential(category, name) {
  return ESSENTIAL_COMPONENTS[category]?.includes(name) || false;
}

function isRedundant(filePath, name) {
  // Vérifier les duplications
  for (const [base, duplicates] of Object.entries(
    POTENTIALLY_REDUNDANT.duplicates,
  )) {
    if (
      duplicates.includes(name) ||
      duplicates.some((d) => filePath.includes(d))
    ) {
      return { type: "duplicate", base, duplicates };
    }
  }

  // Vérifier si c'est spécifique à un domaine
  for (const domain of POTENTIALLY_REDUNDANT.domainSpecific) {
    if (filePath.includes(domain)) {
      return { type: "domain-specific", domain };
    }
  }

  // Vérifier le monitoring avancé
  for (const monitoring of POTENTIALLY_REDUNDANT.advancedMonitoring) {
    if (filePath.includes(monitoring)) {
      return { type: "advanced-monitoring", component: monitoring };
    }
  }

  return null;
}

function analyzeComponent(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(COMPONENTS_DIR, filePath);
  const category = relativePath.split(path.sep)[0];
  const name = path.basename(filePath, path.extname(filePath));

  const usesThemeSystem = usesTheme(content);
  const hasHardcoded = hasHardcodedColors(content);
  const essential = isEssential(category, name);
  const redundant = isRedundant(filePath, name);

  const componentInfo = {
    path: relativePath,
    category,
    name,
    usesTheme: usesThemeSystem,
    hasHardcodedColors: hasHardcoded,
    isEssential: essential,
    isRedundant: !!redundant,
    redundancyInfo: redundant,
    hasClassName: /className=/.test(content),
    hasStyleProp: /style=/.test(content),
    usesHooks: /use[A-Z]/.test(content),
    linesOfCode: content.split("\n").length,
  };

  stats.totalComponents++;
  if (usesThemeSystem) {
    stats.componentsWithTheme++;
  } else if (componentInfo.hasClassName || componentInfo.hasStyleProp) {
    stats.componentsWithoutTheme++;
  }

  if (essential) {
    stats.essentialComponents++;
  }

  if (redundant) {
    stats.redundantComponents++;
    if (redundant.type === "domain-specific") {
      stats.domainSpecificComponents++;
    }
  }

  stats.components.push(componentInfo);

  return componentInfo;
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && shouldScanFile(fullPath)) {
      try {
        analyzeComponent(fullPath);
      } catch (error) {
        console.error(
          `❌ Erreur lors de l'analyse de ${fullPath}:`,
          error.message,
        );
      }
    }
  }
}

function generateReport(options = {}) {
  const { json = false, verbose = false } = options;

  if (json) {
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  console.log("\n" + "=".repeat(100));
  console.log("📊 ANALYSE COMPLÈTE DES COMPOSANTS");
  console.log("=".repeat(100) + "\n");

  console.log("📈 Statistiques Globales:");
  console.log(`   Total de composants analysés: ${stats.totalComponents}`);
  console.log(
    `   Composants avec thème: ${stats.componentsWithTheme} (${((stats.componentsWithTheme / stats.totalComponents) * 100).toFixed(1)}%)`,
  );
  console.log(
    `   Composants sans thème: ${stats.componentsWithoutTheme} (${((stats.componentsWithoutTheme / stats.totalComponents) * 100).toFixed(1)}%)`,
  );
  console.log(`   Composants essentiels: ${stats.essentialComponents}`);
  console.log(
    `   Composants redondants/inutiles: ${stats.redundantComponents}`,
  );
  console.log(
    `   Composants spécifiques à un domaine: ${stats.domainSpecificComponents}`,
  );

  // 1. Composants sans thème
  const withoutTheme = stats.components.filter(
    (c) => !c.usesTheme && (c.hasClassName || c.hasStyleProp),
  );
  console.log("\n" + "1️⃣  COMPOSANTS NON LIÉS AU THÈME:");
  console.log("-".repeat(100));

  if (withoutTheme.length === 0) {
    console.log(
      "✅ Aucun composant sans thème détecté! Tous utilisent le système de thème unifié.\n",
    );
  } else {
    console.log(
      `⚠️  ${withoutTheme.length} composants n'utilisent pas le système de thème:\n`,
    );

    // Grouper par catégorie
    const byCategory = {};
    withoutTheme.forEach((comp) => {
      if (!byCategory[comp.category]) {
        byCategory[comp.category] = [];
      }
      byCategory[comp.category].push(comp);
    });

    Object.entries(byCategory).forEach(([category, comps]) => {
      console.log(`   📁 ${category}/ (${comps.length} composants):`);
      comps.forEach((comp) => {
        const hasHardcoded = comp.hasHardcodedColors ? "🔴 " : "🟡 ";
        console.log(`      ${hasHardcoded}${comp.name} (${comp.path})`);
        if (verbose) {
          console.log(`         - Lignes de code: ${comp.linesOfCode}`);
          console.log(`         - Utilise className: ${comp.hasClassName}`);
          console.log(`         - Utilise style: ${comp.hasStyleProp}`);
          console.log(
            `         - Couleurs hardcodées: ${comp.hasHardcodedColors}`,
          );
        }
      });
      console.log("");
    });
  }

  // 2. Composants redondants/inutiles
  const redundant = stats.components.filter((c) => c.isRedundant);
  console.log("2️⃣  COMPOSANTS REDONDANTS/INUTILES:");
  console.log("-".repeat(100));

  if (redundant.length === 0) {
    console.log("✅ Aucun composant redondant détecté.\n");
  } else {
    console.log(
      `⚠️  ${redundant.length} composants potentiellement redondants ou inutiles:\n`,
    );

    // Grouper par type de redondance
    const byType = {
      duplicate: [],
      "domain-specific": [],
      "advanced-monitoring": [],
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
      console.log("   🔄 Duplications de fonctionnalités:");
      byType["duplicate"].forEach((comp) => {
        const info = comp.redundancyInfo;
        console.log(`      - ${comp.name} (${comp.path})`);
        console.log(`        → Duplique: ${info.base}`);
        console.log(`        → Alternatives: ${info.duplicates.join(", ")}`);
      });
      console.log("");
    }

    // Domain-specific
    if (byType["domain-specific"].length > 0) {
      console.log(
        "   🏢 Composants spécifiques à un domaine (optionnels pour template):",
      );
      const byDomain = {};
      byType["domain-specific"].forEach((comp) => {
        const domain = comp.redundancyInfo.domain;
        if (!byDomain[domain]) {
          byDomain[domain] = [];
        }
        byDomain[domain].push(comp);
      });

      Object.entries(byDomain).forEach(([domain, comps]) => {
        console.log(
          `      📦 ${domain.toUpperCase()} (${comps.length} composants):`,
        );
        comps.forEach((comp) => {
          console.log(`         - ${comp.name} (${comp.path})`);
        });
      });
      console.log("");
    }

    // Advanced monitoring
    if (byType["advanced-monitoring"].length > 0) {
      console.log("   📊 Composants de monitoring avancé (optionnels):");
      byType["advanced-monitoring"].forEach((comp) => {
        console.log(`      - ${comp.name} (${comp.path})`);
      });
      console.log("");
    }
  }

  // 3. Statistiques par catégorie
  console.log("3️⃣  STATISTIQUES PAR CATÉGORIE:");
  console.log("-".repeat(100));

  const byCategory = {};
  stats.components.forEach((comp) => {
    if (!byCategory[comp.category]) {
      byCategory[comp.category] = {
        total: 0,
        withTheme: 0,
        withoutTheme: 0,
        essential: 0,
        redundant: 0,
      };
    }
    byCategory[comp.category].total++;
    if (comp.usesTheme) {
      byCategory[comp.category].withTheme++;
    } else if (comp.hasClassName || comp.hasStyleProp) {
      byCategory[comp.category].withoutTheme++;
    }
    if (comp.isEssential) {
      byCategory[comp.category].essential++;
    }
    if (comp.isRedundant) {
      byCategory[comp.category].redundant++;
    }
  });

  Object.entries(byCategory)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([category, data]) => {
      const themePercent = ((data.withTheme / data.total) * 100).toFixed(0);
      const icon = data.withoutTheme > 0 ? "⚠️ " : "✅ ";
      console.log(
        `${icon} ${category.padEnd(20)} | Total: ${String(data.total).padStart(3)} | Thème: ${String(data.withTheme).padStart(3)} (${themePercent}%) | Essentiels: ${String(data.essential).padStart(2)} | Redondants: ${String(data.redundant).padStart(2)}`,
      );
    });

  console.log("\n" + "=".repeat(100));

  // Score global
  const themeScore = (
    (stats.componentsWithTheme / stats.totalComponents) *
    100
  ).toFixed(1);
  console.log(
    `📊 Score Global: ${themeScore}% des composants utilisent le thème`,
  );

  if (parseFloat(themeScore) >= 95) {
    console.log(
      "✅ Excellent! Le système de thème est presque parfaitement unifié.",
    );
  } else if (parseFloat(themeScore) >= 85) {
    console.log(
      "⚠️  Bon, mais quelques composants nécessitent encore des corrections.",
    );
  } else {
    console.log("❌ Des améliorations importantes sont nécessaires.");
  }

  console.log("=".repeat(100) + "\n");
}

// Point d'entrée
function main() {
  const args = process.argv.slice(2);
  const options = {
    json: args.includes("--json"),
    verbose: args.includes("--verbose"),
  };

  console.log("🔍 Analyse de tous les composants...\n");

  scanDirectory(COMPONENTS_DIR);

  generateReport(options);
}

if (require.main === module) {
  main();
}

module.exports = { analyzeComponent, scanDirectory, generateReport };

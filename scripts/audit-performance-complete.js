#!/usr/bin/env node

/**
 * Audit Complet de Performance
 * Analyse approfondie des performances frontend, backend, bundle et database
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = process.cwd();
const FRONTEND_DIR = path.join(ROOT_DIR, "apps/web/src");
const BACKEND_DIR = path.join(ROOT_DIR, "backend/app");

const performanceResults = {
  frontend: { score: 0, max: 100, issues: [], positives: [] },
  backend: { score: 0, max: 100, issues: [], positives: [] },
  bundle: { score: 0, max: 100, issues: [], positives: [] },
  database: { score: 0, max: 100, issues: [], positives: [] },
  optimization: { score: 0, max: 100, issues: [], positives: [] },
};

const performanceStats = {
  largeComponents: [],
  missingMemoization: [],
  missingLazyLoading: [],
  inlineStyles: [],
  largeBundles: [],
  nPlusOneQueries: [],
  missingIndexes: [],
  inefficientQueries: [],
};

/**
 * Analyser les performances frontend
 */
function analyzeFrontendPerformance() {
  let score = 100;

  console.log("📱 Analysing frontend performance...\n");

  const componentFiles = getAllFiles(FRONTEND_DIR, [".tsx", ".jsx"]);

  componentFiles.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");
    const relativePath = path.relative(ROOT_DIR, file);
    const lines = content.split("\n");

    // Détecter les composants volumineux
    if (lines.length > 300) {
      performanceStats.largeComponents.push({
        file: relativePath,
        lines: lines.length,
      });
      performanceResults.frontend.issues.push({
        file: relativePath,
        issue: `Large component: ${lines.length} lines (consider splitting)`,
        severity: "medium",
      });
      score -= 2;
    }

    // Détecter les opérations coûteuses sans memoization
    if (content.includes("useState") || content.includes("useEffect")) {
      const expensiveOps = [
        /\.map\(/g,
        /\.filter\(/g,
        /\.reduce\(/g,
        /\.sort\(/g,
        /JSON\.parse/g,
        /JSON\.stringify/g,
      ];

      let expensiveCount = 0;
      expensiveOps.forEach((pattern) => {
        const matches = content.match(pattern);
        if (matches) expensiveCount += matches.length;
      });

      const hasUseMemo = content.includes("useMemo");
      const hasUseCallback = content.includes("useCallback");

      if (expensiveCount > 5 && !hasUseMemo && !hasUseCallback) {
        performanceStats.missingMemoization.push({
          file: relativePath,
          operations: expensiveCount,
        });
        performanceResults.frontend.issues.push({
          file: relativePath,
          issue: `${expensiveCount} expensive operations without memoization`,
          severity: "medium",
        });
        score -= 3;
      }
    }

    // Détecter les imports lourds sans lazy loading
    const heavyImports = [
      /import.*Chart/g,
      /import.*Editor/g,
      /import.*Monaco/g,
      /import.*Recharts/g,
    ];

    heavyImports.forEach((pattern) => {
      if (
        pattern.test(content) &&
        !content.includes("dynamic") &&
        !content.includes("lazy")
      ) {
        performanceStats.missingLazyLoading.push({
          file: relativePath,
          import: content.match(pattern)?.[0],
        });
        performanceResults.frontend.issues.push({
          file: relativePath,
          issue: "Heavy component imported directly (consider lazy loading)",
          severity: "low",
        });
        score -= 1;
      }
    });

    // Détecter les styles inline excessifs
    const inlineStyleMatches = content.match(/style=\{\{[^}]*\}\}/g);
    if (inlineStyleMatches && inlineStyleMatches.length > 10) {
      performanceStats.inlineStyles.push({
        file: relativePath,
        count: inlineStyleMatches.length,
      });
      performanceResults.frontend.issues.push({
        file: relativePath,
        issue: `${inlineStyleMatches.length} inline style objects (extract to CSS)`,
        severity: "low",
      });
      score -= 1;
    }

    // Détecter les useEffect avec trop de dépendances
    const useEffectMatches = content.match(/useEffect\([^)]*\)/g);
    useEffectMatches?.forEach((match) => {
      const depsMatch = match.match(/\[([^\]]*)\]/);
      if (depsMatch) {
        const deps = depsMatch[1].split(",").filter((d) => d.trim());
        if (deps.length > 8) {
          performanceResults.frontend.issues.push({
            file: relativePath,
            issue: `useEffect with ${deps.length} dependencies (potential re-render issue)`,
            severity: "medium",
          });
          score -= 2;
        }
      }
    });
  });

  // Vérifier l'utilisation de React.memo
  const memoUsage = componentFiles.filter((f) => {
    const content = fs.readFileSync(f, "utf8");
    return content.includes("React.memo") || content.includes("memo(");
  }).length;

  const memoPercentage = Math.round((memoUsage / componentFiles.length) * 100);
  if (memoPercentage < 10) {
    performanceResults.frontend.issues.push({
      file: "General",
      issue: `Low React.memo usage (${memoPercentage}% of components)`,
      severity: "low",
    });
    score -= 5;
  } else {
    performanceResults.frontend.positives.push(
      `Good React.memo usage (${memoPercentage}%)`,
    );
  }

  // Vérifier l'optimisation des images
  const imageUsage = componentFiles.filter((f) => {
    const content = fs.readFileSync(f, "utf8");
    return content.includes("<img") && !content.includes("next/image");
  }).length;

  if (imageUsage > 0) {
    performanceResults.frontend.issues.push({
      file: "General",
      issue: `${imageUsage} components using <img> instead of next/image`,
      severity: "medium",
    });
    score -= imageUsage * 2;
  } else {
    performanceResults.frontend.positives.push(
      "Using next/image for image optimization",
    );
  }

  performanceResults.frontend.score = Math.max(0, Math.min(100, score));
}

/**
 * Analyser les performances backend
 */
function analyzeBackendPerformance() {
  let score = 100;

  console.log("⚙️  Analysing backend performance...\n");

  const backendFiles = getAllFiles(BACKEND_DIR, [".py"]);

  // Détecter les requêtes N+1 potentielles
  backendFiles.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");
    const relativePath = path.relative(ROOT_DIR, file);

    // Détecter les boucles avec requêtes DB
    if (
      (content.includes("for ") && content.includes("db.query")) ||
      (content.includes("for ") && content.includes("session.query"))
    ) {
      const forMatches = content.match(/for\s+\w+\s+in\s+\w+:/g);
      const queryMatches = content.match(
        /(db\.query|session\.query|\.get\(|\.filter\()/g,
      );

      if (
        forMatches &&
        queryMatches &&
        forMatches.length > 0 &&
        queryMatches.length > forMatches.length
      ) {
        performanceStats.nPlusOneQueries.push({
          file: relativePath,
        });
        performanceResults.backend.issues.push({
          file: relativePath,
          issue: "Potential N+1 query pattern detected",
          severity: "high",
        });
        score -= 5;
      }
    }

    // Vérifier l'utilisation d'eager loading
    const hasEagerLoading =
      content.includes("joinedload") ||
      content.includes("selectinload") ||
      content.includes("subqueryload");

    if (content.includes("relationship") && !hasEagerLoading) {
      performanceResults.backend.issues.push({
        file: relativePath,
        issue: "Relationship without eager loading (potential N+1)",
        severity: "medium",
      });
      score -= 2;
    } else if (hasEagerLoading) {
      performanceResults.backend.positives.push(
        `Eager loading used in ${path.basename(relativePath)}`,
      );
    }

    // Détecter les requêtes sans pagination
    if (
      content.includes(".all()") &&
      !content.includes("limit") &&
      !content.includes("offset")
    ) {
      performanceResults.backend.issues.push({
        file: relativePath,
        issue: "Query without pagination (.all() without limit)",
        severity: "medium",
      });
      score -= 3;
    }

    // Vérifier l'utilisation du cache
    const hasCache =
      content.includes("cache") ||
      content.includes("redis") ||
      content.includes("@cache");

    if (content.includes("db.query") && !hasCache) {
      // Pas critique, juste une note
      performanceResults.backend.issues.push({
        file: relativePath,
        issue: "Query without caching (consider adding cache)",
        severity: "low",
      });
      score -= 1;
    }
  });

  // Vérifier la pagination
  const paginationUsage = backendFiles.filter((f) => {
    const content = fs.readFileSync(f, "utf8");
    return content.includes("limit") && content.includes("offset");
  }).length;

  if (paginationUsage > 0) {
    performanceResults.backend.positives.push(
      `Pagination implemented in ${paginationUsage} files`,
    );
  }

  performanceResults.backend.score = Math.max(0, Math.min(100, score));
}

/**
 * Analyser la taille des bundles
 */
function analyzeBundleSize() {
  let score = 100;

  console.log("📦 Analysing bundle size...\n");

  // Vérifier la configuration Next.js
  const nextConfigPath = path.join(ROOT_DIR, "apps/web/next.config.js");
  if (fs.existsSync(nextConfigPath)) {
    const config = fs.readFileSync(nextConfigPath, "utf8");

    if (config.includes("optimizePackageImports")) {
      performanceResults.bundle.positives.push(
        "Package imports optimization enabled",
      );
    } else {
      performanceResults.bundle.issues.push({
        file: "next.config.js",
        issue: "Package imports optimization not configured",
        severity: "medium",
      });
      score -= 10;
    }

    if (config.includes("removeConsole")) {
      performanceResults.bundle.positives.push(
        "Console removal in production enabled",
      );
    } else {
      performanceResults.bundle.issues.push({
        file: "next.config.js",
        issue: "Console removal not configured",
        severity: "low",
      });
      score -= 5;
    }
  }

  // Vérifier les dépendances lourdes
  const packageJsonPath = path.join(ROOT_DIR, "apps/web/package.json");
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const heavyDeps = ["lodash", "moment", "axios", "recharts"];

    const foundHeavy = heavyDeps.filter(
      (dep) => pkg.dependencies?.[dep] || pkg.devDependencies?.[dep],
    );

    if (foundHeavy.length > 0) {
      foundHeavy.forEach((dep) => {
        performanceResults.bundle.issues.push({
          file: "package.json",
          issue: `Heavy dependency: ${dep} (consider alternatives)`,
          severity: "low",
        });
      });
      score -= foundHeavy.length * 2;
    }
  }

  // Vérifier le code splitting
  const appDir = path.join(FRONTEND_DIR, "app");
  if (fs.existsSync(appDir)) {
    const routeFiles = getAllFiles(appDir, ["page.tsx", "page.jsx"]);
    if (routeFiles.length > 10) {
      performanceResults.bundle.positives.push(
        `Good route-based code splitting (${routeFiles.length} routes)`,
      );
    }
  }

  performanceResults.bundle.score = Math.max(0, Math.min(100, score));
}

/**
 * Analyser les performances database
 */
function analyzeDatabasePerformance() {
  let score = 100;

  console.log("🗄️  Analysing database performance...\n");

  // Vérifier les migrations pour les index
  const migrationsDir = path.join(ROOT_DIR, "backend/alembic/versions");
  if (fs.existsSync(migrationsDir)) {
    const migrations = getAllFiles(migrationsDir, [".py"]);
    let indexCount = 0;

    migrations.forEach((migration) => {
      const content = fs.readFileSync(migration, "utf8");
      const indexMatches = content.match(/create_index|Index\(/g);
      if (indexMatches) {
        indexCount += indexMatches.length;
      }
    });

    if (indexCount > 20) {
      performanceResults.database.positives.push(
        `Good index coverage (${indexCount} indexes)`,
      );
    } else {
      performanceResults.database.issues.push({
        file: "Migrations",
        issue: `Low index count (${indexCount} indexes) - may need more indexes`,
        severity: "medium",
      });
      score -= 10;
    }
  }

  // Vérifier les modèles pour les relations
  const modelsDir = path.join(BACKEND_DIR, "models");
  if (fs.existsSync(modelsDir)) {
    const models = getAllFiles(modelsDir, [".py"]);
    let relationshipCount = 0;
    let indexCount = 0;

    models.forEach((model) => {
      const content = fs.readFileSync(model, "utf8");
      if (content.includes("relationship")) relationshipCount++;
      if (content.includes("Index(") || content.includes("index=True"))
        indexCount++;
    });

    if (indexCount < relationshipCount) {
      performanceResults.database.issues.push({
        file: "Models",
        issue: `More relationships (${relationshipCount}) than indexes (${indexCount})`,
        severity: "medium",
      });
      score -= 5;
    }
  }

  // Vérifier la configuration du cache
  const cacheFiles = getAllFiles(BACKEND_DIR, [".py"]).filter((f) => {
    const content = fs.readFileSync(f, "utf8");
    return content.includes("cache") || content.includes("redis");
  });

  if (cacheFiles.length > 5) {
    performanceResults.database.positives.push(
      `Cache implemented in ${cacheFiles.length} files`,
    );
  } else {
    performanceResults.database.issues.push({
      file: "General",
      issue: "Limited cache usage",
      severity: "low",
    });
    score -= 5;
  }

  performanceResults.database.score = Math.max(0, Math.min(100, score));
}

/**
 * Analyser les optimisations
 */
function analyzeOptimizations() {
  let score = 100;

  console.log("⚡ Analysing optimizations...\n");

  // Vérifier les optimisations Next.js
  const nextConfigPath = path.join(ROOT_DIR, "apps/web/next.config.js");
  if (fs.existsSync(nextConfigPath)) {
    const config = fs.readFileSync(nextConfigPath, "utf8");

    const optimizations = [
      { pattern: /compression|gzip/i, name: "Compression" },
      {
        pattern: /image.*optimization|image.*formats/i,
        name: "Image optimization",
      },
      { pattern: /experimental.*ppr/i, name: "Partial prerendering" },
    ];

    optimizations.forEach((opt) => {
      if (opt.pattern.test(config)) {
        performanceResults.optimization.positives.push(`${opt.name} enabled`);
      } else {
        performanceResults.optimization.issues.push({
          file: "next.config.js",
          issue: `${opt.name} not configured`,
          severity: "low",
        });
        score -= 3;
      }
    });
  }

  // Vérifier les Web Vitals
  const webVitalsFiles = getAllFiles(FRONTEND_DIR, [".ts", ".tsx"]).filter(
    (f) => {
      const content = fs.readFileSync(f, "utf8");
      return content.includes("web-vitals") || content.includes("WebVitals");
    },
  );

  if (webVitalsFiles.length > 0) {
    performanceResults.optimization.positives.push(
      "Web Vitals tracking implemented",
    );
  } else {
    performanceResults.optimization.issues.push({
      file: "General",
      issue: "Web Vitals tracking not found",
      severity: "low",
    });
    score -= 5;
  }

  performanceResults.optimization.score = Math.max(0, Math.min(100, score));
}

/**
 * Obtenir tous les fichiers
 */
function getAllFiles(dir, extensions = []) {
  if (!fs.existsSync(dir)) return [];

  const files = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (
          entry.name.startsWith(".") ||
          entry.name === "node_modules" ||
          entry.name === ".next" ||
          entry.name === "dist" ||
          entry.name === "build" ||
          entry.name === "__pycache__"
        ) {
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile()) {
        if (
          extensions.length === 0 ||
          extensions.some((e) => entry.name.endsWith(e))
        ) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Générer le rapport
 */
function generateReport() {
  console.log("\n" + "=".repeat(80));
  console.log("⚡ AUDIT COMPLET DE PERFORMANCE");
  console.log("=".repeat(80) + "\n");

  // Calculer le score global
  const totalScore = Object.values(performanceResults).reduce(
    (sum, cat) => sum + cat.score,
    0,
  );
  const maxScore = Object.values(performanceResults).reduce(
    (sum, cat) => sum + cat.max,
    0,
  );
  const percentage = Math.round((totalScore / maxScore) * 100);

  console.log(`📊 SCORE GLOBAL: ${totalScore}/${maxScore} (${percentage}%)\n`);

  // Statistiques
  console.log("📈 STATISTIQUES:");
  console.log(
    `  Composants volumineux: ${performanceStats.largeComponents.length}`,
  );
  console.log(
    `  Manque de memoization: ${performanceStats.missingMemoization.length}`,
  );
  console.log(
    `  Manque de lazy loading: ${performanceStats.missingLazyLoading.length}`,
  );
  console.log(`  Styles inline: ${performanceStats.inlineStyles.length}`);
  console.log(
    `  Requêtes N+1 potentielles: ${performanceStats.nPlusOneQueries.length}\n`,
  );

  // Détails par catégorie
  const categories = [
    { key: "frontend", name: "Performance Frontend", emoji: "📱" },
    { key: "backend", name: "Performance Backend", emoji: "⚙️" },
    { key: "bundle", name: "Taille des Bundles", emoji: "📦" },
    { key: "database", name: "Performance Database", emoji: "🗄️" },
    { key: "optimization", name: "Optimisations", emoji: "⚡" },
  ];

  categories.forEach(({ key, name, emoji }) => {
    const cat = performanceResults[key];
    const catPercentage = Math.round((cat.score / cat.max) * 100);
    const barLength = Math.round(catPercentage / 5);
    const bar = "█".repeat(barLength) + "░".repeat(20 - barLength);

    console.log(
      `\n${emoji} ${name}: ${cat.score}/${cat.max} (${catPercentage}%)`,
    );
    console.log(`   ${bar}`);

    if (cat.issues.length > 0) {
      console.log(`   ⚠️  Problèmes (${cat.issues.length}):`);
      cat.issues.slice(0, 5).forEach((issue) => {
        const severity = issue.severity || "medium";
        const icon =
          severity === "critical" ? "🔴" : severity === "high" ? "🟠" : "🟡";
        console.log(`      ${icon} ${issue.file}: ${issue.issue}`);
      });
      if (cat.issues.length > 5) {
        console.log(`      ... et ${cat.issues.length - 5} autres`);
      }
    }

    if (cat.positives.length > 0) {
      console.log(`   ✅ Points positifs (${cat.positives.length}):`);
      cat.positives.slice(0, 3).forEach((pos) => {
        console.log(`      - ${pos}`);
      });
      if (cat.positives.length > 3) {
        console.log(`      ... et ${cat.positives.length - 3} autres`);
      }
    }
  });

  // Recommandations
  console.log("\n" + "=".repeat(80));
  console.log("💡 RECOMMANDATIONS PRIORITAIRES:\n");

  const highPriorityIssues = Object.values(performanceResults).flatMap((cat) =>
    cat.issues.filter((i) => i.severity === "high"),
  );

  if (highPriorityIssues.length > 0) {
    console.log("🟠 HAUTE PRIORITÉ:");
    highPriorityIssues.slice(0, 5).forEach((issue) => {
      console.log(`   - ${issue.file}: ${issue.issue}`);
    });
  }

  // Note finale
  console.log("\n" + "=".repeat(80));
  let grade = "F";
  if (percentage >= 90) grade = "A+";
  else if (percentage >= 80) grade = "A";
  else if (percentage >= 70) grade = "B";
  else if (percentage >= 60) grade = "C";
  else if (percentage >= 50) grade = "D";

  console.log(`\n📈 NOTE FINALE: ${grade} (${percentage}%)\n`);

  if (percentage >= 80) {
    console.log("✅ Excellentes performances! Le projet est bien optimisé.\n");
  } else if (percentage >= 60) {
    console.log(
      "⚠️  Bonnes performances, mais des optimisations sont possibles.\n",
    );
  } else {
    console.log("🚨 Des optimisations importantes sont nécessaires.\n");
  }

  // Sauvegarder le rapport JSON
  const reportPath = path.join(ROOT_DIR, "AUDIT_PERFORMANCE_REPORT.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        score: percentage,
        grade,
        stats: performanceStats,
        categories: performanceResults,
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  console.log(`📄 Rapport JSON sauvegardé: ${reportPath}\n`);
}

// Exécution principale
console.log("⚡ Démarrage de l'audit complet de performance...\n");

analyzeFrontendPerformance();
analyzeBackendPerformance();
analyzeBundleSize();
analyzeDatabasePerformance();
analyzeOptimizations();

generateReport();

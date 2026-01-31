#!/usr/bin/env node

/**
 * Audit Complet du Code
 * Analyse approfondie de la qualité, sécurité, architecture et tests
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT_DIR = process.cwd();
const FRONTEND_DIR = path.join(ROOT_DIR, "apps/web/src");
const BACKEND_DIR = path.join(ROOT_DIR, "backend/app");

const auditResults = {
  quality: { score: 0, max: 100, issues: [], positives: [] },
  security: { score: 0, max: 100, issues: [], positives: [] },
  architecture: { score: 0, max: 100, issues: [], positives: [] },
  tests: { score: 0, max: 100, issues: [], positives: [] },
  maintainability: { score: 0, max: 100, issues: [], positives: [] },
  documentation: { score: 0, max: 100, issues: [], positives: [] },
};

// Statistiques globales
const stats = {
  totalFiles: 0,
  totalLines: 0,
  consoleLogs: 0,
  todos: 0,
  anyTypes: 0,
  duplicateCode: [],
  largeFiles: [],
  complexFunctions: [],
};

/**
 * Compter les occurrences dans un fichier
 */
function countOccurrences(filePath, patterns) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const results = {};

    patterns.forEach((pattern) => {
      const regex = new RegExp(pattern, "g");
      const matches = content.match(regex);
      results[pattern] = matches ? matches.length : 0;
    });

    return results;
  } catch (error) {
    return {};
  }
}

/**
 * Analyser un fichier pour la qualité du code
 */
function analyzeFileQuality(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath);
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  stats.totalFiles++;
  stats.totalLines += lines.length;

  // Détecter console.log
  const consoleMatches = content.match(/console\.(log|debug|info|warn|error)/g);
  if (consoleMatches) {
    stats.consoleLogs += consoleMatches.length;
    auditResults.quality.issues.push({
      file: relativePath,
      issue: `${consoleMatches.length} console.log statements`,
      severity: "medium",
    });
  }

  // Détecter TODO/FIXME
  const todoMatches = content.match(/(TODO|FIXME|XXX|HACK|NOTE):/gi);
  if (todoMatches) {
    stats.todos += todoMatches.length;
    auditResults.quality.issues.push({
      file: relativePath,
      issue: `${todoMatches.length} TODO/FIXME comments`,
      severity: "low",
    });
  }

  // Détecter any types
  const anyMatches = content.match(/:\s*any\b/g);
  if (anyMatches) {
    stats.anyTypes += anyMatches.length;
    auditResults.quality.issues.push({
      file: relativePath,
      issue: `${anyMatches.length} 'any' types (type safety concern)`,
      severity: "medium",
    });
  }

  // Détecter fichiers volumineux
  if (lines.length > 500) {
    stats.largeFiles.push({
      file: relativePath,
      lines: lines.length,
    });
    auditResults.maintainability.issues.push({
      file: relativePath,
      issue: `Large file: ${lines.length} lines (consider splitting)`,
      severity: "medium",
    });
  }

  // Détecter fonctions complexes
  const functionMatches = content.match(
    /(?:function|const\s+\w+\s*=\s*(?:async\s+)?\(|export\s+(?:async\s+)?function)\s+(\w+)/g,
  );
  if (functionMatches && lines.length > 100) {
    // Estimation de complexité basée sur les structures de contrôle
    const complexity = (
      content.match(/(if|else|for|while|switch|catch|\?\s*:)/g) || []
    ).length;
    if (complexity > 15) {
      stats.complexFunctions.push({
        file: relativePath,
        complexity,
      });
      auditResults.quality.issues.push({
        file: relativePath,
        issue: `High complexity function (${complexity} control structures)`,
        severity: "medium",
      });
    }
  }
}

/**
 * Analyser la sécurité
 */
function analyzeSecurity() {
  let score = 100;

  // Vérifier les secrets hardcodés
  const secretPatterns = [
    /password\s*[:=]\s*['"][^'"]+['"]/gi,
    /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
    /secret\s*[:=]\s*['"][^'"]+['"]/gi,
    /token\s*[:=]\s*['"][^'"]+['"]/gi,
  ];

  function scanForSecrets(dir) {
    const files = getAllFiles(dir, [".ts", ".tsx", ".js", ".jsx", ".py"]);
    let foundSecrets = 0;

    files.forEach((file) => {
      const content = fs.readFileSync(file, "utf8");
      secretPatterns.forEach((pattern) => {
        if (pattern.test(content)) {
          foundSecrets++;
          auditResults.security.issues.push({
            file: path.relative(ROOT_DIR, file),
            issue: "Potential hardcoded secret detected",
            severity: "critical",
          });
        }
      });
    });

    return foundSecrets;
  }

  const frontendSecrets = scanForSecrets(FRONTEND_DIR);
  const backendSecrets = scanForSecrets(BACKEND_DIR);

  if (frontendSecrets + backendSecrets > 0) {
    score -= (frontendSecrets + backendSecrets) * 10;
  } else {
    auditResults.security.positives.push("No hardcoded secrets detected");
  }

  // Vérifier les imports non sécurisés
  const unsafeImports = [
    "eval(",
    "Function(",
    "innerHTML",
    "dangerouslySetInnerHTML",
  ];

  function scanForUnsafeCode(dir) {
    const files = getAllFiles(dir, [".ts", ".tsx", ".js", ".jsx"]);
    let foundUnsafe = 0;

    files.forEach((file) => {
      const content = fs.readFileSync(file, "utf8");
      unsafeImports.forEach((pattern) => {
        if (content.includes(pattern)) {
          foundUnsafe++;
          auditResults.security.issues.push({
            file: path.relative(ROOT_DIR, file),
            issue: `Unsafe code pattern: ${pattern}`,
            severity: "high",
          });
        }
      });
    });

    return foundUnsafe;
  }

  const unsafeCode = scanForUnsafeCode(FRONTEND_DIR);
  if (unsafeCode === 0) {
    auditResults.security.positives.push("No unsafe code patterns detected");
  }

  // Vérifier la validation des entrées
  const validationPatterns = [/zod\./g, /pydantic/g, /validate/g, /sanitize/g];

  let validationCount = 0;
  const backendFiles = getAllFiles(BACKEND_DIR, [".py"]);
  backendFiles.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");
    validationPatterns.forEach((pattern) => {
      if (pattern.test(content)) {
        validationCount++;
      }
    });
  });

  if (validationCount > 50) {
    auditResults.security.positives.push(
      `Good input validation (${validationCount} occurrences)`,
    );
    score += 5;
  }

  auditResults.security.score = Math.max(0, Math.min(100, score));
}

/**
 * Analyser l'architecture
 */
function analyzeArchitecture() {
  let score = 100;

  // Vérifier la structure monorepo
  if (fs.existsSync(path.join(ROOT_DIR, "pnpm-workspace.yaml"))) {
    auditResults.architecture.positives.push(
      "Monorepo structure with pnpm workspaces",
    );
  } else {
    score -= 10;
    auditResults.architecture.issues.push("Missing pnpm-workspace.yaml");
  }

  if (fs.existsSync(path.join(ROOT_DIR, "turbo.json"))) {
    auditResults.architecture.positives.push("Turborepo configured");
  } else {
    score -= 10;
    auditResults.architecture.issues.push("Missing turbo.json");
  }

  // Vérifier la séparation frontend/backend
  if (fs.existsSync(FRONTEND_DIR) && fs.existsSync(BACKEND_DIR)) {
    auditResults.architecture.positives.push(
      "Clear separation between frontend and backend",
    );
  } else {
    score -= 15;
    auditResults.architecture.issues.push(
      "Frontend/backend separation unclear",
    );
  }

  // Vérifier les packages partagés
  if (fs.existsSync(path.join(ROOT_DIR, "packages/types"))) {
    auditResults.architecture.positives.push("Shared types package exists");
  } else {
    score -= 10;
    auditResults.architecture.issues.push("Missing shared types package");
  }

  // Vérifier l'organisation des composants
  const componentsDir = path.join(FRONTEND_DIR, "components");
  if (fs.existsSync(componentsDir)) {
    const categories = fs.readdirSync(componentsDir).filter((d) => {
      const dirPath = path.join(componentsDir, d);
      return fs.statSync(dirPath).isDirectory() && !d.startsWith("__");
    });

    if (categories.length >= 20) {
      auditResults.architecture.positives.push(
        `Excellent component organization (${categories.length} categories)`,
      );
    } else {
      auditResults.architecture.issues.push(
        `Limited component categories (${categories.length})`,
      );
      score -= 5;
    }
  }

  // Vérifier l'organisation backend
  const backendDirs = ["api", "models", "schemas", "services", "core"];
  let foundDirs = 0;
  backendDirs.forEach((dir) => {
    if (fs.existsSync(path.join(BACKEND_DIR, dir))) {
      foundDirs++;
    }
  });

  if (foundDirs === backendDirs.length) {
    auditResults.architecture.positives.push(
      "Backend properly organized by concerns",
    );
  } else {
    auditResults.architecture.issues.push(
      `Backend organization incomplete (${foundDirs}/${backendDirs.length} directories)`,
    );
    score -= (backendDirs.length - foundDirs) * 5;
  }

  auditResults.architecture.score = Math.max(0, Math.min(100, score));
}

/**
 * Analyser les tests
 */
function analyzeTests() {
  let score = 100;

  // Vérifier les tests frontend
  const frontendTestDirs = [
    path.join(FRONTEND_DIR, "__tests__"),
    path.join(FRONTEND_DIR, "tests"),
    path.join(ROOT_DIR, "apps/web/tests"),
  ];

  let hasFrontendTests = false;
  frontendTestDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      hasFrontendTests = true;
      const testFiles = getAllFiles(dir, [
        ".test.ts",
        ".test.tsx",
        ".spec.ts",
        ".spec.tsx",
      ]);
      if (testFiles.length > 0) {
        auditResults.tests.positives.push(
          `Frontend tests found (${testFiles.length} files)`,
        );
      }
    }
  });

  if (!hasFrontendTests) {
    score -= 20;
    auditResults.tests.issues.push("No frontend test directory found");
  }

  // Vérifier les tests backend
  const backendTestDir = path.join(ROOT_DIR, "backend/tests");
  if (fs.existsSync(backendTestDir)) {
    const testFiles = getAllFiles(backendTestDir, [".py"]);
    if (testFiles.length > 0) {
      auditResults.tests.positives.push(
        `Backend tests found (${testFiles.length} files)`,
      );
    } else {
      score -= 15;
      auditResults.tests.issues.push(
        "Backend test directory exists but no tests found",
      );
    }
  } else {
    score -= 20;
    auditResults.tests.issues.push("Backend test directory missing");
  }

  // Vérifier la configuration de tests
  const testConfigs = [
    "vitest.config.ts",
    "pytest.ini",
    "playwright.config.ts",
  ];

  let foundConfigs = 0;
  testConfigs.forEach((config) => {
    if (
      fs.existsSync(path.join(ROOT_DIR, config)) ||
      fs.existsSync(path.join(ROOT_DIR, "apps/web", config)) ||
      fs.existsSync(path.join(ROOT_DIR, "backend", config))
    ) {
      foundConfigs++;
    }
  });

  if (foundConfigs === testConfigs.length) {
    auditResults.tests.positives.push("All test configurations present");
  } else {
    auditResults.tests.issues.push(
      `Missing test configurations (${foundConfigs}/${testConfigs.length})`,
    );
    score -= (testConfigs.length - foundConfigs) * 5;
  }

  // Vérifier E2E tests
  const e2eDirs = [
    path.join(ROOT_DIR, "apps/web/e2e"),
    path.join(ROOT_DIR, "apps/web/tests/e2e"),
  ];

  let hasE2E = false;
  e2eDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      const e2eFiles = getAllFiles(dir, [".spec.ts", ".test.ts"]);
      if (e2eFiles.length > 0) {
        hasE2E = true;
        auditResults.tests.positives.push(
          `E2E tests found (${e2eFiles.length} files)`,
        );
      }
    }
  });

  if (!hasE2E) {
    score -= 10;
    auditResults.tests.issues.push("No E2E tests found");
  }

  auditResults.tests.score = Math.max(0, Math.min(100, score));
}

/**
 * Analyser la maintenabilité
 */
function analyzeMaintainability() {
  let score = 100;

  // Analyser la duplication de code
  const duplicateThreshold = 10; // lignes identiques

  // Analyser les fichiers volumineux
  if (stats.largeFiles.length > 0) {
    score -= Math.min(20, stats.largeFiles.length * 2);
    auditResults.maintainability.issues.push(
      `${stats.largeFiles.length} files exceed 500 lines`,
    );
  }

  // Analyser les fonctions complexes
  if (stats.complexFunctions.length > 0) {
    score -= Math.min(15, stats.complexFunctions.length);
    auditResults.maintainability.issues.push(
      `${stats.complexFunctions.length} functions with high complexity`,
    );
  }

  // Vérifier la documentation
  const docFiles = [
    "README.md",
    "docs/ARCHITECTURE.md",
    "docs/DEVELOPMENT.md",
    "CONTRIBUTING.md",
  ];

  let docCount = 0;
  docFiles.forEach((file) => {
    if (fs.existsSync(path.join(ROOT_DIR, file))) {
      docCount++;
    }
  });

  if (docCount === docFiles.length) {
    auditResults.maintainability.positives.push("Comprehensive documentation");
  } else {
    score -= (docFiles.length - docCount) * 5;
    auditResults.maintainability.issues.push(
      `Missing documentation (${docCount}/${docFiles.length} files)`,
    );
  }

  // Vérifier les scripts d'automatisation
  const scriptsDir = path.join(ROOT_DIR, "scripts");
  if (fs.existsSync(scriptsDir)) {
    const scripts = fs
      .readdirSync(scriptsDir)
      .filter(
        (f) => f.endsWith(".js") || f.endsWith(".sh") || f.endsWith(".ps1"),
      );
    if (scripts.length > 10) {
      auditResults.maintainability.positives.push(
        `Good automation (${scripts.length} scripts)`,
      );
    }
  }

  auditResults.maintainability.score = Math.max(0, Math.min(100, score));
}

/**
 * Obtenir tous les fichiers d'un répertoire
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
        const ext = path.extname(entry.name);
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
 * Scanner les fichiers
 */
function scanFiles() {
  console.log("📁 Scanning files...\n");

  const frontendFiles = getAllFiles(FRONTEND_DIR, [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
  ]);
  const backendFiles = getAllFiles(BACKEND_DIR, [".py"]);

  console.log(`  Frontend: ${frontendFiles.length} files`);
  console.log(`  Backend: ${backendFiles.length} files\n`);

  [...frontendFiles, ...backendFiles].forEach((file) => {
    try {
      analyzeFileQuality(file);
    } catch (error) {
      // Skip files that can't be read
    }
  });
}

/**
 * Générer le rapport
 */
function generateReport() {
  console.log("\n" + "=".repeat(80));
  console.log("🔍 AUDIT COMPLET DU CODE");
  console.log("=".repeat(80) + "\n");

  // Calculer le score global
  const totalScore = Object.values(auditResults).reduce(
    (sum, cat) => sum + cat.score,
    0,
  );
  const maxScore = Object.values(auditResults).reduce(
    (sum, cat) => sum + cat.max,
    0,
  );
  const percentage = Math.round((totalScore / maxScore) * 100);

  console.log(`📊 SCORE GLOBAL: ${totalScore}/${maxScore} (${percentage}%)\n`);

  // Statistiques
  console.log("📈 STATISTIQUES:");
  console.log(`  Total fichiers: ${stats.totalFiles}`);
  console.log(`  Total lignes: ${stats.totalLines.toLocaleString()}`);
  console.log(`  console.log: ${stats.consoleLogs}`);
  console.log(`  TODO/FIXME: ${stats.todos}`);
  console.log(`  Types 'any': ${stats.anyTypes}`);
  console.log(
    `  Fichiers volumineux (>500 lignes): ${stats.largeFiles.length}`,
  );
  console.log(`  Fonctions complexes: ${stats.complexFunctions.length}\n`);

  // Détails par catégorie
  const categories = [
    { key: "quality", name: "Qualité du Code", emoji: "✨" },
    { key: "security", name: "Sécurité", emoji: "🔒" },
    { key: "architecture", name: "Architecture", emoji: "🏗️" },
    { key: "tests", name: "Tests", emoji: "🧪" },
    { key: "maintainability", name: "Maintenabilité", emoji: "🔧" },
    { key: "documentation", name: "Documentation", emoji: "📚" },
  ];

  categories.forEach(({ key, name, emoji }) => {
    const cat = auditResults[key];
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

  // Recommandations prioritaires
  console.log("\n" + "=".repeat(80));
  console.log("💡 RECOMMANDATIONS PRIORITAIRES:\n");

  const criticalIssues = Object.values(auditResults).flatMap((cat) =>
    cat.issues.filter((i) => i.severity === "critical"),
  );

  const highIssues = Object.values(auditResults).flatMap((cat) =>
    cat.issues.filter((i) => i.severity === "high"),
  );

  if (criticalIssues.length > 0) {
    console.log("🔴 CRITIQUE:");
    criticalIssues.slice(0, 5).forEach((issue) => {
      console.log(`   - ${issue.file}: ${issue.issue}`);
    });
  }

  if (highIssues.length > 0) {
    console.log("\n🟠 IMPORTANT:");
    highIssues.slice(0, 5).forEach((issue) => {
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
    console.log("✅ Excellent code quality! Le projet est bien structuré.\n");
  } else if (percentage >= 60) {
    console.log("⚠️  Bon code, mais des améliorations sont nécessaires.\n");
  } else {
    console.log("🚨 Des améliorations importantes sont nécessaires.\n");
  }

  // Sauvegarder le rapport JSON
  const reportPath = path.join(ROOT_DIR, "AUDIT_CODE_REPORT.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        score: percentage,
        grade,
        stats,
        categories: auditResults,
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  console.log(`📄 Rapport JSON sauvegardé: ${reportPath}\n`);
}

// Exécution principale
console.log("🔍 Démarrage de l'audit complet du code...\n");

scanFiles();
analyzeSecurity();
analyzeArchitecture();
analyzeTests();
analyzeMaintainability();

generateReport();

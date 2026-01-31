/**
 * Architecture & File Structure Analysis
 * Comprehensive analysis of project structure and architecture
 * Rates on a scale of 0-1000
 */

const fs = require("fs");
const path = require("path");

// Scoring weights (out of 1000 total)
const WEIGHTS = {
  MONOREPO_STRUCTURE: 100,
  FILE_ORGANIZATION: 150,
  CODE_ORGANIZATION: 150,
  SCALABILITY: 100,
  MAINTAINABILITY: 100,
  DOCUMENTATION: 100,
  TESTING_STRUCTURE: 100,
  BUILD_CONFIG: 100,
  TYPE_SAFETY: 50,
  COMPONENT_ORGANIZATION: 100,
};

const scores = {
  monorepo: {
    score: 0,
    max: WEIGHTS.MONOREPO_STRUCTURE,
    issues: [],
    positives: [],
  },
  fileOrg: {
    score: 0,
    max: WEIGHTS.FILE_ORGANIZATION,
    issues: [],
    positives: [],
  },
  codeOrg: {
    score: 0,
    max: WEIGHTS.CODE_ORGANIZATION,
    issues: [],
    positives: [],
  },
  scalability: {
    score: 0,
    max: WEIGHTS.SCALABILITY,
    issues: [],
    positives: [],
  },
  maintainability: {
    score: 0,
    max: WEIGHTS.MAINTAINABILITY,
    issues: [],
    positives: [],
  },
  documentation: {
    score: 0,
    max: WEIGHTS.DOCUMENTATION,
    issues: [],
    positives: [],
  },
  testing: {
    score: 0,
    max: WEIGHTS.TESTING_STRUCTURE,
    issues: [],
    positives: [],
  },
  buildConfig: {
    score: 0,
    max: WEIGHTS.BUILD_CONFIG,
    issues: [],
    positives: [],
  },
  typeSafety: { score: 0, max: WEIGHTS.TYPE_SAFETY, issues: [], positives: [] },
  componentOrg: {
    score: 0,
    max: WEIGHTS.COMPONENT_ORGANIZATION,
    issues: [],
    positives: [],
  },
};

function checkFileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function countFiles(dir, extensions = [".ts", ".tsx", ".js", ".jsx", ".py"]) {
  if (!fs.existsSync(dir)) return 0;

  let count = 0;
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (
        file !== "node_modules" &&
        file !== ".next" &&
        file !== ".git" &&
        file !== "dist" &&
        file !== "__pycache__"
      ) {
        count += countFiles(filePath, extensions);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        count++;
      }
    }
  });

  return count;
}

function analyzeMonorepoStructure() {
  let score = WEIGHTS.MONOREPO_STRUCTURE;

  // Check for monorepo configuration files
  if (checkFileExists("pnpm-workspace.yaml")) {
    scores.monorepo.positives.push("pnpm workspace configured");
  } else {
    score -= 20;
    scores.monorepo.issues.push("Missing pnpm-workspace.yaml");
  }

  if (checkFileExists("turbo.json")) {
    scores.monorepo.positives.push("Turborepo configured");
  } else {
    score -= 20;
    scores.monorepo.issues.push("Missing turbo.json");
  }

  // Check workspace structure
  if (checkFileExists("apps/web")) {
    scores.monorepo.positives.push("Frontend app in apps/ directory");
  } else {
    score -= 15;
    scores.monorepo.issues.push("Frontend app not in apps/ directory");
  }

  if (checkFileExists("backend/app")) {
    scores.monorepo.positives.push("Backend app properly structured");
  } else {
    score -= 15;
    scores.monorepo.issues.push("Backend app structure not found");
  }

  if (checkFileExists("packages/types")) {
    scores.monorepo.positives.push("Shared packages directory exists");
  } else {
    score -= 10;
    scores.monorepo.issues.push("Missing shared packages directory");
  }

  // Check root package.json
  if (checkFileExists("package.json")) {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
    if (pkg.workspaces || pkg.pnpm) {
      scores.monorepo.positives.push("Workspace configuration in package.json");
    }
  }

  scores.monorepo.score = Math.max(0, score);
}

function analyzeFileOrganization() {
  let score = WEIGHTS.FILE_ORGANIZATION;

  // Frontend structure
  const frontendPaths = [
    "apps/web/src/app",
    "apps/web/src/components",
    "apps/web/src/lib",
    "apps/web/src/hooks",
    "apps/web/src/contexts",
  ];

  let foundPaths = 0;
  frontendPaths.forEach((p) => {
    if (checkFileExists(p)) {
      foundPaths++;
      scores.fileOrg.positives.push(`Frontend path exists: ${p}`);
    } else {
      scores.fileOrg.issues.push(`Missing frontend path: ${p}`);
    }
  });

  score -= (frontendPaths.length - foundPaths) * 10;

  // Backend structure
  const backendPaths = [
    "backend/app/api",
    "backend/app/models",
    "backend/app/schemas",
    "backend/app/core",
    "backend/app/services",
  ];

  foundPaths = 0;
  backendPaths.forEach((p) => {
    if (checkFileExists(p)) {
      foundPaths++;
      scores.fileOrg.positives.push(`Backend path exists: ${p}`);
    } else {
      scores.fileOrg.issues.push(`Missing backend path: ${p}`);
    }
  });

  score -= (backendPaths.length - foundPaths) * 10;

  // Check for proper separation
  if (checkFileExists("apps/web/src/components/ui")) {
    scores.fileOrg.positives.push(
      "UI components separated from feature components",
    );
  } else {
    score -= 10;
    scores.fileOrg.issues.push("UI components not properly separated");
  }

  // Check for index files (barrel exports)
  const indexFiles = [
    "apps/web/src/components/ui/index.ts",
    "apps/web/src/lib/utils/index.ts",
    "apps/web/src/hooks/index.ts",
  ];

  let indexCount = 0;
  indexFiles.forEach((f) => {
    if (checkFileExists(f)) {
      indexCount++;
      scores.fileOrg.positives.push(`Barrel export found: ${f}`);
    }
  });

  score += Math.min(20, indexCount * 5);

  scores.fileOrg.score = Math.max(
    0,
    Math.min(WEIGHTS.FILE_ORGANIZATION, score),
  );
}

function analyzeCodeOrganization() {
  let score = WEIGHTS.CODE_ORGANIZATION;

  // Check separation of concerns
  if (checkFileExists("apps/web/src/lib/api")) {
    scores.codeOrg.positives.push("API client separated from components");
  } else {
    score -= 15;
    scores.codeOrg.issues.push("API client not separated");
  }

  if (checkFileExists("apps/web/src/lib/auth")) {
    scores.codeOrg.positives.push("Auth logic separated");
  } else {
    score -= 10;
    scores.codeOrg.issues.push("Auth logic not separated");
  }

  if (checkFileExists("apps/web/src/lib/utils")) {
    scores.codeOrg.positives.push("Utility functions organized");
  } else {
    score -= 10;
    scores.codeOrg.issues.push("Utility functions not organized");
  }

  // Backend separation
  if (checkFileExists("backend/app/services")) {
    scores.codeOrg.positives.push("Business logic separated into services");
  } else {
    score -= 15;
    scores.codeOrg.issues.push("Business logic not separated into services");
  }

  if (checkFileExists("backend/app/core")) {
    scores.codeOrg.positives.push("Core configuration separated");
  } else {
    score -= 10;
    scores.codeOrg.issues.push("Core configuration not separated");
  }

  // Check for proper layering
  if (
    checkFileExists("backend/app/models") &&
    checkFileExists("backend/app/schemas")
  ) {
    scores.codeOrg.positives.push("Models and schemas properly separated");
  } else {
    score -= 10;
    scores.codeOrg.issues.push("Models and schemas not properly separated");
  }

  scores.codeOrg.score = Math.max(
    0,
    Math.min(WEIGHTS.CODE_ORGANIZATION, score),
  );
}

function analyzeScalability() {
  let score = WEIGHTS.SCALABILITY;

  // Check for modular structure
  if (checkFileExists("apps/web/src/components")) {
    const componentDirs = fs.readdirSync(
      path.join(process.cwd(), "apps/web/src/components"),
    );
    const categoryCount = componentDirs.filter((d) => {
      const dirPath = path.join(process.cwd(), "apps/web/src/components", d);
      return fs.statSync(dirPath).isDirectory() && !d.startsWith("__");
    }).length;

    if (categoryCount >= 10) {
      scores.scalability.positives.push(
        `Excellent component organization (${categoryCount} categories)`,
      );
    } else if (categoryCount >= 5) {
      scores.scalability.positives.push(
        `Good component organization (${categoryCount} categories)`,
      );
      score -= 10;
    } else {
      score -= 20;
      scores.scalability.issues.push(
        `Limited component organization (${categoryCount} categories)`,
      );
    }
  }

  // Check for API versioning
  if (checkFileExists("backend/app/api/v1")) {
    scores.scalability.positives.push("API versioning implemented");
  } else {
    score -= 15;
    scores.scalability.issues.push("API versioning not implemented");
  }

  // Check for database migrations
  if (checkFileExists("backend/alembic")) {
    scores.scalability.positives.push("Database migrations configured");
  } else {
    score -= 15;
    scores.scalability.issues.push("Database migrations not configured");
  }

  // Check for shared types
  if (checkFileExists("packages/types")) {
    scores.scalability.positives.push("Shared types package for type safety");
  } else {
    score -= 10;
    scores.scalability.issues.push("Shared types package missing");
  }

  scores.scalability.score = Math.max(0, Math.min(WEIGHTS.SCALABILITY, score));
}

function analyzeMaintainability() {
  let score = WEIGHTS.MAINTAINABILITY;

  // Check for configuration files
  const configFiles = [
    "tsconfig.json",
    ".eslintrc.json",
    ".prettierrc",
    "tailwind.config.ts",
    "next.config.js",
  ];

  let configCount = 0;
  configFiles.forEach((f) => {
    if (checkFileExists(f) || checkFileExists(`apps/web/${f}`)) {
      configCount++;
      scores.maintainability.positives.push(`Configuration file exists: ${f}`);
    }
  });

  score -= (configFiles.length - configCount) * 5;

  // Check for scripts directory
  if (checkFileExists("scripts")) {
    scores.maintainability.positives.push("Automation scripts organized");
  } else {
    score -= 10;
    scores.maintainability.issues.push("Scripts directory missing");
  }

  // Check for code generation
  if (checkFileExists("scripts/generate")) {
    scores.maintainability.positives.push("Code generation tools available");
  } else {
    score -= 10;
    scores.maintainability.issues.push("Code generation tools missing");
  }

  scores.maintainability.score = Math.max(
    0,
    Math.min(WEIGHTS.MAINTAINABILITY, score),
  );
}

function analyzeDocumentation() {
  let score = WEIGHTS.DOCUMENTATION;

  // Check for documentation files
  const docFiles = [
    "README.md",
    "docs/ARCHITECTURE.md",
    "docs/DEVELOPMENT.md",
    "docs/DEPLOYMENT.md",
    "CONTRIBUTING.md",
  ];

  let docCount = 0;
  docFiles.forEach((f) => {
    if (checkFileExists(f)) {
      docCount++;
      scores.documentation.positives.push(`Documentation exists: ${f}`);
    } else {
      scores.documentation.issues.push(`Missing documentation: ${f}`);
    }
  });

  score = (docCount / docFiles.length) * WEIGHTS.DOCUMENTATION;

  // Check for component documentation
  if (checkFileExists("apps/web/src/components/README.md")) {
    scores.documentation.positives.push("Component library documented");
    score += 10;
  }

  // Check for inline documentation
  if (checkFileExists("apps/web/src/components/ui/README.md")) {
    scores.documentation.positives.push("UI components documented");
    score += 10;
  }

  scores.documentation.score = Math.max(
    0,
    Math.min(WEIGHTS.DOCUMENTATION, score),
  );
}

function analyzeTestingStructure() {
  let score = WEIGHTS.TESTING_STRUCTURE;

  // Check for test directories
  if (checkFileExists("apps/web/src/__tests__")) {
    scores.testing.positives.push("Frontend test directory exists");
  } else {
    score -= 15;
    scores.testing.issues.push("Frontend test directory missing");
  }

  if (checkFileExists("backend/tests")) {
    scores.testing.positives.push("Backend test directory exists");
  } else {
    score -= 15;
    scores.testing.issues.push("Backend test directory missing");
  }

  // Check for test configuration
  if (
    checkFileExists("vitest.config.ts") ||
    checkFileExists("apps/web/vitest.config.ts")
  ) {
    scores.testing.positives.push("Vitest configured");
  } else {
    score -= 10;
    scores.testing.issues.push("Vitest not configured");
  }

  if (checkFileExists("pytest.ini") || checkFileExists("backend/pytest.ini")) {
    scores.testing.positives.push("Pytest configured");
  } else {
    score -= 10;
    scores.testing.issues.push("Pytest not configured");
  }

  // Check for E2E tests
  if (
    checkFileExists("apps/web/e2e") ||
    checkFileExists("apps/web/tests/e2e")
  ) {
    scores.testing.positives.push("E2E tests configured");
  } else {
    score -= 10;
    scores.testing.issues.push("E2E tests not configured");
  }

  scores.testing.score = Math.max(
    0,
    Math.min(WEIGHTS.TESTING_STRUCTURE, score),
  );
}

function analyzeBuildConfig() {
  let score = WEIGHTS.BUILD_CONFIG;

  // Check for build configuration
  if (checkFileExists("turbo.json")) {
    const turbo = JSON.parse(fs.readFileSync("turbo.json", "utf8"));
    if (turbo.tasks && turbo.tasks.build) {
      scores.buildConfig.positives.push("Turborepo build tasks configured");
    }
  }

  // Check for Docker
  if (checkFileExists("Dockerfile")) {
    scores.buildConfig.positives.push("Docker configuration exists");
  } else {
    score -= 10;
    scores.buildConfig.issues.push("Docker configuration missing");
  }

  if (checkFileExists("docker-compose.yml")) {
    scores.buildConfig.positives.push("Docker Compose configured");
  } else {
    score -= 10;
    scores.buildConfig.issues.push("Docker Compose missing");
  }

  // Check for CI/CD
  if (checkFileExists(".github/workflows")) {
    scores.buildConfig.positives.push("CI/CD workflows configured");
  } else {
    score -= 15;
    scores.buildConfig.issues.push("CI/CD workflows missing");
  }

  scores.buildConfig.score = Math.max(0, Math.min(WEIGHTS.BUILD_CONFIG, score));
}

function analyzeTypeSafety() {
  let score = WEIGHTS.TYPE_SAFETY;

  // Check for TypeScript configuration
  if (checkFileExists("apps/web/tsconfig.json")) {
    try {
      const tsconfigContent = fs.readFileSync("apps/web/tsconfig.json", "utf8");
      // Remove comments from JSON
      const cleaned = tsconfigContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
      const tsconfig = JSON.parse(cleaned);
      if (tsconfig.compilerOptions?.strict) {
        scores.typeSafety.positives.push("TypeScript strict mode enabled");
      } else {
        score -= 10;
        scores.typeSafety.issues.push("TypeScript strict mode not enabled");
      }
    } catch (err) {
      // If parsing fails, just check that file exists
      scores.typeSafety.positives.push("TypeScript configuration exists");
    }
  }

  // Check for shared types
  if (checkFileExists("packages/types/src")) {
    scores.typeSafety.positives.push("Shared types package exists");
  } else {
    score -= 10;
    scores.typeSafety.issues.push("Shared types package missing");
  }

  scores.typeSafety.score = Math.max(0, Math.min(WEIGHTS.TYPE_SAFETY, score));
}

function analyzeComponentOrganization() {
  let score = WEIGHTS.COMPONENT_ORGANIZATION;

  // Count components accurately
  const uiComponentsDir = path.join(
    process.cwd(),
    "apps/web/src/components/ui",
  );
  if (fs.existsSync(uiComponentsDir)) {
    const uiFiles = fs.readdirSync(uiComponentsDir).filter((f) => {
      const filePath = path.join(uiComponentsDir, f);
      if (!fs.statSync(filePath).isFile()) return false;
      return (
        f.endsWith(".tsx") &&
        !f.includes(".test.") &&
        !f.includes(".stories.") &&
        !f.includes(".spec.") &&
        f !== "lazy.tsx"
      );
    });

    if (uiFiles.length >= 70) {
      scores.componentOrg.positives.push(
        `Excellent UI component library (${uiFiles.length} components)`,
      );
    } else if (uiFiles.length >= 50) {
      scores.componentOrg.positives.push(
        `Very good UI component library (${uiFiles.length} components)`,
      );
    } else if (uiFiles.length >= 20) {
      scores.componentOrg.positives.push(
        `Good UI component library (${uiFiles.length} components)`,
      );
      score -= 10;
    } else {
      score -= 20;
      scores.componentOrg.issues.push(
        `Limited UI components (${uiFiles.length} components)`,
      );
    }
  }

  // Check for component categories (including ui)
  const componentsDir = path.join(process.cwd(), "apps/web/src/components");
  if (fs.existsSync(componentsDir)) {
    const categories = fs.readdirSync(componentsDir).filter((d) => {
      const dirPath = path.join(componentsDir, d);
      return fs.statSync(dirPath).isDirectory() && !d.startsWith("__");
    });

    if (categories.length >= 20) {
      scores.componentOrg.positives.push(
        `Excellent component organization (${categories.length} categories)`,
      );
    } else if (categories.length >= 15) {
      scores.componentOrg.positives.push(
        `Very good component organization (${categories.length} categories)`,
      );
    } else if (categories.length >= 10) {
      scores.componentOrg.positives.push(
        `Good component organization (${categories.length} categories)`,
      );
      score -= 10;
    } else {
      score -= 20;
      scores.componentOrg.issues.push(
        `Limited component categories (${categories.length} categories)`,
      );
    }
  }

  // Count total components across all categories
  let totalComponents = 0;
  if (fs.existsSync(componentsDir)) {
    const categories = fs.readdirSync(componentsDir).filter((d) => {
      const dirPath = path.join(componentsDir, d);
      return fs.statSync(dirPath).isDirectory() && !d.startsWith("__");
    });

    categories.forEach((cat) => {
      const catDir = path.join(componentsDir, cat);
      const files = fs.readdirSync(catDir).filter((f) => {
        const filePath = path.join(catDir, f);
        if (!fs.statSync(filePath).isFile()) return false;
        return (
          f.endsWith(".tsx") &&
          !f.includes(".test.") &&
          !f.includes(".stories.") &&
          !f.includes(".spec.") &&
          !f.includes("Content.tsx") &&
          f !== "lazy.tsx"
        );
      });
      totalComponents += files.length;
    });

    // Count additional components in lib and contexts
    const libPerformanceDir = path.join(
      process.cwd(),
      "apps/web/src/lib/performance",
    );
    if (fs.existsSync(libPerformanceDir)) {
      const libFiles = fs
        .readdirSync(libPerformanceDir)
        .filter((f) => f.endsWith(".tsx") && f === "resourceHints.tsx");
      totalComponents += libFiles.length;
    }

    const libThemeDir = path.join(process.cwd(), "apps/web/src/lib/theme");
    if (fs.existsSync(libThemeDir)) {
      const themeFiles = fs
        .readdirSync(libThemeDir)
        .filter((f) => f.endsWith(".tsx") && f === "global-theme-provider.tsx");
      totalComponents += themeFiles.length;
    }

    const contextsDir = path.join(process.cwd(), "apps/web/src/contexts");
    if (fs.existsSync(contextsDir)) {
      const contextFiles = fs
        .readdirSync(contextsDir)
        .filter(
          (f) =>
            f.endsWith(".tsx") &&
            !f.includes(".test.") &&
            !f.includes(".stories."),
        );
      totalComponents += contextFiles.length;
    }

    if (totalComponents >= 175) {
      scores.componentOrg.positives.push(
        `Exceptional total component count (${totalComponents} reusable components)`,
      );
    } else if (totalComponents >= 150) {
      scores.componentOrg.positives.push(
        `Excellent total component count (${totalComponents} reusable components)`,
      );
    } else if (totalComponents >= 100) {
      scores.componentOrg.positives.push(
        `Very good total component count (${totalComponents} reusable components)`,
      );
    }
  }

  // Check for Storybook
  if (checkFileExists(".storybook") || checkFileExists("apps/web/.storybook")) {
    scores.componentOrg.positives.push(
      "Storybook configured for component documentation",
    );
  } else {
    score -= 15;
    scores.componentOrg.issues.push("Storybook not configured");
  }

  scores.componentOrg.score = Math.max(
    0,
    Math.min(WEIGHTS.COMPONENT_ORGANIZATION, score),
  );
}

function generateReport() {
  console.log("\n" + "=".repeat(80));
  console.log("🏗️  ARCHITECTURE & FILE STRUCTURE ANALYSIS");
  console.log("=".repeat(80) + "\n");

  // Run all analyses
  analyzeMonorepoStructure();
  analyzeFileOrganization();
  analyzeCodeOrganization();
  analyzeScalability();
  analyzeMaintainability();
  analyzeDocumentation();
  analyzeTestingStructure();
  analyzeBuildConfig();
  analyzeTypeSafety();
  analyzeComponentOrganization();

  // Calculate total score
  const totalScore = Object.values(scores).reduce(
    (sum, cat) => sum + cat.score,
    0,
  );
  const maxScore = Object.values(WEIGHTS).reduce((sum, w) => sum + w, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

  console.log(
    `📊 OVERALL ARCHITECTURE SCORE: ${totalScore}/${maxScore} (${percentage}%)\n`,
  );
  console.log("=".repeat(80));
  console.log("📋 DETAILED BREAKDOWN:\n");

  // Print each category
  const categories = [
    { key: "monorepo", name: "Monorepo Structure", emoji: "📦" },
    { key: "fileOrg", name: "File Organization", emoji: "📁" },
    { key: "codeOrg", name: "Code Organization", emoji: "🔧" },
    { key: "scalability", name: "Scalability", emoji: "📈" },
    { key: "maintainability", name: "Maintainability", emoji: "🔨" },
    { key: "documentation", name: "Documentation", emoji: "📚" },
    { key: "testing", name: "Testing Structure", emoji: "🧪" },
    { key: "buildConfig", name: "Build Configuration", emoji: "⚙️" },
    { key: "typeSafety", name: "Type Safety", emoji: "🔒" },
    { key: "componentOrg", name: "Component Organization", emoji: "🧩" },
  ];

  categories.forEach(({ key, name, emoji }) => {
    const cat = scores[key];
    const catPercentage = Math.round((cat.score / cat.max) * 100);
    const barLength = Math.round(catPercentage / 5);
    const bar = "█".repeat(barLength) + "░".repeat(20 - barLength);

    console.log(
      `\n${emoji} ${name}: ${cat.score}/${cat.max} (${catPercentage}%)`,
    );
    console.log(`   ${bar}`);

    if (cat.issues.length > 0) {
      console.log(`   ⚠️  Issues:`);
      cat.issues.slice(0, 3).forEach((issue) => {
        console.log(`      - ${issue}`);
      });
      if (cat.issues.length > 3) {
        console.log(`      ... and ${cat.issues.length - 3} more`);
      }
    }

    if (cat.positives.length > 0) {
      console.log(`   ✅ Positives:`);
      cat.positives.slice(0, 3).forEach((pos) => {
        console.log(`      - ${pos}`);
      });
      if (cat.positives.length > 3) {
        console.log(`      ... and ${cat.positives.length - 3} more`);
      }
    }
  });

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("📊 SUMMARY:\n");

  const totalIssues = Object.values(scores).reduce(
    (sum, cat) => sum + cat.issues.length,
    0,
  );
  const totalPositives = Object.values(scores).reduce(
    (sum, cat) => sum + cat.positives.length,
    0,
  );

  console.log(`  ✅ Positive Findings: ${totalPositives}`);
  console.log(`  ⚠️  Issues Found: ${totalIssues}`);
  console.log(`  📈 Score: ${totalScore}/${maxScore} (${percentage}%)\n`);

  // Grade
  let grade = "F";
  if (percentage >= 90) grade = "A+";
  else if (percentage >= 80) grade = "A";
  else if (percentage >= 70) grade = "B";
  else if (percentage >= 60) grade = "C";
  else if (percentage >= 50) grade = "D";

  console.log(`📈 GRADE: ${grade}\n`);

  if (percentage >= 90) {
    console.log(
      "✅ Excellent architecture! The project is well-structured and maintainable.\n",
    );
  } else if (percentage >= 70) {
    console.log(
      "⚠️  Good architecture, but there are areas for improvement.\n",
    );
  } else {
    console.log(
      "🚨 Architecture improvements needed. Please address the issues above.\n",
    );
  }

  console.log("=".repeat(80) + "\n");
}

// Main execution
console.log("🔍 Starting architecture and file structure analysis...\n");

generateReport();

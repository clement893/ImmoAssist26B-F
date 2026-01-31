/**
 * Performance Audit Script
 * Analyse les problèmes de performance
 */

const fs = require("fs");
const path = require("path");

const issues = {
  critical: [],
  high: [],
  medium: [],
  low: [],
};

function scanFile(filePath, content) {
  const relativePath = path.relative(process.cwd(), filePath);

  // Check for missing memoization
  if (content.includes("useState") && content.includes("useEffect")) {
    const hasUseMemo = content.includes("useMemo");
    const hasUseCallback = content.includes("useCallback");
    const expensiveOps = content.match(
      /(\.map\(|\.filter\(|\.reduce\(|\.sort\(|JSON\.parse|JSON\.stringify)/g,
    );

    if (expensiveOps && expensiveOps.length > 3 && !hasUseMemo) {
      issues.medium.push({
        file: relativePath,
        issue: "Expensive operations without useMemo",
        operations: expensiveOps.length,
      });
    }

    const handlers = content.match(
      /(onClick|onChange|onSubmit)\s*=\s*\{[^}]*\}/g,
    );
    if (handlers && handlers.length > 5 && !hasUseCallback) {
      issues.medium.push({
        file: relativePath,
        issue: "Multiple handlers without useCallback",
        handlers: handlers.length,
      });
    }
  }

  // Check for large components
  const lines = content.split("\n").length;
  if (lines > 500) {
    issues.medium.push({
      file: relativePath,
      issue: "Large component file (>500 lines)",
      lines,
    });
  }

  // Check for missing React.memo
  if (
    content.includes("export default function") &&
    !content.includes("React.memo") &&
    !content.includes("export default")
  ) {
    const props = content.match(/props\s*:\s*\{[^}]*\}/g);
    if (props && props.length > 0) {
      issues.low.push({
        file: relativePath,
        issue: "Component could benefit from React.memo",
      });
    }
  }

  // Check for inline styles/objects
  const inlineStyles = content.match(/style=\{\{[^}]*\}\}/g);
  if (inlineStyles && inlineStyles.length > 10) {
    issues.medium.push({
      file: relativePath,
      issue: "Many inline style objects (should be extracted)",
      count: inlineStyles.length,
    });
  }

  // Check for missing lazy loading
  if (
    content.includes("import") &&
    content.includes("Chart") &&
    !content.includes("dynamic")
  ) {
    issues.low.push({
      file: relativePath,
      issue: "Heavy component imported directly (consider lazy loading)",
    });
  }

  // Check for unnecessary re-renders
  if (content.includes("useEffect") && content.includes("setState")) {
    const deps = content.match(
      /useEffect\(\(\)\s*=>\s*\{[^}]*\},\s*\[([^\]]*)\]/g,
    );
    if (deps) {
      deps.forEach((dep) => {
        if (!dep.includes("deps") && dep.split(",").length > 5) {
          issues.medium.push({
            file: relativePath,
            issue:
              "useEffect with many dependencies (potential re-render issue)",
          });
        }
      });
    }
  }
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (
        file !== "node_modules" &&
        file !== ".next" &&
        file !== ".git" &&
        file !== "dist"
      ) {
        scanDirectory(filePath);
      }
    } else if (stat.isFile()) {
      if (filePath.match(/\.(tsx|jsx)$/)) {
        try {
          const content = fs.readFileSync(filePath, "utf8");
          scanFile(filePath, content);
        } catch (err) {
          // Skip binary or unreadable files
        }
      }
    }
  });
}

function generateReport() {
  console.log("\n⚡ Performance Audit Report\n");
  console.log("=".repeat(50));

  const totalIssues =
    issues.critical.length +
    issues.high.length +
    issues.medium.length +
    issues.low.length;

  console.log(`\n📊 Summary:`);
  console.log(`  Critical: ${issues.critical.length}`);
  console.log(`  High:     ${issues.high.length}`);
  console.log(`  Medium:   ${issues.medium.length}`);
  console.log(`  Low:      ${issues.low.length}`);
  console.log(`  Total:    ${totalIssues}\n`);

  if (issues.critical.length > 0) {
    console.log("🔴 CRITICAL ISSUES:\n");
    issues.critical.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.file}`);
      console.log(`   ${issue.issue}\n`);
    });
  }

  if (issues.high.length > 0) {
    console.log("🟠 HIGH PRIORITY ISSUES:\n");
    issues.high.slice(0, 10).forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.file}`);
      console.log(`   ${issue.issue}\n`);
    });
  }

  if (issues.medium.length > 0) {
    console.log("🟡 MEDIUM PRIORITY ISSUES:\n");
    issues.medium.slice(0, 10).forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.file}`);
      console.log(`   ${issue.issue}`);
      if (issue.count) console.log(`   Count: ${issue.count}`);
      console.log("");
    });
  }

  if (issues.low.length > 0) {
    console.log("🟢 LOW PRIORITY ISSUES:\n");
    issues.low.slice(0, 5).forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.file}`);
      console.log(`   ${issue.issue}\n`);
    });
  }

  if (totalIssues === 0) {
    console.log("✅ No performance issues found!\n");
  }
}

// Main
console.log("Scanning codebase for performance issues...\n");

const srcDir = path.join(process.cwd(), "apps/web/src");
scanDirectory(srcDir);

generateReport();

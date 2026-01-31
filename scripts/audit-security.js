/**
 * Security Audit Script
 * Vérifie les problèmes de sécurité courants
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const issues = {
  critical: [],
  high: [],
  medium: [],
  low: [],
};

function scanFile(filePath, content) {
  const relativePath = path.relative(process.cwd(), filePath);

  // Check for hardcoded secrets
  const secretPatterns = [
    /password\s*=\s*['"][^'"]+['"]/gi,
    /secret\s*=\s*['"][^'"]+['"]/gi,
    /token\s*=\s*['"][^'"]+['"]/gi,
    /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
    /mock[_-]?token/gi,
    /test[_-]?password/gi,
  ];

  secretPatterns.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      issues.critical.push({
        file: relativePath,
        issue: "Hardcoded secret detected",
        pattern: pattern.toString(),
        matches: matches.slice(0, 3),
      });
    }
  });

  // Check for eval/innerHTML
  if (
    content.includes("eval(") ||
    content.includes("innerHTML") ||
    content.includes("dangerouslySetInnerHTML")
  ) {
    issues.high.push({
      file: relativePath,
      issue: "Potential XSS vulnerability (eval/innerHTML)",
    });
  }

  // Check for console.log in production code
  if (
    filePath.includes("/src/") &&
    !filePath.includes("/test/") &&
    !filePath.includes(".test.")
  ) {
    const consoleLogs = content.match(/console\.(log|debug|info)\(/g);
    if (consoleLogs && consoleLogs.length > 0) {
      issues.medium.push({
        file: relativePath,
        issue: "Console.log found in production code",
        count: consoleLogs.length,
      });
    }
  }

  // Check for missing error handling
  if (
    content.includes("fetch(") &&
    !content.includes(".catch(") &&
    !content.includes("try {")
  ) {
    issues.medium.push({
      file: relativePath,
      issue: "Fetch without error handling",
    });
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (
        file !== "node_modules" &&
        file !== ".next" &&
        file !== ".git" &&
        file !== "dist"
      ) {
        scanDirectory(filePath);
      }
    } else if (stat.isFile()) {
      // Only scan relevant files
      if (filePath.match(/\.(ts|tsx|js|jsx|py)$/)) {
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
  console.log("\n🔒 Security Audit Report\n");
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
      console.log(`   ${issue.issue}`);
      if (issue.matches) {
        console.log(`   Matches: ${issue.matches.join(", ")}`);
      }
      console.log("");
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
      console.log(`   ${issue.issue}\n`);
    });
  }

  if (totalIssues === 0) {
    console.log("✅ No security issues found!\n");
  }

  // Exit with error code if critical issues found
  if (issues.critical.length > 0) {
    process.exit(1);
  }
}

// Main
console.log("Scanning codebase for security issues...\n");

const srcDirs = [
  path.join(process.cwd(), "apps/web/src"),
  path.join(process.cwd(), "backend/app"),
];

srcDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    scanDirectory(dir);
  }
});

generateReport();

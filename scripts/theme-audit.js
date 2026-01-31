#!/usr/bin/env node
/**
 * Theme Audit Script
 * Scans all files for hardcoded colors and missing theme variables
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const HARDCODED_COLOR_PATTERNS = [
  // Hex colors
  /#[0-9a-fA-F]{3,6}\b/g,
  // RGB/RGBA
  /rgb\([^)]+\)/gi,
  /rgba\([^)]+\)/gi,
  // Tailwind hardcoded colors (common ones)
  /\b(bg|text|border|ring|from|to|via)-(white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{1,3}\b/g,
  // Common hardcoded color strings
  /\b(white|black|transparent)\b/g,
];

const THEME_VARIABLE_PATTERNS = [/var\(--color-[^)]+\)/g, /--color-[a-z-]+/g];

const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /__tests__/,
  /__mocks__/,
  /\.test\./,
  /\.spec\./,
  /\.stories\./,
  /\.d\.ts$/,
];

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    const issues = [];

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Check for hardcoded colors
      HARDCODED_COLOR_PATTERNS.forEach((pattern) => {
        const matches = line.match(pattern);
        if (matches) {
          // Filter out false positives
          const filteredMatches = matches.filter((match) => {
            // Exclude comments
            if (line.trim().startsWith("//") || line.trim().startsWith("*")) {
              return false;
            }
            // Exclude if it's already using theme variables
            if (line.includes("var(--color-")) {
              return false;
            }
            // Exclude common non-color uses
            if (
              match === "white" &&
              !line.includes("bg-white") &&
              !line.includes("text-white")
            ) {
              return false;
            }
            if (
              match === "black" &&
              !line.includes("bg-black") &&
              !line.includes("text-black")
            ) {
              return false;
            }
            return true;
          });

          if (filteredMatches.length > 0) {
            issues.push({
              type: "hardcoded-color",
              line: lineNum,
              matches: filteredMatches,
              content: line.trim(),
            });
          }
        }
      });
    });

    return issues;
  } catch (error) {
    return [];
  }
}

function scanDirectory(dir, results = { files: 0, issues: [], byFile: {} }) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(process.cwd(), fullPath);

    if (shouldExclude(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath, results);
    } else if (entry.isFile() && /\.(tsx?|jsx?|css)$/.test(entry.name)) {
      results.files++;
      const issues = scanFile(fullPath);

      if (issues.length > 0) {
        results.issues.push(
          ...issues.map((issue) => ({
            ...issue,
            file: relativePath,
          })),
        );
        results.byFile[relativePath] = issues;
      }
    }
  }

  return results;
}

function generateReport(results) {
  const report = {
    summary: {
      totalFiles: results.files,
      filesWithIssues: Object.keys(results.byFile).length,
      totalIssues: results.issues.length,
      byType: {},
    },
    files: results.byFile,
    recommendations: [],
  };

  // Count by type
  results.issues.forEach((issue) => {
    report.summary.byType[issue.type] =
      (report.summary.byType[issue.type] || 0) + 1;
  });

  // Generate recommendations
  if (report.summary.totalIssues > 0) {
    report.recommendations.push({
      priority: "HIGH",
      action: "Replace hardcoded colors with theme variables",
      files: Object.keys(results.byFile).length,
      examples: Object.entries(results.byFile)
        .slice(0, 5)
        .map(([file, issues]) => ({
          file,
          issues: issues.slice(0, 3),
        })),
    });
  }

  return report;
}

// Main execution
const appDir = path.join(__dirname, "../apps/web/src");
console.log("🔍 Starting theme audit...");
console.log(`📁 Scanning: ${appDir}`);

const results = scanDirectory(appDir);
const report = generateReport(results);

// Save report
const reportPath = path.join(__dirname, "../THEME_AUDIT_REPORT.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Print summary
console.log("\n📊 Theme Audit Summary:");
console.log(`   Total files scanned: ${report.summary.totalFiles}`);
console.log(`   Files with issues: ${report.summary.filesWithIssues}`);
console.log(`   Total issues: ${report.summary.totalIssues}`);
console.log(`\n   Issues by type:`);
Object.entries(report.summary.byType).forEach(([type, count]) => {
  console.log(`     ${type}: ${count}`);
});
console.log(`\n📄 Full report saved to: ${reportPath}`);

// Exit with error code if issues found
process.exit(report.summary.totalIssues > 0 ? 1 : 0);

#!/usr/bin/env node

/**
 * Generate API Connection Report
 *
 * Generates a comprehensive markdown report of API connections.
 *
 * Usage:
 *   node scripts/generate-api-connection-report.js
 *   node scripts/generate-api-connection-report.js --output REPORT.md
 */

const fs = require("fs");
const path = require("path");
const { analyzePage, generateReport } = require("./check-api-connections");

function findPageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (
      stat.isDirectory() &&
      !["node_modules", ".next", ".git", "dist", "build"].includes(file)
    ) {
      findPageFiles(filePath, fileList);
    } else if (file === "page.tsx" || file === "page.ts") {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function generateMarkdownReport(analyses, outputPath) {
  const summary = {
    total: analyses.length,
    connected: analyses.filter((a) => a.status === "connected").length,
    partial: analyses.filter((a) => a.status === "partial").length,
    needsIntegration: analyses.filter((a) => a.status === "needs-integration")
      .length,
    static: analyses.filter((a) => a.status === "static").length,
  };

  let markdown = `# API Connection Report\n\n`;
  markdown += `Generated on: ${new Date().toISOString()}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- **Total pages analyzed**: ${summary.total}\n`;
  markdown += `- **✅ Connected**: ${summary.connected}\n`;
  markdown += `- **⚠️ Partial**: ${summary.partial}\n`;
  markdown += `- **❌ Needs integration**: ${summary.needsIntegration}\n`;
  markdown += `- **🟡 Static**: ${summary.static}\n\n`;

  // Pages needing integration
  if (summary.needsIntegration > 0) {
    markdown += `## ❌ Pages Needing API Integration\n\n`;
    analyses
      .filter((a) => a.status === "needs-integration")
      .forEach((analysis) => {
        markdown += `### ${analysis.url}\n\n`;
        markdown += `- **Path**: \`${analysis.path}\`\n`;
        if (analysis.todos.length > 0) {
          markdown += `- **TODOs**:\n`;
          analysis.todos.forEach((todo) => {
            markdown += `  - Line ${todo.line}: ${todo.text}\n`;
          });
        }
        markdown += `\n`;
      });
  }

  // Pages with partial connections
  if (summary.partial > 0) {
    markdown += `## ⚠️ Pages with Partial Connections\n\n`;
    analyses
      .filter((a) => a.status === "partial")
      .forEach((analysis) => {
        markdown += `### ${analysis.url}\n\n`;
        markdown += `- **Path**: \`${analysis.path}\`\n`;
        markdown += `- **Issues**:\n`;
        analysis.issues.forEach((issue) => {
          markdown += `  - ${issue}\n`;
        });
        markdown += `\n`;
      });
  }

  // Connected pages
  if (summary.connected > 0) {
    markdown += `## ✅ Connected Pages\n\n`;
    analyses
      .filter((a) => a.status === "connected")
      .forEach((analysis) => {
        markdown += `### ${analysis.url}\n\n`;
        markdown += `- **Path**: \`${analysis.path}\`\n`;
        if (analysis.moduleCalls.length > 0) {
          markdown += `- **API Calls**:\n`;
          analysis.moduleCalls.forEach((call) => {
            markdown += `  - \`${call.module}.${call.method}()\`\n`;
          });
        }
        markdown += `\n`;
      });
  }

  // Detailed analysis
  markdown += `## 📋 Detailed Analysis\n\n`;
  analyses.forEach((analysis) => {
    markdown += `### ${analysis.url}\n\n`;
    markdown += `- **Status**: ${analysis.status}\n`;
    markdown += `- **Path**: \`${analysis.path}\`\n`;

    if (analysis.directCalls.length > 0) {
      markdown += `- **Direct API Calls**:\n`;
      analysis.directCalls.forEach((call) => {
        const status = call.backendExists ? "✅" : "❌";
        markdown += `  - ${status} \`${call.method} ${call.endpoint}\`\n`;
      });
    }

    if (analysis.moduleCalls.length > 0) {
      markdown += `- **Module API Calls**:\n`;
      analysis.moduleCalls.forEach((call) => {
        const moduleStatus = call.moduleExists ? "✅" : "❌";
        const funcStatus = call.functionExists ? "✅" : "❌";
        markdown += `  - Module: ${moduleStatus} \`${call.module}\`\n`;
        markdown += `  - Function: ${funcStatus} \`${call.method}()\`\n`;
      });
    }

    if (analysis.todos.length > 0) {
      markdown += `- **TODOs**:\n`;
      analysis.todos.forEach((todo) => {
        markdown += `  - Line ${todo.line}: ${todo.text}\n`;
      });
    }

    markdown += `\n`;
  });

  fs.writeFileSync(outputPath, markdown, "utf8");
  console.log(`✅ Report generated: ${outputPath}`);
}

function main() {
  const args = process.argv.slice(2);
  const outputPath =
    args.find((arg) => arg.startsWith("--output="))?.split("=")[1] ||
    "API_CONNECTION_REPORT.md";

  const frontendPath = path.join(__dirname, "../apps/web/src");
  const pagesPath = path.join(frontendPath, "app/[locale]");

  console.log("🔍 Scanning pages...");
  const pageFiles = findPageFiles(pagesPath);
  console.log(`Found ${pageFiles.length} pages\n`);

  console.log("📝 Analyzing...");
  const analyses = pageFiles
    .map((pageFile) => {
      try {
        return analyzePage(pageFile);
      } catch (error) {
        console.error(`Error analyzing ${pageFile}: ${error.message}`);
        return null;
      }
    })
    .filter(Boolean);

  console.log("📊 Generating report...");
  generateMarkdownReport(analyses, outputPath);
}

if (require.main === module) {
  main();
}

module.exports = { generateMarkdownReport };

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
  // Check if directory exists (frontend might not be available in backend container)
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  try {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        if (
          stat.isDirectory() &&
          !["node_modules", ".next", ".git", "dist", "build"].includes(file)
        ) {
          findPageFiles(filePath, fileList);
        } else if (file === "page.tsx" || file === "page.ts") {
          fileList.push(filePath);
        }
      } catch (err) {
        // Skip files we can't access
      }
    });
  } catch (err) {
    // Directory doesn't exist or can't be read
  }
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
  // Support both --output=FILE and --output FILE formats
  let outputPath = args
    .find((arg) => arg.startsWith("--output="))
    ?.split("=")[1];
  if (!outputPath) {
    const outputIndex = args.indexOf("--output");
    if (outputIndex !== -1 && args[outputIndex + 1]) {
      outputPath = args[outputIndex + 1];
    } else {
      outputPath = "API_CONNECTION_REPORT.md";
    }
  }

  // Adjust paths based on whether we're in Docker container or local development
  const isDocker =
    process.env.DOCKER === "true" ||
    fs.existsSync("/.dockerenv") ||
    __dirname.startsWith("/app");
  const frontendPath = isDocker
    ? "/app/apps/web/src" // In Docker: frontend might not be available
    : path.join(__dirname, "../../apps/web/src"); // Local: relative to backend/scripts
  const pagesPath = path.join(frontendPath, "app/[locale]");

  console.log("🔍 Scanning pages...");
  const pageFiles = findPageFiles(pagesPath);

  if (pageFiles.length === 0) {
    console.log(
      "⚠️  No pages found. This may be normal if frontend files are not available in backend container.",
    );
    console.log("   Generating report with backend-only information...\n");
  } else {
    console.log(`Found ${pageFiles.length} pages\n`);
  }

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

  // Determine output path - use absolute path if in Docker, relative otherwise
  // Reuse isDocker variable declared above
  const finalOutputPath =
    isDocker && !path.isAbsolute(outputPath)
      ? path.join("/app", outputPath) // In Docker, save to /app
      : path.isAbsolute(outputPath)
        ? outputPath
        : path.join(process.cwd(), outputPath); // Relative to current working directory

  generateMarkdownReport(analyses, finalOutputPath);

  console.log(`✅ Report generated: ${finalOutputPath}`);

  // Exit with code 0 even if there are issues (we want to return the report)
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { generateMarkdownReport };

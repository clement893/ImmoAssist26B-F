#!/usr/bin/env node

/**
 * API Connection Checker
 *
 * Automatically verifies API connections between frontend pages and backend endpoints.
 *
 * Usage:
 *   node scripts/check-api-connections.js
 *   node scripts/check-api-connections.js --detailed
 *   node scripts/check-api-connections.js --page /content/pages
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuration
// Adjust paths based on whether we're in Docker container or local development
const isDocker =
  process.env.DOCKER === "true" ||
  fs.existsSync("/.dockerenv") ||
  __dirname.startsWith("/app");
const config = isDocker
  ? {
      // In Docker: scripts are at /app/scripts, backend is at /app
      frontendPath: "/app/apps/web/src", // Not available in backend container
      backendPath: "/app/app/api/v1/endpoints",
      pagesPath: "/app/apps/web/src/app/[locale]", // Not available in backend container
      apiLibPath: "/app/apps/web/src/lib/api", // Not available in backend container
    }
  : {
      // Local development: scripts are in backend/scripts, backend is at backend/
      // Frontend is at project root/apps/web
      frontendPath: path.join(__dirname, "../../apps/web/src"),
      backendPath: path.join(__dirname, "../app/api/v1/endpoints"),
      pagesPath: path.join(__dirname, "../../apps/web/src/app/[locale]"),
      apiLibPath: path.join(__dirname, "../../apps/web/src/lib/api"),
    };

// Expected API patterns
const apiPatterns = {
  apiClient: {
    get: /apiClient\.get\(['"`]([^'"`]+)['"`]/g,
    post: /apiClient\.post\(['"`]([^'"`]+)['"`]/g,
    put: /apiClient\.put\(['"`]([^'"`]+)['"`]/g,
    patch: /apiClient\.patch\(['"`]([^'"`]+)['"`]/g,
    delete: /apiClient\.delete\(['"`]([^'"`]+)['"`]/g,
  },
  apiModule: {
    call: /(\w+API)\.(\w+)\(/g,
    import: /import\s+.*from\s+['"`]@\/lib\/api\/(\w+)['"`]/g,
  },
  todo: {
    comment: /TODO.*API|TODO.*api|FIXME.*API|FIXME.*api/g,
  },
};

/**
 * Find all page files
 */
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
        if (stat.isDirectory()) {
          // Skip node_modules and other ignored directories
          if (
            !["node_modules", ".next", ".git", "dist", "build"].includes(file)
          ) {
            findPageFiles(filePath, fileList);
          }
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

/**
 * Extract API calls from a file
 */
function extractApiCalls(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const apiCalls = {
    direct: [],
    module: [],
    todos: [],
    imports: [],
  };

  // Extract direct apiClient calls
  Object.entries(apiPatterns.apiClient).forEach(([method, pattern]) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      apiCalls.direct.push({
        method: method.toUpperCase(),
        endpoint: match[1],
        line: content.substring(0, match.index).split("\n").length,
      });
    }
  });

  // Extract API module calls (e.g., pagesAPI.list())
  let match;
  const modulePattern = apiPatterns.apiModule.call;
  while ((match = modulePattern.exec(content)) !== null) {
    apiCalls.module.push({
      module: match[1],
      method: match[2],
      line: content.substring(0, match.index).split("\n").length,
    });
  }

  // Extract imports
  const importPattern = apiPatterns.apiModule.import;
  while ((match = importPattern.exec(content)) !== null) {
    apiCalls.imports.push(match[1]);
  }

  // Extract TODOs
  const todoPattern = apiPatterns.todo.comment;
  while ((match = todoPattern.exec(content)) !== null) {
    apiCalls.todos.push({
      text: match[0],
      line: content.substring(0, match.index).split("\n").length,
    });
  }

  return apiCalls;
}

/**
 * Check if API module exists
 */
function checkApiModule(moduleName) {
  // Check if API lib path exists (frontend might not be available in backend container)
  if (!fs.existsSync(config.apiLibPath)) {
    return { exists: false, path: null };
  }

  const moduleFile = path.join(config.apiLibPath, `${moduleName}.ts`);
  const moduleFileAlt = path.join(
    config.apiLibPath,
    `${moduleName.toLowerCase()}.ts`,
  );

  if (fs.existsSync(moduleFile)) {
    return { exists: true, path: moduleFile };
  }
  if (fs.existsSync(moduleFileAlt)) {
    return { exists: true, path: moduleFileAlt };
  }
  return { exists: false, path: null };
}

/**
 * Check if API function exists in module
 */
function checkApiFunction(modulePath, functionName) {
  if (!modulePath || !fs.existsSync(modulePath)) {
    return false;
  }

  const content = fs.readFileSync(modulePath, "utf8");
  // Check for function in various formats
  const patterns = [
    new RegExp(`${functionName}\\s*:`), // pagesAPI.list:
    new RegExp(`${functionName}\\s*=\\s*async`), // list = async
    new RegExp(`function\\s+${functionName}`), // function list
    new RegExp(`const\\s+${functionName}\\s*=`), // const list =
  ];

  return patterns.some((pattern) => pattern.test(content));
}

/**
 * Check if backend endpoint exists
 */
function checkBackendEndpoint(endpoint) {
  // Remove /v1 prefix if present
  const cleanEndpoint = endpoint.replace(/^\/v1\//, "");
  const parts = cleanEndpoint.split("/").filter((p) => p);

  if (parts.length === 0) return { exists: false, file: null };

  // Try to find the endpoint file
  const moduleName = parts[0];
  const endpointFile = path.join(config.backendPath, `${moduleName}.py`);

  if (fs.existsSync(endpointFile)) {
    const content = fs.readFileSync(endpointFile, "utf8");
    // Check if endpoint pattern exists in file
    const endpointPattern = new RegExp(
      `@router\\.(get|post|put|patch|delete)\\(["']${endpoint.replace(/^\/v1\//, "")}["']`,
      "i",
    );
    const exists = endpointPattern.test(content) || content.includes(endpoint);

    return { exists, file: endpointFile };
  }

  return { exists: false, file: null };
}

/**
 * Analyze a single page
 */
function analyzePage(pagePath) {
  // Check if frontend path exists (might not be available in backend container)
  if (!fs.existsSync(config.frontendPath)) {
    throw new Error("Frontend path not available in backend container");
  }

  const relativePath = path.relative(config.frontendPath, pagePath);
  const apiCalls = extractApiCalls(pagePath);

  const analysis = {
    path: relativePath,
    url: relativePath
      .replace(/\\/g, "/")
      .replace(/\[locale\]\//, "")
      .replace(/\/page\.(tsx|ts)$/, ""),
    hasApiCalls: apiCalls.direct.length > 0 || apiCalls.module.length > 0,
    hasTodos: apiCalls.todos.length > 0,
    directCalls: [],
    moduleCalls: [],
    todos: apiCalls.todos,
    status: "unknown",
    issues: [],
  };

  // Analyze direct API calls
  apiCalls.direct.forEach((call) => {
    const backendCheck = checkBackendEndpoint(call.endpoint);
    analysis.directCalls.push({
      ...call,
      backendExists: backendCheck.exists,
      backendFile: backendCheck.file,
    });

    if (!backendCheck.exists) {
      analysis.issues.push(`Backend endpoint ${call.endpoint} not found`);
    }
  });

  // Analyze module API calls
  apiCalls.module.forEach((call) => {
    const moduleCheck = checkApiModule(
      call.module.replace("API", "").toLowerCase(),
    );
    const functionExists = moduleCheck.exists
      ? checkApiFunction(moduleCheck.path, call.method)
      : false;

    analysis.moduleCalls.push({
      ...call,
      moduleExists: moduleCheck.exists,
      modulePath: moduleCheck.path,
      functionExists,
    });

    if (!moduleCheck.exists) {
      analysis.issues.push(`API module ${call.module} not found`);
    } else if (!functionExists) {
      analysis.issues.push(
        `API function ${call.module}.${call.method} not found`,
      );
    }
  });

  // Determine status
  if (analysis.hasTodos && !analysis.hasApiCalls) {
    analysis.status = "needs-integration";
  } else if (analysis.hasApiCalls && analysis.issues.length === 0) {
    analysis.status = "connected";
  } else if (analysis.hasApiCalls && analysis.issues.length > 0) {
    analysis.status = "partial";
  } else if (!analysis.hasApiCalls && !analysis.hasTodos) {
    analysis.status = "static";
  }

  return analysis;
}

/**
 * Generate report
 */
function generateReport(analyses, options = {}) {
  const { detailed = false } = options;

  log("\n📊 API Connection Status Report\n", "cyan");
  log("=".repeat(80), "cyan");

  // Summary
  const summary = {
    total: analyses.length,
    connected: analyses.filter((a) => a.status === "connected").length,
    partial: analyses.filter((a) => a.status === "partial").length,
    needsIntegration: analyses.filter((a) => a.status === "needs-integration")
      .length,
    static: analyses.filter((a) => a.status === "static").length,
  };

  log("\n📈 Summary:", "blue");
  log(`  Total pages analyzed: ${summary.total}`, "reset");
  log(`  ✅ Connected: ${summary.connected}`, "green");
  log(`  ⚠️  Partial: ${summary.partial}`, "yellow");
  log(`  ❌ Needs integration: ${summary.needsIntegration}`, "red");
  log(`  🟡 Static: ${summary.static}`, "reset");

  // Pages needing integration
  if (summary.needsIntegration > 0) {
    log("\n❌ Pages Needing API Integration:", "red");
    analyses
      .filter((a) => a.status === "needs-integration")
      .forEach((analysis) => {
        log(`  - ${analysis.url}`, "red");
        if (detailed && analysis.todos.length > 0) {
          analysis.todos.forEach((todo) => {
            log(`    TODO at line ${todo.line}: ${todo.text}`, "yellow");
          });
        }
      });
  }

  // Pages with partial connections
  if (summary.partial > 0) {
    log("\n⚠️  Pages with Partial Connections:", "yellow");
    analyses
      .filter((a) => a.status === "partial")
      .forEach((analysis) => {
        log(`  - ${analysis.url}`, "yellow");
        if (detailed) {
          analysis.issues.forEach((issue) => {
            log(`    Issue: ${issue}`, "yellow");
          });
        }
      });
  }

  // Connected pages (if detailed)
  if (detailed && summary.connected > 0) {
    log("\n✅ Connected Pages:", "green");
    analyses
      .filter((a) => a.status === "connected")
      .forEach((analysis) => {
        log(`  - ${analysis.url}`, "green");
        if (analysis.moduleCalls.length > 0) {
          analysis.moduleCalls.forEach((call) => {
            log(`    Uses: ${call.module}.${call.method}()`, "reset");
          });
        }
      });
  }

  // Detailed report per page
  if (detailed) {
    log("\n📄 Detailed Analysis:", "blue");
    analyses.forEach((analysis) => {
      log(`\n${analysis.url}`, "cyan");
      log(`  Status: ${analysis.status}`, "reset");
      log(`  Path: ${analysis.path}`, "reset");

      if (analysis.directCalls.length > 0) {
        log(`  Direct API calls: ${analysis.directCalls.length}`, "reset");
        analysis.directCalls.forEach((call) => {
          const status = call.backendExists ? "✅" : "❌";
          log(
            `    ${status} ${call.method} ${call.endpoint}`,
            call.backendExists ? "green" : "red",
          );
        });
      }

      if (analysis.moduleCalls.length > 0) {
        log(`  Module API calls: ${analysis.moduleCalls.length}`, "reset");
        analysis.moduleCalls.forEach((call) => {
          const moduleStatus = call.moduleExists ? "✅" : "❌";
          const funcStatus = call.functionExists ? "✅" : "❌";
          log(
            `    Module: ${moduleStatus} ${call.module}`,
            call.moduleExists ? "green" : "red",
          );
          log(
            `    Function: ${funcStatus} ${call.method}()`,
            call.functionExists ? "green" : "red",
          );
        });
      }

      if (analysis.todos.length > 0) {
        log(`  TODOs: ${analysis.todos.length}`, "yellow");
      }
    });
  }

  log("\n" + "=".repeat(80), "cyan");
  log("\n");

  // Return summary for programmatic use
  return summary;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const options = {
    detailed: args.includes("--detailed") || args.includes("-d"),
    page: args.find((arg) => arg.startsWith("--page="))?.split("=")[1],
  };

  log("🔍 Scanning for pages...", "blue");

  // Find all pages (check if frontend path exists - might not be available in backend container)
  let pageFiles = [];
  if (fs.existsSync(config.pagesPath)) {
    pageFiles = findPageFiles(config.pagesPath);
  } else {
    log(
      "⚠️  Frontend pages not available in this environment (backend-only container)",
      "yellow",
    );
    log(
      "   Returning empty result - frontend files are not accessible from backend container.",
      "yellow",
    );
    // Return empty summary so the API can handle it gracefully
    const emptySummary = {
      total: 0,
      connected: 0,
      partial: 0,
      needsIntegration: 0,
      static: 0,
    };
    console.log(JSON.stringify(emptySummary));
    process.exit(0);
  }

  // Filter by specific page if requested
  if (options.page) {
    pageFiles = pageFiles.filter((file) =>
      file.includes(options.page.replace(/\//g, path.sep)),
    );
  }

  log(`Found ${pageFiles.length} pages\n`, "green");

  // Analyze each page
  log("📝 Analyzing pages...", "blue");
  const analyses = pageFiles
    .map((pageFile) => {
      try {
        return analyzePage(pageFile);
      } catch (error) {
        log(`Error analyzing ${pageFile}: ${error.message}`, "red");
        return null;
      }
    })
    .filter(Boolean);

  // Generate report
  const summary = generateReport(analyses, options);

  // Exit with error code if there are issues
  if (summary.needsIntegration > 0 || summary.partial > 0) {
    process.exit(1);
  }

  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzePage,
  checkApiModule,
  checkBackendEndpoint,
  generateReport,
};

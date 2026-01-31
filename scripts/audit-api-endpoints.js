/**
 * Audit Script: API Endpoints and Frontend Fetch Calls
 *
 * This script analyzes:
 * 1. All backend API endpoints (FastAPI routes)
 * 2. All fetch() calls in the frontend
 * 3. All apiClient calls in the frontend
 * 4. Identifies missing endpoints or incorrect fetch usage
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const BACKEND_ENDPOINTS_DIR = path.join(
  __dirname,
  "../backend/app/api/v1/endpoints",
);
const FRONTEND_SRC_DIR = path.join(__dirname, "../apps/web/src");

const report = {
  backend: {
    endpoints: [],
    total: 0,
    byMethod: {},
    byFile: {},
  },
  frontend: {
    fetchCalls: [],
    apiClientCalls: [],
    totalFetch: 0,
    totalApiClient: 0,
  },
  issues: {
    missingEndpoints: [],
    fetchShouldUseApiClient: [],
    apiClientCallsWithoutEndpoint: [],
  },
  summary: {},
};

/**
 * Extract endpoints from Python FastAPI files
 */
function extractBackendEndpoints() {
  console.log("📡 Analyzing backend endpoints...");

  const files = getAllPythonFiles(BACKEND_ENDPOINTS_DIR);

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(BACKEND_ENDPOINTS_DIR, file);

    // Extract router prefix
    const routerMatch = content.match(
      /router\s*=\s*APIRouter\([^)]*prefix\s*=\s*["']([^"']+)["']/,
    );
    const prefix = routerMatch ? routerMatch[1] : "";

    // Extract all route decorators
    const routeRegex =
      /@router\.(get|post|put|delete|patch|head|options)\s*\(["']([^"']+)["']/g;
    let match;

    while ((match = routeRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const route = match[2];
      const fullPath = prefix + route;

      // Extract function name
      const funcMatch = content.substring(match.index).match(/async def (\w+)/);
      const functionName = funcMatch ? funcMatch[1] : "unknown";

      // Extract tags if any
      const tagsMatch = content
        .substring(match.index)
        .match(/tags\s*=\s*\[["']([^"']+)["']\]/);
      const tag = tagsMatch ? tagsMatch[1] : "";

      const endpoint = {
        method,
        route,
        fullPath: fullPath.startsWith("/") ? fullPath : "/" + fullPath,
        functionName,
        file: relativePath,
        tag,
      };

      report.backend.endpoints.push(endpoint);
      report.backend.total++;

      // Count by method
      report.backend.byMethod[method] =
        (report.backend.byMethod[method] || 0) + 1;

      // Count by file
      report.backend.byFile[relativePath] =
        (report.backend.byFile[relativePath] || 0) + 1;
    }
  });

  console.log(`   Found ${report.backend.total} endpoints`);
}

/**
 * Extract fetch() calls from frontend TypeScript/JavaScript files
 */
function extractFrontendFetchCalls() {
  console.log("🔍 Analyzing frontend fetch calls...");

  const files = getAllTypeScriptFiles(FRONTEND_SRC_DIR);

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(FRONTEND_SRC_DIR, file);

    // Extract fetch() calls
    const fetchRegex = /fetch\s*\(\s*[`'"]([^`'"]+)[`'"]/g;
    let match;

    while ((match = fetchRegex.exec(content)) !== null) {
      const url = match[1];

      // Extract method if specified
      const methodMatch = content
        .substring(match.index)
        .match(/method\s*:\s*["']([^"']+)["']/i);
      const method = methodMatch ? methodMatch[1].toUpperCase() : "GET";

      // Extract line number
      const lineNumber = content.substring(0, match.index).split("\n").length;

      const fetchCall = {
        url,
        method,
        file: relativePath,
        line: lineNumber,
      };

      report.frontend.fetchCalls.push(fetchCall);
      report.frontend.totalFetch++;
    }

    // Extract apiClient calls
    const apiClientRegex =
      /apiClient\.(get|post|put|delete|patch)\s*\(\s*[`'"]([^`'"]+)[`'"]/g;

    while ((match = apiClientRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const url = match[2];

      const lineNumber = content.substring(0, match.index).split("\n").length;

      const apiClientCall = {
        url,
        method,
        file: relativePath,
        line: lineNumber,
      };

      report.frontend.apiClientCalls.push(apiClientCall);
      report.frontend.totalApiClient++;
    }
  });

  console.log(`   Found ${report.frontend.totalFetch} fetch() calls`);
  console.log(`   Found ${report.frontend.totalApiClient} apiClient calls`);
}

/**
 * Analyze issues
 */
function analyzeIssues() {
  console.log("🔎 Analyzing issues...");

  // Normalize backend endpoints for comparison
  const backendEndpoints = new Map();
  report.backend.endpoints.forEach((ep) => {
    const key = `${ep.method}:${normalizePath(ep.fullPath)}`;
    if (!backendEndpoints.has(key)) {
      backendEndpoints.set(key, []);
    }
    backendEndpoints.get(key).push(ep);
  });

  // Check fetch calls that should use apiClient
  report.frontend.fetchCalls.forEach((fetchCall) => {
    // Skip if it's not an API call (doesn't start with /api or /v1)
    if (!fetchCall.url.startsWith("/api") && !fetchCall.url.startsWith("/v1")) {
      return;
    }

    // Normalize URL
    const normalizedUrl = normalizePath(fetchCall.url);

    // Check if there's a corresponding endpoint
    const endpointKey = `${fetchCall.method}:${normalizedUrl}`;
    const hasEndpoint = backendEndpoints.has(endpointKey);

    report.issues.fetchShouldUseApiClient.push({
      ...fetchCall,
      hasEndpoint,
      recommendation: hasEndpoint
        ? "Should use apiClient instead of fetch()"
        : "No corresponding endpoint found - may be incorrect",
    });
  });

  // Check apiClient calls without corresponding endpoints
  report.frontend.apiClientCalls.forEach((apiCall) => {
    const normalizedUrl = normalizePath(apiCall.url);
    const endpointKey = `${apiCall.method}:${normalizedUrl}`;
    const hasEndpoint = backendEndpoints.has(endpointKey);

    if (!hasEndpoint) {
      report.issues.apiClientCallsWithoutEndpoint.push({
        ...apiCall,
        recommendation: "No corresponding backend endpoint found",
      });
    }
  });

  console.log(
    `   Found ${report.issues.fetchShouldUseApiClient.length} fetch() calls that should use apiClient`,
  );
  console.log(
    `   Found ${report.issues.apiClientCallsWithoutEndpoint.length} apiClient calls without endpoints`,
  );
}

/**
 * Normalize path for comparison
 */
function normalizePath(path) {
  // Remove leading slash if present
  let normalized = path.startsWith("/") ? path.substring(1) : path;

  // Remove /api/v1 prefix if present
  normalized = normalized.replace(/^api\/v1\//, "");
  normalized = normalized.replace(/^v1\//, "");

  // Add leading slash back
  normalized = "/" + normalized;

  return normalized;
}

/**
 * Get all Python files recursively
 */
function getAllPythonFiles(dir) {
  const files = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    entries.forEach((entry) => {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".py")) {
        files.push(fullPath);
      }
    });
  }

  walk(dir);
  return files;
}

/**
 * Get all TypeScript/JavaScript files recursively
 */
function getAllTypeScriptFiles(dir) {
  const files = [];

  function walk(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      entries.forEach((entry) => {
        const fullPath = path.join(currentDir, entry.name);

        // Skip node_modules, .next, etc.
        if (
          entry.name === "node_modules" ||
          entry.name === ".next" ||
          entry.name === "dist"
        ) {
          return;
        }

        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (
          entry.isFile() &&
          (entry.name.endsWith(".ts") ||
            entry.name.endsWith(".tsx") ||
            entry.name.endsWith(".js") ||
            entry.name.endsWith(".jsx")) &&
          !entry.name.endsWith(".d.ts") &&
          !entry.name.includes(".test.") &&
          !entry.name.includes(".spec.")
        ) {
          files.push(fullPath);
        }
      });
    } catch (err) {
      // Skip directories we can't read
    }
  }

  walk(dir);
  return files;
}

/**
 * Generate report
 */
function generateReport() {
  const reportPath = path.join(__dirname, "../API_ENDPOINTS_AUDIT_REPORT.md");

  let markdown = `# API Endpoints Audit Report\n\n`;
  markdown += `Generated: ${new Date().toISOString()}\n\n`;
  markdown += `---\n\n`;

  // Summary
  markdown += `## 📊 Summary\n\n`;
  markdown += `- **Backend Endpoints**: ${report.backend.total}\n`;
  markdown += `- **Frontend fetch() calls**: ${report.frontend.totalFetch}\n`;
  markdown += `- **Frontend apiClient calls**: ${report.frontend.totalApiClient}\n`;
  markdown += `- **fetch() calls that should use apiClient**: ${report.issues.fetchShouldUseApiClient.length}\n`;
  markdown += `- **apiClient calls without endpoints**: ${report.issues.apiClientCallsWithoutEndpoint.length}\n\n`;

  // Backend endpoints by method
  markdown += `## 🔧 Backend Endpoints by Method\n\n`;
  Object.entries(report.backend.byMethod)
    .sort((a, b) => b[1] - a[1])
    .forEach(([method, count]) => {
      markdown += `- **${method}**: ${count}\n`;
    });
  markdown += `\n`;

  // Backend endpoints by file
  markdown += `## 📁 Backend Endpoints by File\n\n`;
  Object.entries(report.backend.byFile)
    .sort((a, b) => b[1] - a[1])
    .forEach(([file, count]) => {
      markdown += `- **${file}**: ${count} endpoints\n`;
    });
  markdown += `\n`;

  // All backend endpoints
  markdown += `## 📡 All Backend Endpoints\n\n`;
  markdown += `| Method | Path | Function | File | Tag |\n`;
  markdown += `|--------|------|----------|------|-----|\n`;

  report.backend.endpoints
    .sort((a, b) => {
      if (a.method !== b.method) return a.method.localeCompare(b.method);
      return a.fullPath.localeCompare(b.fullPath);
    })
    .forEach((ep) => {
      markdown += `| ${ep.method} | \`${ep.fullPath}\` | ${ep.functionName} | ${ep.file} | ${ep.tag || "-"} |\n`;
    });
  markdown += `\n`;

  // Issues: fetch() that should use apiClient
  markdown += `## ⚠️ Issues: fetch() Calls That Should Use apiClient\n\n`;
  if (report.issues.fetchShouldUseApiClient.length === 0) {
    markdown += `✅ No issues found!\n\n`;
  } else {
    markdown += `| File | Line | Method | URL | Has Endpoint | Recommendation |\n`;
    markdown += `|------|------|--------|-----|--------------|----------------|\n`;

    report.issues.fetchShouldUseApiClient.forEach((issue) => {
      markdown += `| ${issue.file} | ${issue.line} | ${issue.method} | \`${issue.url}\` | ${issue.hasEndpoint ? "✅" : "❌"} | ${issue.recommendation} |\n`;
    });
    markdown += `\n`;
  }

  // Issues: apiClient calls without endpoints
  markdown += `## ⚠️ Issues: apiClient Calls Without Backend Endpoints\n\n`;
  if (report.issues.apiClientCallsWithoutEndpoint.length === 0) {
    markdown += `✅ No issues found!\n\n`;
  } else {
    markdown += `| File | Line | Method | URL | Recommendation |\n`;
    markdown += `|------|------|--------|-----|----------------|\n`;

    report.issues.apiClientCallsWithoutEndpoint.forEach((issue) => {
      markdown += `| ${issue.file} | ${issue.line} | ${issue.method} | \`${issue.url}\` | ${issue.recommendation} |\n`;
    });
    markdown += `\n`;
  }

  // All fetch calls
  markdown += `## 🔍 All Frontend fetch() Calls\n\n`;
  if (report.frontend.fetchCalls.length === 0) {
    markdown += `✅ No fetch() calls found!\n\n`;
  } else {
    markdown += `| File | Line | Method | URL |\n`;
    markdown += `|------|------|--------|-----|\n`;

    report.frontend.fetchCalls.forEach((call) => {
      markdown += `| ${call.file} | ${call.line} | ${call.method} | \`${call.url}\` |\n`;
    });
    markdown += `\n`;
  }

  // All apiClient calls
  markdown += `## 🔍 All Frontend apiClient Calls\n\n`;
  if (report.frontend.apiClientCalls.length === 0) {
    markdown += `✅ No apiClient calls found!\n\n`;
  } else {
    markdown += `| File | Line | Method | URL |\n`;
    markdown += `|------|------|--------|-----|\n`;

    report.frontend.apiClientCalls.forEach((call) => {
      markdown += `| ${call.file} | ${call.line} | ${call.method} | \`${call.url}\` |\n`;
    });
    markdown += `\n`;
  }

  fs.writeFileSync(reportPath, markdown, "utf-8");
  console.log(`\n✅ Report generated: ${reportPath}`);
}

// Main execution
console.log("🚀 Starting API Endpoints Audit...\n");

try {
  extractBackendEndpoints();
  extractFrontendFetchCalls();
  analyzeIssues();
  generateReport();

  console.log("\n✅ Audit completed successfully!");
} catch (error) {
  console.error("\n❌ Error during audit:", error);
  process.exit(1);
}
